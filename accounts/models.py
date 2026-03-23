from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    SUBSCRIPTION_TIER_CHOICES = [
        ('free',    'Free'),
        ('basic',   'Basic'),
        ('premium', 'Premium'),
    ]

    subscription_tier = models.CharField(
        max_length=10,
        choices=SUBSCRIPTION_TIER_CHOICES,
        default='free',
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text='Subscription expiry date. Null means no expiry set.',
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email or self.username

    @property
    def is_subscription_active(self):
        from datetime import date
        if self.expiry_date is None:
            return self.subscription_tier == 'free'
        return self.expiry_date >= date.today()
