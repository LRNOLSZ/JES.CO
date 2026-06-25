from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.html import mark_safe
from unfold.admin import ModelAdmin

from .models import IntroVideo as _IntroVideo


class IntroVideoAdminForm(forms.ModelForm):
    class Meta:
        model  = _IntroVideo
        fields = '__all__'
        widgets = {
            'video_url': forms.FileInput(attrs={'accept': 'video/mp4,video/*'}),
        }

from .models import PageImages, SiteSettings, SocialLink, Testimonial
from .models import IntroVideo


def url_preview(field, size=80):
    """Render a small thumbnail from an ImageField or URL string, or a dash if empty."""
    url = field.url if field and hasattr(field, 'url') else field
    if url:
        return mark_safe(f'<img src="{url}" style="height:{size}px;width:auto;border-radius:6px;object-fit:cover;" />')
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
    list_display  = ('name', 'location', 'rating', 'service', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    ordering      = ('order', '-created_at')
    fields        = ('name', 'location', 'comment', 'profile_picture', 'rating', 'service', 'order', 'is_active')


# ── Intro Videos ──────────────────────────────────────────────────────────────

@admin.register(IntroVideo)
class IntroVideoAdmin(ModelAdmin):
    form          = IntroVideoAdminForm
    list_display  = ('get_page_display', 'title', 'is_active', 'updated_at')
    list_editable = ('is_active',)
    ordering      = ('page',)
    fields        = ('page', 'video_url', 'title', 'is_active')

    def get_page_display(self, obj):
        return obj.get_page_display()
    get_page_display.short_description = 'Page'
