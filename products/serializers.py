from rest_framework import serializers
from .models import ProductItem


class ProductItemSerializer(serializers.ModelSerializer):
    image_url        = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    stock_display    = serializers.CharField(source='get_stock_status_display', read_only=True)

    class Meta:
        model  = ProductItem
        fields = [
            'id', 'name', 'description', 'price',
            'image_url', 'category', 'category_display',
            'stock_status', 'stock_display', 'order',
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
