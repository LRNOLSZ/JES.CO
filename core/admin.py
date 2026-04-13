from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import AdminFileWidget
from unfold.admin import ModelAdmin

from .models import SiteSettings, SocialLink, Testimonial, IntroVideo


class SiteSettingsForm(forms.ModelForm):
    class Meta:
        model  = SiteSettings
        fields = '__all__'
        widgets = {
            'hero_bg':         AdminFileWidget(attrs={'accept': 'image/*'}),
            'studio_bg':       AdminFileWidget(attrs={'accept': 'image/*'}),
            'testimonials_bg': AdminFileWidget(attrs={'accept': 'image/*'}),
        }


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


@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    form = SiteSettingsForm
    fieldsets = (
        ('Footer Tagline', {
            'fields': ('tagline',),
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'location'),
        }),
        ('Background Images', {
            'fields': ('hero_bg', 'studio_bg', 'testimonials_bg'),
        }),
    )

    def has_add_permission(self, request):
        # Only one record allowed — hide Add button if it already exists
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of the singleton
        return False


@admin.register(SocialLink)
class SocialLinkAdmin(ModelAdmin):
    list_display  = ('platform', 'handle', 'url', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering      = ('order', 'platform')


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    form          = TestimonialForm
    list_display  = ('name', 'location', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    ordering      = ('order', '-created_at')
    fields        = ('name', 'location', 'comment', 'profile_picture', 'order', 'is_active')


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
