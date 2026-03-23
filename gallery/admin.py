from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from unfold.admin import ModelAdmin

from .models import GalleryItem


@admin.register(GalleryItem)
class GalleryItemAdmin(ModelAdmin):
    list_display = ('title', 'category', 'publish_status', 'publish_at', 'order', 'before_thumb', 'after_thumb', 'created_at')
    list_filter = ('category',)
    list_editable = ('order',)
    search_fields = ('title', 'description')
    ordering = ('order', '-created_at')

    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'category'),
        }),
        ('Images', {
            'fields': ('before_image', 'after_image'),
        }),
        ('Publishing', {
            'fields': ('publish_at', 'order'),
            'description': (
                'Leave "Publish at" blank to save as a draft. '
                'Set it to now to publish immediately, or pick any future date/time to schedule.'
            ),
        }),
    )

    @admin.display(description='Status')
    def publish_status(self, obj):
        status = obj.status
        styles = {
            'draft':     ('background:#6b7280;color:#fff', 'Draft'),
            'scheduled': ('background:#d97706;color:#fff', 'Scheduled'),
            'live':      ('background:#16a34a;color:#fff', 'Live'),
        }
        style, label = styles[status]
        return format_html(
            '<span style="{}; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600;">{}</span>',
            style, label,
        )

    @admin.display(description='Before')
    def before_thumb(self, obj):
        if obj.before_image:
            return format_html('<img src="{}" style="height:60px;border-radius:4px;" />', obj.before_image.url)
        return '—'

    @admin.display(description='After')
    def after_thumb(self, obj):
        if obj.after_image:
            return format_html('<img src="{}" style="height:60px;border-radius:4px;" />', obj.after_image.url)
        return '—'
