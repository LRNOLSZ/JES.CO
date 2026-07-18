import secrets
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFit


def _video_storage():
    from jesrestudio_backend.bunny_storage import BunnyStreamStorage
    return BunnyStreamStorage()


class CourseTier(models.Model):
    """
    Pricing tier for a course — Basic, Silver, Gold, etc.
    Managed entirely from admin, no hardcoded choices.
    Tiers are independent: paying for Gold does NOT unlock Basic or Silver.
    """
    name          = models.CharField(max_length=50, unique=True,
                      help_text='e.g. Basic, Silver, Gold')
    slug          = models.SlugField(max_length=50, unique=True, blank=True)
    badge_color   = models.CharField(max_length=20, default='#D4AF37',
                      help_text='Hex colour for the tier badge, e.g. #D4AF37')
    price_display = models.CharField(max_length=50, blank=True,
                      help_text='Display price shown on cards, e.g. GHS 250')
    order         = models.PositiveIntegerField(default=0,
                      help_text='Lower number appears first')
    is_active     = models.BooleanField(default=True)

    class Meta:
        ordering            = ['order', 'name']
        verbose_name        = 'Course Tier'
        verbose_name_plural = 'Course Tiers'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class CoursePageSettings(models.Model):
    """
    Singleton — controls the hero section on /studio/courses.
    """
    hero_bg = ProcessedImageField(
                     upload_to='courses/heroes/', blank=True, null=True,
                     processors=[ResizeToFit(1920, 1080)], format='WEBP', options={'quality': 88},
                     help_text='Courses page hero background image.')
    hero_heading = models.CharField(max_length=200,
                     default='Master the Art of Beauty')
    hero_subtext = models.TextField(
                     default='Step-by-step video courses taught by Maame Ama — learn professional makeup at your own pace.')

    class Meta:
        verbose_name        = 'Course Page Settings'
        verbose_name_plural = 'Course Page Settings'

    def __str__(self):
        return 'Course Page Settings'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Course(models.Model):
    """
    A single course — has a public trailer and a tier-locked full video.
    Videos hosted on Bunny Stream (HLS). Thumbnail hosted on Cloudflare R2.
    """
    CATEGORY_CHOICES = [
        ('foundation',   'Foundation & Base'),
        ('eyes',         'Eye Artistry'),
        ('contour',      'Contouring & Sculpting'),
        ('bridal',       'Bridal Makeup'),
        ('full_glam',    'Full Glam'),
        ('editorial',    'Editorial / Creative'),
        ('lips',         'Lip Artistry'),
        ('color_theory', 'Color Theory'),
    ]

    title            = models.CharField(max_length=200)
    slug             = models.SlugField(max_length=200, unique=True, blank=True)
    description      = models.TextField()
    what_youll_learn = models.TextField(blank=True,
                         help_text='One point per line — shown as a bullet list')

    thumbnail = ProcessedImageField(
                  upload_to='courses/thumbnails/', blank=True, null=True,
                  processors=[ResizeToFit(800, 600)], format='WEBP', options={'quality': 88},
                  help_text='Course cover image.')

    category  = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    tier      = models.ForeignKey(CourseTier, on_delete=models.PROTECT,
                    related_name='courses',
                    help_text='Display tier label only — Basic, Premium, Exclusive etc.')
    price     = models.PositiveIntegerField(default=0,
                    help_text='Price in Ghana Cedis (GHS). Used for Paystack checkout.')

    trailer_video = models.FileField(
                      upload_to='courses/trailers/',
                      storage=_video_storage,
                      blank=True, null=True,
                      help_text='Upload the short public trailer video (MP4). Streams via Bunny Stream (HLS).')
    course_video  = models.FileField(
                      upload_to='courses/videos/',
                      storage=_video_storage,
                      blank=True, null=True,
                      help_text='Upload the full tier-locked course video (MP4). Streams via Bunny Stream (HLS).')
    subtitle_url  = models.URLField(blank=True,
                      help_text='Paste the .vtt subtitle file URL (optional).')

    duration_display = models.CharField(max_length=30, blank=True,
                         help_text='e.g. 3h 20m — shown on the course card')

    is_featured = models.BooleanField(default=False,
                    help_text='Show on the studio homepage preview (max 3)')
    is_active   = models.BooleanField(default=True,
                    help_text='Uncheck to hide without deleting')
    order       = models.PositiveIntegerField(default=0,
                    help_text='Lower number appears first')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['order', '-created_at']
        verbose_name        = 'Course'
        verbose_name_plural = 'Courses'

    def __str__(self):
        return f'{self.title} ({self.tier})'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


# ── Loginless Course Access System ────────────────────────────────────────────

