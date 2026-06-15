import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { productsAPI } from '../../services/api';

export default function ProductCard({ product, onFavoriteToggle }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isFav, setIsFav]     = useState(product.is_favorited);
  const [adding, setAdding]   = useState(false);
  const [added, setAdded]     = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка добавления в корзину');
    } finally {
      setAdding(false);
    }
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) return;
    // Оптимистичное обновление
    setIsFav((prev) => !prev);
    try {
      await productsAPI.toggleFavorite(product.slug);
      onFavoriteToggle?.(product.id, !isFav);
    } catch {
      setIsFav((prev) => !prev); // откат
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-card__image-wrap">
        {product.image
          ? <img src={product.image} alt={product.title} className="product-card__image" />
          : <div className="product-card__no-image">🥦</div>
        }
        {product.discount > 0 && (
          <span className="product-card__badge">-{product.discount}%</span>
        )}
        {product.is_organic && (
          <span className="product-card__badge product-card__badge--organic">Органик</span>
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__title">{product.title}</h3>
        <p className="product-card__category">{product.category_title}</p>

        <div className="product-card__price-row">
          <span className="product-card__price">
            {Number(product.discounted_price).toFixed(2)} ₽
          </span>
          {product.discount > 0 && (
            <span className="product-card__old-price">
              {Number(product.price).toFixed(2)} ₽
            </span>
          )}
        </div>

        {product.average_rating && (
          <div className="product-card__rating">
            {'★'.repeat(Math.round(product.average_rating))}
            {'☆'.repeat(5 - Math.round(product.average_rating))}
            <span> {product.average_rating}</span>
          </div>
        )}

        <div className="product-card__actions">
          <button
            className={`btn ${added ? 'btn--success' : 'btn--primary'}`}
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
          >
            {product.stock === 0 ? 'Нет в наличии' : added ? '✓ Добавлено' : 'В корзину'}
          </button>

          {user && (
            <button
              className={`btn btn--icon ${isFav ? 'active' : ''}`}
              onClick={handleFavorite}
              title={isFav ? 'Убрать из избранного' : 'В избранное'}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
