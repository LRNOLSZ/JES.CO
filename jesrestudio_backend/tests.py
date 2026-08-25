import hashlib
import hmac
import json

from django.test import TestCase, override_settings
from django.urls import reverse


# F-15 regression test — the "unrecognized metadata shape" fallback must never
# log the metadata's values, only its key names, so accidental PII (a customer
# name/phone/address that ends up here via some future unmatched shape) never
# lands in plaintext server logs.
@override_settings(PAYSTACK_SECRET_KEY='test-secret-key')
class PaystackWebhookUnrecognizedMetadataLoggingTests(TestCase):
    def _signed_post(self, payload):
        body = json.dumps(payload).encode()
        signature = hmac.new(b'test-secret-key', body, hashlib.sha512).hexdigest()
        url = reverse('paystack-webhook')
        return self.client.post(
            url, data=body, content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )

    def test_unrecognized_metadata_logs_keys_not_values(self):
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'ref-unrecognized',
                'amount': 1000,
                'customer': {'email': 'someone@example.com'},
                'metadata': {'phone': '+233555000111', 'some_unknown_field': 'x'},
            },
        }
        with self.assertLogs('jesrestudio_backend.views', level='WARNING') as captured:
            response = self._signed_post(payload)

        self.assertEqual(response.status_code, 200)
        log_output = '\n'.join(captured.output)
        self.assertNotIn('+233555000111', log_output)
        self.assertIn('phone', log_output)
        self.assertIn('some_unknown_field', log_output)
