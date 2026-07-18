import json
from datetime import date

from django import forms
from django.contrib import admin
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html, mark_safe
from unfold.admin import ModelAdmin

from .models import IntroVideo as _IntroVideo


class IntroVideoAdminForm(forms.ModelForm):
    class Meta:
        model  = _IntroVideo
        fields = '__all__'
        widgets = {
            'video_url': forms.FileInput(attrs={'accept': 'video/mp4,video/*'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk and self.instance.video_url:
            self.fields['video_url'].widget.attrs['data-has-existing'] = '1'

from .models import PageImages, SiteSettings, SocialLink, Testimonial
from .models import IntroVideo
from .models import BookingRevenue, Announcement


def url_preview(field, size=80):
    """Render a small thumbnail from an ImageField or URL string, or a dash if empty."""
    url = field.url if field and hasattr(field, 'url') else field
    if url:
        return mark_safe(f'<img src="{url}" style="height:{size}px;width:auto;border-radius:6px;object-fit:cover;" />')
    return '—'


def video_preview(field, size=160):
    """Render a playable <video> tag from a video FileField, or a dash if empty.

    Bunny Stream serves HLS (.m3u8), which only plays natively in Safari — so the
    URL is passed via data-hls-src and loaded by admin_video_preview.js (hls.js
    for Chrome/Firefox/Edge, native src for Safari), same split as VideoPlayer.jsx.
    """
    url = field.url if field and hasattr(field, 'url') else field
    if url:
        return mark_safe(
            f'<video data-hls-src="{url}" controls '
            f'style="height:{size}px;width:auto;border-radius:6px;background:#000;"></video>'
        )
    return '—'


# ── Page Images ───────────────────────────────────────────────────────────────

@admin.register(PageImages)
class PageImagesAdmin(ModelAdmin):
    fieldsets = (
        ('Home Page', {
            'fields': ('home_hero', 'home_hero_preview', 'home_studio_feature', 'home_studio_feature_preview'),
        }),
        ('Studio Page', {
            'fields': (
                'studio_portrait',        'studio_portrait_preview',
                'studio_about',           'studio_about_preview',
                'studio_booking',         'studio_booking_preview',
                'studio_testimonials_bg', 'studio_testimonials_bg_preview',
            ),
        }),
    )
    readonly_fields = (
        'home_hero_preview', 'home_studio_feature_preview',
        'studio_portrait_preview', 'studio_about_preview',
        'studio_booking_preview', 'studio_testimonials_bg_preview',
    )

    def home_hero_preview(self, obj):              return url_preview(obj.home_hero)
    def home_studio_feature_preview(self, obj):    return url_preview(obj.home_studio_feature)
    def studio_portrait_preview(self, obj):        return url_preview(obj.studio_portrait)
    def studio_about_preview(self, obj):           return url_preview(obj.studio_about)
    def studio_booking_preview(self, obj):         return url_preview(obj.studio_booking)
    def studio_testimonials_bg_preview(self, obj): return url_preview(obj.studio_testimonials_bg)

    home_hero_preview.short_description              = 'Current'
    home_studio_feature_preview.short_description    = 'Current'
    studio_portrait_preview.short_description        = 'Current'
    studio_about_preview.short_description           = 'Current'
    studio_booking_preview.short_description         = 'Current'
    studio_testimonials_bg_preview.short_description = 'Current'

    def changelist_view(self, request, extra_context=None):
        if PageImages.objects.exists():
            url = reverse('admin:core_pageimages_change', args=[1])
            return redirect(url)
        return super().changelist_view(request, extra_context)

    def has_add_permission(self, request):
        return not PageImages.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


# ── Site Settings ─────────────────────────────────────────────────────────────

@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    fieldsets = (
        ('Brand Tagline', {
            'fields': ('tagline',),
        }),
        ('Contact Details', {
            'description': 'Shown in the site footer.',
            'fields': ('email', 'phone', 'location'),
        }),
    )

    def changelist_view(self, request, extra_context=None):
        if SiteSettings.objects.exists():
            url = reverse('admin:core_sitesettings_change', args=[1])
            return redirect(url)
        return super().changelist_view(request, extra_context)

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


# ── Social Links ──────────────────────────────────────────────────────────────

@admin.register(SocialLink)
class SocialLinkAdmin(ModelAdmin):
    list_display  = ('platform', 'handle', 'url', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering      = ('order', 'platform')


# ── Testimonials ──────────────────────────────────────────────────────────────

@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    list_display  = ('name', 'testimonial_type', 'location', 'rating', 'service', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter   = ('testimonial_type', 'is_active')
    ordering      = ('order', '-created_at')
    fields        = (
        'testimonial_type', 'name', 'location', 'comment', 'profile_picture',
        'before_image', 'before_image_preview', 'after_image', 'after_image_preview',
        'rating', 'service', 'source_comment', 'order', 'is_active',
    )
    readonly_fields = ('before_image_preview', 'after_image_preview')

    def before_image_preview(self, obj): return url_preview(obj.before_image)
    def after_image_preview(self, obj):  return url_preview(obj.after_image)
    before_image_preview.short_description = 'Current'
    after_image_preview.short_description  = 'Current'


# ── Intro Videos ──────────────────────────────────────────────────────────────

@admin.register(IntroVideo)
class IntroVideoAdmin(ModelAdmin):
    form            = IntroVideoAdminForm

    class Media:
        js = ('js/vendor/hls.min.js', 'js/admin_video_preview.js')

    list_display    = ('get_page_display', 'title', 'is_active', 'updated_at')
    list_editable   = ('is_active',)
    ordering        = ('page',)
    fields          = ('page', 'video_url', 'video_url_preview', 'title', 'is_active')
    readonly_fields = ('video_url_preview',)

    def video_url_preview(self, obj):
        return video_preview(obj.video_url)
    video_url_preview.short_description = 'Current'

    def get_page_display(self, obj):
        return obj.get_page_display()
    get_page_display.short_description = 'Page'


# ── Booking Revenue ────────────────────────────────────────────────────────────

@admin.register(BookingRevenue)
class BookingRevenueAdmin(ModelAdmin):
    list_display  = ('date', 'amount', 'description')
    search_fields = ('description',)
    ordering      = ('-date',)


# ── Announcements ──────────────────────────────────────────────────────────────

ANNOUNCEMENT_STATUS_COLORS = {
    'ongoing':  ('#16a34a', 'Happening Now'),
    'upcoming': ('#D4AF37', 'Upcoming'),
    'past':     ('#6b7280', 'Past'),
}


@admin.register(Announcement)
class AnnouncementAdmin(ModelAdmin):
    list_display  = ('title', 'start_date', 'end_date', 'status_badge', 'is_active', 'order')
    list_editable = ('order', 'is_active')
    list_filter   = ('is_active',)
    ordering      = ('-start_date',)
    fields        = ('title', 'description', 'image', 'start_date', 'end_date', 'order', 'is_active')

    def status_badge(self, obj):
        color, label = ANNOUNCEMENT_STATUS_COLORS.get(obj.status, ('#6b7280', obj.status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:0.7rem;font-weight:600;">{}</span>',
            color, label,
        )
    status_badge.short_description = 'Status'


# ── Finance dashboard ──────────────────────────────────────────────────────────

def _last_12_months():
    today = timezone.now().date().replace(day=1)
    months = []
    for i in range(11, -1, -1):
        year, month = today.year, today.month - i
        while month <= 0:
            month += 12
            year -= 1
        months.append(date(year, month, 1))
    return months


def _monthly_totals(queryset, date_field, value_field, months):
    rows = (
        queryset.annotate(month=TruncMonth(date_field))
        .values('month')
        .annotate(total=Sum(value_field))
        .order_by('month')
    )
    by_month = {r['month'].strftime('%Y-%m'): float(r['total'] or 0) for r in rows if r['month']}
    return [by_month.get(m.strftime('%Y-%m'), 0) for m in months]


def dashboard_callback(request, context):
    """Feeds the Django admin index page a monthly revenue chart + details table."""
    from products.models import Order
    from courses.models import CoursePurchase

    months = _last_12_months()
    labels = [m.strftime('%b %Y') for m in months]

    product_data = _monthly_totals(Order.objects.filter(amount_ghs__isnull=False), 'created_at', 'amount_ghs', months)
    course_data  = _monthly_totals(CoursePurchase.objects.filter(price_paid__isnull=False), 'purchased_at', 'price_paid', months)
    booking_data = _monthly_totals(BookingRevenue.objects.all(), 'date', 'amount', months)

    chart_data = {
        'labels': labels,
        'datasets': [
            {'label': 'Products', 'data': product_data, 'backgroundColor': '#60269E'},
            {'label': 'Courses',  'data': course_data,  'backgroundColor': '#D4AF37'},
            {'label': 'Bookings', 'data': booking_data, 'backgroundColor': '#1a56db'},
        ],
    }

    revenue_table = [
        {
            'month':    labels[i],
            'products': product_data[i],
            'courses':  course_data[i],
            'bookings': booking_data[i],
            'total':    product_data[i] + course_data[i] + booking_data[i],
        }
        for i in range(len(labels))
    ]

    context.update({
        'revenue_chart_data': json.dumps(chart_data),
        'revenue_table':      revenue_table,
        'revenue_total':      sum(row['total'] for row in revenue_table),
    })
    return context
