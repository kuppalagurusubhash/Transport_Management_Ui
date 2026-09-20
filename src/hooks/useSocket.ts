import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:9090`;

export type SocketEventHandlers = {
  onOrderCreated?: (data: unknown) => void;
  onOrderStatus?: (data: unknown) => void;
  onTripCreated?: (data: unknown) => void;
  onTripUpdated?: (data: unknown) => void;
  onTripDispatched?: (data: unknown) => void;
  onNotificationNew?: (data: unknown) => void;
};

export function useSocket(handlers: SocketEventHandlers = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to backend:', socket.id);
      socket.emit('join:room', 'owner');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend');
    });

    if (handlers.onOrderCreated) socket.on('order:created', handlers.onOrderCreated);
    if (handlers.onOrderStatus) socket.on('order:status', handlers.onOrderStatus);
    if (handlers.onTripCreated) socket.on('trip:created', handlers.onTripCreated);
    if (handlers.onTripUpdated) socket.on('trip:updated', handlers.onTripUpdated);
    if (handlers.onTripDispatched) socket.on('trip:dispatched', handlers.onTripDispatched);
    if (handlers.onNotificationNew) socket.on('notification:new', handlers.onNotificationNew);

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef;
}
