# VeganShop — Интернет-магазин вегетарианской продукции

Курсовой проект по дисциплине «Технология разработки программного обеспечения»  
Траектория **В**: React SPA + Django REST API + WebSocket (Django Channels) + JWT

---

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Backend | Django 4.2, Django REST Framework, SimpleJWT, Django Channels |
| Frontend | React 18, React Router v6, Axios, React Query |
| БД | SQLite (разработка) / PostgreSQL (продакшн) |
| Real-time | WebSocket (Django Channels, InMemoryChannelLayer) |
| Аутентификация | JWT (access + refresh токены) |
| Документация API | drf-spectacular (OpenAPI / Swagger) |

---

## Быстрый старт (локально)

Запустите `run.bat` из корневой папки проекта.

Скрипт автоматически откроет два окна терминала:
- **Backend** (Daphne) — порт 8000
- **Frontend** (React) — порт 3000

> ⚠️ Окна терминала нельзя закрывать до завершения работы.

### Доступные адреса

Приложение доступно на `http://localhost:3000`  
API доступно на `http://localhost:8000/api`  
Swagger UI: `http://localhost:8000/api/docs/`  
Django Admin: `http://localhost:8000/admin/`

---

## Структура проекта

```
course-project/
├── backend/
│   ├── config/           # settings, urls, asgi, wsgi
│   ├── users/            # модель User, JWT-аутентификация
│   ├── products/         # Category, Product, Comment, Favorite
│   ├── orders/           # Cart, Order, WebSocket consumers
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   # layout + ui компоненты
│       ├── pages/        # страницы приложения
│       ├── contexts/     # AuthContext, CartContext
│       ├── hooks/        # useWebSocket, useNotifications
│       └── services/     # api.js, websocket.js
└── docker-compose.yml
```

---

## API эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/register/` | Регистрация |
| POST | `/api/auth/login/` | Получение JWT-токенов |
| POST | `/api/auth/token/refresh/` | Обновление access-токена |
| POST | `/api/auth/logout/` | Инвалидация refresh-токена |
| GET/PATCH | `/api/auth/profile/` | Профиль пользователя |
| GET | `/api/products/` | Список товаров (фильтры, пагинация, поиск) |
| GET | `/api/products/{slug}/` | Детали товара |
| GET | `/api/products/categories/` | Список категорий |
| POST | `/api/products/{slug}/toggle_favorite/` | Избранное |
| GET/POST | `/api/products/{slug}/comments/` | Отзывы |
| GET | `/api/orders/cart/` | Корзина |
| POST | `/api/orders/cart/add/` | Добавить в корзину |
| POST | `/api/orders/checkout/` | Оформить заказ |
| GET | `/api/orders/` | Мои заказы |
| PATCH | `/api/orders/{id}/update_status/` | Изменить статус (admin) |
| POST | `/api/orders/{id}/cancel/` | Отменить заказ |

### WebSocket

| URL | Описание |
|-----|----------|
| `ws://localhost:8000/ws/orders/{id}/` | Трекинг статуса заказа |
| `ws://localhost:8000/ws/notifications/` | Уведомления пользователя |

---

## Запуск тестов

```bash
cd backend
python manage.py test
```

---

## Статистика разработки

> Раздел заполняется по завершении проекта.

### Метрики Git
- Всего коммитов: 23
- Период: 03.04.2026-15.06.2026
- Средняя частота: 0.7 коммита в неделю

---

## Автор

Студент группы ПИЖ-б-о-24-1  
Направление: 09.03.04 «Программная инженерия»  
СКФУ, 2026
