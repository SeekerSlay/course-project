from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    """Категория товаров (например: Злаки, Орехи, Напитки)."""

    title = models.CharField(
        max_length=150, unique=True, db_index=True, verbose_name='Название'
    )
    slug = models.SlugField(max_length=150, unique=True, verbose_name='Slug')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='categories/', blank=True, verbose_name='Изображение'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['title']

    def __str__(self):
        return self.title


class Product(models.Model):
    """Товар — основная сущность магазина (аналог Article/Post)."""

    title = models.CharField(
        max_length=200, verbose_name='Название', db_index=True
    )
    slug = models.SlugField(max_length=200, unique=True, verbose_name='Slug')
    description = models.TextField(verbose_name='Описание')
    composition = models.TextField(blank=True, verbose_name='Состав')
    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Цена'
    )
    discount = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        verbose_name='Скидка (%)'
    )
    stock = models.PositiveIntegerField(default=0, verbose_name='Остаток на складе')
    weight = models.PositiveIntegerField(default=0, verbose_name='Вес (г)')
    image = models.ImageField(
        upload_to='products/%Y/%m/%d', blank=True, verbose_name='Фото'
    )
    is_published = models.BooleanField(default=True, verbose_name='Опубликован', db_index=True)
    is_vegan = models.BooleanField(default=True, verbose_name='Веган')
    is_organic = models.BooleanField(default=False, verbose_name='Органик')
    views = models.PositiveIntegerField(default=0, verbose_name='Просмотры')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан', db_index=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name='Категория'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
        verbose_name='Добавил'
    )

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'is_published']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return self.title

    @property
    def discounted_price(self):
        """Цена с учётом скидки."""
        if self.discount:
            return self.price * (100 - self.discount) / 100
        return self.price

    @property
    def average_rating(self):
        reviews = self.comments.filter(is_published=True)
        if not reviews.exists():
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)


class Comment(models.Model):
    """Отзыв покупателя на товар."""

    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Товар'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Автор'
    )
    text = models.TextField(verbose_name='Текст отзыва')
    rating = models.PositiveSmallIntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оценка'
    )
    is_published = models.BooleanField(default=True, verbose_name='Опубликован')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата', db_index=True)

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']
        # Один пользователь — один отзыв на товар
        unique_together = [('product', 'author')]

    def __str__(self):
        return f'{self.author} → {self.product} ({self.rating}★)'


class Favorite(models.Model):
    """Избранные товары пользователя."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name='Пользователь'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='Товар'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Добавлен')

    class Meta:
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'
        unique_together = [('user', 'product')]

    def __str__(self):
        return f'{self.user} ♥ {self.product}'
