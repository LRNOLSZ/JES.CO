import logging
from decimal import Decimal
from typing import NamedTuple
from urllib.parse import quote

from django.conf import settings
from django.core.cache import cache
from django.db.models import F
from django.db.models.functions import Greatest
from django.utils import timezone
from django.utils.html import escape

from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from jesrestudio_backend.email_backends import send_branded_email
from core.views import get_client_ip

from .models import (
    DeliveryZone, DigitalEntitlement, ProductItem, Order, OrderItem,
    ShopAccessToken, ShopSession,
)
from .serializers import (
    DeliveryZoneSerializer, DigitalDownloadSerializer, OrderSerializer,
    OrderStatusSerializer, ProductItemSerializer,
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

class _Line(NamedTuple):
    """One validated cart line, with the currency of its price carried explicitly.

    `currency` is the currency of THIS line's `unit_price`, not of the customer's
    region — a USA order for a product with no `price_usd` legitimately falls
    back to the GHS price, and the difference matters when totalling.

    The currency used to be implicit: inferred from region at the point the price
    was chosen, then forgotten. That is what allowed a USA cart holding a
    USD-priced physical item and a GHS-priced digital one to be summed into a
    single meaningless number. Carrying it here makes that sum impossible to
    write rather than merely something to remember to avoid.
    """
    product:    'ProductItem'
    qty:        int
    unit_price: Decimal
    currency:   str   # 'GHS' | 'USD'

    @property
    def line_total(self):
        return self.unit_price * self.qty


# rate is USD per ONE GHS (≈0.08) — see get_ghs_usd_rate in core/views.py.
# So GHS = USD / rate, and USD = GHS * rate.

def _as_ghs(amount, currency, rate):
    return amount if currency == 'GHS' else amount / Decimal(str(rate))


def _as_usd(amount, currency, rate):
    return amount if currency == 'USD' else amount * Decimal(str(rate))


def _build_whatsapp_url(text):
    number = getattr(settings, 'WHATSAPP_NUMBER', '')
    if not number:
        return None
    return f'https://wa.me/{number}?text={quote(text)}'


def _admin_url(path=''):
    return f'{settings.BACKEND_URL}/tweneboa/{path}'


def _frontend_url():
    return getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')


def _tracking_url(order):
    return f'{_frontend_url()}/track-order?token={order.tracking_token}'


def _account_url():
    """Customer account page — orders and digital downloads.

    Emails must link HERE and never to a file URL directly: a signed download
    link expires in 24h and would be dead by the time someone came back to the
    email, whereas this link keeps working forever because the page mints a
    fresh signed URL on every visit.
    """
    return f'{_frontend_url()}/my-orders'


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
        # prefetch_related because ProductItemSerializer now nests `images`.
        # Without it this is one extra query per product — invisible at 3
        # products, a real cost once the fashion catalogue fills out.
        qs = ProductItem.objects.filter(is_active=True).prefetch_related('images')
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return Response(ProductItemSerializer(qs, many=True, context={'request': request}).data)


class ProductItemDetailView(APIView):
    """Single product, by pk. Kept for anything already calling it — the
    customer-facing detail page uses the slug route below instead."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        item = (ProductItem.objects
                .filter(pk=pk, is_active=True)
                .prefetch_related('images')
                .first())
        if not item:
            return Response({'detail': 'Not found.'}, status=drf_status.HTTP_404_NOT_FOUND)
        return Response(ProductItemSerializer(item, context={'request': request}).data)


class ProductItemBySlugView(APIView):
    """GET /api/products/by-slug/<slug>/ — powers /product/<slug>.

    Slug rather than pk so each product has one stable, readable, canonical URL
    that survives reordering and reads properly in search results. `images` is
    prefetched because the detail page renders the whole gallery.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        item = (ProductItem.objects
                .filter(slug=slug, is_active=True)
                .prefetch_related('images')
                .first())
        if not item:
            return Response({'detail': 'Not found.'}, status=drf_status.HTTP_404_NOT_FOUND)
        return Response(ProductItemSerializer(item, context={'request': request}).data)


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
                f'{escape(i["name"])} x{i["quantity"]} @ {escape(str(i["price"]))}' for i in data.get('items', [])
            )
            delivery_html = ''
            if delivery_zone:
                currency = 'GHS' if delivery_zone.country == 'ghana' else 'USD'
                delivery_html = f'<br>Delivery — {delivery_zone.location_name}: {currency} {data.get("delivery_fee", 0)}'
            send_branded_email(
                admin_email,
                title='New WhatsApp Order Request',
                message=(
                    f'Customer: {escape(data["full_name"])} ({escape(data["email"])}, {escape(data["phone"])})<br>'
                    f'Address: {escape(data.get("address") or "N/A")}<br>'
                    f'Notes: {escape(data.get("notes") or "N/A")}<br><br>'
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
    """
    GET /api/orders/track/?token=xxx   — preferred, used by the emailed tracking link.
    GET /api/orders/track/?ref=PAY_XXX&email=x@x.com   — manual lookup / legacy emailed links
    sent before the token existed.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        ip = get_client_ip(request)
        cache_key = f'order_track_rate_{ip}'
        request_count = cache.get(cache_key, 0)
        if request_count >= 10:
            return Response({'detail': 'Too many requests.'}, status=drf_status.HTTP_429_TOO_MANY_REQUESTS)
        cache.set(cache_key, request_count + 1, timeout=60)

        token = request.query_params.get('token', '').strip()
        if token:
            order = Order.objects.filter(tracking_token=token).select_related('delivery_zone').prefetch_related('items').first()
            if not order:
                return Response({'detail': 'No order found.'}, status=drf_status.HTTP_404_NOT_FOUND)
            return Response(OrderStatusSerializer(order).data)

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

    amount_ghs   = Decimal(amount_pesewas) / 100
    zone_id      = meta.get('delivery_zone_id')
    customer_name = meta.get('customer_name', '')
    phone        = meta.get('phone', '')
    address      = meta.get('address', '')
    notes        = meta.get('notes', '')
    items_meta   = meta.get('items', [])

    delivery_zone = None
    delivery_fee  = Decimal('0')
    if zone_id:
        try:
            delivery_zone = DeliveryZone.objects.get(pk=zone_id)
            delivery_fee  = delivery_zone.price  # already a DecimalField — no cast needed
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
    MAX_ITEM_QTY = 50

    is_usa = bool(delivery_zone and delivery_zone.country == 'usa')

    # Every item is re-derived from the database — id, quantity, name and
    # price are never trusted from the client-supplied metadata beyond being
    # a lookup key. A single bad item invalidates the whole cart (same as a
    # price mismatch below) rather than silently dropping or partially
    # fulfilling it — this closes both the negative-quantity underpayment
    # exploit and the ghost/inactive-product injection exploit.
    validated_items = []
    invalid_reason = None
    for item in items_meta:
        try:
            pid = int(item.get('id'))
            qty = int(item.get('quantity', 1))
        except (TypeError, ValueError):
            invalid_reason = f'Malformed item in cart: {item!r}'
            break
        if qty < 1 or qty > MAX_ITEM_QTY:
            invalid_reason = f'Invalid quantity ({qty}) for product {pid}'
            break
        product = ProductItem.objects.filter(pk=pid, is_active=True).first()
        if not product:
            invalid_reason = f'Unknown or inactive product ({pid})'
            break
        if product.is_digital:
            # Digital products are priced in GHS only — the same price applies to
            # Ghana and international buyers, with a USD figure shown alongside for
            # information. Making that explicit here (rather than relying on
            # price_usd being left blank in the admin) keeps the rule in one place.
            unit_price, line_currency = product.price, 'GHS'
        elif is_usa and product.price_usd:
            unit_price, line_currency = product.price_usd, 'USD'
        else:
            # Includes a USA order for a physical product with no price_usd set —
            # it falls back to the GHS price, so the currency must say GHS.
            unit_price, line_currency = product.price, 'GHS'
        if unit_price is None:
            invalid_reason = f'Product {pid} has no price set'
            break
        validated_items.append(_Line(product, qty, unit_price, line_currency))

    # Nothing physical in the cart means nothing to deliver. Zeroed here rather
    # than trusted from the client so a stale or tampered delivery_zone_id can
    # never attach a shipping charge to a download-only order. is_usa is reset
    # with it because it is derived from the zone and would otherwise leave a
    # digital-only order tagged with a USD equivalent it was never quoted in.
    has_physical = any(not line.product.is_digital for line in validated_items)
    if not has_physical:
        delivery_zone = None
        delivery_fee  = Decimal('0')
        is_usa        = False

    # DeliveryZone.price is GHS for Ghana zones and USD for USA zones (its own
    # help_text says so), so it needs converting exactly like a line does.
    delivery_currency = 'USD' if (delivery_zone and delivery_zone.country == 'usa') else 'GHS'

    # A rate is only needed if something is actually in a currency other than the
    # one we're totalling in. Derived from the currencies present rather than from
    # `is_usa`, so a USA order priced entirely in GHS never depends on the rate.
    currencies   = {line.currency for line in validated_items}
    if delivery_fee:
        currencies.add(delivery_currency)
    needs_rate   = currencies - {'GHS'} != set()
    needs_rate_usd = currencies - {'USD'} != set()

    rate_unavailable   = False
    expected_total_ghs = None
    expected_total_usd = None

    if not invalid_reason:
        rate = None
        if needs_rate or (is_usa and needs_rate_usd):
            from core.views import get_ghs_usd_rate
            rate = get_ghs_usd_rate()

        if (needs_rate or (is_usa and needs_rate_usd)) and not rate:
            rate_unavailable = True
        else:
            # Every component converted individually, then summed — so a cart
            # mixing a USD-priced dress and a GHS-priced PDF totals correctly
            # instead of adding two different units together.
            expected_total_ghs = (
                _as_ghs(delivery_fee, delivery_currency, rate)
                + sum((_as_ghs(line.line_total, line.currency, rate)
                       for line in validated_items), Decimal('0'))
            )
            if is_usa:
                # Display-only: the "≈ $50.00 USD" shown on the tracking page.
                expected_total_usd = (
                    _as_usd(delivery_fee, delivery_currency, rate)
                    + sum((_as_usd(line.line_total, line.currency, rate)
                           for line in validated_items), Decimal('0'))
                )

    # A fixed exchange rate is applied on both ends (frontend at checkout,
    # backend here) from independently-cached snapshots, so a small legitimate
    # drift is expected for USA orders — hence a relative, not flat, tolerance.
    tolerance = max(Decimal('1.0'), (expected_total_ghs or Decimal('0')) * Decimal('0.02'))
    mismatch  = bool(invalid_reason) or rate_unavailable or (amount_ghs + tolerance < expected_total_ghs)

    if mismatch:
        alert_key = f'price_mismatch_alerted_{reference}'
        admin_email = getattr(settings, 'MAAME_AMA_EMAIL', '')
        if admin_email and not cache.get(alert_key):
            cache.set(alert_key, True, timeout=60 * 60 * 24 * 7)
            items_text = '<br>'.join(f'{escape(str(i.get("name","")))} x{i.get("quantity",1)}' for i in items_meta)
            if invalid_reason:
                expected_line = f'Rejected — {invalid_reason}'
            elif rate_unavailable:
                expected_line = 'Could not verify — exchange rate unavailable.'
            else:
                expected_line = f'GHS {expected_total_ghs:.2f}'
            send_branded_email(
                admin_email,
                title='Underpaid Shop Charge Flagged',
                message=(
                    f'A charge from {escape(customer_name or email)} ({escape(email)}) was flagged and NOT turned into an order.<br><br>'
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
        amount_usd         = round(expected_total_usd, 2) if expected_total_usd is not None else None,
        delivery_zone      = delivery_zone,
        delivery_fee       = delivery_fee,
        paystack_reference = reference,
    )
    for line in validated_items:
        OrderItem.objects.create(
            order      = order,
            product_id = line.product.pk,
            name       = line.product.name,
            # NOTE: stored without a currency marker, unchanged from before this
            # change. A mixed USA order genuinely holds lines in two currencies,
            # so "50.00" (a USD dress) next to "80.00" (a GHS PDF) reads as if
            # the PDF costs more. Pre-existing — USA orders already stored
            # unmarked USD — but newly *visible* now mixed carts are allowed.
            # Left alone deliberately to keep this change focused; the field is
            # display-only and rendered in emails, the tracking page, /my-orders
            # and the admin, so changing its format is its own small task.
            price      = str(line.unit_price),
            quantity   = line.qty,
        )
    # Physical items only. _decrement_stock writes stock_status through a queryset
    # .update(), which bypasses ProductItem.save() and therefore the digital guard
    # living there — a digital item reaching it would be flipped to out_of_stock
    # and disappear from the shop after its first sale.
    shortages = _decrement_stock(
        [{'id': line.product.pk, 'quantity': line.qty}
         for line in validated_items if not line.product.is_digital]
    )

    # Grant permanent access to any digital items in this order. Safe against
    # Paystack's webhook retries two ways over: this runs after the
    # paystack_reference guard at the top of the function, and get_or_create is
    # idempotent against the ('email', 'product') unique constraint anyway.
    digital_items = [line.product for line in validated_items if line.product.is_digital]
    for product in digital_items:
        DigitalEntitlement.objects.get_or_create(
            email=email,
            product=product,
            defaults={'order': order},
        )

    # Customer receipt
    delivery_display = (
        f'{"GHS" if order.delivery_zone.country == "ghana" else "USD"} {order.delivery_fee}'
        if order.delivery_zone else '—'
    )
    footnote = (
        f'Quoted at checkout as approximately ${expected_total_usd:.2f} — charged at today\'s rate.'
        if expected_total_usd is not None else ''
    )
    receipt_message = _build_receipt_message(order)
    if digital_items:
        names = '<br>'.join(f'• {escape(p.name)}' for p in digital_items)
        receipt_message += (
            '<br><br><strong>Your downloads are ready</strong><br>'
            f'{names}<br><br>'
            'Open your account page below to download them. They stay available '
            'forever — come back any time.'
        )
    send_branded_email(
        email,
        title='Order Confirmed',
        first_name=order.full_name,
        message=receipt_message,
        details=[
            ('Order #', f'#{order.pk}'),
            ('Total', order.total),
            ('Delivery', delivery_display),
        ],
        footnote=footnote,
        # Digital orders point at the account page (where downloads live and
        # links are re-minted); physical-only keeps the direct tracking link,
        # which needs no email round-trip.
        cta_url=_account_url() if digital_items else _tracking_url(order),
        cta_label='View Your Downloads' if digital_items else 'Track Your Order',
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
            message=f'New paid order #{order.pk} from {escape(customer_name)} ({escape(email)}).',
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


# ── Customer account (loginless magic link) ───────────────────────────────────
#
# Mirrors the course magic-link flow in courses/views.py, but on its own token
# and session models. See ShopSession's docstring for why CourseSession is not
# reused: its 8-hour expiry and 2-device cap exist to limit concurrent video
# streams, and both would be user-hostile applied to reading order history.


def _resolve_shop_session(request):
    """Return the ShopSession for the X-Shop-Session header, or None."""
    session_key = request.META.get('HTTP_X_SHOP_SESSION', '').strip()
    if not session_key:
        return None
    try:
        session = ShopSession.objects.get(session_key=session_key)
    except ShopSession.DoesNotExist:
        return None
    return None if session.is_expired else session


@api_view(['POST'])
@permission_classes([AllowAny])
def request_shop_access_link(request):
    """
    POST /api/shop/access/request/   Body: { "email": "..." }

    Sends an account link only if the email actually has orders or digital
    entitlements — but ALWAYS returns the same response either way. Saying "no
    account found" would turn this into an enumeration oracle for who has
    shopped here; same reasoning as the F-14 fix on the course equivalent.
    Rate limited to 10/min per IP.
    """
    ip = get_client_ip(request)
    cache_key = f'shop_magic_link_rate_{ip}'
    attempts = cache.get(cache_key, 0)
    if attempts >= 10:
        return Response(
            {'detail': 'Too many requests. Please try again in a minute.'},
            status=drf_status.HTTP_429_TOO_MANY_REQUESTS,
        )
    cache.set(cache_key, attempts + 1, timeout=60)

    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'detail': 'Email is required.'}, status=drf_status.HTTP_400_BAD_REQUEST)

    generic_response = Response({
        'detail': 'If this email has any orders or downloads, we have sent it an account link.',
    })

    has_orders    = Order.objects.filter(email__iexact=email).exists()
    has_downloads = DigitalEntitlement.objects.filter(email__iexact=email, is_active=True).exists()
    if not (has_orders or has_downloads):
        return generic_response

    token = ShopAccessToken.create_for_email(email)
    send_branded_email(
        email,
        title='Your JES.CO Account Link',
        message=(
            'Tap the button below to see your orders and downloads.<br><br>'
            'This link expires in 24 hours and can only be used once — you can '
            'request a new one any time.'
        ),
        cta_url=f'{_account_url()}/verify?token={token.token}',
        cta_label='View My Orders',
        footnote="If you didn't request this, you can safely ignore it.",
    )
    return generic_response


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_shop_token(request):
    """
    GET  /api/shop/access/verify/?token=xxx  — read-only check, no side effects.
        Deliberately harmless so email clients that pre-fetch links cannot burn
        the token before the customer taps it. Returns { email }.
    POST /api/shop/access/verify/ { token }  — consumes the token and opens a
        ShopSession. Returns { session_key, email }.
    """
    raw_token = (
        request.query_params.get('token') if request.method == 'GET'
        else request.data.get('token', '')
    )
    raw_token = (raw_token or '').strip()
    if not raw_token:
        return Response({'detail': 'Token is required.'}, status=drf_status.HTTP_400_BAD_REQUEST)

    try:
        access_token = ShopAccessToken.objects.get(token=raw_token)
    except ShopAccessToken.DoesNotExist:
        return Response({'detail': 'This link is invalid or has already been used.'},
                        status=drf_status.HTTP_404_NOT_FOUND)

    if access_token.is_used or access_token.is_expired:
        return Response({'detail': 'This link has expired or already been used.'},
                        status=drf_status.HTTP_410_GONE)

    if request.method == 'GET':
        return Response({'email': access_token.email})

    access_token.is_used = True
    access_token.save(update_fields=['is_used'])

    session = ShopSession.create_for_email(
        access_token.email,
        device_hint=request.META.get('HTTP_USER_AGENT', ''),
    )
    return Response({'session_key': session.session_key, 'email': session.email})


@api_view(['GET'])
@permission_classes([AllowAny])
def shop_account(request):
    """
    GET /api/shop/account/   Header: X-Shop-Session

    Every physical order and every digital download for the session's email.
    Download URLs are signed fresh on each call, which is what lets the
    entitlement be permanent while no long-lived link to the file ever exists.

    Session-gated rather than open to a typed-in email because orders carry the
    customer's full name, phone and address — considerably more than the
    existing reference+email tracking lookup discloses, which can only confirm
    an order the caller already knows about.
    """
    session = _resolve_shop_session(request)
    if not session:
        return Response({'detail': 'Not signed in.'}, status=drf_status.HTTP_401_UNAUTHORIZED)

    session.save(update_fields=['last_seen'])

    orders = (Order.objects
              .filter(email__iexact=session.email)
              .select_related('delivery_zone')
              .prefetch_related('items'))
    downloads = (DigitalEntitlement.objects
                 .filter(email__iexact=session.email, is_active=True)
                 .select_related('product'))

    return Response({
        'email':     session.email,
        'orders':    OrderStatusSerializer(orders, many=True).data,
        'downloads': DigitalDownloadSerializer(downloads, many=True).data,
    })


@api_view(['DELETE'])
@permission_classes([AllowAny])
def shop_logout(request):
    """DELETE /api/shop/access/session/ — ends this device's session only."""
    session = _resolve_shop_session(request)
    if session:
        session.delete()
    return Response({'detail': 'Signed out.'})
