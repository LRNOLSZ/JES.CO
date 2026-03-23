from rest_framework import serializers
from .models import GalleryItem


class GalleryItemSerializer(serializers.ModelSerializer):
    before_image = serializers.ImageField(use_url=True)
    after_image = serializers.ImageField(use_url=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = GalleryItem
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_display',
            'before_image',
            'after_image',
            'publish_at',
            'created_at',
        ]
