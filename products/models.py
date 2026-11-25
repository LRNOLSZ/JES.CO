import secrets

from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFit

from jesrestudio_backend.storage_backends import get_private_storage


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

    # Fulfilment type — this is BEHAVIOUR, deliberately separate from `category`,
    # which is only merchandising (which page the item appears on). A digital item
    # needs no address, no delivery fee and no stock; a physical one needs all
    # three. Keeping these apart is what stops `if category == ...` logic spreading
    # through the codebase every time a new product line is added.
    TYPE_CHOICES = [
        ('physical', 'Physical'),
        ('digital',  'Digital (download)'),
    ]

    name         = models.CharField(max_length=200)
    description  = models.TextField()
    price        = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
                     help_text='Price in GHS')
    price_usd    = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
                     help_text='Price in USD, shown to USA-region visitors instead of the GHS price above. Leave blank to fall back to the GHS price.')
    image        = ProcessedImageField(
                     upload_to='products/',
                     processors=[ResizeToFit(800, 800)],
                     format='WEBP',
                     options={'quality': 88},
                     help_text='Product photo — will be auto-converted to WebP',
                   )
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    product_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='physical',
                     help_text='Digital items are delivered as a download — no delivery fee, '
                               'no address and no stock tracking.')
    digital_file = models.FileField(
                     upload_to='digital/',
                     storage=get_private_storage,
                     blank=True,
                     validators=[FileExtensionValidator(['pdf'])],
                     help_text='PDF only. Required for digital products. Stored privately — '
                               'customers only ever receive a short-lived signed link, never '
                               'a public URL.',
                   )
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

    def clean(self):
        # A digital product with no file attached would sell perfectly well and
        # then have nothing to deliver — the customer pays and gets an empty
        # downloads list. Caught here so the admin refuses to save it at all.
        from django.core.exceptions import ValidationError
        if self.product_type == 'digital' and not self.digital_file:
            raise ValidationError({
                'digital_file': 'A digital product needs a PDF attached, otherwise '
                                'customers would pay and receive nothing.'
            })
        super().clean()

    def save(self, *args, **kwargs):
        # Physical items only. Without this guard a digital product — which has
        # no stock and so sits at quantity 0 forever — would flip itself to
        # 'out_of_stock' on its very first save and disappear from the shop the
        # moment it was created.
        if self.product_type == 'physical':
            if self.quantity <= 0 and self.stock_status == 'in_stock':
                self.stock_status = 'out_of_stock'
            elif self.quantity > 0 and self.stock_status == 'out_of_stock':
                self.stock_status = 'in_stock'
        super().save(*args, **kwargs)

    @property
    def is_digital(self):
        return self.product_type == 'digital'

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
    amount_usd          = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                            help_text='USD-equivalent total quoted at checkout for USA orders. Null for Ghana/WhatsApp orders.')
    delivery_zone       = models.ForeignKey(DeliveryZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    delivery_fee        = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    paystack_reference  = models.CharField(max_length=100, blank=True)
    tracking_token      = models.CharField(max_length=96, unique=True, null=True, blank=True,
                            help_text='Opaque token for the emailed order-tracking link — keeps '
                                       'the customer\'s email out of a URL that ends up in browser '
                                       'history and server logs. Auto-generated on creation.')
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f'Order #{self.pk} — {self.full_name} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.pk and not self.tracking_token:
            self.tracking_token = secrets.token_hex(48)
        super().save(*args, **kwargs)


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


class DigitalEntitlement(models.Model):
    """
    Permanent proof that an email owns a digital product.

    Deliberately a real row rather than something derived from OrderItem, for
    three reasons: a refund can revoke one entitlement without touching order
    history; Maame Ama can gift a product with no order at all; and it mirrors
    how CoursePurchase already works for course access.

    Unlike CoursePurchase there is NO expiry — a bought PDF is owned forever.
    What expires is the signed download URL, which is re-minted on every visit.
    """
    email      = models.EmailField(db_index=True)
    product    = models.ForeignKey(ProductItem, on_delete=models.CASCADE, related_name='entitlements')
    order      = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True,
                   related_name='entitlements',
                   help_text='The order this came from. Blank for manually granted/gifted access.')
    granted_at = models.DateTimeField(auto_now_add=True)
    is_active  = models.BooleanField(default=True,
                   help_text='Uncheck to revoke access (e.g. after a refund) without deleting '
                             'the record.')

    class Meta:
        ordering            = ['-granted_at']
        unique_together     = ('email', 'product')
        verbose_name        = 'Digital Entitlement'
        verbose_name_plural = 'Digital Entitlements'

    def __str__(self):
        return f'{self.email} — {self.product.name}'


class ShopAccessToken(models.Model):
    """
    One-time magic link for the customer account page. Expires in 24 hours.

    Mirrors CourseAccessToken (courses/models.py) but is kept separate so shop
    access and course access stay independent — a shop customer who has never
    bought a course should not receive a course session, and vice versa.
    """
    email      = models.EmailField(db_index=True)
    token      = models.CharField(max_length=96, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Shop Access Token'
        verbose_name_plural = 'Shop Access Tokens'

    def __str__(self):
        return f'{self.email} — {"used" if self.is_used else "unused"}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_for_email(cls, email, expiry_hours=24):
        cls.objects.filter(email=email, is_used=False).update(is_used=True)
        return cls.objects.create(
            email=email,
            token=secrets.token_hex(48),
            expires_at=timezone.now() + timezone.timedelta(hours=expiry_hours),
        )


class ShopSession(models.Model):
    """
    Active account-page session for a customer email.

    ⚠️ Intentionally NOT reusing CourseSession. That model caps sessions at 2 per
    email and expires them after 8 hours — a deliberate anti-sharing limit on
    concurrent *video streams*. Neither rule makes sense for reading your own
    order history: a customer checking an order on both phone and laptop would
    silently evict a session, and everyone would be logged out after 8 hours just
    for looking at a delivery status. So: long expiry, no device cap.
    """
    email       = models.EmailField(db_index=True)
    session_key = models.CharField(max_length=96, unique=True)
    device_hint = models.CharField(max_length=200, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    last_seen   = models.DateTimeField(auto_now=True)
    expires_at  = models.DateTimeField()

    class Meta:
        ordering            = ['-last_seen']
        verbose_name        = 'Shop Session'
        verbose_name_plural = 'Shop Sessions'

    def __str__(self):
        return f'{self.email} — {self.device_hint[:60] or "unknown device"}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_for_email(cls, email, device_hint='', expiry_days=30):
        return cls.objects.create(
            email=email,
            session_key=secrets.token_hex(48),
            device_hint=device_hint[:200],
            expires_at=timezone.now() + timezone.timedelta(days=expiry_days),
        )
