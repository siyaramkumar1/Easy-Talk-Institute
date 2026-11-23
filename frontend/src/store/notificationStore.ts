import { create } from 'zustand';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { getAppSocket } from '../utils/socket';
import { useAuthStore } from './useAuthStore';

export interface EmailStats {
  totalRecipients: number;
  attempted: number;
  sent: number;
  failed: number;
}

export interface EmailLog {
  recipientEmail: string;
  userId?: string;
  status: 'Sent' | 'Failed' | 'Pending';
  error?: string;
  sentAt?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  targetAudience: string;
  priority: string;
  createdBy: any;
  readBy: string[];
  isRead?: boolean;
  readAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  recipientId?: string;
  recipientUserId?: string;
  inquiryId?: string;
  replyId?: string;
  type?: string;
  notificationType?: string;
  senderRole?: string;
  metadata?: Record<string, any> | null;
  emailStats?: EmailStats;
  deliveryStatus?: string;
}

export const normalizeNotification = (n: any): Notification => {
  if (!n || typeof n !== 'object') {
    return {
      _id: '',
      title: '',
      message: '',
      targetAudience: 'all',
      priority: 'normal',
      createdBy: null,
      readBy: [],
      isRead: false,
      readAt: null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      emailStats: { totalRecipients: 0, attempted: 0, sent: 0, failed: 0 },
      deliveryStatus: 'sent'
    };
  }
  return {
    _id: String(n._id || n.id || ''),
    title: String(n.title || ''),
    message: String(n.message || ''),
    targetAudience: String(n.targetAudience || 'all'),
    priority: String(n.priority || 'normal'),
    createdBy: n.createdBy || null,
    readBy: Array.isArray(n.readBy) ? n.readBy : [],
    isRead: Boolean(n.isRead),
    readAt: n.readAt ? String(n.readAt) : null,
    isDeleted: Boolean(n.isDeleted),
    createdAt: n.createdAt ? String(n.createdAt) : new Date().toISOString(),
    emailStats: n.emailStats ? {
      totalRecipients: Number(n.emailStats.totalRecipients || 0),
      attempted: Number(n.emailStats.attempted || 0),
      sent: Number(n.emailStats.sent || 0),
      failed: Number(n.emailStats.failed || 0)
    } : { totalRecipients: 0, attempted: 0, sent: 0, failed: 0 },
    deliveryStatus: String(n.deliveryStatus || 'sent'),
    ...(n.recipientId ? { recipientId: String(n.recipientId) } : {}),
    ...(n.recipientUserId ? { recipientUserId: String(n.recipientUserId) } : {}),
    ...(n.inquiryId ? { inquiryId: String(n.inquiryId) } : {}),
    ...(n.replyId ? { replyId: String(n.replyId) } : {}),
    ...(n.type ? { type: String(n.type) } : {}),
    ...(n.notificationType ? { notificationType: String(n.notificationType) } : {}),
    ...(n.senderRole ? { senderRole: String(n.senderRole) } : {}),
    ...(n.metadata ? { metadata: n.metadata } : {}),
  };
};

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  loading: boolean;
  isSocketInitialized: boolean;
  
  initializeSocket: (userId?: string) => void;
  getNotifications: () => Promise<void>;
  createNotification: (data: any) => Promise<any>;
  updateNotification: (id: string, data: any) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  fetchEmailLogs: (id: string) => Promise<any>;
  retryFailedEmails: (id: string) => Promise<any>;
  fetchAudienceCount: (audience: string) => Promise<number>;
  resetStore: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  loading: false,
  isSocketInitialized: false,

  initializeSocket: (userId?: string) => {
    let socket = get().socket;
    if (!socket) {
      socket = getAppSocket();
      set({ socket });
    }
    if (!socket) return;

    if (userId) {
      socket.emit('authenticate', userId);
    }

    if (get().isSocketInitialized) {
      return;
    }
    set({ isSocketInitialized: true });

    // Clean up specific listeners before registering
    socket.off('notification_created');
    socket.off('notification_updated');
    socket.off('notification_deleted');
    socket.off('notification_read');

    socket.on('notification_created', (notification: any) => {
      if (!notification || typeof notification !== 'object') {
        get().getNotifications();
        get().getUnreadCount();
        return;
      }

      const safeNotification = normalizeNotification(notification);
      if (!safeNotification._id) {
        get().getNotifications();
        get().getUnreadCount();
        return;
      }

      // Strictly enforce client-side isolation for targeted individual notifications
      const currentUser = useAuthStore.getState().user;
      const myId = String(currentUser?._id || currentUser?.id || '');
      const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
      const notifAudience = safeNotification.targetAudience.toLowerCase();
      const targetUser = String(safeNotification.recipientUserId || safeNotification.recipientId || '');
      if (notifAudience === 'individual' && (!myId || targetUser !== myId)) {
        return;
      }
      if (!isStaff && notifAudience === 'admins') {
        return;
      }

      set((state) => {
        const safeExisting = (state.notifications || []).filter(Boolean);
        const exists = safeExisting.some((n) => n?._id === safeNotification._id);
        if (exists) {
          return {
            notifications: safeExisting.map(n => n?._id === safeNotification._id ? safeNotification : n)
          };
        }

        return { 
          notifications: [safeNotification, ...safeExisting],
          unreadCount: (state.unreadCount || 0) + 1
        };
      });
    });

    socket.on('notification_updated', (updated: any) => {
      if (!updated || typeof updated !== 'object' || !updated._id) {
        get().getNotifications();
        return;
      }
      const safeUpdated = normalizeNotification(updated);
      set((state) => ({
        notifications: (state.notifications || []).map((n) => 
          n?._id === safeUpdated._id ? { ...n, ...safeUpdated } : n
        )
      }));
    });

    socket.on('notification_deleted', (data: any) => {
      const id = data?.id || (typeof data === 'string' ? data : null);
      if (!id) {
        get().getNotifications();
        return;
      }
      set((state) => ({
        notifications: (state.notifications || []).filter((n) => n?._id !== id),
        unreadCount: Math.max(0, (state.unreadCount || 0) - 1)
      }));
      get().getUnreadCount();
    });

    socket.on('notification_read', (data: any) => {
      if (!data || !data.notificationId) return;
      const { notificationId, userId: readUserId } = data;
      set((state) => ({
        notifications: (state.notifications || []).map((n) => {
          if (n?._id === notificationId) {
            const currentRead = Array.isArray(n.readBy) ? n.readBy : [];
            const updatedRead = currentRead.includes(readUserId) ? currentRead : [...currentRead, readUserId];
            return {
              ...n,
              isRead: n.targetAudience === 'individual' ? true : n.isRead,
              readBy: updatedRead
            };
          }
          return n;
        })
      }));
      get().getUnreadCount();
    });
  },

  resetStore: () => {
    set({
      notifications: [],
      unreadCount: 0,
      socket: null,
      loading: false,
      isSocketInitialized: false
    });
  },

  getNotifications: async () => {
    set({ loading: true });
    try {
      const res = await axios.get('/api/notifications');
      const rawList = Array.isArray(res.data) 
        ? res.data 
        : (Array.isArray(res.data?.notifications) ? res.data.notifications : []);
      const sanitized = rawList
        .filter((n: any) => Boolean(n && (n._id || n.id)))
        .map(normalizeNotification);
      set({ notifications: sanitized, loading: false });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ loading: false });
    }
  },

  createNotification: async (data: any) => {
    const res = await axios.post('/api/notifications', data);
    if (res.data?.notification) {
      const normalized = normalizeNotification(res.data.notification);
      set((state) => {
        const safeExisting = (state.notifications || []).filter(n => n?._id !== normalized._id);
        return { notifications: [normalized, ...safeExisting] };
      });
    }
    return res.data;
  },

  updateNotification: async (id: string, data: any) => {
    const res = await axios.put(`/api/notifications/${id}`, data);
    if (res.data) {
      const normalized = normalizeNotification(res.data);
      set((state) => ({
        notifications: (state.notifications || []).map(n => n._id === id ? normalized : n)
      }));
    }
  },

  deleteNotification: async (id: string) => {
    await axios.delete(`/api/notifications/${id}`);
    set((state) => ({
      notifications: (state.notifications || []).filter((n) => n?._id !== id),
      unreadCount: Math.max(0, (state.unreadCount || 0) - 1)
    }));
  },

  markAsRead: async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
    } catch (error) {
      console.error(error);
    }
  },

  getUnreadCount: async () => {
    try {
      const res = await axios.get('/api/notifications/unread/count');
      set({ unreadCount: res.data.count });
    } catch (error) {
      console.error(error);
    }
  },

  fetchEmailLogs: async (id: string) => {
    const res = await axios.get(`/api/notifications/${id}/email-logs`);
    return res.data;
  },

  retryFailedEmails: async (id: string) => {
    const res = await axios.post(`/api/notifications/${id}/retry-failed`);
    if (res.data?.notification) {
      const normalized = normalizeNotification(res.data.notification);
      set((state) => ({
        notifications: (state.notifications || []).map(n => n._id === id ? normalized : n)
      }));
    }
    return res.data;
  },

  fetchAudienceCount: async (audience: string) => {
    try {
      const res = await axios.get(`/api/notifications/audience-count?audience=${audience}`);
      return res.data?.count || 0;
    } catch {
      return 0;
    }
  }
}));
