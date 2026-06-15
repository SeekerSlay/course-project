from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'', views.ProductViewSet, basename='product')

# Вложенный роутер для отзывов: /api/products/{slug}/comments/
comment_list = views.CommentViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
comment_detail = views.CommentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', include(router.urls)),
    path('<slug:product_slug>/comments/', comment_list, name='comment-list'),
    path('<slug:product_slug>/comments/<int:pk>/', comment_detail, name='comment-detail'),
]
