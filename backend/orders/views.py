from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer, CartItemSerializer,
    OrderSerializer, CreateOrderSerializer, UpdateOrderStatusSerializer,
)
from products.models import Product


def _notify_order_status(order):
    """Отправить WebSocket-уведомление об изменении статуса заказа."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'order_{order.pk}',
        {
            'type': 'order_status_update',
            'order_id': order.pk,
            'status': order.status,
            'status_display': order.get_status_display(),
        }
    )
    # Также в общую ленту уведомлений пользователя
    async_to_sync(channel_layer.group_send)(
        f'user_{order.user_id}_notifications',
        {
            'type': 'notification',
            'message': f'Статус заказа #{order.pk} изменён: {order.get_status_display()}',
            'order_id': order.pk,
            'status': order.status,
        }
    )


class CartViewSet(viewsets.ViewSet):
    """
    GET    /api/orders/cart/               — получить корзину
    POST   /api/orders/cart/add/           — добавить товар
    PATCH  /api/orders/cart/update/{id}/   — изменить количество
    DELETE /api/orders/cart/remove/{id}/   — удалить позицию
    DELETE /api/orders/cart/clear/         — очистить корзину
    """

    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        cart = self._get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart = self._get_or_create_cart(request.user)
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        quantity = serializer.validated_data.get('quantity', 1)

        if product.stock < quantity:
            return Response(
                {'detail': f'Недостаточно товара на складе. Доступно: {product.stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += quantity
            item.save()

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['patch'], url_path='update/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        cart = self._get_or_create_cart(request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        quantity = request.data.get('quantity', 1)

        if int(quantity) < 1:
            item.delete()
        else:
            item.quantity = quantity
            item.save()

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['delete'], url_path='remove/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        cart = self._get_or_create_cart(request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        cart = self._get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class OrderViewSet(viewsets.ModelViewSet):
    """
    GET    /api/orders/                   — список моих заказов
    POST   /api/orders/checkout/          — оформить заказ из корзины
    GET    /api/orders/{id}/              — детали заказа
    PATCH  /api/orders/{id}/update_status/— изменить статус (admin)
    POST   /api/orders/{id}/cancel/       — отменить заказ (auth)
    """

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().prefetch_related('items')
        return Order.objects.filter(user=user).prefetch_related('items')

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Оформить заказ из корзины."""
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_object_or_404(Cart, user=request.user)
        items = cart.items.select_related('product').all()

        if not items.exists():
            return Response(
                {'detail': 'Корзина пуста.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка наличия на складе
        for item in items:
            if item.product.stock < item.quantity:
                return Response(
                    {'detail': f'Товар «{item.product.title}» доступен только в количестве {item.product.stock} шт.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        total = sum(item.total_price for item in items)

        order = Order.objects.create(
            user=request.user,
            delivery_address=serializer.validated_data['delivery_address'],
            comment=serializer.validated_data.get('comment', ''),
            total_price=total,
        )

        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_title=item.product.title,
                price=item.product.discounted_price,
                quantity=item.quantity,
            )
            # Списать со склада
            Product.objects.filter(pk=item.product.pk).update(
                stock=item.product.stock - item.quantity
            )

        # Очистить корзину
        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update_status',
            permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        """Изменить статус заказа (только admin). Уведомление через WebSocket."""
        order = self.get_object()
        serializer = UpdateOrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Real-time уведомление
        _notify_order_status(order)

        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отменить заказ (только покупатель, только в статусе pending)."""
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if order.status != Order.STATUS_PENDING:
            return Response(
                {'detail': 'Можно отменить только заказ в статусе «Ожидает подтверждения».'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = Order.STATUS_CANCELLED
        order.save()
        _notify_order_status(order)
        return Response(OrderSerializer(order).data)
