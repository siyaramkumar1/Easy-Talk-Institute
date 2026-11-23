import React, { useEffect, useState } from 'react';
import { Bell, ArrowRight, Clock } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Link } from 'react-router-dom';

export const NotificationCenterWidget = () => {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" /> Recent Notifications
        </h3>
        <Link to="/user/notifications" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex-1 p-0 overflow-y-auto min-h-[300px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
            <Bell className="w-12 h-12 text-slate-200 mb-3" />
            <p>No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.slice(0, 5).map(notif => (
              <div 
                key={notif._id} 
                onClick={() => !notif.read && markAsRead(notif._id)}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!notif.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  notif.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                  notif.priority === 'Important' ? 'bg-orange-100 text-orange-600' :
                  notif.priority === 'Announcement' ? 'bg-purple-100 text-purple-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {notif.priority === 'Announcement' ? <Bell className="w-5 h-5"/> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm font-semibold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-2 leading-snug">{notif.message}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
