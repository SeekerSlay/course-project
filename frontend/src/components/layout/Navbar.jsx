import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNotifications } from '../../hooks/useNotifications';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const navigate = useNavigate();

  // Состояние для открытия/закрытия выпадающего меню
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрыть при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleIconClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleMarkAllRead = () => {
    markAllRead();
    setIsNotificationsOpen(false); // закрыть после отметки прочитанных
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <Link to="/">🌿 VeganShop</Link>
      </div>

      <div className="navbar__links">
        <Link to="/products">Каталог</Link>
        <Link to="/categories">Категории</Link>
      </div>

      <div className="navbar__actions">
        {/* Корзина */}
        <Link to="/cart" className="navbar__cart">
          🛒
          {cart.total_items > 0 && (
            <span className="badge">{cart.total_items}</span>
          )}
        </Link>

        {user ? (
          <>
            {/* Уведомления */}
            <div className="navbar__notifications" ref={dropdownRef}>
              <div onClick={handleIconClick} style={{ cursor: 'pointer' }}>
                🔔
                {unreadCount > 0 && (
                  <span className="badge badge--red">{unreadCount}</span>
                )}
              </div>
              
              {isNotificationsOpen && notifications.length > 0 && (
                <div className="notifications__dropdown">
                  <div className="notification-header">
                    <span>Уведомления</span>
                    <button onClick={handleMarkAllRead} className="clear-all-btn">✕ Прочитать всё</button>
                  </div>
                  {notifications.slice(0, 5).map((n) => (
                    <div 
                      key={n.id} 
                      className={`notification-item ${n.read ? '' : 'unread'}`}
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                      {n.message}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="notification-item">Нет уведомлений</div>
                  )}
                </div>
              )}
            </div>

            <Link to="/profile">👤 {user.username}</Link>
            <Link to="/orders">Мои заказы</Link>
            {user.is_staff && <Link to="/admin-panel">Панель</Link>}
            <button onClick={handleLogout} className="btn btn--outline">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn--outline">Войти</Link>
            <Link to="/register" className="btn btn--primary">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}