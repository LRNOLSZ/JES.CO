from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import AdminFileWidget
from django.utils.html import mark_safe
from django.shortcuts import redirect
from unfold.admin import ModelAdmin

from .models import PageImages, SiteSettings, SocialLink, Testimonial, IntroVideo


# ── Helpers ───────────────────────────────────────────────────────────────────

def img_preview(field_file, size=80):
    """Return a small thumbnail tag if an image is uploaded, else a dash."""
    if field_file:
        return mark_safe(f'<img src="{field_file.url}" style="height:{size}px;width:auto;border-radius:6px;object-fit:cover;" />')
    return '—'


# ── Forms ─────────────────────────────────────────────────────────────────────

class PageImagesForm(forms.ModelForm):
    class Meta:
        model  = PageImages
        fields = '__all__'
        widgets = {
            'home_hero':              AdminFileWidget(attrs={'accept': 'image/*'}),
            'home_studio_feature':    AdminFileWidget(attrs={'accept': 'image/*'}),
            'studio_portrait':        AdminFileWidget(attrs={'accept': 'image/*'}),
            'studio_about':           AdminFileWidget(attrs={'accept': 'image/*'}),
            'studio_booking':         AdminFileWidget(attrs={'accept': 'image/*'}),
            'studio_testimonials_bg': AdminFileWidget(attrs={'accept': 'image/*'}),
        }


class SiteSettingsForm(forms.ModelForm):
    class Meta:
        model  = SiteSettings
        fields = '__all__'


class TestimonialForm(forms.ModelForm):
    class Meta:
        model  = Testimonial
        fields = '__all__'
        widgets = {
            'profile_picture': AdminFileWidget(attrs={'accept': 'image/*'}),
        }


class IntroVideoForm(forms.ModelForm):
    class Meta:
        model  = IntroVideo
        fields = '__all__'
        widgets = {
            'video_file': AdminFileWidget(attrs={'accept': 'video/*'}),
        }


# ── Admin classes ─────────────────────────────────────────────────────────────

@admin.register(PageImages)
class PageImagesAdmin(ModelAdmin):
    form = PageImagesForm
    fieldsets = (
        ('Home Page', {
            'description': 'Images that appear on the main JES.CO landing page.',
            'fields': ('home_hero', 'home_hero_preview', 'home_studio_feature', 'home_studio_feature_preview'),
        }),
        ('Studio Page', {
            'description': 'Images that appear on the Jesres Glam Studio page.',
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

    def home_hero_preview(self, obj):               return img_preview(obj.home_hero)
    def home_studio_feature_preview(self, obj):     return img_preview(obj.home_studio_feature)
    def studio_portrait_preview(self, obj):         return img_preview(obj.studio_portrait)
    def studio_about_preview(self, obj):            return img_preview(obj.studio_about)
    def studio_booking_preview(self, obj):          return img_preview(obj.studio_booking)
    def studio_testimonials_bg_preview(self, obj):  return img_preview(obj.studio_testimonials_bg)

    home_hero_preview.short_description              = 'Current'
    home_studio_feature_preview.short_description    = 'Current'
    studio_portrait_preview.short_description        = 'Current'
    studio_about_preview.short_description           = 'Current'
    studio_booking_preview.short_description         = 'Current'
    studio_testimonials_bg_preview.short_description = 'Current'

    def changelist_view(self, request, extra_context=None):
        # Singleton: if a record exists, skip the list and go straight to edit
        if PageImages.objects.exists():
            obj = PageImages.objects.get(pk=1)
            return redirect(f'../{ obj.pk }/change/')
        return super().changelist_view(request, extra_context)

    def has_add_permission(self, request):
        return not PageImages.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    form = SiteSettingsForm
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
            obj = SiteSettings.objects.get(pk=1)
            return redirect(f'../{ obj.pk }/change/')
        return super().changelist_view(request, extra_context)

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SocialLink)
class SocialLinkAdmin(ModelAdmin):
    list_display  = ('platform', 'handle', 'url', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering      = ('order', 'platform')


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    form          = TestimonialForm
    list_display  = ('name', 'location', 'rating', 'service', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    ordering      = ('order', '-created_at')
    fields        = ('name', 'location', 'comment', 'profile_picture', 'rating', 'service', 'order', 'is_active')


@admin.register(IntroVideo)
class IntroVideoAdmin(ModelAdmin):
    form          = IntroVideoForm
    list_display  = ('get_page_display', 'title', 'is_active', 'updated_at')
    list_editable = ('is_active',)
    ordering      = ('page',)
    fields        = ('page', 'video_file', 'title', 'is_active')

    def get_page_display(self, obj):
        return obj.get_page_display()
    get_page_display.short_description = 'Page'
