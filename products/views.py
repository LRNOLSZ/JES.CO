import logging
from urllib.parse import quote

from django.conf import settings
from django.core.cache import cache
from django.db.models import F
from django.db.models.functions import Greatest
from django.utils import timezone

from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from jesrestudio_backend.email_backends import send_branded_email

from .models import DeliveryZone, ProductItem, Order, OrderItem
from .serializers import (
    DeliveryZoneSerializer, OrderSerializer, OrderStatusSerializer, ProductItemSerializer,
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_whatsapp_url(text):
    number = getattr(settings, 'WHATSAPP_NUMBER', '')
    if not number:
        return None
    return f'https://wa.me/{number}?text={quote(text)}'


def _admin_url(path=''):
    return f'{settings.BACKEND_URL}/tweneboa/{path}'


def _tracking_url(order):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    ref = order.paystack_reference or order.pk
    return f'{frontend_url}/track-order?ref={quote(str(ref))}&email={quote(order.email)}'


def _decrement_stock(items_meta):
    """Atomically reduces ProductItem.quantity for a confirmed sale. Clamps at 0, never goes negative.
    Returns a list of (name, requested, available) for any item that couldn't be fully covered —
    the sale still happens (payment is already captured by the time this runs), this is just
    reported to the admin so a real shortfall doesn't go unnoticed."""
    shortages = []
    for item in items_meta:
        product_id = item.get('id')
        qty = item.get('quantity', 1)
        if not product_id:
            continue
        try:
            product = ProductItem.objects.get(pk=product_id)
        except ProductItem.DoesNotExist:
            continue
        if product.quantity < qty:
            shortages.append((product.name, qty, product.quantity))
        updated = ProductItem.objects.filter(pk=product_id).update(
            quantity=Greatest(F('quantity') - qty, 0)
        )
        if not updated:
            continue
        product.refresh_from_db(fields=['quantity'])
        if product.quantity <= 0 and product.stock_status != 'coming_soon':
            ProductItem.objects.filter(pk=product_id).update(stock_status='out_of_stock')
    return shortages


def _build_receipt_message(order):
    lines = [f'{i.name} x{i.quantity} — {i.price}' for i in order.items.all()]
    if order.delivery_zone:
        currency = 'GHS' if order.delivery_zone.country == 'ghana' else 'USD'
        lines.append(f'Delivery — {order.delivery_zone.location_name} — {currency} {order.delivery_fee}')
    items_block = '<br>'.join(lines)
    return (
        f'Your payment was received. Here is your order summary:<br><br>'
        f'{items_block}<br><br>'
        f'We will notify you as your order moves through each stage.'
    )


# ── Product endpoints ─────────────────────────────────────────────────────────

class ProductItemListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = ProductItem.objects.filter(is_active=True)
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return Response(ProductItemSerializer(qs, many=True, context={'request': request}).data)


class ProductItemDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            item = ProductItem.objects.get(pk=pk, is_active=True)
            return Response(ProductItemSerializer(item, context={'request': request}).data)
        except ProductItem.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=drf_status.HTTP_404_NOT_FOUND)


# ── Delivery zones ────────────────────────────────────────────────────────────

