from rest_framework import serializers
from .models import Order, OrderItem, ProductItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ['product_id', 'name', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model  = Order
        fields = ['full_name', 'email', 'phone', 'address', 'notes', 'total', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order


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
