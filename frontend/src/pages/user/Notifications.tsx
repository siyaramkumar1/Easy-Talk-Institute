import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/notificationStore';
import { contactService } from '../../services/contactService';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Trash2, 
  CheckCheck, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  BookOpen, 
  ExternalLink,
  MessageSquare,
  User,
  ShieldCheck,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getAppSocket } from '../../utils/socket';

type FilterType = 'all' | 'unread' | 'read' | 'contact_reply' | 'enrollment' | 'general';

interface InquiryReplyItem {
  _id?: string;
  replyMessage: string;
  repliedByName?: string;
  repliedByRole?: string;
  repliedAt: string;
}

interface InquiryConversation {
  _id: string;
  fullName?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
  replies?: InquiryReplyItem[];
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  targetAudience?: string;
  recipientId?: string;
  recipientUserId?: string;
  inquiryId?: string;
  notificationType?: string;
  senderRole?: string;
  isRead?: boolean;
  metadata?: {
    inquiryId?: string;
    inquirySubject?: string;
    originalMessage?: string;
    adminReply?: string;
    repliedByName?: string;
    repliedByRole?: string;
    senderRoleLabel?: string;
    repliedAt?: string;
    inquiryCreatedAt?: string;
  } | null;
  priority?: string;
  type?: string;
  readBy?: (string | { _id: string })[];
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Inquiry Conversation Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<InquiryConversation | null>(null);

  const myUserId = String(user?._id || user?.id || '');

  const getAuthConfig = () => {
    const { token } = useAuthStore.getState();
    return token && token !== 'cookie-session'
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
  };

  const fetchNotifications = async () => {
    try {
      setError(null);
      const { token, isAuthenticated: hasAuth } = useAuthStore.getState();
      if (!hasAuth && !token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const res = await axios.get('/api/notifications', getAuthConfig());

      const list = Array.isArray(res.data) 
        ? res.data 
        : (Array.isArray(res.data?.notifications) ? res.data.notifications : []);

      setNotifications(list);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err?.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !useAuthStore.getState().token) {
      navigate('/login?redirect=/user/notifications');
      return;
    }

    fetchNotifications();

    const socket = getAppSocket();
    if (socket) {
      if (myUserId) {
        socket.emit('authenticate', myUserId);
      }

      const handleSync = () => {
        fetchNotifications();
      };

      socket.on('notification_created', handleSync);
      socket.on('notification_updated', handleSync);
      socket.on('notification_deleted', handleSync);
      socket.on('notification_read', handleSync);

      return () => {
        socket.off('notification_created', handleSync);
        socket.off('notification_updated', handleSync);
        socket.off('notification_deleted', handleSync);
        socket.off('notification_read', handleSync);
      };
    }
  }, [isAuthenticated, myUserId]);

  // Determine if a notification has been read by the current user
  const isNotificationRead = (notif: NotificationItem) => {
    const ownerId = String(notif.recipientUserId || notif.recipientId || '');
    if (notif.targetAudience === 'individual' && ownerId && ownerId === myUserId && notif.isRead) {
      return true;
    }
    const readList = Array.isArray(notif.readBy) ? notif.readBy : [];
    return readList.some((r: any) => {
      if (typeof r === 'string') return r === myUserId;
      if (r && typeof r === 'object' && r._id) return String(r._id) === myUserId;
      return false;
    });
  };

