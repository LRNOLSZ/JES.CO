import io
from decimal import Decimal
from unittest.mock import patch

from PIL import Image

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import (
    DeliveryZone, DigitalEntitlement, Order, ProductItem, ShopAccessToken, ShopSession,
)
from .views import _process_product_charge, _tracking_url


def _test_image():
    buf = io.BytesIO()
    Image.new('RGB', (10, 10), color='white').save(buf, format='PNG')
    buf.seek(0)
    return SimpleUploadedFile('test.png', buf.read(), content_type='image/png')


def _charge_data(items, amount_pesewas, reference='ref-1'):
    return {
        'customer': {'email': 'buyer@example.com'},
        'reference': reference,
        'amount': amount_pesewas,
        'metadata': {'items': items},
    }


# F-01 regression tests — a manipulated Paystack checkout payload must never
# under-charge, invent a product, or inflate stock. send_branded_email is
# mocked throughout so these tests never make a real network call.
@patch('products.views.send_branded_email')
class ProcessProductChargeTests(TestCase):
    def setUp(self):
        self.item_a = ProductItem.objects.create(
            name='Item A', description='desc', price=Decimal('100.00'),
            image=_test_image(), category='makeup', quantity=10, is_active=True,
        )
        self.item_b = ProductItem.objects.create(
            name='Item B', description='desc', price=Decimal('50.00'),
            image=_test_image(), category='makeup', quantity=10, is_active=True,
        )

    def test_negative_quantity_rejected_and_stock_untouched(self, mock_email):
        # 100*1 + 50*(-1) = 50 GHS expected if the exploit worked — attacker
        # would only need to pay 5000 pesewas instead of the real 15000.
        items = [
            {'id': self.item_a.pk, 'quantity': 1},
            {'id': self.item_b.pk, 'quantity': -1},
        ]
        response = _process_product_charge(_charge_data(items, 5000))

        self.assertEqual(response.data, {'detail': 'Flagged for review.'})
        self.assertEqual(Order.objects.count(), 0)

        self.item_a.refresh_from_db()
        self.item_b.refresh_from_db()
        self.assertEqual(self.item_a.quantity, 10)
        self.assertEqual(self.item_b.quantity, 10)  # must never increase

    def test_ghost_product_id_rejected(self, mock_email):
        items = [{'id': 999999, 'quantity': 1, 'name': 'Free Stuff', 'price': '0'}]
        response = _process_product_charge(_charge_data(items, 10000))

        self.assertEqual(response.data, {'detail': 'Flagged for review.'})
        self.assertEqual(Order.objects.count(), 0)

    def test_fractional_and_zero_quantity_rejected(self, mock_email):
        for bad_qty in (0, 0.01, -5):
            with self.subTest(bad_qty=bad_qty):
                items = [{'id': self.item_a.pk, 'quantity': bad_qty}]
                response = _process_product_charge(_charge_data(items, 1, reference=f'ref-{bad_qty}'))
                self.assertEqual(response.data, {'detail': 'Flagged for review.'})
        self.assertEqual(Order.objects.count(), 0)

    def test_inactive_product_rejected(self, mock_email):
        self.item_a.is_active = False
        self.item_a.save()
        items = [{'id': self.item_a.pk, 'quantity': 1}]
        response = _process_product_charge(_charge_data(items, 10000))

        self.assertEqual(response.data, {'detail': 'Flagged for review.'})
        self.assertEqual(Order.objects.count(), 0)

    def test_legit_order_still_works(self, mock_email):
        # Real price: 100 GHS x2 = 200 GHS = 20000 pesewas.
        items = [{'id': self.item_a.pk, 'quantity': 2, 'name': 'attacker-supplied name', 'price': '1'}]
        response = _process_product_charge(_charge_data(items, 20000))

        self.assertEqual(Order.objects.count(), 1)
        order = Order.objects.first()
        self.assertEqual(order.status, 'confirmed')
        self.assertEqual(order.items.count(), 1)

        order_item = order.items.first()
        # Name/price come from the DB product, never from the attacker's metadata.
        self.assertEqual(order_item.name, 'Item A')
        self.assertEqual(order_item.price, '100.00')
        self.assertEqual(order_item.quantity, 2)

        self.item_a.refresh_from_db()
        self.assertEqual(self.item_a.quantity, 8)


