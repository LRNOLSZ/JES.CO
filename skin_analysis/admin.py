from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import SkinAnalysisSubmission


@admin.register(SkinAnalysisSubmission)
class SkinAnalysisSubmissionAdmin(ModelAdmin):
    list_display  = ('email', 'full_name', 'skin_tone', 'is_paid', 'replied', 'created_at')
    list_editable = ('replied',)
    list_filter   = ('is_paid', 'replied', 'skin_tone')
    search_fields = ('email', 'full_name')
    ordering      = ('-created_at',)
    readonly_fields = ('is_paid', 'paystack_reference', 'amount_paid', 'created_at')
    fields = (
        'full_name', 'email',
        'skin_tone', 'undertone', 'skin_type', 'skin_concern',
        'allergies', 'allergies_detail', 'makeup_routine',
        'foundation_finish', 'occasion', 'budget', 'additional_notes',
        'is_paid', 'paystack_reference', 'amount_paid', 'replied', 'created_at',
    )

    def has_add_permission(self, request):
        return False
