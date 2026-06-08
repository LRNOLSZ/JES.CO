from django.db import models


class BookingRequest(models.Model):

    SERVICE_CHOICES = [
        ('bridal',     'Bridal Makeup'),
        ('full_glam',  'Full Glam'),
        ('editorial',  'Editorial / Creative'),
        ('photoshoot', 'Photoshoot Glam'),
        ('lessons',    'Makeup Lessons'),
        ('other',      'Other'),
    ]

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    full_name      = models.CharField(max_length=200)
    email          = models.EmailField()
    phone          = models.CharField(max_length=30)
    service_type   = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    preferred_date = models.DateField()
    message        = models.TextField(blank=True)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Booking Request'
        verbose_name_plural = 'Booking Requests'

    def __str__(self):
        return f'{self.full_name} — {self.get_service_type_display()} ({self.preferred_date})'
