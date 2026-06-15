import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [isFav, setIsFav]         = useState(false);
  const [qty, setQty]             = useState(1);
  const [adding, setAdding]       = useState(false);

  // Форма отзыва
  const [commentText, setCommentText] = useState('');
  const [rating, setRating]           = useState(5);
  const [submitting, setSubmitting]   = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLoading(true);
    productsAPI.getDetail(slug)
      .then(({ data }) => {
        setProduct(data);
        setIsFav(data.is_favorited);
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(product, qty);
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка');
    } finally {
      setAdding(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setIsFav((p) => !p);
    try {
      await productsAPI.toggleFavorite(slug);
    } catch {
      setIsFav((p) => !p);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCommentError('');
    try {
      const { data } = await productsAPI.addComment(slug, { text: commentText, rating });
      setProduct((prev) => ({
        ...prev,
        comments: [data, ...prev.comments],
      }));
      setCommentText('');
      setRating(5);
    } catch (err) {
      const errs = err.response?.data;
      if (errs?.non_field_errors) setCommentError(errs.non_field_errors[0]);
      else setCommentError('Ошибка при отправке отзыва.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!product) return null;

  const hasUserComment = user && product.comments.some(
    (c) => c.author_name === user.username
  );

  return (
    <div className="product-detail">
      {/* Основной блок */}
      <div className="product-detail__top">
        <div className="product-detail__image-wrap">
          {product.image
            ? <img src={product.image} alt={product.title} />
            : <div className="product-detail__no-image">🥦</div>
          }
        </div>

        <div className="product-detail__info">
          <p className="product-detail__category">{product.category?.title}</p>
          <h1 className="product-detail__title">{product.title}</h1>

          {product.average_rating && (
            <div className="product-detail__rating">
              {'★'.repeat(Math.round(product.average_rating))}
              {'☆'.repeat(5 - Math.round(product.average_rating))}
              <span> {product.average_rating} ({product.comments.length} отзывов)</span>
            </div>
          )}

          <div className="product-detail__price-block">
            <span className="product-detail__price">
              {Number(product.discounted_price).toFixed(2)} ₽
            </span>
            {product.discount > 0 && (
              <span className="product-detail__old-price">
                {Number(product.price).toFixed(2)} ₽
              </span>
            )}
            {product.discount > 0 && (
              <span className="product-detail__discount">-{product.discount}%</span>
            )}
          </div>

          <div className="product-detail__tags">
            {product.is_vegan && <span className="tag tag--vegan">🌱 Веган</span>}
            {product.is_organic && <span className="tag tag--organic">🍃 Органик</span>}
            {product.weight > 0 && <span className="tag">⚖️ {product.weight} г</span>}
          </div>

          <p className="product-detail__stock">
            {product.stock > 0
              ? `✅ В наличии: ${product.stock} шт.`
              : '❌ Нет в наличии'}
          </p>

          {product.stock > 0 && (
            <div className="product-detail__cart-row">
              <input
                type="number" min="1" max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.min(product.stock, Math.max(1, Number(e.target.value))))}
                className="qty-input"
              />
              <button
                className="btn btn--primary"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? 'Добавляется...' : 'В корзину 🛒'}
              </button>
            </div>
          )}

          <button
            className={`btn btn--outline ${isFav ? 'active' : ''}`}
            onClick={handleFavorite}
          >
            {isFav ? '❤️ В избранном' : '🤍 В избранное'}
          </button>

          <div className="product-detail__description">
            <h3>Описание</h3>
            <p>{product.description}</p>
            {product.composition && (
              <>
                <h3>Состав</h3>
                <p>{product.composition}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Отзывы */}
      <section className="product-detail__comments">
        <h2>Отзывы ({product.comments.length})</h2>

        {/* Форма нового отзыва */}
        {user && !hasUserComment && (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <h3>Оставить отзыв</h3>
            {commentError && <p className="error">{commentError}</p>}

            <div className="comment-form__rating">
              <label>Оценка: </label>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s} type="button"
                  className={`star-btn ${s <= rating ? 'active' : ''}`}
                  onClick={() => setRating(s)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Поделитесь вашим мнением о товаре..."
              rows={4}
              required
            />
            <button className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        )}

        {/* Список отзывов */}
        {product.comments.length === 0 ? (
          <p className="empty-state">Отзывов пока нет. Будьте первым!</p>
        ) : (
          <div className="comments-list">
            {product.comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-item__header">
                  <strong>{c.author_name}</strong>
                  <span className="comment-item__rating">
                    {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                  </span>
                  <span className="comment-item__date">
                    {new Date(c.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
