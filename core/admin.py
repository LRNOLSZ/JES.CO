import json
from datetime import date

from django import forms
from django.contrib import admin
from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html, mark_safe
from unfold.admin import ModelAdmin
from unfold.decorators import display

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
    """Render a small thumbnail from an ImageField or URL string, or a dash if empty.
    Wrapped in a bordered rounded "media card" so it reads as a distinct element on
    the page instead of a bare floating image — same treatment as video_preview()."""
    url = field.url if field and hasattr(field, 'url') else field
    if url:
        return mark_safe(
            f'<div class="inline-block p-1 bg-base-50 dark:bg-base-900 border border-base-200 '
            f'dark:border-base-800 rounded-default overflow-hidden">'
            f'<img src="{url}" style="height:{size}px;width:auto;border-radius:4px;object-fit:cover;" />'
            f'</div>'
        )
    return '—'


def action_button(url, label):
    """Themed link-button using real Unfold/Tailwind classes (matching its own button
    styling) instead of hand-rolled hex — reused by any admin.py view that renders a
    clickable admin action (e.g. CoursePurchaseAdmin/StudentAdmin's 'add course' links)."""
    return format_html(
        '<a href="{}" class="bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium '
        'px-4 py-2 rounded-default inline-block no-underline">{}</a>',
        url, label,
    )


def initials_avatar(text):
    """Small circle showing the first letter of `text`, matching Unfold's own
    avatar.html chrome (same real Tailwind classes it uses, not hand-computed
    color values) — reused across every person-centric list view."""
    initial = (text or '?')[0].upper()
    return format_html(
        '<div class="bg-base-200 dark:bg-base-700 h-8 w-8 min-w-8 rounded-default flex items-center '
        'justify-center font-semibold text-xs text-font-important-light dark:text-font-important-dark">{}</div>',
        initial,
    )


def person_display(primary_text, subtitle=None):
    """Avatar + primary text (+ optional smaller subtitle line) — the dash2-style
    identity-column cell used across CoursePurchase/Student/CourseComment/
    CourseSession/SkinAnalysisSubmission/User list views."""
    avatar = initials_avatar(primary_text)
    if subtitle:
        return format_html(
            '<div class="flex items-center gap-2">{}<div><div class="font-medium">{}</div>'
            '<div class="text-xs text-font-subtle-light dark:text-font-subtle-dark">{}</div></div></div>',
            avatar, primary_text, subtitle,
        )
    return format_html(
        '<div class="flex items-center gap-2">{}<div class="font-medium">{}</div></div>',
        avatar, primary_text,
    )


def video_preview(field, size=160):
    """Render a playable <video> tag from a video FileField, or a dash if empty.

    Bunny Stream serves HLS (.m3u8), which only plays natively in Safari — so the
    URL is passed via data-hls-src and loaded by admin_video_preview.js (hls.js
    for Chrome/Firefox/Edge, native src for Safari), same split as VideoPlayer.jsx.
    """
    url = field.url if field and hasattr(field, 'url') else field
    if url:
        return mark_safe(
            f'<div class="inline-block p-1 bg-base-50 dark:bg-base-900 border border-base-200 '
            f'dark:border-base-800 rounded-default overflow-hidden">'
            f'<video data-hls-src="{url}" controls '
            f'style="height:{size}px;width:auto;border-radius:4px;background:#000;"></video>'
            f'</div>'
        )
    return '—'


# ── Page Images ───────────────────────────────────────────────────────────────

