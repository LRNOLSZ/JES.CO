import logging
import sys
from urllib.parse import quote

from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.db.models import F
from django.db.models.functions import Greatest
from django.utils import timezone

from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

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


def _send_order_email(to_email, subject, body):
    if settings.DEBUG:
        msg = f'\n{"="*60}\n[DEV] Email to {to_email}\nSubject: {subject}\n{body}\n{"="*60}\n'
        sys.stderr.write(msg)
        sys.stderr.flush()
        logger.warning(msg)
        return
    msg = EmailMessage(subject=subject, body=body,
                       from_email=settings.DEFAULT_FROM_EMAIL, to=[to_email])
    msg.encoding = 'ascii'
    msg.send(fail_silently=True)


def _tracking_url(order):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    ref = order.paystack_reference or order.pk
    return f'{frontend_url}/track-order?ref={quote(str(ref))}&email={quote(order.email)}'


def _decrement_stock(items_meta):
    """Atomically reduces ProductItem.quantity for a confirmed sale. Clamps at 0, never goes negative."""
    for item in items_meta:
        product_id = item.get('id')
        qty = item.get('quantity', 1)
        if not product_id:
            continue
        updated = ProductItem.objects.filter(pk=product_id).update(
            quantity=Greatest(F('quantity') - qty, 0)
        )
        if not updated:
            continue
        try:
            product = ProductItem.objects.get(pk=product_id)
        except ProductItem.DoesNotExist:
            continue
        if product.quantity <= 0 and product.stock_status != 'coming_soon':
            ProductItem.objects.filter(pk=product_id).update(stock_status='out_of_stock')


def _build_receipt_body(order):
    lines = [f'  {i.name} x{i.quantity}  —  {i.price}' for i in order.items.all()]
    zone_line = ''
    if order.delivery_zone:
        currency = 'GHS' if order.delivery_zone.country == 'ghana' else 'USD'
        zone_line = f'\n  Delivery — {order.delivery_zone.location_name}  —  {currency} {order.delivery_fee}'
    tracking_url = _tracking_url(order)
    items_block = '\n'.join(lines)
    divider     = '─' * 44
    return (
        f'Hi {order.full_name},\n\n'
        f'Your payment was received. Here is your order summary:\n\n'
        f'{items_block}{zone_line}\n'
        f'{divider}\n'
        f'  TOTAL PAID  {order.total}\n\n'
        f'Track your order: {tracking_url}\n\n'
        f'We will notify you as your order moves through each stage.\n\n'
        f'-- The JES.CO Team'
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
            _send_order_email(admin_email, f'New WhatsApp Order Request — {data["full_name"]}', wa_text)

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

    subtotal   = amount_ghs - delivery_fee
    currency   = 'GHS' if (not delivery_zone or delivery_zone.country == 'ghana') else 'USD'
    total_display = f'{currency} {amount_ghs:.2f}'

    # The amount charged is set client-side (PaystackPop.setup({amount: ...})),
    # so it — and the item prices/quantities riding along in metadata — can be
    # tampered with in devtools before the popup opens. The webhook signature
    # only proves this payload came from Paystack unaltered, not that it was
    # ever the right price. Recompute the real expected total from the DB
    # (never trusting item['price'] from metadata) and enforce it here.
    is_usa = bool(delivery_zone and delivery_zone.country == 'usa')
    expected_total = delivery_fee
    for item in items_meta:
        try:
            product = ProductItem.objects.get(pk=item.get('id'))
        except (ProductItem.DoesNotExist, ValueError, TypeError):
            continue
        unit_price = product.price_usd if (is_usa and product.price_usd) else product.price
        expected_total += float(unit_price or 0) * item.get('quantity', 1)

    if amount_ghs + 1.0 < expected_total:
        alert_key = f'price_mismatch_alerted_{reference}'
        admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
        if admin_email and not cache.get(alert_key):
            cache.set(alert_key, True, timeout=60 * 60 * 24 * 7)
            items_text = '\n'.join(f'  - {i.get("name","")} x{i.get("quantity",1)}' for i in items_meta)
            _send_order_email(
                admin_email,
                f'Underpaid shop charge flagged — {customer_name or email}',
                f'A charge from {customer_name or email} ({email}) was flagged and NOT turned into an order.\n\n'
                f'Reference: {reference}\n'
                f'Expected: {currency} {expected_total:.2f}\n'
                f'Actually charged: {currency} {amount_ghs:.2f}\n\n'
                f'Items:\n{items_text}\n\n'
                f'This usually means the checkout amount was tampered with client-side. '
                f'No order was created and no stock was decremented for this transaction.'
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
    _decrement_stock(items_meta)

    # Customer receipt
    receipt = _build_receipt_body(order)
    _send_order_email(email, f'Your JES.CO Order #{order.pk} — Confirmed', receipt)

    # Admin notification
    admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
    if admin_email:
        admin_body = f'New paid order #{order.pk} from {customer_name} ({email}).\n\nReference: {reference}\nTotal: {total_display}'
        _send_order_email(admin_email, f'New Order #{order.pk} — {customer_name}', admin_body)

    return Response({'detail': 'Order created.'})
