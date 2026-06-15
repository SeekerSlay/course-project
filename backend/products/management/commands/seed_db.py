"""
Команда для заполнения БД тестовыми данными.
Использование: python manage.py seed_db
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from products.models import Category, Product, Comment

User = get_user_model()

CATEGORIES = [
    {'title': 'Орехи и семена',   'slug': 'nuts-seeds'},
    {'title': 'Злаки и крупы',    'slug': 'grains'},
    {'title': 'Фрукты и ягоды',   'slug': 'fruits'},
    {'title': 'Овощи',            'slug': 'vegetables'},
    {'title': 'Напитки',          'slug': 'drinks'},
    {'title': 'Сладости',         'slug': 'sweets'},
    {'title': 'Масла',            'slug': 'oils'},
    {'title': 'Суперфуды',        'slug': 'superfoods'},
]

PRODUCTS = [
    # Орехи
    {'title': 'Кешью сырой',      'slug': 'cashew-raw',      'cat': 'nuts-seeds',
     'price': '450.00', 'discount': 0,  'stock': 50, 'weight': 300,
     'is_organic': True,
     'desc': 'Сырой кешью высшего качества. Богат белком и полезными жирами.',
     'comp': 'Орехи кешью 100%'},
    {'title': 'Миндаль жареный',  'slug': 'almond-roasted',  'cat': 'nuts-seeds',
     'price': '380.00', 'discount': 10, 'stock': 30, 'weight': 250,
     'is_organic': False,
     'desc': 'Хрустящий жареный миндаль. Источник витамина E.',
     'comp': 'Миндаль, соль'},
    {'title': 'Семена чиа',       'slug': 'chia-seeds',      'cat': 'nuts-seeds',
     'price': '290.00', 'discount': 0,  'stock': 60, 'weight': 200,
     'is_organic': True,
     'desc': 'Суперфуд — семена чиа. Богаты омега-3 и клетчаткой.',
     'comp': 'Семена чиа 100%'},
    {'title': 'Грецкий орех',     'slug': 'walnut',          'cat': 'nuts-seeds',
     'price': '320.00', 'discount': 5,  'stock': 40, 'weight': 300,
     'is_organic': False,
     'desc': 'Грецкие орехи — источник омега-3 жирных кислот.',
     'comp': 'Орехи грецкие 100%'},

    # Злаки
    {'title': 'Овсянка органик',  'slug': 'oats-organic',    'cat': 'grains',
     'price': '180.00', 'discount': 0,  'stock': 100, 'weight': 500,
     'is_organic': True,
     'desc': 'Органическая овсянка для здорового завтрака.',
     'comp': 'Овёс 100%'},
    {'title': 'Киноа белая',      'slug': 'quinoa-white',    'cat': 'grains',
     'price': '420.00', 'discount': 15, 'stock': 25, 'weight': 400,
     'is_organic': True,
     'desc': 'Киноа — полноценный растительный белок, все 9 аминокислот.',
     'comp': 'Киноа белая 100%'},
    {'title': 'Гречка зелёная',   'slug': 'buckwheat-green', 'cat': 'grains',
     'price': '220.00', 'discount': 0,  'stock': 70, 'weight': 500,
     'is_organic': True,
     'desc': 'Необжаренная зелёная гречка — живой продукт.',
     'comp': 'Гречиха 100%'},

    # Фрукты
    {'title': 'Финики Меджул',    'slug': 'dates-medjool',   'cat': 'fruits',
     'price': '650.00', 'discount': 0,  'stock': 20, 'weight': 500,
     'is_organic': True,
     'desc': 'Крупные сочные финики Меджул. Натуральный сахар.',
     'comp': 'Финики Меджул 100%'},
    {'title': 'Изюм золотой',     'slug': 'raisins-golden',  'cat': 'fruits',
     'price': '190.00', 'discount': 0,  'stock': 80, 'weight': 300,
     'is_organic': False,
     'desc': 'Золотой изюм без косточек. Сладкий и сочный.',
     'comp': 'Виноград сушёный'},
    {'title': 'Клюква вяленая',   'slug': 'cranberry-dried', 'cat': 'fruits',
     'price': '240.00', 'discount': 10, 'stock': 45, 'weight': 200,
     'is_organic': False,
     'desc': 'Вяленая клюква — антиоксидант, помогает иммунитету.',
     'comp': 'Клюква, тростниковый сахар'},

    # Напитки
    {'title': 'Кокосовая вода',   'slug': 'coconut-water',   'cat': 'drinks',
     'price': '120.00', 'discount': 0,  'stock': 150, 'weight': 330,
     'is_organic': False,
     'desc': 'Натуральная кокосовая вода. Электролиты без сахара.',
     'comp': 'Кокосовая вода 100%'},
    {'title': 'Чай матча',        'slug': 'matcha-tea',      'cat': 'drinks',
     'price': '890.00', 'discount': 0,  'stock': 15, 'weight': 100,
     'is_organic': True,
     'desc': 'Японский чай матча церемониального класса.',
     'comp': 'Листья зелёного чая (порошок)'},

    # Суперфуды
    {'title': 'Спирулина порошок','slug': 'spirulina-powder','cat': 'superfoods',
     'price': '560.00', 'discount': 0,  'stock': 30, 'weight': 200,
     'is_organic': True,
     'desc': 'Спирулина — водоросль с высоким содержанием белка.',
     'comp': 'Спирулина 100%'},
    {'title': 'Ягоды годжи',      'slug': 'goji-berries',    'cat': 'superfoods',
     'price': '380.00', 'discount': 20, 'stock': 35, 'weight': 150,
     'is_organic': True,
     'desc': 'Ягоды годжи — источник антиоксидантов и витаминов.',
     'comp': 'Ягоды годжи сушёные 100%'},

    # Масла
    {'title': 'Масло кокосовое',  'slug': 'coconut-oil',     'cat': 'oils',
     'price': '480.00', 'discount': 0,  'stock': 40, 'weight': 500,
     'is_organic': True,
     'desc': 'Нерафинированное кокосовое масло холодного отжима.',
     'comp': 'Кокосовое масло 100%'},
    {'title': 'Масло льняное',    'slug': 'flaxseed-oil',    'cat': 'oils',
     'price': '290.00', 'discount': 0,  'stock': 55, 'weight': 250,
     'is_organic': True,
     'desc': 'Льняное масло — рекордсмен по содержанию омега-3.',
     'comp': 'Масло семян льна 100%'},

    # Сладости
    {'title': 'Шоколад 90% какао','slug': 'dark-chocolate',  'cat': 'sweets',
     'price': '210.00', 'discount': 0,  'stock': 60, 'weight': 100,
     'is_organic': True,
     'desc': 'Горький шоколад без молока и лишнего сахара.',
     'comp': 'Какао-масса, какао-порошок, тростниковый сахар'},
    {'title': 'Козинак из семян', 'slug': 'seed-kozinaki',   'cat': 'sweets',
     'price': '160.00', 'discount': 5,  'stock': 90, 'weight': 150,
     'is_organic': False,
     'desc': 'Козинак из подсолнечника и тыквенных семян на мёде.',
     'comp': 'Семена подсолнечника, тыквенные семена, мёд'},
]

COMMENTS = [
    ('Очень вкусно, буду заказывать ещё!', 5),
    ('Хорошее качество, быстрая доставка.', 4),
    ('Свежий продукт, соответствует описанию.', 5),
    ('Нормально, но ожидал немного другого.', 3),
    ('Отличный вкус, натуральный состав!', 5),
    ('Понравилось, рекомендую.', 4),
]


class Command(BaseCommand):
    help = 'Заполняет базу данных тестовыми данными'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Создаём тестовые данные...')

        # Администратор
        admin, _ = User.objects.get_or_create(
            email='admin@veganshop.com',
            defaults={
                'username': 'admin',
                'first_name': 'Администратор',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if not admin.has_usable_password():
            admin.set_password('admin123')
            admin.save()
        self.stdout.write(f'  ✓ Администратор: admin@veganshop.com / admin123')

        # Тестовый покупатель
        buyer, _ = User.objects.get_or_create(
            email='buyer@veganshop.com',
            defaults={
                'username': 'buyer',
                'first_name': 'Иван',
                'last_name': 'Петров',
                'address': 'Москва, ул. Зелёная, 42',
            }
        )
        if not buyer.has_usable_password():
            buyer.set_password('buyer123')
            buyer.save()
        self.stdout.write(f'  ✓ Покупатель: buyer@veganshop.com / buyer123')

        # Категории
        cat_map = {}
        for c in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=c['slug'], defaults={'title': c['title']}
            )
            cat_map[c['slug']] = cat
            if created:
                self.stdout.write(f'  ✓ Категория: {cat.title}')

        # Товары
        for p in PRODUCTS:
            product, created = Product.objects.get_or_create(
                slug=p['slug'],
                defaults={
                    'title':      p['title'],
                    'description':p['desc'],
                    'composition':p['comp'],
                    'price':      p['price'],
                    'discount':   p['discount'],
                    'stock':      p['stock'],
                    'weight':     p['weight'],
                    'is_organic': p['is_organic'],
                    'category':   cat_map[p['cat']],
                    'author':     admin,
                }
            )
            if created:
                self.stdout.write(f'  ✓ Товар: {product.title}')

        # Отзывы (покупатель оставляет на первые 6 товаров)
        products = Product.objects.all()[:6]
        for product, (text, rating) in zip(products, COMMENTS):
            Comment.objects.get_or_create(
                product=product, author=buyer,
                defaults={'text': text, 'rating': rating}
            )

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Готово! Создано категорий: {len(CATEGORIES)}, '
            f'товаров: {len(PRODUCTS)}, отзывов: {min(len(PRODUCTS), len(COMMENTS))}'
        ))
        self.stdout.write('\nЗапустите сервер: python manage.py runserver')