class DeliveryZoneListView(APIView):
    """GET /api/delivery-zones/ — returns active zones grouped by country."""
    permission_classes = [AllowAny]

    def get(self, request):
        zones = DeliveryZone.objects.filter(is_active=True)
        data  = DeliveryZoneSerializer(zones, many=True).data
        grouped = {'ghana': [], 'usa': []}
        for zone in data:
            grouped.setdefault(zone['country'], []).append(zone)
        return Response(grouped)


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderCreateView(APIView):
    """POST /api/products/orders/ — WhatsApp order request.

    Nothing is verified yet at this point, so no Order is created here. This
    just validates the cart/customer details, sends them to Maame Ama (via
    WhatsApp + a backup email), and lets her complete the real order herself
    via Paystack checkout once she's actually received payment from the
    customer — that's the one, already-verified path that creates an Order.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        delivery_zone = None
        zone_id = data.get('delivery_zone_id')
        if zone_id:
            try:
                delivery_zone = DeliveryZone.objects.get(pk=zone_id)
            except DeliveryZone.DoesNotExist:
                pass

        items_text = '\n'.join(
            f'  - {i["name"]} x{i["quantity"]} @ {i["price"]}'
            for i in data.get('items', [])
        )
        delivery_text = ''
        if delivery_zone:
            currency = 'GHS' if delivery_zone.country == 'ghana' else 'USD'
            delivery_text = f'\nDelivery — {delivery_zone.location_name}: {currency} {data.get("delivery_fee", 0)}'

        wa_text = (
            f'New WhatsApp Order Request — JES.CO\n\n'
            f'Name: {data["full_name"]}\n'
            f'Email: {data["email"]}\n'
            f'Phone: {data["phone"]}\n'
            f'Address: {data.get("address") or "N/A"}\n'
            f'Notes: {data.get("notes") or "N/A"}\n\n'
            f'Items:\n{items_text}{delivery_text}\n\n'
            f'Total: {data["total"]}\n\n'
            f'Once payment is received, complete this order via Paystack checkout '
            f'on the customer\'s behalf so they get their automatic receipt and tracking link.'
        )
        whatsapp_url = _build_whatsapp_url(wa_text)

        # Admin notification
        admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
        if admin_email:
            items_html = '<br>'.join(
                f'{i["name"]} x{i["quantity"]} @ {i["price"]}' for i in data.get('items', [])
            )
            delivery_html = ''
            if delivery_zone:
                currency = 'GHS' if delivery_zone.country == 'ghana' else 'USD'
                delivery_html = f'<br>Delivery — {delivery_zone.location_name}: {currency} {data.get("delivery_fee", 0)}'
            send_branded_email(
                admin_email,
                title='New WhatsApp Order Request',
                message=(
                    f'Customer: {data["full_name"]} ({data["email"]}, {data["phone"]})<br>'
                    f'Address: {data.get("address") or "N/A"}<br>'
                    f'Notes: {data.get("notes") or "N/A"}<br><br>'
                    f'Items:<br>{items_html}{delivery_html}<br><br>'
                    f'Once payment is received, complete this order via Paystack checkout '
                    f'on the customer\'s behalf so they get their automatic receipt and tracking link.'
                ),
                details=[('Total', data['total'])],
                cta_url=_admin_url(),
                cta_label='Open Admin',
            )

        return Response({
            'detail': 'Request sent.',
            'whatsapp_url': whatsapp_url,
        }, status=drf_status.HTTP_200_OK)


class OrderTrackingView(APIView):
    """GET /api/orders/track/?ref=PAY_XXX&email=x@x.com"""
    permission_classes = [AllowAny]

    def get(self, request):
        ref   = request.query_params.get('ref', '').strip()
        email = request.query_params.get('email', '').strip().lower()
        if not ref or not email:
            return Response({'detail': 'ref and email are required.'}, status=drf_status.HTTP_400_BAD_REQUEST)

        # Try matching by paystack_reference first, then by pk
        order = Order.objects.filter(paystack_reference=ref, email__iexact=email).select_related('delivery_zone').prefetch_related('items').first()
        if not order:
            try:
                order = Order.objects.filter(pk=int(ref), email__iexact=email).select_related('delivery_zone').prefetch_related('items').first()
            except (ValueError, TypeError):
                pass

        if not order:
            return Response({'detail': 'No order found. Check your reference and email.'}, status=drf_status.HTTP_404_NOT_FOUND)

        return Response(OrderStatusSerializer(order).data)


# ── Paystack webhook ──────────────────────────────────────────────────────────

def _process_product_charge(data):
    """Handles a verified charge.success event whose metadata identifies a shop order."""
    email     = data.get('customer', {}).get('email', '').lower()
    reference = data.get('reference', '')
    amount_pesewas = data.get('amount', 0)
    meta      = data.get('metadata', {})

    if not email or not reference:
        return Response({'detail': 'Missing email or reference.'}, status=drf_status.HTTP_400_BAD_REQUEST)

    # Skip if already processed
    if Order.objects.filter(paystack_reference=reference).exists():
        return Response({'detail': 'Already processed.'})

    amount_ghs   = amount_pesewas / 100
    zone_id      = meta.get('delivery_zone_id')
    customer_name = meta.get('customer_name', '')
    phone        = meta.get('phone', '')
    address      = meta.get('address', '')
    notes        = meta.get('notes', '')
    items_meta   = meta.get('items', [])

    delivery_zone = None
    delivery_fee  = 0
    if zone_id:
        try:
            delivery_zone = DeliveryZone.objects.get(pk=zone_id)
            delivery_fee  = float(delivery_zone.price)
        except DeliveryZone.DoesNotExist:
            pass

    # Paystack (Ghana accounts) can only ever settle in GHS, so the real charge
    # is always GHS regardless of region — USD is shown while shopping and
    # converted to its GHS equivalent client-side right before payment.
    total_display = f'GHS {amount_ghs:.2f}'

    # The amount charged is set client-side (PaystackPop.setup({amount: ...})),
    # so it — and the item prices/quantities riding along in metadata — can be
    # tampered with in devtools before the popup opens. The webhook signature
    # only proves this payload came from Paystack unaltered, not that it was
    # ever the right price. Recompute the real expected total from the DB
    # (never trusting item['price'] from metadata) and enforce it here.
    is_usa = bool(delivery_zone and delivery_zone.country == 'usa')
    expected_total_native = delivery_fee  # USD if is_usa, else already GHS
    for item in items_meta:
        try:
            product = ProductItem.objects.get(pk=item.get('id'))
        except (ProductItem.DoesNotExist, ValueError, TypeError):
            continue
        unit_price = product.price_usd if (is_usa and product.price_usd) else product.price
        expected_total_native += float(unit_price or 0) * item.get('quantity', 1)

    rate_unavailable = False
    if is_usa:
        from core.views import get_ghs_usd_rate
        rate = get_ghs_usd_rate()
        if rate:
            expected_total_ghs = expected_total_native / rate
        else:
            expected_total_ghs = None
            rate_unavailable = True
    else:
        expected_total_ghs = expected_total_native

    # A fixed exchange rate is applied on both ends (frontend at checkout,
    # backend here) from independently-cached snapshots, so a small legitimate
    # drift is expected for USA orders — hence a relative, not flat, tolerance.
    tolerance = max(1.0, (expected_total_ghs or 0) * 0.02)
    mismatch  = rate_unavailable or (amount_ghs + tolerance < expected_total_ghs)

    if mismatch:
        alert_key = f'price_mismatch_alerted_{reference}'
        admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
        if admin_email and not cache.get(alert_key):
            cache.set(alert_key, True, timeout=60 * 60 * 24 * 7)
            items_text = '<br>'.join(f'{i.get("name","")} x{i.get("quantity",1)}' for i in items_meta)
            expected_line = (
                'Could not verify — exchange rate unavailable.'
                if rate_unavailable else f'GHS {expected_total_ghs:.2f}'
            )
            send_branded_email(
                admin_email,
                title='Underpaid Shop Charge Flagged',
                message=(
                    f'A charge from {customer_name or email} ({email}) was flagged and NOT turned into an order.<br><br>'
                    f'Items:<br>{items_text}<br><br>'
                    f'This usually means the checkout amount was tampered with client-side, '
                    f'or (for a USA order) the exchange rate could not be verified. '
                    f'No order was created and no stock was decremented for this transaction.'
                ),
                details=[
                    ('Reference', reference),
                    ('Expected', expected_line),
                    ('Actual', f'GHS {amount_ghs:.2f}'),
                ],
                cta_url=_admin_url('products/order/'),
                cta_label='View Orders',
            )
        return Response({'detail': 'Flagged for review.'})

    order = Order.objects.create(
        full_name          = customer_name or email,
        email              = email,
        phone              = phone,
        address            = address,
        notes              = notes,
        status             = 'confirmed',
        total              = total_display,
        amount_ghs         = amount_ghs,
        amount_usd         = round(expected_total_native, 2) if is_usa and not rate_unavailable else None,
        delivery_zone      = delivery_zone,
        delivery_fee       = delivery_fee,
        paystack_reference = reference,
    )
    for item in items_meta:
        OrderItem.objects.create(
            order      = order,
            product_id = item.get('id', 0),
            name       = item.get('name', ''),
            price      = item.get('price', ''),
            quantity   = item.get('quantity', 1),
        )
    shortages = _decrement_stock(items_meta)

    # Customer receipt
    delivery_display = (
        f'{"GHS" if order.delivery_zone.country == "ghana" else "USD"} {order.delivery_fee}'
        if order.delivery_zone else '—'
    )
    footnote = (
        f'Quoted at checkout as approximately ${expected_total_native:.2f} — charged at today\'s rate.'
        if is_usa and not rate_unavailable else ''
    )
    send_branded_email(
        email,
        title='Order Confirmed',
        first_name=order.full_name,
        message=_build_receipt_message(order),
        details=[
            ('Order #', f'#{order.pk}'),
            ('Total', order.total),
            ('Delivery', delivery_display),
        ],
        footnote=footnote,
        cta_url=_tracking_url(order),
        cta_label='Track Your Order',
    )

    # Admin notification
    admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
    if admin_email:
        shortage_footnote = ''
        if shortages:
            shortage_list = '; '.join(f'{name} (wanted {req}, had {avail})' for name, req, avail in shortages)
            shortage_footnote = (
                f'⚠ Stock shortage — insufficient inventory for: {shortage_list}. '
                f'Contact the customer about a delay/backorder.'
            )
        send_branded_email(
            admin_email,
            title='New Order Received',
            message=f'New paid order #{order.pk} from {customer_name} ({email}).',
            details=[
                ('Order #', f'#{order.pk}'),
                ('Total', total_display),
                ('Reference', reference),
            ],
            footnote=shortage_footnote,
            cta_url=_admin_url(f'products/order/{order.pk}/change/'),
            cta_label='View Order',
        )

    return Response({'detail': 'Order created.'})
