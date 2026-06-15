const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

/**
 * Создать WebSocket-соединение с автопереподключением.
 * @param {string} path  — путь после WS_URL, например '/ws/notifications/'
 * @param {object} handlers — { onMessage, onOpen, onClose, onError }
 * @returns {{ close: Function }}
 */
export function createWebSocket(path, handlers = {}) {
  let ws = null;
  let reconnectTimer = null;
  let isClosed = false;
  const RECONNECT_DELAY = 3000;

  function connect() {
    ws = new WebSocket(`${WS_URL}${path}`);

    ws.onopen = () => {
      if (handlers.onOpen) handlers.onOpen();
      // Keepalive ping каждые 25 сек
      ws._pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return;
        if (handlers.onMessage) handlers.onMessage(data);
      } catch (_) {}
    };

    ws.onerror = (err) => {
      if (handlers.onError) handlers.onError(err);
    };

    ws.onclose = () => {
      clearInterval(ws._pingInterval);
      if (handlers.onClose) handlers.onClose();
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    };
  }

  connect();

  return {
    close() {
      isClosed = true;
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    },
    send(data) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    },
  };
}
