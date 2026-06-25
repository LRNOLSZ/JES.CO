from django.db import models
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFit


def _video_storage():
    from jesrestudio_backend.cloudinary_storage import CloudinaryVideoStorage
    return CloudinaryVideoStorage()


class PageImages(models.Model):
    """
    Singleton — one record holds every site-level image.
    Maame Ama uploads images directly; they go to R2 in production.
    """

    # ── Home Page ──────────────────────────────────────────────
    home_hero = ProcessedImageField(
        upload_to='pages/', blank=True, null=True,
        processors=[ResizeToFit(1920, 1080)], format='WEBP', options={'quality': 88},
        help_text='Full-screen background photo on the JES.CO home page hero.')
    home_studio_feature = ProcessedImageField(
        upload_to='pages/', blank=True, null=True,
        processors=[ResizeToFit(1200, 900)], format='WEBP', options={'quality': 88},
        help_text='Photo shown in the "Studio" feature section on the home page.')

    # ── Studio Page ────────────────────────────────────────────
    studio_portrait = ProcessedImageField(
        upload_to='pages/', blank=True, null=True,
        processors=[ResizeToFit(800, 1200)], format='WEBP', options={'quality': 88},
        help_text="Maame Ama's portrait shown in the studio page hero (arch frame).")
    studio_about = ProcessedImageField(
        upload_to='pages/', blank=True, null=True,
        processors=[ResizeToFit(1200, 900)], format='WEBP', options={'quality': 88},
        help_text='Photo shown in the "About the Studio" section.')
    studio_booking = ProcessedImageField(
        upload_to='pages/', blank=True, null=True,
        processors=[ResizeToFit(1200, 900)], format='WEBP', options={'quality': 88},
        help_text='Atmosphere photo shown beside the booking form.')
    studio_testimonials_bg = ProcessedImageField(
        upload_to='pages/', blank=True, null=True,
        processors=[ResizeToFit(1920, 1080)], format='WEBP', options={'quality': 85},
        help_text='Subtle background photo behind the testimonials section.')

    class Meta:
        verbose_name        = 'Page Images'
        verbose_name_plural = 'Page Images'

    def __str__(self):
        return 'Page Images'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SiteSettings(models.Model):
    """
    Singleton — contact details shown in the footer and other text content.
    """
    tagline  = models.TextField(default='Premium skin and makeup artistry by Maame Ama. Crafted for those who demand the finest.')
    email    = models.EmailField(default='hello@jesresstudio.com')
    phone    = models.CharField(max_length=30, default='+233 XX XXX XXXX')
    location = models.CharField(max_length=100, default='Accra, Ghana')

    class Meta:
        verbose_name        = 'Site Settings'
        verbose_name_plural = 'Site Settings'

    def __str__(self):
        return 'Site Settings'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Testimonial(models.Model):
    """
    Client testimonials shown in the studio page carousel.
    """
    name            = models.CharField(max_length=100)
    location        = models.CharField(max_length=100, blank=True, help_text='e.g. Accra, Ghana')
    comment         = models.TextField()
    profile_picture = ProcessedImageField(
                        upload_to='testimonials/', blank=True, null=True,
                        processors=[ResizeToFit(400, 400)], format='WEBP', options={'quality': 88},
                        help_text='Client photo or finished makeup shot.')
    rating          = models.PositiveSmallIntegerField(default=5, help_text='Star rating out of 5')
    service         = models.CharField(max_length=100, blank=True, help_text='e.g. Bridal Glam, Editorial')
    order           = models.PositiveIntegerField(default=0, help_text='Lower number appears first')
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['order', '-created_at']
        verbose_name        = 'Testimonial'
        verbose_name_plural = 'Testimonials'

    def __str__(self):
        return f'{self.name} — {self.location or "no location"}'


class SocialLink(models.Model):
    """
    One row per social media platform.
    """
    platform  = models.CharField(max_length=50, help_text='e.g. Instagram, TikTok, YouTube')
    handle    = models.CharField(max_length=100, help_text='Display text e.g. @jesresstudio')
    url       = models.URLField(help_text='Full URL to the social media page')
    order     = models.PositiveIntegerField(default=0, help_text='Lower number appears first')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering            = ['order', 'platform']
        verbose_name        = 'Social Link'
        verbose_name_plural = 'Social Links'

    def __str__(self):
        return f'{self.platform} — {self.handle}'


class IntroVideo(models.Model):
    """
    One intro video per page. Hosted on Cloudinary.
    """
    PAGE_CHOICES = [
        ('jesoco', 'JES.CO Homepage'),
        ('studio', 'Jesres Glam Studio'),
    ]

    page      = models.CharField(max_length=20, choices=PAGE_CHOICES, unique=True,
                    help_text='Which page this video appears on')
    video_url = models.FileField(
                    upload_to='intro_videos/',
                    storage=_video_storage,
                    blank=True, null=True,
                    help_text='Upload intro video (MP4). Goes to Cloudinary in production.')
    title     = models.CharField(max_length=200, blank=True, help_text='Optional caption')
    is_active = models.BooleanField(default=True, help_text='Uncheck to hide without deleting')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Intro Video'
        verbose_name_plural = 'Intro Videos'

    def __str__(self):
        return f'Intro Video — {self.get_page_display()}'
