from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from products.views import CategoryViewSet
from rest_framework.routers import DefaultRouter

categories_router = DefaultRouter()
categories_router.register('categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('admin/', admin.site.urls),

    # API
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/auth/', include('users.urls')),

    path('api/', include(categories_router.urls)),

    # OpenAPI документация
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
