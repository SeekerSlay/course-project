import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api'; // Проверьте правильность пути к вашему api.js
import Spinner from '../components/ui/Spinner'; // Проверьте правильность пути к спиннеру

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsAPI.getCategories()
      .then((response) => {
        const catData = response.data;
        // Обрабатываем как обычный массив, так и пагинированный объект { results: [...] }
        setCategories(Array.isArray(catData) ? catData : (catData.results || []));
      })
      .catch((error) => console.error("Ошибка при загрузке категорий:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="categories-page section">
      <h1 className="section__title" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        Категории товаров
      </h1>
      
      <div className="categories-grid">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.slug}`} className="category-card">
              {cat.image ? (
                <img src={cat.image} alt={cat.title} />
              ) : (
                <div className="category-card__icon" style={{ fontSize: '3rem', padding: '1rem' }}>🌿</div>
              )}
              <h3 style={{ margin: '0.5rem 0' }}>{cat.title}</h3>
              <small>{cat.product_count} товаров</small>
            </Link>
          ))
        ) : (
          <p style={{ textAlign: 'center', width: '100%' }}>Категории не найдены.</p>
        )}
      </div>
    </div>
  );
}