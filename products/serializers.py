from rest_framework import serializers
from .models import DeliveryZone, Order, OrderItem, ProductItem


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

    def create(self, validated_data):
        items_data       = validated_data.pop('items')
        zone_id          = validated_data.pop('delivery_zone_id', None)
        if zone_id:
            try:
                validated_data['delivery_zone'] = DeliveryZone.objects.get(pk=zone_id)
            except DeliveryZone.DoesNotExist:
                pass
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order


class OrderStatusSerializer(serializers.ModelSerializer):
    items         = OrderItemSerializer(many=True, read_only=True)
    delivery_zone = DeliveryZoneSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'full_name', 'status', 'status_display',
            'total', 'delivery_zone', 'delivery_fee',
            'items', 'created_at',
        ]


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
