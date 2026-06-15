from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.serializers import ProductListSerializer
from products.models import Product


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_published=True),
        write_only=True,
        source='product'
    )
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total_price']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.ReadOnlyField()
    total_items = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_items', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_title', 'price', 'quantity', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'status_display', 'user_email', 'delivery_address',
            'comment', 'total_price', 'items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'total_price', 'created_at', 'updated_at']


class CreateOrderSerializer(serializers.Serializer):
    """Оформление заказа из корзины."""
    delivery_address = serializers.CharField(required=True)
    comment = serializers.CharField(required=False, allow_blank=True, default='')


class UpdateOrderStatusSerializer(serializers.ModelSerializer):
    """Смена статуса заказа (только для администратора)."""

    class Meta:
        model = Order
        fields = ['status']
