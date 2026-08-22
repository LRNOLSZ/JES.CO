from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

User = get_user_model()


# F-07 regression test — django-axes must lock out the real client IP behind
# Railway's proxy, not a shared/spoofable one, so one attacker's lockout never
# collaterally locks out a different real visitor.
class AxesLockoutIPTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='RealPassw0rd!',
        )
        self.login_url = reverse('admin:login')

    def _attempt(self, xff, password):
        return self.client.post(
            self.login_url,
            {'username': 'admin', 'password': password, 'next': '/tweneboa/'},
            HTTP_X_FORWARDED_FOR=xff,
        )

    def test_lockout_is_scoped_to_real_client_ip_not_shared_proxy_ip(self):
        # 'noise' stands in for Railway's own proxy hop — get_client_ip()
        # takes the last entry as the real client IP, same as production.
        attacker_xff = 'noise, 9.9.9.9'
        for _ in range(10):
            self._attempt(attacker_xff, 'wrong-password')

        # Same real IP, now with the correct password — must still be locked.
        # django-axes returns 429 (Too Many Requests) for an active lockout.
        locked_response = self._attempt(attacker_xff, 'RealPassw0rd!')
        self.assertEqual(locked_response.status_code, 429)

        # A different real client IP behind the same shared proxy must be
        # completely unaffected and able to log in normally.
        other_xff = 'noise, 1.2.3.4'
        ok_response = self._attempt(other_xff, 'RealPassw0rd!')
        self.assertEqual(ok_response.status_code, 302)
