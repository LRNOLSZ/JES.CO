import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):

    class Meta:
        verbose_name        = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email or self.username


class MagicLinkToken(models.Model):
    """One-time login token — expires in 15 min, single use."""
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='magic_tokens')
    token      = models.CharField(max_length=96, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    class Meta:
        verbose_name        = 'Magic Link Token'
        verbose_name_plural = 'Magic Link Tokens'
        ordering            = ['-created_at']

    def __str__(self):
        status = 'used' if self.is_used else ('expired' if self.is_expired else 'active')
        return f'{self.user.email} — {status}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_for_user(cls, user, expiry_minutes=15):
        token = secrets.token_hex(48)
        expires_at = timezone.now() + timezone.timedelta(minutes=expiry_minutes)
        return cls.objects.create(user=user, token=token, expires_at=expires_at)


class UserSession(models.Model):
    """Tracks active DRF auth tokens — enforces 2-device limit."""
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    token       = models.OneToOneField('authtoken.Token', on_delete=models.CASCADE, related_name='session')
    created_at  = models.DateTimeField(auto_now_add=True)
    last_used   = models.DateTimeField(auto_now=True)
    device_hint = models.CharField(max_length=200, blank=True,
                    help_text='First 200 chars of User-Agent')

    class Meta:
        verbose_name        = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering            = ['-last_used']

    def __str__(self):
        return f'{self.user.email} — {self.created_at:%Y-%m-%d %H:%M}'
