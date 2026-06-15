from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from products.models import Product


class Cart(models.Model):
    """Корзина пользователя (одна на пользователя)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
        verbose_name='Пользователь'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'

    def __str__(self):
        return f'Корзина {self.user}'

    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """Позиция в корзине."""

    cart = models.ForeignKey(
        Cart, on_delete=models.CASCADE, related_name='items', verbose_name='Корзина'
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, verbose_name='Товар'
    )
    quantity = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1)], verbose_name='Количество'
    )

    class Meta:
        verbose_name = 'Позиция корзины'
        verbose_name_plural = 'Позиции корзины'
        unique_together = [('cart', 'product')]

    def __str__(self):
        return f'{self.product} × {self.quantity}'

    @property
    def total_price(self):
        return self.product.discounted_price * self.quantity


class Order(models.Model):
    """Заказ покупателя."""

    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_SHIPPED = 'shipped'
    STATUS_DELIVERED = 'delivered'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Ожидает подтверждения'),
        (STATUS_CONFIRMED, 'Подтверждён'),
        (STATUS_SHIPPED, 'Отправлен'),
        (STATUS_DELIVERED, 'Доставлен'),
        (STATUS_CANCELLED, 'Отменён'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Покупатель'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default=STATUS_PENDING, db_index=True,
        verbose_name='Статус'
    )
    delivery_address = models.TextField(verbose_name='Адрес доставки')
    comment = models.TextField(blank=True, verbose_name='Комментарий к заказу')
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Сумма заказа'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f'Заказ #{self.pk} — {self.user} ({self.get_status_display()})'


class OrderItem(models.Model):
    """Позиция в заказе (снимок цены на момент оформления)."""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items', verbose_name='Заказ'
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, verbose_name='Товар'
    )
    product_title = models.CharField(max_length=200, verbose_name='Название товара')
    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Цена за единицу'
    )
    quantity = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1)], verbose_name='Количество'
    )

    class Meta:
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказа'

    def __str__(self):
        return f'{self.product_title} × {self.quantity}'

    @property
    def total_price(self):
        return self.price * self.quantity
