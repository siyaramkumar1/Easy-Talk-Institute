import React from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const myRole = user?.role === 'admin' || user?.role === 'superadmin' ? 'admins' : (user?.role || 'student') + 's';
  const myUserId = String(user?._id || user?.id || '');

  const myNotifications = (notifications || [])
    .filter((n): n is any => Boolean(n && typeof n === 'object'))
    .filter(n => {
      const audience = (n.targetAudience || 'all').toLowerCase();
      const targetUserId = String(n.recipientUserId || n.recipientId || '');
      const isRecipient = Boolean(targetUserId && myUserId && targetUserId === myUserId);
      if (audience === 'individual') return isRecipient;
      return audience === 'all' || audience === myRole.toLowerCase() || (myRole === 'students' && audience === 'students') || isRecipient;
    });
  
  const recentNotifications = myNotifications.slice(0, 5);

  const checkIsRead = (notif: any) => {
    const ownerId = String(notif?.recipientUserId || notif?.recipientId || '');
    if (notif?.targetAudience === 'individual' && ownerId && ownerId === myUserId && notif?.isRead) {
      return true;
    }
    const readList = Array.isArray(notif?.readBy) ? notif.readBy : [];
    return readList.some((r: any) =>
      typeof r === 'string' ? r === myUserId : String(r?._id || '') === myUserId
    );
  };

  const getSenderRoleLabel = (notif: any) => {
    return (
      notif?.metadata?.senderRoleLabel ||
      notif?.senderRole ||
      (notif?.metadata?.repliedByRole === 'superadmin' ? 'SuperAdmin' : 'Admin')
    );
  };

  return (
    <div className="flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Notifications</h3>
        <Link 
          to="/user/notifications" 
          onClick={onClose}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          View All
        </Link>
      </div>

      <div className="overflow-y-auto">
        {recentNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentNotifications.map(notif => {
              const isRead = checkIsRead(notif);
              const targetInquiryId = notif?.inquiryId || notif?.metadata?.inquiryId;
              const isContactReply =
                notif?.type === 'contact_reply' ||
                notif?.notificationType === 'contact_reply' ||
                Boolean(targetInquiryId);
              const senderLabel = isContactReply ? getSenderRoleLabel(notif) : null;

              return (
                <div 
                  key={notif._id || Math.random().toString()}
                  onClick={() => {
                    if (isContactReply && targetInquiryId) {
                      onClose();
                      navigate(`/user/notifications?inquiryId=${encodeURIComponent(String(targetInquiryId))}&notifId=${encodeURIComponent(String(notif._id || ''))}`);
                      return;
                    }
                    if (!isRead && notif._id) markAsRead(notif._id);
                  }}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!isRead ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="space-y-1">
                      {senderLabel && (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          senderLabel === 'SuperAdmin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          Message from {senderLabel}
                        </span>
                      )}
                      <h4 className={`text-sm font-medium ${isRead ? 'text-slate-800' : 'text-indigo-900'}`}>
                        {notif.title || 'Notification'}
                      </h4>
                    </div>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></span>}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {isContactReply && notif?.metadata?.adminReply
                      ? `Reply from ${senderLabel}: ${notif.metadata.adminReply}`
                      : notif.message}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            No notifications yet
          </div>
        )}
      </div>
      
      {myNotifications.length > 5 && (
        <Link 
          to="/user/notifications" 
          onClick={onClose}
          className="p-3 text-center text-sm font-medium text-slate-600 border-t border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
        >
          See {myNotifications.length - 5} more <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
