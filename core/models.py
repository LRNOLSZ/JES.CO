from django.db import models


class SiteSettings(models.Model):
    """
    Singleton model — only one record should ever exist.
    Stores contact details shown in the footer.
    """
    tagline  = models.TextField(default='Premium skin and makeup artistry by Maame Ama. Crafted for those who demand the finest.')
    email    = models.EmailField(default='hello@jesresstudio.com')
    phone    = models.CharField(max_length=30, default='+233 XX XXX XXXX')
    location = models.CharField(max_length=100, default='Accra, Ghana')

    # Background images — uploaded from admin, served to frontend
    hero_bg   = models.ImageField(upload_to='site/', blank=True, null=True,
                    help_text='Full-screen hero section background image')
    studio_bg = models.ImageField(upload_to='site/', blank=True, null=True,
                    help_text='The Studio section background image (will be blurred)')

    class Meta:
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'

    def __str__(self):
        return 'Site Settings'

    def save(self, *args, **kwargs):
        # Enforce singleton — always update the first record
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Testimonial(models.Model):
    """
    Client testimonials shown in the homepage carousel.
    Maame Ama adds these from admin — name, photo, location, comment.
    """
    name            = models.CharField(max_length=100)
    location        = models.CharField(max_length=100, blank=True,
                        help_text='e.g. Accra, Ghana')
    comment         = models.TextField()
    profile_picture = models.ImageField(upload_to='testimonials/', blank=True, null=True,
                        help_text='Client photo or finished makeup shot')
    order           = models.PositiveIntegerField(default=0,
                        help_text='Lower number appears first')
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name        = 'Testimonial'
        verbose_name_plural = 'Testimonials'

    def __str__(self):
        return f'{self.name} — {self.location or "no location"}'


class SocialLink(models.Model):
    """
    One row per social media platform.
    She can add, remove, or reorder these freely from the admin.
    """
    platform = models.CharField(
        max_length=50,
        help_text='e.g. Instagram, Facebook, TikTok, YouTube',
    )
    handle = models.CharField(
        max_length=100,
        help_text='Display text e.g. @jesresstudio',
    )
    url = models.URLField(help_text='Full URL to the social media page')
    order = models.PositiveIntegerField(default=0, help_text='Lower number appears first')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'platform']
        verbose_name = 'Social Link'
        verbose_name_plural = 'Social Links'

    def __str__(self):
        return f'{self.platform} — {self.handle}'
