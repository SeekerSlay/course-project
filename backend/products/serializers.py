from rest_framework import serializers
from .models import Category, Product, Comment, Favorite


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(
        source='products.count', read_only=True
    )

    class Meta:
        model = Category
        fields = ['id', 'title', 'slug', 'description', 'image', 'is_active', 'product_count']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.ImageField(source='author.avatar', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author_name', 'author_avatar', 'text', 'rating', 'created_at']
        read_only_fields = ['id', 'author_name', 'author_avatar', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Краткое представление для списка товаров."""

    category_title = serializers.CharField(source='category.title', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'price', 'discount', 'discounted_price',
            'image', 'category_title', 'is_vegan', 'is_organic',
            'stock', 'views', 'average_rating', 'is_favorited', 'created_at',
        ]

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, product=obj).exists()
        return False


class ProductDetailSerializer(serializers.ModelSerializer):
    """Полное представление товара с отзывами."""

    category = CategorySerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    discounted_price = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    author_name = serializers.CharField(source='author.username', read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, product=obj).exists()
        return False


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор создания/редактирования товара (только для персонала)."""

    class Meta:
        model = Product
        fields = [
            'title', 'slug', 'description', 'composition', 'price',
            'discount', 'stock', 'weight', 'image', 'is_published',
            'is_vegan', 'is_organic', 'category',
        ]


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'created_at']
