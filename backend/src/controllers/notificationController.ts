// @ts-nocheck
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { getIo, sendNotificationToUser } from '../sockets/notificationSocket';
import { emailNotificationService } from '../services/emailNotificationService';

/**
 * Create notification and dispatch both in-app and email notifications
 * Allowed: SuperAdmin only
 */
export const createNotification = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ success: false, message: 'Database disconnected' });
    }

    const userRole = (req as any).user?.role;
    if (userRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin is authorized to dispatch notifications' });
    }

    const { title, message, targetAudience, priority, type, recipientId } = req.body;
    const createdBy = (req as any).user?.id || (req as any).user?._id;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const validAudiences = ['all', 'students', 'trainers', 'admins', 'individual'];
    const validPriorities = ['low', 'normal', 'high', 'urgent'];

    let normalizedAudience = 'all';
    if (targetAudience) {
      const lower = String(targetAudience).toLowerCase().trim();
      if (lower === 'admin') normalizedAudience = 'admins';
      else if (lower === 'student') normalizedAudience = 'students';
      else if (lower === 'trainer') normalizedAudience = 'trainers';
      else if (validAudiences.includes(lower)) normalizedAudience = lower;
    }

    let normalizedPriority = 'normal';
    if (priority) {
      const lower = String(priority).toLowerCase().trim();
      if (lower === 'medium') normalizedPriority = 'normal';
      else if (validPriorities.includes(lower)) normalizedPriority = lower;
    }

    // 1. Fetch eligible recipients for email delivery
    const recipients = await emailNotificationService.getAudienceRecipients(normalizedAudience, recipientId);

    // 2. Save initial notification in MongoDB
    const notification = new Notification({
      title: title.trim(),
      message: message.trim(),
      targetAudience: normalizedAudience,
      recipientId: recipientId || undefined,
      priority: normalizedPriority,
      type: type || 'general',
      createdBy,
      readBy: [],
      isDeleted: false,
      deliveryStatus: 'sending',
      emailStats: {
        totalRecipients: recipients.length,
        attempted: 0,
        sent: 0,
        failed: 0
      },
      emailLogs: []
    });

    await notification.save();
    const populatedNotif = await notification.populate('createdBy', 'name email');

    // 3. Emit in-app notification via Socket.IO strictly to intended audience
    const io = getIo();
    if (normalizedAudience === 'individual' && recipientId) {
      sendNotificationToUser(String(recipientId), 'notification_created', populatedNotif);
      sendNotificationToUser(String(recipientId), 'notification:new', populatedNotif);
    } else if (io) {
      io.emit('notification_created', populatedNotif);
    }

    // 4. Send bulk emails in background/batch
    const emailResult = await emailNotificationService.dispatchBulkEmails({
      title: title.trim(),
      message: message.trim(),
      priority: normalizedPriority,
      recipients
    });

    // 5. Update notification with email stats and logs
    notification.emailStats = emailResult.emailStats;
    notification.emailLogs = emailResult.emailLogs;
    notification.deliveryStatus = emailResult.deliveryStatus;
    await notification.save();

    // 6. Broadcast updated notification with stats
    if (io) {
      io.emit('notification_updated', notification);
    }

    res.status(201).json({
      success: true,
      notification,
      emailSummary: {
        totalRecipients: emailResult.emailStats.totalRecipients,
        sent: emailResult.emailStats.sent,
        failed: emailResult.emailStats.failed,
        smtpConfigured: emailResult.smtpConfigured
      }
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating notification' });
  }
};

/**
 * Get recipient count for audience preview before sending
 */
export const getAudienceCount = async (req: Request, res: Response) => {
  try {
    const audience = String(req.query.audience || 'all');
    const recipients = await emailNotificationService.getAudienceRecipients(audience);
    res.json({ success: true, count: recipients.length, audience });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error counting audience' });
  }
};

