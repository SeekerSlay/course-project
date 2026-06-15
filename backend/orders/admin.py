from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('total_price',)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_items', 'total_price', 'updated_at')
    inlines = [CartItemInline]
    search_fields = ('user__email',)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'created_at')
    list_display_links = ('id',)
    list_editable = ('status',)
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'delivery_address')
    readonly_fields = ('total_price', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
