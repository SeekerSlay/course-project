import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '../contexts/AuthContext';

/**
 * Подключиться к /ws/notifications/ и хранить список уведомлений.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const handleMessage = useCallback((data) => {
    if (data.type === 'notification') {
      setNotifications((prev) => [
        { id: Date.now(), ...data, read: false },
        ...prev.slice(0, 49),          // хранить последние 50
      ]);
    }
  }, []);

  useWebSocket(user ? '/ws/notifications/' : null, handleMessage);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead };
}