# F-06 regression tests — customer-supplied text must never reach the admin
# HTML email unescaped (a raw <a>/<script> tag would render as a real, live
# clickable element in Maame Ama's inbox).
@patch('products.views.send_branded_email')
@override_settings(MAAME_AMA_EMAIL='admin@example.com')
class AdminEmailEscapingTests(TestCase):
    def setUp(self):
        self.item = ProductItem.objects.create(
            name='Item A', description='desc', price=Decimal('100.00'),
            image=_test_image(), category='makeup', quantity=10, is_active=True,
        )

    def test_whatsapp_order_request_email_is_escaped(self, mock_email):
        payload = {
            'full_name': '<script>alert(1)</script>',
            'email': 'buyer@example.com',
            'phone': '0000000000',
            'address': 'N/A',
            'notes': '<a href="https://evil.example">click here</a>',
            'total': 'GHS 100.00',
            'items': [{'product_id': self.item.pk, 'name': 'Item A', 'price': '100.00', 'quantity': 1}],
        }
        response = self.client.post('/api/products/orders/', payload, content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(mock_email.called)
        message = mock_email.call_args.kwargs['message']
        self.assertNotIn('<script>', message)
        self.assertIn('&lt;script&gt;', message)
        self.assertNotIn('<a href="https://evil.example">', message)

    def test_mismatch_alert_email_is_escaped(self, mock_email):
        # A ghost product id forces the "flagged for review" admin-alert path.
        items = [{'id': 999999, 'quantity': 1}]
        data = _charge_data(items, 1, reference='ref-xss-mismatch')
        data['metadata']['customer_name'] = '<img src=x onerror=alert(1)>'

        _process_product_charge(data)

        self.assertTrue(mock_email.called)
        message = mock_email.call_args.kwargs['message']
        self.assertNotIn('<img src=x', message)
        self.assertIn('&lt;img', message)

    def test_success_order_email_is_escaped(self, mock_email):
        items = [{'id': self.item.pk, 'quantity': 1}]
        data = _charge_data(items, 10000, reference='ref-xss-success')
        data['metadata']['customer_name'] = '<a href="https://evil.example">link</a>'

        _process_product_charge(data)

        # Success path sends 2 emails (customer receipt, then admin notice) —
        # the admin one is last and is the one that matters for this finding.
        admin_call = mock_email.call_args_list[-1]
        message = admin_call.kwargs['message']
        self.assertNotIn('<a href="https://evil.example">', message)
        self.assertIn('&lt;a href=', message)


# F-16 regression tests — the emailed order-tracking link must never carry the
# customer's email; the tracking endpoint must resolve a real order via an
# opaque token, and the legacy ref+email lookup must keep working for orders
# created before this token existed.
class OrderTrackingTokenTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(
            full_name='Jane Buyer', email='jane@example.com', phone='0000000000',
            status='confirmed', total='GHS 100.00', paystack_reference='ref-track-1',
        )

    def test_tracking_url_has_no_email(self):
        url = _tracking_url(self.order)
        self.assertNotIn('jane@example.com', url)
        self.assertIn(self.order.tracking_token, url)

    def test_token_lookup_returns_order_with_no_email_in_response(self):
        api_url = reverse('order-track')
        response = self.client.get(api_url, {'token': self.order.tracking_token})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], self.order.pk)
        self.assertNotIn('email', response.data)

    def test_invalid_token_returns_404(self):
        api_url = reverse('order-track')
        response = self.client.get(api_url, {'token': 'not-a-real-token'})
        self.assertEqual(response.status_code, 404)

    def test_legacy_ref_and_email_lookup_still_works(self):
        api_url = reverse('order-track')
        response = self.client.get(api_url, {'ref': 'ref-track-1', 'email': 'jane@example.com'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], self.order.pk)


# ── Digital products ───────────────────────────────────────────────────────────

def _test_pdf():
    return SimpleUploadedFile('guide.pdf', b'%PDF-1.4 fake test pdf', content_type='application/pdf')


