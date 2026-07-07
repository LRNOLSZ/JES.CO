import csv

from django import forms
from django.contrib import admin
from django.db.models import Count, Min
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html, mark_safe
from unfold.admin import ModelAdmin

from .models import (
    CourseTier, CoursePageSettings, Course,
    CoursePurchase, Student, CourseSession, CourseComment,
)


# ── CSV export action ─────────────────────────────────────────────────────────

@admin.action(description='Export selected purchaser emails as CSV')
def export_emails_csv(modeladmin, request, queryset):
    emails = sorted(set(queryset.values_list('email', flat=True)))
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="purchaser_emails.csv"'
    writer = csv.writer(response)
    writer.writerow(['Email'])
    for email in emails:
        writer.writerow([email])
    return response


# ── Course admin form ─────────────────────────────────────────────────────────

class CourseAdminForm(forms.ModelForm):
    class Meta:
        model   = Course
        fields  = '__all__'
        widgets = {
            'trailer_video': forms.FileInput(attrs={'accept': 'video/mp4,video/*'}),
            'course_video':  forms.FileInput(attrs={'accept': 'video/mp4,video/*'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name in ('trailer_video', 'course_video'):
            if self.instance.pk and getattr(self.instance, field_name):
                self.fields[field_name].widget.attrs['data-has-existing'] = '1'


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


# ── Model admins ──────────────────────────────────────────────────────────────

@admin.register(CourseTier)
class CourseTierAdmin(ModelAdmin):
    list_display  = ('name', 'price_display', 'badge_color', 'order', 'is_active')
    list_editable = ('price_display', 'order', 'is_active')
    ordering      = ('order', 'name')
    fields        = ('name', 'slug', 'badge_color', 'price_display', 'order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(CoursePageSettings)
class CoursePageSettingsAdmin(ModelAdmin):
    fieldsets = (
        ('Hero Section', {
            'fields': ('hero_heading', 'hero_subtext', 'hero_bg'),
        }),
    )

    def has_add_permission(self, request):
        return not CoursePageSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    form          = CourseAdminForm

    class Media:
        js = ('js/vendor/hls.min.js', 'js/admin_video_preview.js')

    list_display  = ('title', 'category', 'tier', 'price', 'duration_display', 'is_featured', 'is_active', 'order')
    list_editable = ('price', 'order', 'is_featured', 'is_active')
    list_filter   = ('category', 'tier', 'is_active', 'is_featured')
    search_fields = ('title', 'description')
    ordering      = ('order', '-created_at')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('trailer_video_preview', 'course_video_preview')
    fieldsets = (
        ('Course Info', {
            'fields': ('title', 'slug', 'description', 'what_youll_learn', 'thumbnail'),
        }),
        ('Classification & Pricing', {
            'fields': ('category', 'tier', 'price', 'duration_display'),
        }),
        ('Videos', {
            'fields': (
                'trailer_video', 'trailer_video_preview',
                'course_video', 'course_video_preview',
                'subtitle_url',
            ),
        }),
        ('Visibility', {
            'fields': ('is_featured', 'is_active', 'order'),
        }),
    )

    def trailer_video_preview(self, obj):
        return video_preview(obj.trailer_video)
    trailer_video_preview.short_description = 'Current'

    def course_video_preview(self, obj):
        return video_preview(obj.course_video)
    course_video_preview.short_description = 'Current'


@admin.register(CoursePurchase)
class CoursePurchaseAdmin(ModelAdmin):
    list_display    = ('email', 'course', 'purchased_at', 'expires_at', 'access_status')
    list_filter     = ('course',)
    search_fields   = ('email', 'course__title', 'paystack_reference')
    ordering        = ('-purchased_at',)
    readonly_fields = ('purchased_at', 'add_course_for_email')
    fields          = ('email', 'course', 'expires_at', 'paystack_reference', 'purchased_at', 'add_course_for_email')

    def access_status(self, obj):
        if obj.is_access_expired:
            return format_html('<span style="color:#e05252;font-weight:600;">Expired</span>')
        if obj.days_remaining is not None and obj.days_remaining <= 14:
            return format_html('<span style="color:#e0a020;font-weight:600;">{} days left</span>', obj.days_remaining)
        if obj.days_remaining is not None:
            return format_html('<span style="color:#5fbf5f;">{} days left</span>', obj.days_remaining)
        return format_html('<span style="color:#888;">Lifetime</span>')
    access_status.short_description = 'Access'
    actions         = [export_emails_csv]

    def add_course_for_email(self, obj):
        url = reverse('admin:courses_coursepurchase_add') + f'?email={obj.email}'
        return format_html(
            '<a href="{}" style="display:inline-block;padding:0.4rem 1rem;'
            'background:#60269E;color:#fff;border-radius:6px;text-decoration:none;font-size:0.8rem;">'
            '+ Add another course for {}</a>',
            url, obj.email
        )
    add_course_for_email.short_description = 'Quick Action'

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        if 'email' in request.GET:
            initial['email'] = request.GET['email']
        return initial

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        widget = form.base_fields['course'].widget
        widget.can_add_related    = False
        widget.can_change_related = False
        widget.can_view_related   = False
        widget.can_delete_related = False
        return form


# ── Students admin (grouped by email) ────────────────────────────────────────

@admin.register(Student)
class StudentAdmin(ModelAdmin):
    list_display    = ('student_email', 'courses_owned', 'first_purchase')
    search_fields   = ('email',)
    ordering        = ('email',)
    readonly_fields = ('email', 'purchased_courses_list', 'add_course_link')
    fields          = ('email', 'purchased_courses_list', 'add_course_link')
    actions         = [export_emails_csv]

    def get_queryset(self, request):
        # One row per unique email — earliest purchase record per email
        qs = super().get_queryset(request)
        # Annotate and deduplicate: keep the first purchase per email
        emails_seen = set()
        unique_pks  = []
        for obj in qs.order_by('email', 'purchased_at'):
            if obj.email not in emails_seen:
                emails_seen.add(obj.email)
                unique_pks.append(obj.pk)
        return qs.filter(pk__in=unique_pks).order_by('email')

    def purchased_courses_list(self, obj):
        from django.utils.html import escape
        purchases = CoursePurchase.objects.filter(email=obj.email).select_related('course').order_by('purchased_at')
        if not purchases.exists():
            return '—'
        td = 'padding:0.35rem 0.75rem;border-bottom:1px solid #2a2020;'
        rows = ''.join(
            f'<tr>'
            f'<td style="{td}">{escape(p.course.title)}</td>'
            f'<td style="{td}color:#aaa;">{escape(str(p.course.tier))}</td>'
            f'<td style="{td}color:#aaa;">{p.purchased_at.strftime("%d %b %Y")}</td>'
            f'<td style="{td}color:#aaa;">{escape(p.paystack_reference) if p.paystack_reference else "—"}</td>'
            f'</tr>'
            for p in purchases
        )
        th = 'padding:0.35rem 0.75rem;text-align:left;color:#D4AF37;font-weight:600;'
        html = (
            f'<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">'
            f'<thead><tr>'
            f'<th style="{th}">Course</th>'
            f'<th style="{th}">Tier</th>'
            f'<th style="{th}">Purchased</th>'
            f'<th style="{th}">Reference</th>'
            f'</tr></thead><tbody>{rows}</tbody></table>'
        )
        from django.utils.safestring import mark_safe
        return mark_safe(html)
    purchased_courses_list.short_description = 'Purchased Courses'

    def student_email(self, obj):
        return obj.email
    student_email.short_description = 'Email'
    student_email.admin_order_field = 'email'

    def courses_owned(self, obj):
        count = CoursePurchase.objects.filter(email=obj.email).count()
        return f'{count} course{"s" if count != 1 else ""}'
    courses_owned.short_description = 'Courses Purchased'

    def first_purchase(self, obj):
        first = CoursePurchase.objects.filter(email=obj.email).order_by('purchased_at').first()
        return first.purchased_at.strftime('%d %b %Y') if first else '—'
    first_purchase.short_description = 'First Purchase'

    def add_course_link(self, obj):
        url = reverse('admin:courses_coursepurchase_add') + f'?email={obj.email}'
        return format_html(
            '<a href="{}" style="display:inline-block;padding:0.4rem 1rem;'
            'background:#60269E;color:#fff;border-radius:6px;text-decoration:none;font-size:0.8rem;">'
            '+ Add a course for {}</a>',
            url, obj.email
        )
    add_course_link.short_description = 'Quick Action'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ── Session + Comment admins ──────────────────────────────────────────────────

@admin.register(CourseSession)
class CourseSessionAdmin(ModelAdmin):
    list_display    = ('email', 'device_hint', 'created_at', 'last_seen', 'expires_at')
    search_fields   = ('email',)
    ordering        = ('-last_seen',)
    readonly_fields = ('created_at', 'last_seen', 'session_key')

    def has_add_permission(self, request):
        return False


@admin.register(CourseComment)
class CourseCommentAdmin(ModelAdmin):
    list_display  = ('email', 'course', 'short_body', 'is_approved', 'created_at')
    list_editable = ('is_approved',)
    list_filter   = ('course', 'is_approved')
    search_fields = ('email', 'body')
    ordering      = ('-created_at',)

    def short_body(self, obj):
        return obj.body[:80] + '…' if len(obj.body) > 80 else obj.body
    short_body.short_description = 'Comment'
