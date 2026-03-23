from django.db import models
from django.utils import timezone
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFit


class GalleryItem(models.Model):

    CATEGORY_CHOICES = [
        ('hair',   'Hair'),
        ('makeup', 'Makeup'),
        ('nails',  'Nails'),
        ('skin',   'Skin / Glow'),
        ('lashes', 'Lashes'),
        ('brows',  'Brows'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    before_image = ProcessedImageField(
        upload_to='gallery/before/',
        processors=[ResizeToFit(1080, 1920)],
        format='WEBP',
        options={'quality': 85},
    )
    after_image = ProcessedImageField(
        upload_to='gallery/after/',
        processors=[ResizeToFit(1080, 1920)],
        format='WEBP',
        options={'quality': 85},
    )

    publish_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Leave blank to save as draft. Set to now or a future time to schedule.',
    )
    order = models.PositiveIntegerField(default=0, help_text='Lower number appears first.')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Gallery Item'
        verbose_name_plural = 'Gallery Items'

    def __str__(self):
        return f'{self.get_category_display()} — {self.title}'

    @property
    def status(self):
        if self.publish_at is None:
            return 'draft'
        if self.publish_at > timezone.now():
            return 'scheduled'
        return 'live'
