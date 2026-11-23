import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Calendar, Clock, Bell, Activity, Target, Award, PlayCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();
  const queryClient = useQueryClient();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['studentDashboard', user?._id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!user,
    staleTime: 10000,
    refetchInterval: 60000,
  });

  const { data: studentNotifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['studentNotificationsList', user?._id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
    staleTime: 10000,
  });

  useEffect(() => {
    if (!socket) return;
    const handleSync = () => {
      refetch();
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentNotificationsList'] });
    };

    socket.on('batchesUpdated', handleSync);
    socket.on('coursesUpdated', handleSync);
    socket.on('notification_created', handleSync);
    socket.on('notification_updated', handleSync);
    socket.on('notification_deleted', handleSync);
    socket.on('notification_read', handleSync);
    socket.on('reservationsUpdated', handleSync);

    return () => {
      socket.off('batchesUpdated', handleSync);
      socket.off('coursesUpdated', handleSync);
      socket.off('notification_created', handleSync);
      socket.off('notification_updated', handleSync);
      socket.off('notification_deleted', handleSync);
      socket.off('notification_read', handleSync);
      socket.off('reservationsUpdated', handleSync);
    };
  }, [socket, refetch, refetchNotifications, queryClient]);

  if (loading) return <div className="py-8 px-4 text-center text-slate-500 font-medium text-sm">Loading dashboard...</div>;
  if (!data) return <div className="py-8 px-4 text-center text-slate-500 font-medium text-sm">Failed to load dashboard</div>;

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* ========================================================= */}
      {/* 1. WELCOME SECTION                                        */}
      {/* Compact top spacing, immediately visible below navbar      */}
      {/* Heading margin-bottom: 6px, Description margin-bottom: 16px*/}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-md relative overflow-hidden mt-0 sm:mt-1">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-[6px] tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed mb-4">
            Ready to continue your learning journey? Check your enrolled courses and upcoming batches below.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Target className="w-48 h-48 sm:w-60 sm:h-60" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DASHBOARD STATS SECTION                                */}
      {/* Welcome Section ↓ 16px Stats Cards (mt-4 = 16px)          */}
      {/* ========================================================= */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Link 
          to="/my-courses" 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-2.5 sm:mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-0.5 sm:mb-1">{data.enrolledCoursesCount || 0}</p>
          <p className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Enrolled Courses</p>
        </Link>
        
        <Link 
          to="/batches?status=active" 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col hover:border-green-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-2.5 sm:mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-0.5 sm:mb-1">{data.activeBatchesCount || 0}</p>
          <p className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-green-600 transition-colors">Active Batches</p>
        </Link>
        
        <Link 
          to="/batches?status=upcoming" 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col hover:border-orange-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-2.5 sm:mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-0.5 sm:mb-1">{data.upcomingBatchesCount || 0}</p>
          <p className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-orange-600 transition-colors">Upcoming Batches</p>
        </Link>
        
        <Link 
          to="/user/notifications" 
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col hover:border-purple-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-2.5 sm:mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-0.5 sm:mb-1">{data.unreadNotificationsCount || 0}</p>
          <p className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-purple-600 transition-colors">Unread Notifications</p>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN DASHBOARD CONTENT GRID                            */}
      {/* Stats Cards ↓ 20px My Active Batches (mt-5 = 20px)        */}
      {/* ========================================================= */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        <div className="lg:col-span-2 flex flex-col">
          
          {/* 3A. ACTIVE BATCHES SECTION */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">My Active Batches</h2>
              <Link to="/batches?status=active" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</Link>
            </div>
            
            {data.activeBatches?.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                {data.activeBatches.map((batch: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <h3 className="font-bold text-slate-800 line-clamp-1 text-sm sm:text-base" title={batch.name}>{batch.name}</h3>
                        <span className="shrink-0 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                          {batch.statusBadge || batch.status || 'Active'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                        <p className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Course:</span> {batch.courseName || batch.course?.title || 'General English'}</p>
                        <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Trainer:</span> {batch.trainerName || batch.trainer || batch.instructor || 'Expert Faculty'}</p>
                        <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Start Date:</span> {batch.startDate || 'TBA'}</p>
                        <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">End Date:</span> {batch.endDate || 'TBA'}</p>
                        <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Timing:</span> {batch.timing || 'Daily Classes'}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Available Seats: <strong className="text-slate-700">{batch.availableSeats ?? 'Available'}</strong></span>
                      <span className="text-green-600 font-semibold">{batch.isAssigned ? 'Enrolled' : 'Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 sm:p-8 text-center border border-slate-200/90 shadow-xs text-slate-500 text-sm">
                You have no active batches right now.
              </div>
            )}
          </div>
          
          {/* 3B. UPCOMING BATCHES SECTION */}
          {/* Active Batches ↓ 24px Upcoming Batches (mt-6 = 24px) */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Upcoming Batches</h2>
              <Link to="/batches?status=upcoming" className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">View All</Link>
            </div>
            {data.upcomingBatches?.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                {data.upcomingBatches.map((batch: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <h3 className="font-bold text-slate-800 line-clamp-1 text-sm sm:text-base" title={batch.name}>{batch.name}</h3>
                        <span className="shrink-0 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase">
                          {batch.statusBadge || batch.status || 'Upcoming'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                        <p className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Course:</span> {batch.courseName || batch.course?.title || 'General English'}</p>
                        <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Trainer:</span> {batch.trainerName || batch.trainer || batch.instructor || 'Expert Faculty'}</p>
                        <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Start Date:</span> {batch.startDate || 'TBA'}</p>
                        <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">End Date:</span> {batch.endDate || 'TBA'}</p>
                        <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400 shrink-0"/> <span className="font-medium text-slate-700">Timing:</span> {batch.timing || 'Daily Classes'}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Available Seats: <strong className="text-slate-700">{batch.availableSeats ?? 'Available'}</strong></span>
                      <span className="text-orange-600 font-semibold">{batch.isAssigned ? 'Enrolled' : 'Upcoming'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 sm:p-8 text-center border border-slate-200/90 shadow-xs text-slate-500 text-sm">
                You have no upcoming batches right now.
              </div>
            )}
          </div>

        </div>
        
        {/* ========================================================= */}
        {/* 4. NOTIFICATIONS & RECENT ACTIVITY SECTION                */}
        {/* ========================================================= */}
        <div className="mt-6 lg:mt-0 space-y-6">
          
          {/* 4A. NOTIFICATIONS SECTION WITH VIEW ALL */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" /> Notifications
              </h2>
              <Link 
                to="/user/notifications" 
                className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
              >
                View All →
              </Link>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
              {studentNotifications && studentNotifications.length > 0 ? (
                <div className="space-y-3 divide-y divide-slate-100">
                  {studentNotifications.slice(0, 3).map((notif: any) => {
                    const myUserId = user?._id || user?.id || '';
                    const readList = Array.isArray(notif.readBy) ? notif.readBy : [];
                    const isRead = readList.some((r: any) => String(r) === String(myUserId));
                    const isEnrollment = notif.title?.toLowerCase().includes('enrollment') || notif.type === 'enrollment';

                    return (
                      <div key={notif._id} className={`pt-3 first:pt-0 ${!isRead ? 'bg-orange-50/40 -mx-2 px-2 py-2 rounded-xl' : ''}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isEnrollment ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Bell className="w-4 h-4 text-orange-600 shrink-0" />
                            )}
                            <h4 className={`text-xs sm:text-sm font-bold truncate ${isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                              {notif.title}
                            </h4>
                          </div>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-1.5">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs sm:text-sm">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No notifications yet
                </div>
              )}
            </div>
          </div>

          {/* 4B. RECENT ACTIVITY SECTION */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3">Recent Activity</h2>
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              {data.recentActivities?.length > 0 ? (
                data.recentActivities.map((act: any, i: number) => (
                  <div key={i} className="flex gap-3.5 items-start pb-3.5 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium text-xs sm:text-sm leading-snug">{act.description}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{new Date(act.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-4 text-xs sm:text-sm">No recent activity</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
