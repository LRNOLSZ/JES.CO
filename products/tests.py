import io
from decimal import Decimal
from unittest.mock import patch

from PIL import Image

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import Order, ProductItem
from .views import _process_product_charge


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