class DigitalProductModelTests(TestCase):
    def test_digital_product_does_not_auto_hide_itself(self):
        """A digital product has no stock, so it sits at quantity 0 forever. The
        stock auto-sync in save() must skip it — otherwise it would flip to
        out_of_stock on creation and vanish from the shop immediately."""
        item = ProductItem.objects.create(
            name='Beauty Guide', description='pdf', price=Decimal('80.00'),
            image=_test_image(), category='makeup',
            product_type='digital', digital_file=_test_pdf(),
            quantity=0, is_active=True,
        )
        item.refresh_from_db()
        self.assertEqual(item.stock_status, 'in_stock')
        self.assertTrue(item.is_digital)

    def test_physical_product_still_auto_hides_at_zero_stock(self):
        """The guard must not disable the existing behaviour for physical items."""
        item = ProductItem.objects.create(
            name='Lipstick', description='x', price=Decimal('50.00'),
            image=_test_image(), category='makeup', quantity=0, is_active=True,
        )
        item.refresh_from_db()
        self.assertEqual(item.stock_status, 'out_of_stock')

    def test_digital_product_without_file_is_rejected(self):
        """Selling a download with no file attached would take the customer's
        money and deliver nothing."""
        from django.core.exceptions import ValidationError
        item = ProductItem(
            name='Empty Guide', description='pdf', price=Decimal('80.00'),
            image=_test_image(), category='makeup', product_type='digital',
        )
        with self.assertRaises(ValidationError) as ctx:
            item.full_clean()
        self.assertIn('digital_file', ctx.exception.message_dict)


@patch('products.views.send_branded_email')
class DigitalCheckoutTests(TestCase):
    def setUp(self):
        self.pdf = ProductItem.objects.create(
            name='Beauty Guide', description='pdf', price=Decimal('80.00'),
            image=_test_image(), category='makeup',
            product_type='digital', digital_file=_test_pdf(),
            quantity=0, is_active=True,
        )
        self.physical = ProductItem.objects.create(
            name='Lip Set', description='x', price=Decimal('100.00'),
            image=_test_image(), category='makeup', quantity=10, is_active=True,
        )
        self.zone = DeliveryZone.objects.create(
            country='ghana', location_name='Accra', price=Decimal('30.00'), is_active=True,
        )

    def test_digital_only_order_charges_no_delivery_and_grants_access(self, mock_email):
        items = [{'id': self.pdf.pk, 'quantity': 1}]
        response = _process_product_charge(_charge_data(items, 8000, reference='dig-1'))

        self.assertEqual(response.data, {'detail': 'Order created.'})
        order = Order.objects.get(paystack_reference='dig-1')
        self.assertEqual(order.delivery_fee, Decimal('0'))
        self.assertIsNone(order.delivery_zone)
        self.assertTrue(
            DigitalEntitlement.objects.filter(email='buyer@example.com', product=self.pdf).exists()
        )

    def test_digital_only_order_ignores_a_tampered_delivery_zone(self, mock_email):
        """A stale or injected delivery_zone_id must not attach shipping to a
        download-only order — otherwise the expected total would include a fee
        the customer was never shown, and the charge would be flagged."""
        data = _charge_data([{'id': self.pdf.pk, 'quantity': 1}], 8000, reference='dig-2')
        data['metadata']['delivery_zone_id'] = self.zone.pk
        response = _process_product_charge(data)

        self.assertEqual(response.data, {'detail': 'Order created.'})
        order = Order.objects.get(paystack_reference='dig-2')
        self.assertEqual(order.delivery_fee, Decimal('0'))

    def test_digital_stock_is_never_decremented(self, mock_email):
        """_decrement_stock writes stock_status via queryset .update(), bypassing
        save() and its digital guard — so digital items must never reach it."""
        _process_product_charge(_charge_data([{'id': self.pdf.pk, 'quantity': 1}], 8000, reference='dig-3'))
        self.pdf.refresh_from_db()
        self.assertEqual(self.pdf.quantity, 0)
        self.assertEqual(self.pdf.stock_status, 'in_stock')

    def test_webhook_replay_does_not_double_grant(self, mock_email):
        items = [{'id': self.pdf.pk, 'quantity': 1}]
        _process_product_charge(_charge_data(items, 8000, reference='dig-4'))
        _process_product_charge(_charge_data(items, 8000, reference='dig-4'))

        self.assertEqual(Order.objects.filter(paystack_reference='dig-4').count(), 1)
        self.assertEqual(
            DigitalEntitlement.objects.filter(email='buyer@example.com', product=self.pdf).count(), 1
        )

    def test_mixed_ghana_cart_charges_delivery_once_and_only_decrements_physical(self, mock_email):
        items = [
            {'id': self.physical.pk, 'quantity': 1},
            {'id': self.pdf.pk,      'quantity': 1},
        ]
        data = _charge_data(items, 21000, reference='mix-1')   # 100 + 80 + 30 delivery
        data['metadata']['delivery_zone_id'] = self.zone.pk
        response = _process_product_charge(data)

        self.assertEqual(response.data, {'detail': 'Order created.'})
        order = Order.objects.get(paystack_reference='mix-1')
        self.assertEqual(order.delivery_fee, Decimal('30.00'))

        self.physical.refresh_from_db()
        self.pdf.refresh_from_db()
        self.assertEqual(self.physical.quantity, 9)   # decremented
        self.assertEqual(self.pdf.quantity, 0)        # untouched
        self.assertTrue(DigitalEntitlement.objects.filter(product=self.pdf).exists())


