from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product
from orders.models import Cart, CartItem, Order

User = get_user_model()


def make_user(email='buyer@test.com'):
    return User.objects.create_user(username=email.split('@')[0], email=email, password='Pass123!')


def make_admin(email='admin@test.com'):
    u = make_user(email)
    u.is_staff = True
    u.save()
    return u


def make_product(price='200.00', stock=10):
    cat = Category.objects.create(title='Фрукты', slug='fruits')
    admin = make_admin('prod_admin@test.com')
    return Product.objects.create(
        title='Авокадо', slug='avocado',
        description='Полезно', price=price,
        stock=stock, category=cat, author=admin
    )


class CartTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.product = make_product()
        self.client.force_authenticate(self.user)

    def test_get_empty_cart(self):
        resp = self.client.get('/api/orders/cart/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_items'], 0)

    def test_add_to_cart(self):
        resp = self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.pk,
            'quantity': 2,
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_items'], 2)

    def test_add_exceeds_stock(self):
        resp = self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.pk,
            'quantity': 999,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_clear_cart(self):
        self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.pk, 'quantity': 1
        })
        resp = self.client.delete('/api/orders/cart/clear/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_items'], 0)


class OrderTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.admin = make_admin()
        self.product = make_product()
        self.client.force_authenticate(self.user)
        # Добавить товар в корзину
        self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.pk, 'quantity': 2
        })

    def test_checkout(self):
        resp = self.client.post('/api/orders/checkout/', {
            'delivery_address': 'Москва, ул. Ленина, 1'
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['status'], 'pending')

    def test_checkout_empty_cart(self):
        self.client.delete('/api/orders/cart/clear/')
        resp = self.client.post('/api/orders/checkout/', {
            'delivery_address': 'Москва, ул. Ленина, 1'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_order(self):
        checkout = self.client.post('/api/orders/checkout/', {
            'delivery_address': 'Москва'
        })
        order_id = checkout.data['id']
        resp = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'cancelled')

    def test_list_orders(self):
        self.client.post('/api/orders/checkout/', {'delivery_address': 'Москва'})
        resp = self.client.get('/api/orders/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreater(resp.data['count'], 0)
