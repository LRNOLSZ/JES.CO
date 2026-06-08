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


class Order(models.Model):

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped',   'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    full_name  = models.CharField(max_length=200)
    email      = models.EmailField()
    phone      = models.CharField(max_length=30)
    address    = models.TextField(blank=True)
    notes      = models.TextField(blank=True)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total      = models.CharField(max_length=50, help_text='Display total e.g. GHS 350')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f'Order #{self.pk} — {self.full_name} ({self.status})'


class OrderItem(models.Model):
    order      = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product_id = models.IntegerField()
    name       = models.CharField(max_length=200)
    price      = models.CharField(max_length=50)
    quantity   = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name        = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f'{self.name} x{self.quantity}'
