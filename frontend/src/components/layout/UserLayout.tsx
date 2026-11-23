import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, BookOpen, Settings, Bell, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const UserLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  
  const menuItems = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'Notifications', path: '/user/notifications', icon: Bell },
    { name: 'Settings', path: '/student/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 shrink-0 h-auto md:min-h-[calc(100vh-4rem)] p-2 sm:p-4">
        <div className="hidden md:block mb-6 px-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Navigation</p>
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar py-0.5 md:py-0">
          {menuItems.map((item) => {
            const isNotificationsActive = item.name === 'Notifications' && location.pathname.includes('notifications');
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all font-medium text-xs sm:text-sm whitespace-nowrap shrink-0 ${
                    isActive || isNotificationsActive
                      ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs border border-orange-200/60' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600'
                  }`
                }
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-4 sm:pb-8 max-w-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
