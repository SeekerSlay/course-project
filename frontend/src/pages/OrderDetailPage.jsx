import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_LABELS = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждён',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const justCreated = location.state?.justCreated;

  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    ordersAPI.getOrder(id)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false));
  }, [id]);

  // Подключение WebSocket для real-time обновления статуса
  useWebSocket(
    user ? `/ws/orders/${id}/` : null,
    (data) => {
      if (data.type === 'order_status_update') {
        setLiveStatus({ status: data.status, label: data.status_display });
        setOrder((prev) => prev ? { ...prev, status: data.status, status_display: data.status_display } : prev);
      }
    }
  );

  const handleCancel = async () => {
    if (!window.confirm('Отменить заказ?')) return;
    try {
      const { data } = await ordersAPI.cancelOrder(id);
      setOrder(data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка отмены.');
    }
  };

  if (loading) return <Spinner />;
  if (!order) return <p>Заказ не найден.</p>;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="order-detail">
      <h1>Заказ #{order.id}</h1>

      {justCreated && (
        <div className="alert alert--success">
          ✅ Заказ успешно оформлен! Мы уведомим вас об изменении статуса.
        </div>
      )}

      {liveStatus && (
        <div className="alert alert--info">
          🔔 Статус обновлён: <strong>{liveStatus.label}</strong>
        </div>
      )}

      {/* Прогресс-бар статуса */}
      {!isCancelled && (
        <div className="order-progress">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className={`order-progress__step ${i <= currentStep ? 'done' : ''}`}>
              <div className="order-progress__dot" />
              <span>{STATUS_LABELS[step]}</span>
            </div>
          ))}
        </div>
      )}

      {isCancelled && (
        <div className="alert alert--danger">❌ Заказ отменён</div>
      )}

      {/* Детали */}
      <div className="order-detail__grid">
        <div className="order-detail__info">
          <h3>Информация о заказе</h3>
          <p><strong>Статус:</strong> {order.status_display}</p>
          <p><strong>Адрес:</strong> {order.delivery_address}</p>
          {order.comment && <p><strong>Комментарий:</strong> {order.comment}</p>}
          <p><strong>Дата:</strong> {new Date(order.created_at).toLocaleString('ru-RU')}</p>
          <p><strong>Сумма:</strong> {Number(order.total_price).toFixed(2)} ₽</p>
        </div>

        <div className="order-detail__items">
          <h3>Состав заказа</h3>
          {order.items.map((item) => (
            <div key={item.id} className="order-item">
              <span>{item.product_title}</span>
              <span>× {item.quantity}</span>
              <span>{Number(item.price).toFixed(2)} ₽</span>
              <span>{Number(item.total_price).toFixed(2)} ₽</span>
            </div>
          ))}
        </div>
      </div>

      {order.status === 'pending' && (
        <button className="btn btn--danger" onClick={handleCancel}>
          Отменить заказ
        </button>
      )}
    </div>
  );
}
