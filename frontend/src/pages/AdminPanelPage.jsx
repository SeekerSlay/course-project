import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Ожидает подтверждения' },
  { value: 'confirmed', label: 'Подтверждён' },
  { value: 'shipped',   label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'cancelled', label: 'Отменён' },
];

const STATUS_COLOR = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  shipped:   '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

export default function AdminPanelPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // id заказа, который обновляется

  useEffect(() => {
    if (!user?.is_staff) { navigate('/'); return; }
    ordersAPI.getOrders()
      .then(({ data }) => setOrders(data.results || data))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      // Оптимистичное обновление
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: newStatus, status_display: STATUS_OPTIONS.find(s => s.value === newStatus)?.label }
            : o
        )
      );
      await ordersAPI.updateStatus(orderId, newStatus);
    } catch (err) {
      alert('Ошибка обновления статуса.');
      // Откат
      const { data } = await ordersAPI.getOrders();
      setOrders(data.results || data);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Spinner />;

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue:   orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_price), 0),
  };

  return (
    <div className="admin-panel">
      <h1>Панель администратора</h1>

      {/* Статистика */}
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-card__value">{stats.total}</span>
          <span className="stat-card__label">Всего заказов</span>
        </div>
        <div className="stat-card stat-card--orange">
          <span className="stat-card__value">{stats.pending}</span>
          <span className="stat-card__label">Ожидают</span>
        </div>
        <div className="stat-card stat-card--blue">
          <span className="stat-card__value">{stats.confirmed + stats.shipped}</span>
          <span className="stat-card__label">В работе</span>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-card__value">{stats.delivered}</span>
          <span className="stat-card__label">Доставлено</span>
        </div>
        <div className="stat-card stat-card--purple">
          <span className="stat-card__value">{stats.revenue.toFixed(0)} ₽</span>
          <span className="stat-card__label">Выручка</span>
        </div>
      </div>

      {/* Таблица заказов */}
      <div className="admin-table-wrap">
        <h2>Все заказы</h2>
        {orders.length === 0 ? (
          <p className="empty-state">Заказов пока нет.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Покупатель</th>
                <th>Сумма</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.user_email || '—'}</td>
                  <td>{Number(order.total_price).toFixed(2)} ₽</td>
                  <td>{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <span
                      className="order-status-badge"
                      style={{ color: STATUS_COLOR[order.status] }}
                    >
                      {order.status_display}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="status-select"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
