from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Расширенная модель пользователя магазина."""

    email = models.EmailField(unique=True, verbose_name='Email')
    bio = models.TextField(blank=True, verbose_name='О себе')
    avatar = models.ImageField(
        upload_to='avatars/%Y/%m/%d',
        blank=True,
        verbose_name='Аватар'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='Телефон')
    address = models.TextField(blank=True, verbose_name='Адрес доставки')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.username
