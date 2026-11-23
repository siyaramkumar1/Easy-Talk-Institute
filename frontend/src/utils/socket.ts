import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './apiConfig';
import { useAuthStore } from '../store/useAuthStore';

let socketInstance: Socket | null = null;

/**
 * Returns a persistent singleton Socket.IO client instance.
 * Ensures the connection is initialized only once and never disconnected mid-handshake
 * by concurrent component mounts.
 */
export const getAppSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    try {
      const serverUrl = API_BASE_URL || window.location.origin;

      socketInstance = io(serverUrl, {
        path: '/socket.io/',
        // HTTP long-polling handshake first ensures reliability across Cloud Run,
        // Render, and reverse proxies, then seamlessly upgrades to WebSocket
        transports: ['polling', 'websocket'],
        upgrade: true,
        rememberUpgrade: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 20000,
        autoConnect: true,
        withCredentials: true,
        forceNew: false,
        auth: (cb) => {
          const token = useAuthStore.getState().token;
          cb({ token: token && token !== 'cookie-session' ? token : undefined });
        }
      });

      // Suppress unhandled connection noise while Socket.IO automatically recovers
      socketInstance.on('connect_error', (error: any) => {
        // Handled silently by Socket.IO auto-reconnect engine
      });
    } catch (err) {
      console.warn('[Socket.IO] Failed to initialize client socket:', err);
      socketInstance = null;
    }
  }

  // If the socket was explicitly disconnected previously, reconnect the existing instance
  if (socketInstance && socketInstance.disconnected && !socketInstance.active) {
    socketInstance.connect();
  }

  return socketInstance;
};

/**
 * Explicit disconnect helper for user logout
 */
export const disconnectAppSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};