/**
 * Fetch notifications list
 * - Admins/SuperAdmins get all notifications with emailStats
 * - Regular students only receive notifications intended for them (without recipient email logs)
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json([]); }
    
    const user = (req as any).user;
    const isStaff = user?.role === 'admin' || user?.role === 'superadmin';

    let filter: any = { isDeleted: false };
    if (!isStaff) {
      const userId = String(user?.id || user?._id || '');
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
      filter = {
        isDeleted: false,
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'students' },
          {
            targetAudience: 'individual',
            $or: [
              { recipientId: userId },
              { recipientId: userObjectId },
              { recipientUserId: userId },
              { recipientUserId: userObjectId }
            ]
          }
        ]
      };
    }

    const requestedType = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    if (requestedType === 'contact_reply') {
      filter.type = 'contact_reply';
    }

    // Regular students do not need full emailLogs of all users
    const query = Notification.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    if (!isStaff) {
      query.select('-emailLogs');
    }

    const notifications = await query.lean();
    res.json(notifications);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error fetching notifications' });
  }
};

/**
 * Get detailed email delivery logs for a specific notification
 * Allowed: SuperAdmin only
 */
export const getNotificationEmailLogs = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, isDeleted: false })
      .select('title message targetAudience priority deliveryStatus emailStats emailLogs createdAt')
      .lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      title: notification.title,
      targetAudience: notification.targetAudience,
      priority: notification.priority,
      deliveryStatus: notification.deliveryStatus,
      emailStats: notification.emailStats,
      emailLogs: notification.emailLogs || [],
      createdAt: notification.createdAt
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error fetching email logs' });
  }
};

/**
 * Retry sending failed emails for a notification
 * Allowed: SuperAdmin only
 */
export const retryFailedNotificationEmails = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only SuperAdmin can retry failed notifications' });
    }

    const { id } = req.params;
    const result = await emailNotificationService.retryFailedEmails(id);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error retrying failed emails' });
  }
};

export const getNotificationById = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json({}); }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }
    const user = (req as any).user;
    const userId = String(user?.id || user?._id || '');
    const isStaff = user?.role === 'admin' || user?.role === 'superadmin';

    const query = Notification.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email');

    if (!isStaff) {
      query.select('-emailLogs');
    }

    const notification: any = await query.lean();
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });

    if (!isStaff) {
      const audience = String(notification.targetAudience || '').toLowerCase();
      const ownerId = notification.recipientUserId
        ? String(notification.recipientUserId)
        : (notification.recipientId ? String(notification.recipientId) : '');
      const allowedBroadcast = audience === 'all' || audience === 'students';
      const isOwner = audience === 'individual' && ownerId && ownerId === userId;
      if (!allowedBroadcast && !isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied to this notification' });
      }
    }

    res.json(notification);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error fetching notification' });
  }
};

