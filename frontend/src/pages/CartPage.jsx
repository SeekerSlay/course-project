import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="cart-page empty-state">
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога</p>
        <Link to="/products" className="btn btn--primary">Перейти в каталог</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Корзина</h1>

      <div className="cart-page__layout">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item">
              <Link to={`/products/${item.product.slug}`}>
                {item.product.image
                  ? <img src={item.product.image} alt={item.product.title} className="cart-item__img" />
                  : <div className="cart-item__no-img">🥦</div>
                }
              </Link>

              <div className="cart-item__info">
                <Link to={`/products/${item.product.slug}`}>
                  <h3>{item.product.title}</h3>
                </Link>
                <p>{Number(item.product.discounted_price).toFixed(2)} ₽ / шт.</p>
              </div>

              <div className="cart-item__qty">
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                >
                  +
                </button>
              </div>

              <p className="cart-item__total">
                {(Number(item.product.discounted_price) * item.quantity).toFixed(2)} ₽
              </p>

              <button
                className="btn btn--icon btn--danger"
                onClick={() => removeFromCart(item.id)}
                title="Удалить"
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        {/* Сводка */}
        <div className="cart-summary">
          <h3>Итого</h3>
          <p>{cart.total_items} товаров</p>
          <p className="cart-summary__total">{Number(cart.total_price).toFixed(2)} ₽</p>

          {user ? (
            <button
              className="btn btn--primary btn--large"
              onClick={() => navigate('/checkout')}
            >
              Оформить заказ →
            </button>
          ) : (
            <Link to="/login" className="btn btn--primary btn--large">
              Войдите для оформления
            </Link>
          )}

          <button className="btn btn--outline" onClick={clearCart}>
            Очистить корзину
          </button>
        </div>
      </div>
    </div>
  );
}
