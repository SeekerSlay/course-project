from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Product, Comment, Favorite
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer, CommentSerializer, FavoriteSerializer,
)
from .permissions import IsAdminOrReadOnly, IsAuthorOrReadOnly
from .filters import ProductFilter


class CategoryViewSet(viewsets.ModelViewSet):
    """
    GET  /api/products/categories/       — список категорий
    POST /api/products/categories/       — создать (admin)
    GET  /api/products/categories/{id}/  — детали
    PUT  /api/products/categories/{id}/  — обновить (admin)
    DELETE /api/products/categories/{id}/— удалить (admin)
    """

    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    pagination_class = None  # категорий мало — пагинация не нужна


class ProductViewSet(viewsets.ModelViewSet):
    """
    GET    /api/products/                — список с фильтрами и пагинацией
    POST   /api/products/                — создать товар (admin)
    GET    /api/products/{slug}/         — детали + отзывы
    PUT    /api/products/{slug}/         — обновить (admin)
    DELETE /api/products/{slug}/         — удалить (admin)
    POST   /api/products/{slug}/increment_views/ — счётчик просмотров
    POST   /api/products/{slug}/toggle_favorite/ — избранное (auth)
    GET    /api/products/favorites/      — мои избранные (auth)
    """

    queryset = Product.objects.filter(is_published=True).select_related(
        'category', 'author'
    ).prefetch_related('comments', 'favorited_by')
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filterset_class = ProductFilter
    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]
    search_fields = ['title', 'description', 'composition']
    ordering_fields = ['price', 'created_at', 'views']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Инкремент просмотров при GET детали
        Product.objects.filter(pk=instance.pk).update(views=instance.views + 1)
        instance.views += 1
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, slug=None):
        """Добавить/удалить из избранного (оптимистичное обновление на фронте)."""
        product = self.get_object()
        fav, created = Favorite.objects.get_or_create(
            user=request.user, product=product
        )
        if not created:
            fav.delete()
            return Response({'is_favorited': False, 'product_id': product.id})
        return Response({'is_favorited': True, 'product_id': product.id})

    @action(
        detail=False, methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='favorites'
    )
    def favorites(self, request):
        """Список избранных товаров текущего пользователя."""
        favs = Favorite.objects.filter(user=request.user).select_related('product__category')
        serializer = FavoriteSerializer(favs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'],
            permission_classes=[permissions.IsAuthenticated],
            url_path='my-products')
    def my_products(self, request):
        """Товары, добавленные текущим администратором."""
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        products = Product.objects.filter(author=request.user)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    GET    /api/products/{product_slug}/comments/      — отзывы товара
    POST   /api/products/{product_slug}/comments/      — добавить отзыв (auth)
    PUT    /api/products/{product_slug}/comments/{id}/ — обновить (автор)
    DELETE /api/products/{product_slug}/comments/{id}/ — удалить (автор/admin)
    """

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_queryset(self):
        product_slug = self.kwargs.get('product_slug')
        product = get_object_or_404(Product, slug=product_slug, is_published=True)
        return Comment.objects.filter(
            product=product, is_published=True
        ).select_related('author')

    def perform_create(self, serializer):
        product_slug = self.kwargs.get('product_slug')
        product = get_object_or_404(Product, slug=product_slug, is_published=True)
        serializer.save(author=self.request.user, product=product)