@patch('products.views.send_branded_email')
class ShopAccountAccessTests(TestCase):
    def setUp(self):
        self.pdf = ProductItem.objects.create(
            name='Beauty Guide', description='pdf', price=Decimal('80.00'),
            image=_test_image(), category='makeup',
            product_type='digital', digital_file=_test_pdf(), is_active=True,
        )
        DigitalEntitlement.objects.create(email='known@example.com', product=self.pdf)

    def test_access_request_does_not_reveal_whether_the_email_exists(self, mock_email):
        """F-14 pattern: a differing response would let anyone probe which emails
        have shopped here."""
        url = reverse('shop-access-request')
        known   = self.client.post(url, {'email': 'known@example.com'})
        unknown = self.client.post(url, {'email': 'nobody@example.com'})

        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.data, unknown.data)
        # ...but only the real customer is actually emailed.
        self.assertEqual(mock_email.call_count, 1)
        self.assertEqual(mock_email.call_args[0][0], 'known@example.com')

    def test_account_requires_a_session(self, mock_email):
        response = self.client.get(reverse('shop-account'))
        self.assertEqual(response.status_code, 401)

    def test_account_rejects_an_expired_session(self, mock_email):
        session = ShopSession.create_for_email('known@example.com')
        session.expires_at = timezone.now() - timezone.timedelta(minutes=1)
        session.save(update_fields=['expires_at'])

        response = self.client.get(reverse('shop-account'), HTTP_X_SHOP_SESSION=session.session_key)
        self.assertEqual(response.status_code, 401)

    def test_account_returns_orders_and_downloads_for_the_session_email(self, mock_email):
        Order.objects.create(
            full_name='Known', email='known@example.com', phone='1', total='GHS 80',
            paystack_reference='acct-1',
        )
        session = ShopSession.create_for_email('known@example.com')

        response = self.client.get(reverse('shop-account'), HTTP_X_SHOP_SESSION=session.session_key)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'known@example.com')
        self.assertEqual(len(response.data['orders']), 1)
        self.assertEqual(len(response.data['downloads']), 1)
        self.assertEqual(response.data['downloads'][0]['name'], 'Beauty Guide')

    def test_revoked_entitlement_disappears_from_downloads(self, mock_email):
        """is_active=False is the refund path — access goes away without
        destroying the record of what was granted."""
        DigitalEntitlement.objects.filter(email='known@example.com').update(is_active=False)
        session = ShopSession.create_for_email('known@example.com')

        response = self.client.get(reverse('shop-account'), HTTP_X_SHOP_SESSION=session.session_key)
        self.assertEqual(response.data['downloads'], [])

    def test_magic_link_token_is_single_use(self, mock_email):
        token = ShopAccessToken.create_for_email('known@example.com')
        url = reverse('shop-access-verify')

        # A GET must be side-effect free — email clients pre-fetch links.
        peek = self.client.get(url, {'token': token.token})
        self.assertEqual(peek.status_code, 200)
        token.refresh_from_db()
        self.assertFalse(token.is_used)

        first = self.client.post(url, {'token': token.token})
        self.assertEqual(first.status_code, 200)
        self.assertIn('session_key', first.data)

        second = self.client.post(url, {'token': token.token})
        self.assertEqual(second.status_code, 410)


class PrivateStorageConfigTests(TestCase):
    """Guards the one setting that decides whether paid PDFs are public.

    Only meaningful when R2 is configured, so it skips locally. The live
    behaviour (an unsigned object path returning 403) has to be confirmed
    against real R2 — see the Phase A verification notes.
    """

    def test_private_storage_never_sets_a_custom_domain(self):
        from jesrestudio_backend import storage_backends as sb
        if not sb.R2_CONFIGURED:
            self.skipTest('R2 not configured locally — verify against production')
        self.assertIsNone(sb.R2PrivateStorage.custom_domain)
        self.assertTrue(sb.R2PrivateStorage.querystring_auth)
