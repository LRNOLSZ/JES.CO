from rest_framework import serializers
from .models import SkinAnalysisSubmission


class SkinAnalysisSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SkinAnalysisSubmission
        fields = [
            'full_name', 'email',
            'skin_tone', 'undertone', 'skin_type', 'skin_concern',
            'allergies', 'allergies_detail', 'makeup_routine',
            'foundation_finish', 'occasion', 'budget', 'additional_notes',
        ]
