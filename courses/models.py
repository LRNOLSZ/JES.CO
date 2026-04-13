from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFit

ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']


def validate_video_file(file):
    import os
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError(
            f'Unsupported file type "{ext}". Please upload a video file: '
            + ', '.join(ALLOWED_VIDEO_EXTENSIONS)
        )


def validate_image_file(file):
    import os
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f'Unsupported file type "{ext}". Please upload an image file: '
            + ', '.join(ALLOWED_IMAGE_EXTENSIONS)
        )


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
    hero_bg      = models.ImageField(upload_to='courses/', blank=True, null=True,
                     help_text='Courses page hero background image')
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

    title           = models.CharField(max_length=200)
    slug            = models.SlugField(max_length=200, unique=True, blank=True)
    description     = models.TextField()
    what_youll_learn = models.TextField(blank=True,
                         help_text='One point per line — shown as a bullet list')

    thumbnail = ProcessedImageField(
        upload_to='courses/thumbnails/',
        processors=[ResizeToFit(800, 800)],
        format='WEBP',
        options={'quality': 88},
        help_text='Course cover image — auto-converted to WebP',
    )

    category        = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    tier            = models.ForeignKey(CourseTier, on_delete=models.PROTECT,
                         related_name='courses',
                         help_text='Which tier unlocks this course')

    trailer_video   = models.FileField(upload_to='courses/trailers/',
                         validators=[validate_video_file],
                         help_text='Short trailer — visible to everyone, no login required. MP4/MOV/WEBM only.')
    course_video    = models.FileField(upload_to='courses/videos/',
                         validators=[validate_video_file],
                         help_text='Full course video — locked behind the tier paywall. MP4/MOV/WEBM only.')

    duration_display = models.CharField(max_length=30, blank=True,
                         help_text='e.g. 3h 20m — shown on the course card')

    is_featured     = models.BooleanField(default=False,
                         help_text='Show on the studio homepage preview (max 3)')
    is_active       = models.BooleanField(default=True,
                         help_text='Uncheck to hide without deleting')
    order           = models.PositiveIntegerField(default=0,
                         help_text='Lower number appears first')
    created_at      = models.DateTimeField(auto_now_add=True)

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
