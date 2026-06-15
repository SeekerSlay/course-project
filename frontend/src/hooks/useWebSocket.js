import { useEffect, useRef, useCallback } from 'react';
import { createWebSocket } from '../services/websocket';

/**
 * Хук для подключения к WebSocket с автоотключением при размонтировании.
 * @param {string|null} path  — путь WS, null = не подключаться
 * @param {function} onMessage — коллбэк на входящее сообщение
 */
export function useWebSocket(path, onMessage) {
  const wsRef      = useRef(null);
  const cbRef      = useRef(onMessage);
  cbRef.current    = onMessage;

  useEffect(() => {
    if (!path) return;

    const ws = createWebSocket(path, {
      onMessage: (data) => cbRef.current?.(data),
    });
    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [path]);

  const send = useCallback((data) => {
    wsRef.current?.send(data);
  }, []);

  return { send };
}
