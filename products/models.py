from django.db import models
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFit


class ProductItem(models.Model):

    CATEGORY_CHOICES = [
        ('makeup',      'Makeup Sets'),
        ('skincare',    'Skincare Sets'),
        ('collections', 'Curated Collections'),
    ]

    STOCK_CHOICES = [
        ('in_stock',    'In Stock'),
        ('out_of_stock','Out of Stock'),
        ('coming_soon', 'Coming Soon'),
    ]

    name         = models.CharField(max_length=200)
    description  = models.TextField()
    price        = models.CharField(max_length=50, blank=True,
                     help_text='e.g. GHS 150 or GHS 80 – 120')
    image        = ProcessedImageField(
                     upload_to='products/',
                     processors=[ResizeToFit(800, 800)],
                     format='WEBP',
                     options={'quality': 88},
                     help_text='Product photo — will be auto-converted to WebP',
                   )
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    stock_status = models.CharField(max_length=20, choices=STOCK_CHOICES, default='in_stock')
    order        = models.PositiveIntegerField(default=0,
                     help_text='Lower number appears first')
    is_active    = models.BooleanField(default=True,
                     help_text='Uncheck to hide from the website without deleting')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['order', '-created_at']
        verbose_name        = 'Product Item'
        verbose_name_plural = 'Product Items'

    def __str__(self):
        return f'{self.get_category_display()} — {self.name}'
