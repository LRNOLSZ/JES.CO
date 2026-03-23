from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import SiteSettings, SocialLink, Testimonial


@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    fieldsets = (
        ('Footer Tagline', {
            'fields': ('tagline',),
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'location'),
        }),
        ('Background Images', {
            'fields': ('hero_bg', 'studio_bg'),
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
    list_display  = ('name', 'location', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    ordering      = ('order', '-created_at')
    fields        = ('name', 'location', 'comment', 'profile_picture', 'order', 'is_active')