export const updateNotification = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.status(400).json({ success: false, message: 'DB disconnected' }); }
    const { id } = req.params;
    const { title, message, targetAudience, priority } = req.body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (targetAudience !== undefined) {
      const lower = String(targetAudience).toLowerCase().trim();
      if (lower === 'admin') updateData.targetAudience = 'admins';
      else if (lower === 'student') updateData.targetAudience = 'students';
      else if (lower === 'trainer') updateData.targetAudience = 'trainers';
      else updateData.targetAudience = lower;
    }
    if (priority !== undefined) {
      const lower = String(priority).toLowerCase().trim();
      if (lower === 'medium') updateData.priority = 'normal';
      else updateData.priority = lower;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { returnDocument: 'after' }
    ).populate('createdBy', 'name email');

    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });

    const io = getIo();
    if (io) {
      io.emit('notification_updated', notification);
    }

    res.json(notification);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating notification' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.status(400).json({ success: false, message: 'DB disconnected' }); }
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const isStaff = user?.role === 'superadmin' || user?.role === 'admin';

    const notification = await Notification.findById(id);
    if (!notification || notification.isDeleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (isStaff) {
      await Notification.findByIdAndDelete(id);
      const io = getIo();
      if (io) {
        io.emit('notification_deleted', { id });
      }
      return res.json({ success: true, message: 'Notification deleted successfully' });
    }

    // Allow student to delete their own notification if recipientId/recipientUserId matches
    const ownerId = notification.recipientUserId
      ? String(notification.recipientUserId)
      : (notification.recipientId ? String(notification.recipientId) : '');
    const isOwnNotification = ownerId && ownerId === String(userId);
    if (isOwnNotification) {
      notification.isDeleted = true;
      await notification.save();
      sendNotificationToUser(String(userId), 'notification_deleted', { id, userId });
      return res.json({ success: true, message: 'Notification deleted successfully' });
    } else {
      const audience = String(notification.targetAudience || '').toLowerCase();
      if (audience === 'individual' || audience === 'admins' || audience === 'trainers') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      // For general or broadcast notification, mark as read for this student
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
      const isAlreadyRead = notification.readBy.some((r: any) => String(r) === String(userId));
      if (!isAlreadyRead) {
        notification.readBy.push(userObjectId);
        await notification.save();
      }
      return res.json({ success: true, message: 'Notification dismissed' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error deleting notification' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json({ message: 'Notification Marked As Read' }); }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }
    const user = (req as any).user;
    const userId = String(user.id || user._id || '');
    const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    
    const notification = await Notification.findOne({ _id: id, isDeleted: false });
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });

    const audience = String(notification.targetAudience || '').toLowerCase();
    const ownerId = notification.recipientUserId
      ? String(notification.recipientUserId)
      : (notification.recipientId ? String(notification.recipientId) : '');
    const isOwnIndividual = audience === 'individual' && ownerId === userId;

    if (!isStaff && audience === 'individual' && !isOwnIndividual) {
      return res.status(403).json({ success: false, message: 'Access denied: cannot modify another user\'s notification' });
    }
    if (!isStaff && (audience === 'admins' || audience === 'trainers')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const isAlreadyRead = notification.readBy.some((r: any) => String(r) === userId);
    if (!isAlreadyRead) {
      notification.readBy.push(userObjectId);
    }
    if (isOwnIndividual) {
      notification.isRead = true;
      notification.readAt = notification.readAt || new Date();
    }
    await notification.save();

    if (audience === 'individual' && ownerId) {
      sendNotificationToUser(ownerId, 'notification_read', { notificationId: id, userId });
    } else {
      const io = getIo();
      if (io) {
        io.emit('notification_read', { notificationId: id, userId });
      }
    }

    res.json({ success: true, message: 'Notification Marked As Read' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating read status' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json({ count: 0 }); }
    const userId = String((req as any).user.id || (req as any).user._id || '');
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const role = (req as any).user.role;

    let audience = 'students';
    if (role === 'admin' || role === 'superadmin') audience = 'admins';
    else if (role === 'trainer') audience = 'trainers';

    const count = await Notification.countDocuments({
      isDeleted: false,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: audience },
        {
          targetAudience: 'individual',
          $or: [
            { recipientId: userId },
            { recipientId: userObjectId },
            { recipientUserId: userId },
            { recipientUserId: userObjectId }
          ]
        }
      ],
      readBy: { $nin: [userId, userObjectId] }
    });

    res.json({ count });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error fetching unread count' });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json({ message: 'All Notifications Marked As Read' }); }
    const userId = String((req as any).user.id || (req as any).user._id || '');
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const role = (req as any).user.role;
    let audience = 'students';
    if (role === 'admin' || role === 'superadmin') audience = 'admins';
    else if (role === 'trainer') audience = 'trainers';

    const unreadNotifications = await Notification.find({
      isDeleted: false,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: audience },
        {
          targetAudience: 'individual',
          $or: [
            { recipientId: userId },
            { recipientId: userObjectId },
            { recipientUserId: userId },
            { recipientUserId: userObjectId }
          ]
        }
      ],
      readBy: { $nin: [userId, userObjectId] }
    });

    for (const notification of unreadNotifications) {
      const isAlreadyRead = notification.readBy.some((r: any) => String(r) === userId);
      if (!isAlreadyRead) {
        notification.readBy.push(userObjectId);
      }
      if (notification.targetAudience === 'individual') {
        notification.isRead = true;
        notification.readAt = notification.readAt || new Date();
      }
      await notification.save();
    }

    res.json({ success: true, message: 'All Notifications Marked As Read' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating read status' });
  }
};
