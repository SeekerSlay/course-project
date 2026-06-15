import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from orders import consumers as order_consumers

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    
    # WebSocket соединения
    'websocket': AuthMiddlewareStack(
        URLRouter([
            path('ws/orders/<int:order_id>/', order_consumers.OrderStatusConsumer.as_asgi()),
            path('ws/notifications/', order_consumers.NotificationConsumer.as_asgi()),
        ])
    ),
})