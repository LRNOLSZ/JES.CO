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
    price_usd    = models.CharField(max_length=50, blank=True,
                     help_text='e.g. USD 45 or USD 25 – 40. Shown to USA-region visitors instead of the GHS price above. Leave blank to fall back to the GHS price.')
    image        = ProcessedImageField(
                     upload_to='products/',
                     processors=[ResizeToFit(800, 800)],
                     format='WEBP',
                     options={'quality': 88},
                     help_text='Product photo — will be auto-converted to WebP',
                   )
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    stock_status = models.CharField(max_length=20, choices=STOCK_CHOICES, default='in_stock')
    quantity     = models.PositiveIntegerField(default=0,
                     help_text='Units in stock. Auto-syncs Stock Status below — flips to Out of Stock at 0.')
    order        = models.PositiveIntegerField(default=0,
                     help_text='Lower number appears first')
    is_active    = models.BooleanField(default=True,
                     help_text='Uncheck to hide from the website without deleting')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['order', '-created_at']
        verbose_name        = 'Product Item'
        verbose_name_plural = 'Product Items'

    def save(self, *args, **kwargs):
        if self.quantity <= 0 and self.stock_status == 'in_stock':
            self.stock_status = 'out_of_stock'
        elif self.quantity > 0 and self.stock_status == 'out_of_stock':
            self.stock_status = 'in_stock'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.get_category_display()} — {self.name}'


class DeliveryZone(models.Model):
    COUNTRY_CHOICES = [('ghana', 'Ghana'), ('usa', 'USA')]

    country       = models.CharField(max_length=10, choices=COUNTRY_CHOICES)
    location_name = models.CharField(max_length=200, help_text='e.g. Accra, Kumasi, New York')
    price         = models.DecimalField(max_digits=8, decimal_places=2,
                      help_text='Delivery fee in GHS (Ghana) or USD (USA)')
    is_active     = models.BooleanField(default=True)
    order         = models.PositiveIntegerField(default=0, help_text='Lower number appears first')

    class Meta:
        ordering            = ['country', 'order', 'location_name']
        verbose_name        = 'Delivery Zone'
        verbose_name_plural = 'Delivery Zones'

    def __str__(self):
        return f'{self.get_country_display()} — {self.location_name} ({"GHS" if self.country == "ghana" else "USD"} {self.price})'


class Order(models.Model):

    STATUS_CHOICES = [
        ('pending',    'Pending'),
        ('confirmed',  'Confirmed'),
        ('processing', 'Processing'),
        ('shipped',    'Shipped'),
        ('delivered',  'Delivered'),
        ('cancelled',  'Cancelled'),
    ]

    full_name           = models.CharField(max_length=200)
    email               = models.EmailField()
    phone               = models.CharField(max_length=30)
    address             = models.TextField(blank=True)
    notes               = models.TextField(blank=True)
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total               = models.CharField(max_length=50, help_text='Display total e.g. GHS 350')
    amount_ghs          = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                            help_text='Real numeric amount charged via Paystack. Null for WhatsApp/manual orders.')
    delivery_zone       = models.ForeignKey(DeliveryZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    delivery_fee        = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    paystack_reference  = models.CharField(max_length=100, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)

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
