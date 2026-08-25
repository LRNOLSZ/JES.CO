import csv

from django import forms
from django.contrib import admin
from django.db.models import Count, Min
from django.http import HttpResponse
from django.urls import reverse
from unfold.admin import ModelAdmin
from unfold.decorators import display

from core.admin import action_button, person_display, url_preview, video_preview

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


@admin.action(description='Reset reminder flags (allow re-sending)')
def reset_reminder_flags(modeladmin, request, queryset):
    queryset.update(reminder_14_sent=False, reminder_5_sent=False, expiry_notice_sent=False)


@admin.action(description='Promote to testimonial (draft)')
def promote_to_testimonial(modeladmin, request, queryset):
    from core.models import Testimonial
    created = 0
    for comment in queryset.filter(is_approved=True):
        if Testimonial.objects.filter(source_comment=comment).exists():
            continue
        Testimonial.objects.create(
            testimonial_type='student',
            name=comment.name or '(add student name)',
            comment=comment.body,
            service=comment.course.title,
            before_image=comment.before_image,
            after_image=comment.after_image,
            source_comment=comment,
            is_active=False,
        )
        created += 1
    modeladmin.message_user(
        request,
        f'{created} draft testimonial(s) created. Edit them under Testimonials to add a name/photo, then activate.'
    )


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


# ── Model admins ──────────────────────────────────────────────────────────────

