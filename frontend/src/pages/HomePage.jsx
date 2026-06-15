import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';

export default function HomePage() {
  const [featured, setFeatured]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      productsAPI.getList({ ordering: '-views', page_size: 8 }),
      productsAPI.getCategories(),
    ]).then(([prodResp, catResp]) => {
      setFeatured(prodResp.data.results || []);
      // API может вернуть массив или пагинированный объект {results: [...]}
      const catData = catResp.data;
      setCategories(Array.isArray(catData) ? catData : (catData.results || []));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero__content">
          <h1>Магазин вегетарианской продукции</h1>
          <p>Только натуральные, органические и веганские товары</p>
          <Link to="/products" className="btn btn--primary btn--large">
            Перейти в каталог →
          </Link>
        </div>
      </section>

      {/* Категории */}
      <section className="section">
        <h2 className="section__title">Категории</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.slug}`} className="category-card">
              {cat.image
                ? <img src={cat.image} alt={cat.title} />
                : <div className="category-card__icon">🌿</div>
              }
              <span>{cat.title}</span>
              <small>{cat.product_count} товаров</small>
            </Link>
          ))}
        </div>
      </section>

      {/* Популярные товары */}
      <section className="section">
        <h2 className="section__title">Популярные товары</h2>
        <div className="products-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="section__more">
          <Link to="/products" className="btn btn--outline">Смотреть все товары</Link>
        </div>
      </section>
    </div>
  );
}
