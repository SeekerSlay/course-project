import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import Spinner from '../components/ui/Spinner';

const STATUS_COLOR = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getOrders()
      .then(({ data }) => setOrders(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (orders.length === 0) {
    return (
      <div className="orders-page empty-state">
        <h2>У вас пока нет заказов</h2>
        <Link to="/products" className="btn btn--primary">Перейти в каталог</Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>Мои заказы</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="order-card">
            <div className="order-card__header">
              <span className="order-card__id">Заказ #{order.id}</span>
              <span
                className="order-card__status"
                style={{ color: STATUS_COLOR[order.status] }}
              >
                {order.status_display}
              </span>
            </div>
            <p className="order-card__date">
              {new Date(order.created_at).toLocaleDateString('ru-RU')}
            </p>
            <p className="order-card__total">
              {order.items?.length || 0} позиций — {Number(order.total_price).toFixed(2)} ₽
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
