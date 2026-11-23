import { Server, Socket } from 'socket.io';
import { jwtService } from '../services/jwt.service';
import { AUTH_COOKIE_NAME } from '../utils/authCookie';

let ioInstance: Server | null = null;
const userSockets: Map<string, Set<string>> = new Map();

const extractCookieValue = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === name) {
      try {
        return decodeURIComponent(pair.slice(idx + 1).trim());
      } catch {
        return pair.slice(idx + 1).trim();
      }
    }
  }
  return null;
};

export const initNotificationSocket = (io: Server) => {
  ioInstance = io;

  // Handshake authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const rawAuth = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      let cleanToken =
        rawAuth && typeof rawAuth === 'string'
          ? (rawAuth.startsWith('Bearer ') ? rawAuth.slice(7).trim() : rawAuth.trim())
          : '';

      if (!cleanToken || cleanToken === 'null' || cleanToken === 'undefined' || cleanToken === 'cookie-session') {
        cleanToken = extractCookieValue(socket.handshake.headers?.cookie, AUTH_COOKIE_NAME) || '';
      }

      if (cleanToken) {
        try {
          const decoded: any = jwtService.verifyToken(cleanToken);
          const revoked = decoded?.jti ? await jwtService.isTokenRevoked(decoded.jti) : false;
          if (decoded && !revoked) {
            socket.data.userId = decoded.userId || decoded.id;
            socket.data.role = decoded.role;
            socket.data.email = decoded.email;
          }
        } catch {
          // Token expired, revoked, or invalid - allow unauthenticated socket connection for public real-time events
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    // Automatically join user room if authenticated via handshake token
    const handshakeUserId = socket.data.userId;
    if (handshakeUserId) {
      socket.join(`user:${handshakeUserId}`);
      if (socket.data.role) {
        socket.join(`role:${socket.data.role}`);
      }
      if (!userSockets.has(handshakeUserId)) {
        userSockets.set(handshakeUserId, new Set());
      }
      userSockets.get(handshakeUserId)?.add(socket.id);
    }

    // Client event for explicit authentication (only allowed when matching JWT-verified handshake userId)
    socket.on('authenticate', (userId: string) => {
      if (!userId || !socket.data.userId || String(socket.data.userId) !== String(userId)) {
        return;
      }

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)?.add(socket.id);

      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId)?.delete(socket.id);
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });
};

export const getIoInstance = () => ioInstance;
export const getIo = () => ioInstance;

export const sendNotificationToUser = (userId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

