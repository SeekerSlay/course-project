import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [address, setAddress]   = useState(user?.address || '');
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await ordersAPI.checkout({ delivery_address: address, comment });
      await fetchCart();
      navigate(`/orders/${data.id}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка оформления заказа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Оформление заказа</h1>

      <div className="checkout-page__layout">
        {/* Форма */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h3>Данные доставки</h3>

          {error && <p className="error">{error}</p>}

          <label>
            Адрес доставки *
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
              placeholder="Город, улица, дом, квартира"
            />
          </label>

          <label>
            Комментарий к заказу
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Необязательно"
            />
          </label>

          <button
            className="btn btn--primary btn--large"
            disabled={loading || cart.items.length === 0}
          >
            {loading ? 'Оформление...' : `Подтвердить заказ — ${Number(cart.total_price).toFixed(2)} ₽`}
          </button>
        </form>

        {/* Состав заказа */}
        <div className="checkout-summary">
          <h3>Состав заказа</h3>
          {cart.items.map((item) => (
            <div key={item.id} className="checkout-summary__item">
              <span>{item.product.title} × {item.quantity}</span>
              <span>{(Number(item.product.discounted_price) * item.quantity).toFixed(2)} ₽</span>
            </div>
          ))}
          <hr />
          <div className="checkout-summary__total">
            <strong>Итого:</strong>
            <strong>{Number(cart.total_price).toFixed(2)} ₽</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
