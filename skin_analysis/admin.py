from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.decorators import display

from core.admin import person_display

from .models import SkinAnalysisSubmission


@admin.register(SkinAnalysisSubmission)
class SkinAnalysisSubmissionAdmin(ModelAdmin):
    list_display  = ('email_display', 'skin_tone', 'is_paid', 'replied', 'created_at')
    list_editable = ('replied',)
    list_filter   = ('is_paid', 'replied', 'skin_tone')
    search_fields = ('email', 'full_name')
    ordering      = ('-created_at',)
    readonly_fields = ('is_paid', 'paystack_reference', 'amount_paid', 'created_at')
    compressed_fields = True
    fieldsets = (
        ('Contact', {
            'fields': ('full_name', 'email'),
            'classes': ('tab',),
        }),
        ('Skin Profile', {
            'fields': ('skin_tone', 'undertone', 'skin_type', 'skin_concern', 'allergies', 'allergies_detail'),
            'classes': ('tab',),
        }),
        ('Preferences & Budget', {
            'fields': ('makeup_routine', 'foundation_finish', 'occasion', 'budget', 'additional_notes'),
            'classes': ('tab',),
        }),
        ('Payment & Status', {
            'fields': ('is_paid', 'paystack_reference', 'amount_paid', 'replied', 'created_at'),
            'classes': ('tab',),
        }),
    )

    @display(description='Email', ordering='email')
    def email_display(self, obj):
        return person_display(obj.email, subtitle=obj.full_name or None)

    def has_add_permission(self, request):
        return False
