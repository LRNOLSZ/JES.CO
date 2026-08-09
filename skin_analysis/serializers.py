import unicodedata

from rest_framework import serializers
from .models import SkinAnalysisSubmission


def reject_control_characters(value):
    """Rejects control (Cc) and format (Cf) Unicode characters — e.g. null
    bytes, zero-width spaces, right-to-left override — while allowing normal
    whitespace. Blocks binary-blob pastes and text-spoofing tricks in free-text
    fields that later get rendered in admin emails."""
    for ch in value:
        if ch in ('\t', '\n', '\r'):
            continue
        if unicodedata.category(ch) in ('Cc', 'Cf'):
            raise serializers.ValidationError('This field contains characters that are not allowed.')
    return value


class SkinAnalysisSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SkinAnalysisSubmission
        fields = [
            'full_name', 'email',
            'skin_tone', 'undertone', 'skin_type', 'skin_concern',
            'allergies', 'allergies_detail', 'makeup_routine',
            'foundation_finish', 'occasion', 'budget', 'additional_notes',
        ]

    def validate_full_name(self, value):
        return reject_control_characters(value)

    def validate_allergies_detail(self, value):
        return reject_control_characters(value)

    def validate_additional_notes(self, value):
        value = reject_control_characters(value)
        if len(value.split()) > 1000:
            raise serializers.ValidationError('Please keep additional notes under 1000 words.')
        return value