  // Classify notification category for filtering and badges
  const getNotificationCategory = (notif: NotificationItem): 'contact_reply' | 'enrollment' | 'general' => {
    if (isContactReplyNotification(notif)) {
      return 'contact_reply';
    }
    const title = (notif.title || '').toLowerCase();
    const message = (notif.message || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();

    if (
      type === 'enrollment' ||
      title.includes('enrollment') ||
      title.includes('admission') ||
      message.includes('enrollment') ||
      message.includes('eti-enr') ||
      message.includes('admission')
    ) {
      return 'enrollment';
    }
    return 'general';
  };

  const isContactReplyNotification = (notif: NotificationItem) => {
    return (
      notif.type === 'contact_reply' ||
      notif.notificationType === 'contact_reply' ||
      Boolean(notif.inquiryId || notif.metadata?.inquiryId)
    );
  };

  const getSenderRoleLabel = (notif: NotificationItem): 'Admin' | 'SuperAdmin' => {
    const raw =
      notif.metadata?.senderRoleLabel ||
      notif.senderRole ||
      notif.metadata?.repliedByRole ||
      '';
    return String(raw).toLowerCase() === 'superadmin' ? 'SuperAdmin' : 'Admin';
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (notif.isDeleted) return false;
      const isRead = isNotificationRead(notif);
      const category = getNotificationCategory(notif);

      switch (activeFilter) {
        case 'unread':
          return !isRead;
        case 'read':
          return isRead;
        case 'contact_reply':
          return category === 'contact_reply';
        case 'enrollment':
          return category === 'enrollment';
        case 'general':
          return category === 'general';
        case 'all':
        default:
          return true;
      }
    });
  }, [notifications, activeFilter, myUserId]);

  // Counts
  const counts = useMemo(() => {
    const valid = notifications.filter(n => !n.isDeleted);
    const unread = valid.filter(n => !isNotificationRead(n)).length;
    const read = valid.length - unread;
    const contact_reply = valid.filter(n => getNotificationCategory(n) === 'contact_reply').length;
    const enrollment = valid.filter(n => getNotificationCategory(n) === 'enrollment').length;
    const general = valid.filter(n => getNotificationCategory(n) === 'general').length;

    return {
      all: valid.length,
      unread,
      read,
      contact_reply,
      enrollment,
      general
    };
  }, [notifications, myUserId]);

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
    try {
      setActionInProgress(id);
      await axios.patch(`/api/notifications/${id}/read`, {}, getAuthConfig());

      setNotifications((prev) =>
        prev.map((n) => {
          if (n._id === id) {
            const currentRead = Array.isArray(n.readBy) ? n.readBy : [];
            const alreadyInList = currentRead.some((r: any) =>
              typeof r === 'string' ? r === myUserId : String(r?._id || '') === myUserId
            );
            return {
              ...n,
              isRead: n.targetAudience === 'individual' ? true : n.isRead,
              readBy: alreadyInList ? currentRead : [...currentRead, myUserId]
            };
          }
          return n;
        })
      );
      getUnreadCount();
    } catch (err: any) {
      console.error('Failed to mark read:', err);
      toast.error(err?.response?.data?.message || 'Failed to mark as read');
    } finally {
      setActionInProgress(null);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (counts.unread === 0) return;
    try {
      setActionInProgress('all');
      await axios.patch('/api/notifications/read-all', {}, getAuthConfig());

      toast.success('All notifications marked as read');
      setNotifications((prev) =>
        prev.map((n) => {
          const currentRead = Array.isArray(n.readBy) ? n.readBy : [];
          const alreadyInList = currentRead.some((r: any) =>
            typeof r === 'string' ? r === myUserId : String(r?._id || '') === myUserId
          );
          return {
            ...n,
            isRead: n.targetAudience === 'individual' ? true : n.isRead,
            readBy: alreadyInList ? currentRead : [...currentRead, myUserId]
          };
        })
      );
      getUnreadCount();
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      toast.error(err?.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    try {
      setActionInProgress(id);
      await axios.delete(`/api/notifications/${id}`, getAuthConfig());

      toast.success('Notification removed');
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setDeleteConfirmId(null);
      getUnreadCount();
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      toast.error(err?.response?.data?.message || 'Failed to remove notification');
    } finally {
      setActionInProgress(null);
    }
  };

  // Open Inquiry Conversation Modal and mark notification as read
  const handleViewInquiryReply = async (inquiryId: string, notificationId: string) => {
    setActiveInquiryId(inquiryId);
    setActiveNotificationId(notificationId);
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setConversation(null);

    if (notificationId) {
      const targetNotif = notifications.find((n) => n._id === notificationId);
      if (targetNotif && !isNotificationRead(targetNotif)) {
        handleMarkAsRead(notificationId);
      }
    }

    try {
      const res = await contactService.getMyInquiry(inquiryId);
      if (res?.inquiry) {
        setConversation(res.inquiry);
      } else {
        setModalError('Inquiry conversation details are unavailable.');
      }
    } catch (err: any) {
      console.error('Failed to load inquiry conversation:', err);
      setModalError(err?.response?.data?.message || 'Failed to load inquiry conversation.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeConversationModal = () => {
    setModalOpen(false);
    setActiveInquiryId(null);
    setActiveNotificationId(null);
    setConversation(null);
    setModalError(null);
    if (searchParams.has('inquiryId') || searchParams.has('notifId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('inquiryId');
      nextParams.delete('notifId');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Auto-open inquiry conversation when navigated with ?inquiryId=...
  useEffect(() => {
    const deepInquiryId = searchParams.get('inquiryId');
    const deepNotifId = searchParams.get('notifId') || '';
    if (deepInquiryId && (isAuthenticated || useAuthStore.getState().token) && !modalOpen && activeInquiryId !== deepInquiryId) {
      const matchedNotif =
        notifications.find((n) => n._id === deepNotifId) ||
        notifications.find((n) => String(n.inquiryId || n.metadata?.inquiryId || '') === deepInquiryId);
      handleViewInquiryReply(deepInquiryId, matchedNotif?._id || deepNotifId);
    }
  }, [searchParams, isAuthenticated, notifications.length]);

  // Visual badge configuration
  const getCardVisuals = (notif: NotificationItem) => {
    const title = (notif.title || '').toLowerCase();
    const category = getNotificationCategory(notif);

    if (isContactReplyNotification(notif)) {
      const senderLabel = getSenderRoleLabel(notif);
      const isSuper = senderLabel === 'SuperAdmin';
      return {
        badgeText: 'Contact Reply',
        senderBadgeText: `Message from ${senderLabel}`,
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
        senderBadgeClass: isSuper
          ? 'bg-purple-50 text-purple-700 border-purple-200/80'
          : 'bg-blue-50 text-blue-700 border-blue-200/80',
        iconBg: 'bg-orange-100/90 text-orange-600',
        Icon: MessageSquare,
        actionLink: null,
        actionLabel: null
      };
    }

    if (category === 'enrollment') {
      return {
        badgeText: 'Enrollment',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        iconBg: 'bg-emerald-100/80 text-emerald-600',
        Icon: CheckCircle2,
        actionLink: '/my-courses',
        actionLabel: 'View Enrollments'
      };
    }

    if (title.includes('batch') || title.includes('class') || title.includes('schedule')) {
      return {
        badgeText: 'Batch Update',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
        iconBg: 'bg-purple-100/80 text-purple-600',
        Icon: Calendar,
        actionLink: '/batches',
        actionLabel: 'View Batches'
      };
    }

    if (title.includes('course') || title.includes('syllabus') || title.includes('curriculum')) {
      return {
        badgeText: 'Course Update',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
        iconBg: 'bg-blue-100/80 text-blue-600',
        Icon: BookOpen,
        actionLink: '/courses',
        actionLabel: 'Explore Courses'
      };
    }

    if (notif.priority === 'urgent' || notif.priority === 'high' || title.includes('important')) {
      return {
        badgeText: 'Important',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
        iconBg: 'bg-orange-100/80 text-orange-600',
        Icon: AlertCircle,
        actionLink: null,
        actionLabel: null
      };
    }

    return {
      badgeText: 'General',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      Icon: Bell,
      actionLink: null,
      actionLabel: null
    };
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeModalNotification = useMemo(() => {
    if (!activeNotificationId) return null;
    return notifications.find((n) => n._id === activeNotificationId) || null;
  }, [notifications, activeNotificationId]);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 animate-in fade-in duration-300">
      
      {/* ========================================================= */}
      {/* 1. TOP BREADCRUMB / BACK LINK                             */}
      {/* ========================================================= */}
      <div className="mb-3 sm:mb-4">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 2. PAGE HEADER CARD                                       */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Notifications
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Total: {counts.all}
                </span>
                {counts.unread > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                    {counts.unread} Unread
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed max-w-xl">
                Stay updated with your enrollment requests, courses, batches and important institute announcements.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {counts.unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionInProgress === 'all'}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All as Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Refresh notifications"
              aria-label="Refresh notifications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FUNCTIONAL NOTIFICATION FILTERS                        */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'unread', label: 'Unread', count: counts.unread },
          { key: 'read', label: 'Read', count: counts.read },
          { key: 'contact_reply', label: 'Contact Reply', count: counts.contact_reply },
          { key: 'enrollment', label: 'Enrollment', count: counts.enrollment },
          { key: 'general', label: 'General', count: counts.general }
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as FilterType)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-orange-600/80 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 4. CONTENT AREA: LOADING / ERROR / EMPTY / LIST           */}
      {/* ========================================================= */}
      {loading ? (
        
        /* 4A. LOADING SKELETON */
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 bg-slate-200 rounded-md" />
                <div className="h-4 w-20 bg-slate-100 rounded-md" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
              <div className="h-4 w-full bg-slate-100 rounded-md" />
              <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>

      ) : error ? (

        /* 4B. ERROR STATE */
        <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Unable to load notifications</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>

      ) : filteredNotifications.length === 0 ? (

        /* 4C. EMPTY STATE */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-14 text-center shadow-xs animate-in fade-in duration-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
            You're All Caught Up!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {activeFilter === 'all'
              ? "You don't have any notifications right now. We'll notify you when there's something new."
              : `No ${activeFilter} notifications match your selected filter.`}
          </p>
          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer"
            >
              View All Notifications ({counts.all})
            </button>
          )}
        </div>

      ) : (

        /* 4D. NOTIFICATION CARDS LIST */
        <div className="space-y-3 sm:space-y-3.5">
          {filteredNotifications.map((notif) => {
            const isRead = isNotificationRead(notif);
            const visuals = getCardVisuals(notif);
            const { badgeText, badgeClass, iconBg, Icon, actionLink, actionLabel } = visuals;
            const senderBadgeText = (visuals as any).senderBadgeText as string | undefined;
            const senderBadgeClass = (visuals as any).senderBadgeClass as string | undefined;
            const isDeleting = actionInProgress === notif._id;
            const isReply = isContactReplyNotification(notif);
            const targetInquiryId = notif.inquiryId || notif.metadata?.inquiryId;
            const senderRoleLabel = isReply ? getSenderRoleLabel(notif) : 'Admin';
            const replyMessageText = notif.metadata?.adminReply || notif.message;

            return (
              <div
                key={notif._id}
                onClick={() => {
                  if (isReply && targetInquiryId) {
                    handleViewInquiryReply(String(targetInquiryId), notif._id);
                  }
                }}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                  isReply && targetInquiryId ? 'cursor-pointer hover:border-orange-300' : ''
                } ${
                  !isRead
                    ? 'bg-[#FFF7ED] border-orange-200 shadow-xs'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Header row: Icon, Category Badge, Read status & Date */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                        {badgeText}
                      </span>
                      {senderBadgeText && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${senderBadgeClass}`}>
                          {senderBadgeText}
                        </span>
                      )}
                      {!isRead ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                          Unread
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Read
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(notif.metadata?.repliedAt || notif.createdAt)}
                  </span>
                </div>

                {/* Notification Title */}
                <h3 className={`text-sm sm:text-base mb-1.5 tracking-tight ${
                  !isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                }`}>
                  {notif.title}
                </h3>

                {/* Structured Inquiry Reply Content or Standard Notification Message */}
                {isReply ? (
                  <div className="mb-3.5 space-y-2.5">
                    <div className="rounded-xl border border-orange-200/70 bg-white/95 p-3 sm:p-3.5 space-y-2 text-xs sm:text-sm">
                      {notif.metadata?.inquirySubject && (
                        <div>
                          <span className="font-semibold text-slate-700">Subject: </span>
                          <span className="text-slate-900 font-medium">{notif.metadata.inquirySubject}</span>
                        </div>
                      )}
                      {notif.metadata?.originalMessage && (
                        <div>
                          <span className="font-semibold text-slate-700">Original Inquiry: </span>
                          <span className="text-slate-600 whitespace-pre-line">{notif.metadata.originalMessage}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="font-semibold text-orange-700 mb-1">
                          Reply from {senderRoleLabel}:
                        </div>
                        <p className="text-slate-900 font-medium bg-orange-50/70 border border-orange-100 rounded-lg px-3 py-2 whitespace-pre-line leading-relaxed">
                          {replyMessageText}
                        </p>
                      </div>
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          Sent by: {senderRoleLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Date: {formatDate(notif.metadata?.repliedAt || notif.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3.5 whitespace-pre-line">
                    {notif.message}
                  </p>
                )}

                {/* Action Row: View Related / View Reply, Mark Read, Delete */}
                <div
                  className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    {isReply && targetInquiryId && (
                      <button
                        type="button"
                        onClick={() => handleViewInquiryReply(String(targetInquiryId), notif._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>View Reply</span>
                      </button>
                    )}

                    {actionLink && actionLabel && (
                      <Link
                        to={actionLink}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <span>{actionLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif._id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                        title="Mark notification as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark as Read</span>
                      </button>
                    )}

                    {deleteConfirmId === notif._id ? (
                      <div className="inline-flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                        <span className="text-[11px] text-red-700 font-medium px-1">Confirm?</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif._id)}
                          disabled={isDeleting}
                          className="px-2 py-0.5 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(notif._id)}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. FULL INQUIRY CONVERSATION MODAL                        */}
      {/* ========================================================= */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-conversation-title"
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/70">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="inquiry-conversation-title" className="text-base sm:text-lg font-bold text-slate-900">
                    Inquiry Conversation
                  </h2>
                  {conversation && (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {conversation.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {conversation.status || 'Resolved'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={closeConversationModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                aria-label="Close inquiry conversation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {modalLoading ? (
                <div className="space-y-3 animate-pulse py-4">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-20 w-full bg-slate-100 rounded-xl" />
                  <div className="h-24 w-full bg-blue-50 rounded-xl" />
                </div>
              ) : modalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-5 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-800 mb-3">{modalError}</p>
                  {activeInquiryId && activeNotificationId && (
                    <button
                      type="button"
                      onClick={() => handleViewInquiryReply(activeInquiryId, activeNotificationId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              ) : conversation ? (
                <>
                  {/* Original Student Inquiry */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Your Original Inquiry</span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(conversation.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      Subject: {conversation.subject}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {conversation.message}
                    </p>
                  </div>

                  {/* Replies Thread */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Institute Replies ({Array.isArray(conversation.replies) ? conversation.replies.length : 0})
                    </h3>

                    {Array.isArray(conversation.replies) && conversation.replies.length > 0 ? (
                      conversation.replies.map((rep, idx) => {
                        const isSuper = rep.repliedByRole === 'superadmin';
                        const repRoleLabel = isSuper ? 'SuperAdmin' : 'Admin';
                        return (
                          <div
                            key={rep._id || idx}
                            className={`rounded-xl border p-4 ${
                              isSuper
                                ? 'border-purple-200/80 bg-purple-50/40'
                                : 'border-blue-200/80 bg-blue-50/50'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <ShieldCheck className={`w-4 h-4 ${isSuper ? 'text-purple-600' : 'text-blue-600'}`} />
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isSuper ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  Message from {repRoleLabel}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {rep.repliedByName || 'Easy Talk Institute'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(rep.repliedAt)}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed mb-2">
                              {rep.replyMessage}
                            </p>
                            <div className="text-[11px] font-semibold text-slate-500">
                              Sent by: {repRoleLabel}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-slate-200 p-4 text-center text-xs text-slate-500">
                        No replies recorded yet.
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
              {activeModalNotification && !isNotificationRead(activeModalNotification) ? (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(activeModalNotification._id)}
                  disabled={actionInProgress === activeModalNotification._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Notification as Read</span>
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={closeConversationModal}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