@admin.register(CourseTier)
class CourseTierAdmin(ModelAdmin):
    list_display  = ('name', 'badge_color', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering      = ('order', 'name')
    fields        = ('name', 'slug', 'badge_color', 'order', 'is_active')
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
    compressed_fields = True
    fieldsets = (
        ('Course Info', {
            'fields': ('title', 'slug', 'description', 'what_youll_learn', 'thumbnail'),
            'classes': ('tab',),
        }),
        ('Classification & Pricing', {
            'fields': ('category', 'tier', 'price', 'duration_display'),
            'classes': ('tab',),
        }),
        ('Videos', {
            'fields': (
                'trailer_video', 'trailer_video_preview',
                'course_video', 'course_video_preview',
                'subtitle_url',
            ),
            'classes': ('tab',),
        }),
        ('Visibility', {
            'fields': ('is_featured', 'is_active', 'order'),
            'classes': ('tab',),
        }),
    )

    def trailer_video_preview(self, obj):
        return video_preview(obj.trailer_video, size=480)
    trailer_video_preview.short_description = 'Current'

    def course_video_preview(self, obj):
        return video_preview(obj.course_video, size=480)
    course_video_preview.short_description = 'Current'


@admin.register(CoursePurchase)
class CoursePurchaseAdmin(ModelAdmin):
    list_display    = ('email_display', 'course', 'purchased_at', 'expires_at', 'access_status')
    list_filter     = ('course',)
    search_fields   = ('email', 'course__title', 'paystack_reference')
    ordering        = ('-purchased_at',)
    readonly_fields = ('purchased_at', 'add_course_for_email')
    fieldsets = (
        ('Purchaser & Course', {
            'fields': ('email', 'course', 'expires_at', 'paystack_reference', 'purchased_at'),
        }),
        ('Reminders & Status', {
            'fields': ('reminder_14_sent', 'reminder_5_sent', 'expiry_notice_sent', 'add_course_for_email'),
        }),
    )

    @display(description='Email', ordering='email')
    def email_display(self, obj):
        return person_display(obj.email)

    @display(description='Access', label={
        'expired': 'danger', 'soon': 'warning', 'ok': 'success', 'lifetime': 'info',
    })
    def access_status(self, obj):
        if obj.is_access_expired:
            return 'expired', 'Expired'
        if obj.days_remaining is not None and obj.days_remaining <= 14:
            return 'soon', f'{obj.days_remaining} days left'
        if obj.days_remaining is not None:
            return 'ok', f'{obj.days_remaining} days left'
        return 'lifetime', 'Lifetime'
    actions         = [export_emails_csv, reset_reminder_flags]

    def add_course_for_email(self, obj):
        url = reverse('admin:courses_coursepurchase_add') + f'?email={obj.email}'
        return action_button(url, f'+ Add another course for {obj.email}')
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
        # Theme-aware Tailwind classes instead of hardcoded hex — the previous version
        # used dark-mode-only colors (#2a2020 borders, #aaa text) that were illegible
        # in light mode, same class of bug as Stage 1's malformed-CSS fix.
        td = 'px-3 py-1.5 border-b border-base-200 dark:border-base-800'
        muted = f'{td} text-font-subtle-light dark:text-font-subtle-dark'
        rows = ''.join(
            f'<tr>'
            f'<td class="{td}">{escape(p.course.title)}</td>'
            f'<td class="{muted}">{escape(str(p.course.tier))}</td>'
            f'<td class="{muted}">{p.purchased_at.strftime("%d %b %Y")}</td>'
            f'<td class="{muted}">{escape(p.paystack_reference) if p.paystack_reference else "—"}</td>'
            f'</tr>'
            for p in purchases
        )
        th = 'px-3 py-1.5 text-left text-primary-600 dark:text-primary-500 font-semibold'
        html = (
            f'<div class="overflow-x-auto">'
            f'<table class="w-full text-sm" style="border-collapse:collapse;">'
            f'<thead><tr>'
            f'<th class="{th}">Course</th>'
            f'<th class="{th}">Tier</th>'
            f'<th class="{th}">Purchased</th>'
            f'<th class="{th}">Reference</th>'
            f'</tr></thead><tbody>{rows}</tbody></table>'
            f'</div>'
        )
        from django.utils.safestring import mark_safe
        return mark_safe(html)
    purchased_courses_list.short_description = 'Purchased Courses'

    @display(description='Email', ordering='email')
    def student_email(self, obj):
        return person_display(obj.email)

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
        return action_button(url, f'+ Add a course for {obj.email}')
    add_course_link.short_description = 'Quick Action'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ── Session + Comment admins ──────────────────────────────────────────────────

@admin.register(CourseSession)
class CourseSessionAdmin(ModelAdmin):
    list_display    = ('email_display', 'created_at', 'last_seen', 'expires_at')
    search_fields   = ('email',)
    ordering        = ('-last_seen',)
    readonly_fields = ('created_at', 'last_seen', 'session_key')

    @display(description='Email', ordering='email')
    def email_display(self, obj):
        return person_display(obj.email, subtitle=obj.device_hint or None)

    def has_add_permission(self, request):
        return False


@admin.register(CourseComment)
class CourseCommentAdmin(ModelAdmin):
    list_display  = ('email_display', 'course', 'short_body', 'is_approved', 'created_at')
    list_editable = ('is_approved',)
    list_filter   = ('course', 'is_approved')
    search_fields = ('email', 'name', 'body')
    ordering      = ('-created_at',)
    actions       = [promote_to_testimonial]
    compressed_fields = True
    fieldsets = (
        ('Comment', {
            'fields': ('course', 'email', 'name', 'body'),
        }),
        ('Before & After Photos', {
            'fields': ('before_image', 'before_image_preview', 'after_image', 'after_image_preview'),
        }),
        ('Moderation', {
            'fields': ('is_approved', 'created_at'),
        }),
    )
    readonly_fields = ('created_at', 'before_image_preview', 'after_image_preview')

    @display(description='Email', ordering='email')
    def email_display(self, obj):
        return person_display(obj.email, subtitle=obj.name or None)

    def short_body(self, obj):
        return obj.body[:80] + '…' if len(obj.body) > 80 else obj.body
    short_body.short_description = 'Comment'

    def before_image_preview(self, obj): return url_preview(obj.before_image)
    def after_image_preview(self, obj):  return url_preview(obj.after_image)
    before_image_preview.short_description = 'Before Preview'
    after_image_preview.short_description  = 'After Preview'
