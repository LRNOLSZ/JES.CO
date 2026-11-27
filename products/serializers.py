from rest_framework import serializers
from .models import (
    DeliveryZone, DigitalEntitlement, Order, OrderItem, ProductImage, ProductItem,
)


class DeliveryZoneSerializer(serializers.ModelSerializer):
    currency = serializers.SerializerMethodField()

    def get_currency(self, obj):
        return 'GHS' if obj.country == 'ghana' else 'USD'

    class Meta:
        model  = DeliveryZone
        fields = ['id', 'country', 'location_name', 'price', 'currency']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ['product_id', 'name', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items            = OrderItemSerializer(many=True)
    delivery_zone_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model  = Order
        fields = [
            'full_name', 'email', 'phone', 'address', 'notes',
            'total', 'delivery_zone_id', 'delivery_fee', 'paystack_reference', 'items',
        ]


class OrderStatusSerializer(serializers.ModelSerializer):
    items         = OrderItemSerializer(many=True, read_only=True)
    delivery_zone = DeliveryZoneSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'full_name', 'status', 'status_display',
            'total', 'amount_usd', 'delivery_zone', 'delivery_fee',
            'items', 'created_at',
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    """An extra gallery photo. Absolute URL so it works identically whether the
    page is rendered in the browser or by the build-time pre-renderer."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'order']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ProductItemSerializer(serializers.ModelSerializer):
    images           = ProductImageSerializer(many=True, read_only=True)
    image_url        = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    type_display     = serializers.CharField(source='get_product_type_display', read_only=True)
    stock_display    = serializers.CharField(source='get_stock_status_display', read_only=True)

    class Meta:
        model  = ProductItem
        fields = [
            'id', 'slug', 'name', 'description', 'price', 'price_usd',
            'image_url', 'images', 'category', 'category_display',
            'product_type', 'type_display',
            'stock_status', 'stock_display', 'quantity', 'order',
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class DigitalDownloadSerializer(serializers.ModelSerializer):
    """One owned digital product, with a freshly signed download URL.

    `url` is generated at serialization time, so every request to the account
    page returns a brand-new short-lived link. That's what lets the entitlement
    be permanent while the URL itself stays short-lived — nothing is ever
    stored or emailed that could leak the file long-term.
    """
    product_id = serializers.IntegerField(source='product.pk', read_only=True)
    name       = serializers.CharField(source='product.name', read_only=True)
    url        = serializers.SerializerMethodField()

    class Meta:
        model  = DigitalEntitlement
        fields = ['product_id', 'name', 'url', 'granted_at']

    def get_url(self, obj):
        if not obj.product.digital_file:
            return None
        return obj.product.digital_file.url