class CoursePurchase(models.Model):
    """Records which email has purchased which course. Access expires after 6 months."""
    email               = models.EmailField(db_index=True)
    course              = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='purchases')
    purchased_at        = models.DateTimeField(auto_now_add=True)
    expires_at          = models.DateTimeField(
                            null=True, blank=True,
                            help_text='Access expiry date. Auto-set to 6 months from purchase. Edit to extend.')
    paystack_reference  = models.CharField(max_length=100, blank=True,
                            help_text='Paystack transaction reference — auto-filled by webhook.')
    price_paid          = models.PositiveIntegerField(null=True, blank=True,
                            help_text='GHS amount actually paid at time of purchase/renewal — snapshot so revenue stays accurate if the course price changes later.')
    reminder_14_sent    = models.BooleanField(default=False, help_text='14-day expiry reminder email sent.')
    reminder_5_sent     = models.BooleanField(default=False, help_text='5-day expiry reminder email sent.')
    expiry_notice_sent  = models.BooleanField(default=False, help_text='Access-expired notice email sent.')

    class Meta:
        unique_together     = ('email', 'course')
        ordering            = ['-purchased_at']
        verbose_name        = 'Course Purchase'
        verbose_name_plural = 'Course Purchases'

    def __str__(self):
        return f'{self.email} → {self.course.title}'

    def save(self, *args, **kwargs):
        if not self.pk and self.expires_at is None:
            self.expires_at = timezone.now() + timezone.timedelta(days=180)
        super().save(*args, **kwargs)

    @property
    def is_access_expired(self):
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    @property
    def days_remaining(self):
        if self.expires_at is None:
            return None
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)


class Student(CoursePurchase):
    """Proxy model for the Students admin view — groups purchases by email."""
    class Meta:
        proxy               = True
        verbose_name        = 'Student'
        verbose_name_plural = 'Students'


class CourseAccessToken(models.Model):
    """One-time magic link token sent to a student's email. Expires in 24 hours."""
    email      = models.EmailField(db_index=True)
    token      = models.CharField(max_length=96, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Course Access Token'
        verbose_name_plural = 'Course Access Tokens'

    def __str__(self):
        state = 'used' if self.is_used else ('expired' if self.is_expired else 'active')
        return f'{self.email} — {state}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_for_email(cls, email, expiry_hours=24):
        cls.objects.filter(email=email, is_used=False).update(is_used=True)
        token = secrets.token_hex(48)
        expires_at = timezone.now() + timezone.timedelta(hours=expiry_hours)
        return cls.objects.create(email=email, token=token, expires_at=expires_at)


class CourseSession(models.Model):
    """Active dashboard session for a student email. Max 2 per email — oldest is auto-kicked."""
    email       = models.EmailField(db_index=True)
    session_key = models.CharField(max_length=96, unique=True)
    device_hint = models.CharField(max_length=200, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    last_seen   = models.DateTimeField(auto_now=True)
    expires_at  = models.DateTimeField()

    MAX_SESSIONS = 2

    class Meta:
        ordering            = ['-last_seen']
        verbose_name        = 'Course Session'
        verbose_name_plural = 'Course Sessions'

    def __str__(self):
        return f'{self.email} — {self.device_hint[:60] or "unknown device"}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def create_for_email(cls, email, device_hint='', expiry_hours=8):
        sessions = cls.objects.filter(email=email).order_by('last_seen')
        if sessions.count() >= cls.MAX_SESSIONS:
            sessions.first().delete()
        session_key = secrets.token_hex(48)
        expires_at  = timezone.now() + timezone.timedelta(hours=expiry_hours)
        return cls.objects.create(
            email=email,
            session_key=session_key,
            device_hint=device_hint[:200],
            expires_at=expires_at,
        )


class VideoHeartbeat(models.Model):
    """
    Tracks concurrent video streams per session+course.
    Max 2 active heartbeats (last_ping < 60s ago) per email+course combination.
    """
    session_key = models.CharField(max_length=96, db_index=True)
    course      = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='heartbeats')
    ip_address  = models.GenericIPAddressField()
    last_ping   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together     = ('session_key', 'course')
        verbose_name        = 'Video Heartbeat'
        verbose_name_plural = 'Video Heartbeats'

    def __str__(self):
        return f'{self.session_key[:12]}… → {self.course.title}'


class CourseComment(models.Model):
    """Student comments on a course — require Maame Ama's approval before showing publicly."""
    course      = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='comments')
    email       = models.EmailField()
    body        = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False,
                    help_text='Tick to make this comment visible on the site.')

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Course Comment'
        verbose_name_plural = 'Course Comments'

    def __str__(self):
        return f'{self.email} on "{self.course.title}"'
