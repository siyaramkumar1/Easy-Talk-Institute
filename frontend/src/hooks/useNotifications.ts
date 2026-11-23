import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { getAppSocket } from '../utils/socket';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../store/useAuthStore';

export const useNotifications = () => {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user?._id || !token) return;
    try {
      const data = await notificationService.getUserNotifications(user._id, token);
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user?._id && token) {
      fetchNotifications();
      
      const socket = getAppSocket();
      if (socket) {
        socket.emit('authenticate', user._id);
        
        const handleNew = () => {
          fetchNotifications();
        };

        socket.on('notification:new', handleNew);

        return () => {
          socket.off('notification:new', handleNew);
        };
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?._id, token]);

  const markAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await notificationService.markAsRead(notificationId, token);
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await notificationService.markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
