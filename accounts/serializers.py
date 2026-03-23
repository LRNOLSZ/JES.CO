from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_subscription_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'subscription_tier',
            'expiry_date',
            'is_subscription_active',
        ]
        read_only_fields = ['id', 'subscription_tier', 'expiry_date', 'is_subscription_active']
