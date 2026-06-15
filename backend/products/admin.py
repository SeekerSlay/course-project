from django.contrib import admin
from .models import Category, Product, Comment, Favorite


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'slug', 'is_active')
    list_display_links = ('id', 'title')
    list_editable = ('is_active',)
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'category', 'price', 'discount',
        'stock', 'is_published', 'is_vegan', 'is_organic', 'views'
    )
    list_display_links = ('id', 'title')
    list_editable = ('is_published', 'stock', 'price')
    list_filter = ('is_published', 'is_vegan', 'is_organic', 'category')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('views', 'created_at', 'updated_at')
    raw_id_fields = ('author',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'product', 'rating', 'is_published', 'created_at')
    list_display_links = ('id',)
    list_editable = ('is_published',)
    list_filter = ('is_published', 'rating')
    search_fields = ('text', 'author__username')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'created_at')
    search_fields = ('user__email', 'product__title')