@admin.register(PageImages)
class PageImagesAdmin(ModelAdmin):
    compressed_fields = True
    fieldsets = (
        ('Home Page', {
            'fields': ('home_hero', 'home_hero_preview', 'home_studio_feature', 'home_studio_feature_preview'),
            'classes': ('tab',),
        }),
        ('Studio Page', {
            'fields': (
                'studio_portrait',        'studio_portrait_preview',
                'studio_about',           'studio_about_preview',
                'studio_booking',         'studio_booking_preview',
                'studio_testimonials_bg', 'studio_testimonials_bg_preview',
            ),
            'classes': ('tab',),
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
    compressed_fields = True
    fieldsets = (
        ('Testimonial', {
            'fields': ('testimonial_type', 'name', 'location', 'comment', 'profile_picture'),
        }),
        ('Before & After Photos', {
            'fields': ('before_image', 'before_image_preview', 'after_image', 'after_image_preview'),
        }),
        ('Rating & Publishing', {
            'fields': ('rating', 'service', 'source_comment', 'order', 'is_active'),
        }),
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

# obj.status is a Python property (core/models.py), not a choices field, so there's
# no get_status_display() to reuse — just the display text here, color mapping is
# now handled by the @display(label=...) decorator below instead of hardcoded hex.
ANNOUNCEMENT_STATUS_LABELS = {
    'ongoing':  'Happening Now',
    'upcoming': 'Upcoming',
    'past':     'Past',
}


@admin.register(Announcement)
class AnnouncementAdmin(ModelAdmin):
    list_display  = ('title', 'start_date', 'end_date', 'status_badge', 'is_active', 'order')
    list_editable = ('order', 'is_active')
    list_filter   = ('is_active',)
    ordering      = ('-start_date',)
    fieldsets = (
        ('Content', {
            'fields': ('title', 'description', 'image'),
        }),
        ('Scheduling & Visibility', {
            'fields': ('start_date', 'end_date', 'order', 'is_active'),
        }),
    )

    @display(description='Status', label={'ongoing': 'success', 'upcoming': 'primary'})
    def status_badge(self, obj):
        return obj.status, ANNOUNCEMENT_STATUS_LABELS.get(obj.status, obj.status)


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


def _trend_label(current, previous):
    """Month-over-month % change, prepared as a ready-to-render label (text + badge variant)
    so the template only has to drop it into the label component, no conditionals there."""
    if not previous:
        return None
    pct = round((current - previous) / previous * 100, 1)
    sign = '+' if pct >= 0 else ''
    return {'text': f'{sign}{pct}%', 'variant': 'success' if pct >= 0 else 'danger'}


def dashboard_callback(request, context):
    """Feeds the Django admin index page a monthly revenue chart + details table, plus a
    KPI stat row (Stage 1 of the admin aesthetic overhaul — see the
    admin_dashboard_aesthetic_overhaul memory)."""
    from products.models import Order
    from courses.models import CoursePurchase

    months = _last_12_months()
    labels = [m.strftime('%b %Y') for m in months]

    product_data = _monthly_totals(Order.objects.filter(amount_ghs__isnull=False), 'created_at', 'amount_ghs', months)
    course_data  = _monthly_totals(CoursePurchase.objects.filter(price_paid__isnull=False), 'purchased_at', 'price_paid', months)
    booking_data = _monthly_totals(BookingRevenue.objects.all(), 'date', 'amount', months)

    # New palette's gold/base-derived hex values, replacing the old purple/gold/blue trio —
    # keep in sync with COLORS.primary in settings.py if that scale ever changes.
    chart_data = {
        'labels': labels,
        'datasets': [
            {'label': 'Products', 'data': product_data, 'backgroundColor': '#A8864A'},
            {'label': 'Courses',  'data': course_data,  'backgroundColor': '#6E4B8E'},
            {'label': 'Bookings', 'data': booking_data, 'backgroundColor': '#8E713E'},
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
    revenue_total = sum(row['total'] for row in revenue_table)

    # Revenue breakdown doughnut — same 12-month totals, just summed per-category instead of
    # per-month, so it reads as "share of revenue" alongside the existing bar chart.
    breakdown_totals = {
        'Products': sum(product_data),
        'Courses':  sum(course_data),
        'Bookings': sum(booking_data),
    }
    breakdown_chart_data = {
        'labels': list(breakdown_totals.keys()),
        'datasets': [{
            'data': list(breakdown_totals.values()),
            'backgroundColor': ['#A8864A', '#6E4B8E', '#8E713E'],
        }],
    }

    # KPI row — this-month vs last-month, derived from the per-month arrays already computed
    # above (no extra queries needed for the revenue/orders figures).
    revenue_this_month = revenue_table[-1]['total'] if revenue_table else 0
    revenue_prev_month  = revenue_table[-2]['total'] if len(revenue_table) > 1 else 0
    orders_this_month  = Order.objects.filter(created_at__year=months[-1].year, created_at__month=months[-1].month).count()
    orders_prev_month  = Order.objects.filter(created_at__year=months[-2].year, created_at__month=months[-2].month).count()
    active_students = CoursePurchase.objects.filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
    ).values('email').distinct().count()

    context.update({
        'revenue_chart_data':    json.dumps(chart_data),
        'breakdown_chart_data':  json.dumps(breakdown_chart_data),
        'revenue_table':         revenue_table,
        'revenue_total':         revenue_total,
        'revenue_this_month':    revenue_this_month,
        'revenue_trend':         _trend_label(revenue_this_month, revenue_prev_month),
        'orders_this_month':     orders_this_month,
        'orders_trend':          _trend_label(orders_this_month, orders_prev_month),
        'active_students':       active_students,
    })
    return context
