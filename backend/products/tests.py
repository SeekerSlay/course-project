from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product, Comment, Favorite

User = get_user_model()


def make_user(email='u@test.com', is_staff=False):
    u = User.objects.create_user(username=email.split('@')[0], email=email, password='Pass123!')
    u.is_staff = is_staff
    u.save()
    return u


def make_category():
    return Category.objects.create(title='Орехи', slug='nuts')


def make_product(category, author):
    return Product.objects.create(
        title='Кешью', slug='cashew', description='Вкусный', price='350.00',
        stock=10, category=category, author=author
    )


class CategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('admin@test.com', is_staff=True)
        self.user = make_user('user@test.com')

    def test_list_categories(self):
        make_category()
        resp = self.client.get('/api/products/categories/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_category_admin(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.post('/api/products/categories/', {
            'title': 'Злаки', 'slug': 'grains'
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_category_forbidden(self):
        self.client.force_authenticate(self.user)
        resp = self.client.post('/api/products/categories/', {
            'title': 'Злаки', 'slug': 'grains'
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class ProductAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('admin@test.com', is_staff=True)
        self.user = make_user('user@test.com')
        self.category = make_category()
        self.product = make_product(self.category, self.admin)

    def test_list_products(self):
        resp = self.client.get('/api/products/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['count'], 1)

    def test_filter_by_category(self):
        resp = self.client.get('/api/products/?category=nuts')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['count'], 1)

    def test_search(self):
        resp = self.client.get('/api/products/?search=Кешью')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreater(resp.data['count'], 0)

    def test_toggle_favorite(self):
        self.client.force_authenticate(self.user)
        resp = self.client.post(f'/api/products/{self.product.slug}/toggle_favorite/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['is_favorited'])
        # Повторно — снять
        resp2 = self.client.post(f'/api/products/{self.product.slug}/toggle_favorite/')
        self.assertFalse(resp2.data['is_favorited'])


class CommentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('admin@test.com', is_staff=True)
        self.user = make_user('user@test.com')
        cat = make_category()
        self.product = make_product(cat, self.admin)

    def test_add_comment(self):
        self.client.force_authenticate(self.user)
        resp = self.client.post(f'/api/products/{self.product.slug}/comments/', {
            'text': 'Отличный продукт!', 'rating': 5
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_duplicate_comment_forbidden(self):
        self.client.force_authenticate(self.user)
        self.client.post(f'/api/products/{self.product.slug}/comments/', {
            'text': 'Первый', 'rating': 4
        })
        resp = self.client.post(f'/api/products/{self.product.slug}/comments/', {
            'text': 'Второй', 'rating': 3
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_comment_requires_auth(self):
        resp = self.client.post(f'/api/products/{self.product.slug}/comments/', {
            'text': 'Анонимно', 'rating': 3
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
