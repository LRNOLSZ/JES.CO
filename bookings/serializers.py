from rest_framework import serializers
from .models import BookingRequest


class BookingRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model  = BookingRequest
        fields = [
            'full_name', 'email', 'phone',
            'service_type', 'preferred_date', 'message',
        ]
