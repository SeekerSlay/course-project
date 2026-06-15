import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class OrderStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket /ws/orders/{order_id}/
    Клиент подписывается на обновления статуса конкретного заказа.
    """

    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'order_{self.order_id}'

        # Проверка: заказ принадлежит пользователю (или пользователь — admin)
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        has_access = await self._check_order_access(user, self.order_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': f'Подключено к заказу #{self.order_id}',
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # Клиент может отправить ping
        data = json.loads(text_data)
        if data.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def order_status_update(self, event):
        """Получить сообщение из группы и переслать клиенту."""
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'order_id': event['order_id'],
            'status': event['status'],
            'status_display': event['status_display'],
        }))

    @database_sync_to_async
    def _check_order_access(self, user, order_id):
        from orders.models import Order
        if user.is_staff:
            return True
        return Order.objects.filter(pk=order_id, user=user).exists()


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket /ws/notifications/
    Общий канал уведомлений для авторизованного пользователя.
    """

    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        self.group_name = f'user_{user.pk}_notifications'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': 'Уведомления подключены.',
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def notification(self, event):
        """Получить уведомление из группы и переслать клиенту."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'order_id': event.get('order_id'),
            'status': event.get('status'),
        }))
