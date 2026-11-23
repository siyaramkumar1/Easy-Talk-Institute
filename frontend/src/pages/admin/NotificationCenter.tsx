import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotificationStore, Notification, EmailLog } from '../../store/notificationStore';
import { 
  Bell, 
  Send, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Edit2, 
  Eye, 
  Users, 
  Clock, 
  Search, 
  X, 
  Check, 
  ShieldAlert,
  Save,
  Radio
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function NotificationCenter() {
  const { 
    notifications, 
    getNotifications, 
    createNotification, 
    updateNotification, 
    deleteNotification,
    fetchEmailLogs,
    retryFailedEmails,
    fetchAudienceCount
  } = useNotificationStore();

  const { user } = useAuthStore();
  const location = useLocation();

  const isSuperAdmin = user?.role === 'superadmin';

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    priority: 'normal'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedRecipients, setEstimatedRecipients] = useState<number | null>(null);

  // Table Filters & Highlighting
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all_filter');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNotificationForDetails, setSelectedNotificationForDetails] = useState<Notification | null>(null);
  const [selectedNotificationForLogs, setSelectedNotificationForLogs] = useState<Notification | null>(null);
  const [emailLogsData, setEmailLogsData] = useState<{
    stats: any;
    logs: EmailLog[];
    loading: boolean;
    error: string | null;
  }>({
    stats: null,
    logs: [],
    loading: false,
    error: null
  });
  const [onlyFailedFilter, setOnlyFailedFilter] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  // Fetch estimated recipient count when target audience changes
  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      const count = await fetchAudienceCount(formData.targetAudience);
      if (active) {
        setEstimatedRecipients(count);
      }
    };
    fetchCount();
    return () => { active = false; };
  }, [formData.targetAudience, fetchAudienceCount]);

  // Handle URL query parameters to auto-scroll & highlight selected notification
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const notifId = params.get('id');
    if (notifId) {
      setHighlightedId(notifId);
      setTimeout(() => {
        const el = document.getElementById(`notif-${notifId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    } else if (location.pathname.includes('/create')) {
      setTimeout(() => {
        const el = document.getElementById('create-notification-form');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const input = el.querySelector('input');
          if (input) input.focus();
        }
      }, 200);
    }
  }, [location.search, location.pathname, notifications]);

  // Form submission handler
  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a notification title');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // If broadcasting to all or > 10 recipients and not editing, show confirmation modal first
    if (!editingId && !showConfirmModal && ((estimatedRecipients ?? 0) > 10 || formData.targetAudience === 'all')) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateNotification(editingId, formData);
        toast.success('Notification updated successfully');
        setEditingId(null);
      } else {
        const res = await createNotification(formData);
        const emailSummary = res?.emailSummary;
        if (emailSummary) {
          if (!emailSummary.smtpConfigured) {
            toast.success(
              `Notification saved in portal. Email delivery unconfigured (set EMAIL_PASS in .env).`,
              { duration: 5000 }
            );
          } else {
            toast.success(
              `Notification sent! ${emailSummary.sent} emails sent (${emailSummary.failed} failed).`,
              { duration: 5000 }
            );
          }
        } else {
          toast.success('Notification created and dispatched successfully!');
        }
      }
      setFormData({ title: '', message: '', targetAudience: 'all', priority: 'normal' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (notification: Notification) => {
    if (!notification) return;
    setEditingId(notification._id);
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      targetAudience: notification.targetAudience || 'all',
      priority: notification.priority || 'normal'
    });
    const formEl = document.getElementById('create-notification-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openDetailsModal = (notif: Notification) => {
    setSelectedNotificationForDetails(notif);
  };

  const openEmailLogsModal = async (notif: Notification, failedOnly: boolean = false) => {
    setSelectedNotificationForLogs(notif);
    setOnlyFailedFilter(failedOnly);
    setEmailLogsData({ stats: notif.emailStats || null, logs: [], loading: true, error: null });

    try {
      const data = await fetchEmailLogs(notif._id);
      setEmailLogsData({
        stats: data.emailStats || notif.emailStats,
        logs: Array.isArray(data.emailLogs) ? data.emailLogs : [],
        loading: false,
        error: null
      });
    } catch (err: any) {
      setEmailLogsData({
        stats: notif.emailStats || null,
        logs: [],
        loading: false,
        error: err.response?.data?.message || 'Failed to load email delivery logs'
      });
    }
  };

  const handleRetryFailed = async (notifId: string) => {
    setRetryingId(notifId);
    try {
      const res = await retryFailedEmails(notifId);
      toast.success(res.message || 'Retry process completed', { duration: 4000 });
      // Refresh current open logs if viewing this notification
      if (selectedNotificationForLogs?._id === notifId) {
        const updated = await fetchEmailLogs(notifId);
        setEmailLogsData({
          stats: updated.emailStats,
          logs: updated.emailLogs || [],
          loading: false,
          error: null
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry failed emails');
    } finally {
      setRetryingId(null);
    }
  };

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return (notifications || []).filter(Boolean).filter(n => {
      const matchesSearch = 
        !searchQuery.trim() || 
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAudience = 
        audienceFilter === 'all_filter' || 
        n.targetAudience === audienceFilter;

      return matchesSearch && matchesAudience;
    });
  }, [notifications, searchQuery, audienceFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SuperAdmin Notification Center</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Broadcast announcements simultaneously via in-app alerts and official email delivery.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Live In-App + Email Sync
          </div>
        </div>
      </div>

      {/* Create / Edit Form */}
      <div id="create-notification-form" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              {editingId ? 'Edit Notification' : 'Compose New Notification & Email Broadcast'}
            </h2>
          </div>
          {estimatedRecipients !== null && !editingId && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Reaches <strong className="text-slate-800 font-bold">{estimatedRecipients}</strong> eligible recipient{estimatedRecipients === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Notification Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none"
                placeholder="e.g., Live Masterclass Schedule Announcement"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.targetAudience}
                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none"
                disabled={isSubmitting}
              >
                <option value="all">All Registered Users</option>
                <option value="students">Students Only</option>
                <option value="admins">Admins & SuperAdmins</option>
                <option value="trainers">Trainers</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Formatted into branded HTML email & instant in-app notification
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none resize-none"
                placeholder="Write the full announcement message here. Paragraph breaks will be formatted cleanly in both the notification center and the recipient's email inbox..."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all outline-none"
                disabled={isSubmitting}
              >
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Announcement</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end justify-end gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', message: '', targetAudience: 'all', priority: 'normal' });
                  }}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isSuperAdmin}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  isSubmitting 
                    ? 'bg-blue-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-blue-500/30'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Broadcast...</span>
                  </>
                ) : editingId ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Notification & Emails</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Large Audiences */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Confirm Broadcast Dispatch</h3>
              <p className="text-sm text-slate-600">
                You are about to dispatch this notification to <strong className="text-slate-900">{estimatedRecipients ?? 'all'}</strong> users.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-left border border-slate-200/60 mt-2 space-y-1">
                <div><strong>Title:</strong> {formData.title}</div>
                <div><strong>Audience:</strong> {formData.targetAudience}</div>
                <div><strong>Priority:</strong> {formData.priority}</div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleFormSubmit()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notification History & Email Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review sent announcements, live recipient reading status, and verified SMTP delivery metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44 sm:w-56"
              />
            </div>

            <select
              value={audienceFilter}
              onChange={e => setAudienceFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all_filter">All Audiences</option>
              <option value="all">Audience: All</option>
              <option value="students">Audience: Students</option>
              <option value="admins">Audience: Admins</option>
              <option value="trainers">Audience: Trainers</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Title & Message</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5 text-center">Recipients</th>
                <th className="px-4 py-3.5 text-center">Email Sent</th>
                <th className="px-4 py-3.5 text-center">Email Failed</th>
                <th className="px-4 py-3.5 text-center">Read Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotifications.map((notif) => {
                const stats = notif.emailStats || { totalRecipients: 0, attempted: 0, sent: 0, failed: 0 };
                const hasFailed = stats.failed > 0;
                const isRetrying = retryingId === notif._id;

                return (
                  <tr
                    key={notif._id}
                    id={`notif-${notif._id}`}
                    className={`transition-colors ${
                      highlightedId === notif._id
                        ? 'bg-blue-50/80 ring-2 ring-blue-400 font-medium'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate" title={notif.title}>
                        {notif.title || 'Untitled Notification'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5" title={notif.message}>
                        {notif.message}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {notif.targetAudience || 'all'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        notif.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        notif.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        notif.priority === 'low' ? 'bg-slate-100 text-slate-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {notif.priority || 'normal'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openEmailLogsModal(notif)}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 transition-colors"
                        title="View recipient list"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{stats.totalRecipients || 0}</span>
                      </button>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openEmailLogsModal(notif)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                        title="Emails accepted by SMTP server"
                      >
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>{stats.sent || 0} Sent</span>
                      </button>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {hasFailed ? (
                        <button
                          onClick={() => openEmailLogsModal(notif, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Click to view failure details & retry"
                        >
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>{stats.failed} Failed</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">0</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {Array.isArray(notif.readBy) ? notif.readBy.length : 0}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">reads</span>
                    </td>

                    <td className="px-4 py-4 text-slate-500 text-[11px]">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailsModal(notif)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Announcement Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEmailLogsModal(notif)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="View Delivery Logs"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {hasFailed && isSuperAdmin && (
                          <button
                            onClick={() => handleRetryFailed(notif._id)}
                            disabled={isRetrying}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isRetrying 
                                ? 'text-amber-500 bg-amber-50 animate-spin' 
                                : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                            title="Retry Failed Emails"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(notif)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Announcement"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this notification?')) {
                                  try {
                                    await deleteNotification(notif._id);
                                    toast.success('Notification deleted successfully');
                                  } catch {
                                    toast.error('Failed to delete notification');
                                  }
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredNotifications.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No notifications found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Use the form above to dispatch your first announcement.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedNotificationForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Notification Details</h3>
              </div>
              <button
                onClick={() => setSelectedNotificationForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNotificationForDetails.title}</h4>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold capitalize">
                  Audience: {selectedNotificationForDetails.targetAudience}
                </span>
                <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                  selectedNotificationForDetails.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  selectedNotificationForDetails.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                  selectedNotificationForDetails.priority === 'low' ? 'bg-slate-100 text-slate-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  Priority: {selectedNotificationForDetails.priority}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">
                  {new Date(selectedNotificationForDetails.createdAt).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message</span>
                <div className="mt-1 p-3.5 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-line leading-relaxed border border-slate-200/60 max-h-60 overflow-y-auto">
                  {selectedNotificationForDetails.message}
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span>In-app views: <strong>{selectedNotificationForDetails.readBy?.length || 0}</strong></span>
                <span>Email sent: <strong>{selectedNotificationForDetails.emailStats?.sent || 0}</strong></span>
                <span>Failed: <strong>{selectedNotificationForDetails.emailStats?.failed || 0}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotificationForDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Delivery Logs & Summary Modal */}
      {selectedNotificationForLogs && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Email Delivery Summary & Logs</h3>
                  <p className="text-xs text-slate-500 truncate max-w-md">
                    {selectedNotificationForLogs.title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotificationForLogs(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KPI Summary Cards */}
            {(() => {
              const stats = emailLogsData.stats || selectedNotificationForLogs.emailStats || { totalRecipients: 0, sent: 0, failed: 0 };
              const successRate = stats.totalRecipients > 0 
                ? Math.round((stats.sent / stats.totalRecipients) * 100) 
                : 0;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipients</div>
                    <div className="text-xl font-bold text-slate-800 mt-0.5">{stats.totalRecipients || 0}</div>
                  </div>

                  <div className="p-3 bg-green-50/70 border border-green-200/70 rounded-xl text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-700">Sent (SMTP)</div>
                    <div className="text-xl font-bold text-green-700 mt-0.5">{stats.sent || 0}</div>
                  </div>

                  <div className="p-3 bg-red-50/70 border border-red-200/70 rounded-xl text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-700">Failed</div>
                    <div className="text-xl font-bold text-red-700 mt-0.5">{stats.failed || 0}</div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Delivery Rate</div>
                    <div className="text-xl font-bold text-blue-700 mt-0.5">{successRate}%</div>
                  </div>
                </div>
              );
            })()}

            {/* Status notice */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 shrink-0 flex items-center justify-between">
              <span>
                <strong>Note:</strong> Status <em>Sent</em> confirms the email was accepted by the SMTP host for transmission.
              </span>
              {isSuperAdmin && (emailLogsData.stats?.failed > 0 || selectedNotificationForLogs.emailStats?.failed > 0) && (
                <button
                  onClick={() => handleRetryFailed(selectedNotificationForLogs._id)}
                  disabled={retryingId === selectedNotificationForLogs._id}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryingId === selectedNotificationForLogs._id ? 'animate-spin' : ''}`} />
                  <span>Retry All Failed ({emailLogsData.stats?.failed || selectedNotificationForLogs.emailStats?.failed})</span>
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex items-center justify-between text-xs shrink-0 pt-1">
              <span className="font-bold text-slate-700">Recipient Dispatch Log</span>
              <button
                type="button"
                onClick={() => setOnlyFailedFilter(!onlyFailedFilter)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  onlyFailedFilter
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {onlyFailedFilter ? 'Showing Failed Only' : 'Show Only Failed'}
              </button>
            </div>

            {/* Logs List Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              {emailLogsData.loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading delivery logs...
                </div>
              ) : emailLogsData.error ? (
                <div className="p-6 text-center text-red-500 text-xs">
                  {emailLogsData.error}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Recipient Email</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5">Error / Details</th>
                      <th className="px-3 py-2.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(emailLogsData.logs || [])
                      .filter(log => !onlyFailedFilter || log.status === 'Failed')
                      .map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {log.recipientEmail}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'Sent'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {log.status === 'Sent' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-[11px] max-w-xs truncate" title={log.error || ''}>
                            {log.error ? (
                              <span className="text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {log.error}
                              </span>
                            ) : (
                              <span className="text-green-600">Delivered to SMTP host</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-400 text-[10px]">
                            {log.sentAt ? new Date(log.sentAt).toLocaleTimeString('en-IN') : '-'}
                          </td>
                        </tr>
                      ))}

                    {emailLogsData.logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">
                          No delivery log entries recorded yet for this notification.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedNotificationForLogs(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
