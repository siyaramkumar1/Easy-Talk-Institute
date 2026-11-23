// @ts-nocheck
import express from 'express';
import { 
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllRead,
  getUnreadCount,
  getNotificationEmailLogs,
  retryFailedNotificationEmails,
  getAudienceCount
} from '../controllers/notificationController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get unread count (available to all authenticated users)
router.get('/unread/count', authenticate, getUnreadCount);

// Audience count estimation for notification composition (SuperAdmin and Admin)
router.get('/audience-count', authenticate, authorize(['admin', 'superadmin']), getAudienceCount);

// Mark as read (available to all authenticated users via PATCH or PUT)
router.patch('/read-all', authenticate, markAllRead);
router.put('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markAsRead);
router.put('/:id/read', authenticate, markAsRead);

// Email logs and delivery stats (SuperAdmin and Admin)
router.get('/:id/email-logs', authenticate, authorize(['admin', 'superadmin']), getNotificationEmailLogs);

// Retry failed emails (SuperAdmin only)
router.post('/:id/retry-failed', authenticate, authorize(['superadmin']), retryFailedNotificationEmails);

// User-specific route alias for notificationService
router.get('/user/:userId', authenticate, getNotifications);

// Standard CRUD & notification dispatch
// Dispatch notification via In-App + Email (SuperAdmin only)
router.post('/', authenticate, authorize(['superadmin']), createNotification);
router.get('/', authenticate, getNotifications);
router.get('/:id', authenticate, getNotificationById);
router.put('/:id', authenticate, authorize(['superadmin']), updateNotification);
router.delete('/:id', authenticate, deleteNotification);

export default router;
