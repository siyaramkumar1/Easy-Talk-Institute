import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  Settings,
  Bell,
  BookOpen,
  Menu,
  X,
  Home,
  Calendar,
  BookMarked,
  Mail,
  LayoutDashboard,
  GraduationCap,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import NotificationBell from '../notifications/NotificationBell';

export default function Navbar() {
  const { settings } = useSettingsStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real authentication detection using existing Zustand store
  const { token, user, authLoading, logout } = useAuthStore();
  const isAuthenticated = Boolean(token) && Boolean(user);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Primary navigation links matching reference design exactly
  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Courses', path: '/courses', icon: BookOpen },
    { name: 'Batches', path: '/batches', icon: Calendar },
    { name: 'Reading', path: '/reading', icon: BookMarked },
    { name: 'Testimonials', path: '/testimonials', icon: Star },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  // Helper formatters for user role and paths
  const formatRole = (role?: string) => {
    if (!role) return 'Student';
    const r = role.toLowerCase();
    if (r === 'superadmin' || r === 'super_admin') return 'SuperAdmin';
    if (r === 'admin') return 'Admin';
    return 'Student';
  };

  const getDashboardPath = (role?: string) => {
    if (!role) return '/student/dashboard';
    const r = role.toLowerCase();
    if (r === 'superadmin' || r === 'super_admin') return '/superadmin/dashboard';
    if (r === 'admin') return '/admin/dashboard';
    return '/student/dashboard';
  };

  const getCoursesPath = (role?: string) => {
    if (!role) return '/student/courses';
    const r = role.toLowerCase();
    if (r === 'superadmin' || r === 'super_admin') return '/superadmin/courses';
    if (r === 'admin') return '/admin/courses';
    return '/student/courses';
  };

  // Route active helper
  const isLinkActive = (path: string) => {
    const current = location.pathname;
    if (path === '/') return current === '/';
    if (path === '/courses') return current === '/courses' || current.startsWith('/courses/') || current.startsWith('/course/');
    if (path === '/batches') return current === '/batches' || current.startsWith('/batches/');
    if (path === '/reading') return current === '/reading' || current.startsWith('/reading/');
    if (path === '/testimonials') return current === '/testimonials' || current.startsWith('/testimonials/');
    if (path === '/gallery') return current === '/gallery' || current.startsWith('/gallery/');
    if (path === '/contact') return current === '/contact' || current.startsWith('/contact/');
    return current === path;
  };

  // Close profile dropdown and mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Production logout flow
  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true, state: { message: 'Logged Out Successfully' } });
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      {/* ========================================================================= */}
      {/* 1. DESKTOP & LAPTOP NAVBAR (>= lg: 1024px, 1280px, 1366px, 1440px, 1920px) */}
      {/* ========================================================================= */}
      <div className="hidden lg:block w-full h-[88px]">
        <div className="max-w-[1440px] mx-auto px-6 xl:px-10 h-full flex items-center justify-between gap-6">
          
          {/* Left: Institute Logo matching reference banner */}
          <Link
            to="/"
            className="flex items-center shrink-0 transition-opacity hover:opacity-95"
            aria-label="Easy Talk Institute Homepage"
          >
            <Logo 
              variant="navbar"
              imgClassName="max-h-[56px] w-auto object-contain" 
            />
          </Link>

          {/* Center: Navigation Links in one single horizontal row */}
          <nav className="flex items-center justify-center gap-6 xl:gap-8 2xl:gap-9 whitespace-nowrap">
            {navLinks.map((link) => {
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm xl:text-[15.5px] tracking-normal transition-all duration-150 py-1 ${
                    active
                      ? 'text-[#FF6500] font-bold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-[2.5px] after:bg-[#FF6500] after:rounded-full'
                      : 'text-[#082B63] hover:text-[#FF6500] font-semibold'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Auth Action Buttons / User Menu */}
          <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
            {authLoading ? (
              /* Loading State: Skeleton Loader */
              <div className="flex items-center gap-3">
                <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-full" />
                <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-full" />
              </div>
            ) : isAuthenticated ? (
              /* Authenticated User: Dashboard, Notifications, Profile Dropdown */
              <div className="flex items-center gap-3">
                {/* Dashboard Button */}
                <Link
                  to={getDashboardPath(user?.role)}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-[#082B63] bg-[#F3F7FD] hover:bg-blue-100/80 border border-blue-200 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#082B63]" />
                  <span>Dashboard</span>
                </Link>

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Profile Avatar with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#082B63] font-bold border-2 border-white shadow-xs overflow-hidden hover:ring-2 hover:ring-[#082B63] transition-all cursor-pointer"
                    aria-expanded={isProfileOpen}
                    aria-label="User profile options"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        className="w-full h-full object-cover"
                        alt={user.name}
                      />
                    ) : (
                      <span>
                        {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                          <p className="font-bold text-slate-800 text-sm truncate">{user?.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold text-[#082B63] bg-blue-100/80 rounded-md">
                            {formatRole(user?.role)}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#082B63] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <UserIcon className="w-4 h-4 text-slate-400" /> My Profile
                          </Link>
                          <Link
                            to={getDashboardPath(user?.role)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#082B63] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#082B63]" /> Dashboard
                          </Link>
                          <Link
                            to={getCoursesPath(user?.role)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#082B63] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <GraduationCap className="w-4 h-4 text-indigo-600" /> My Courses
                          </Link>
                          <Link
                            to={user?.role === 'student' || user?.role === 'user' ? '/student/notifications' : '/notifications'}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#082B63] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Bell className="w-4 h-4 text-amber-500" /> Notifications
                          </Link>
                          <Link
                            to={user?.role === 'student' || user?.role === 'user' ? '/student/settings' : '/settings'}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#082B63] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-slate-400" /> Settings
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors cursor-pointer text-left font-semibold"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* Guest User: Exact Login and Register Now Buttons matching reference design */
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="group px-5 xl:px-6 py-2 xl:py-2.5 rounded-full text-sm xl:text-[15px] font-semibold text-[#082B63] bg-white border-2 border-[#082B63] hover:bg-[#082B63] hover:text-white transition-all duration-150 flex items-center gap-2 shadow-2xs"
                >
                  <UserIcon className="w-4 h-4 fill-[#082B63] text-[#082B63] group-hover:fill-white group-hover:text-white transition-colors" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="px-5 xl:px-6 py-2 xl:py-2.5 rounded-full text-sm xl:text-[15px] font-semibold text-white bg-[#FF6500] hover:bg-[#e05900] active:bg-[#c44e00] shadow-sm hover:shadow-orange-500/25 transition-all duration-150 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 fill-white text-white" />
                  <span>Register Now</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE & TABLET NAVBAR (< lg: 320px - 1023px)                          */}
      {/* ========================================================================= */}
      <div className="lg:hidden" ref={mobileMenuRef}>
        <div className="px-4 sm:px-6 h-[76px] flex items-center justify-between gap-3 w-full">
          {/* Brand: Logo aligned left */}
          <Link
            to="/"
            className="flex items-center shrink-0"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Easy Talk Institute Homepage"
          >
            <Logo 
              variant="navbar"
              isMobile={true}
              imgClassName="max-h-[46px] w-auto max-w-[190px] object-contain" 
            />
          </Link>

          {/* Right: Actions & Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {authLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-full" />
              </div>
            ) : isAuthenticated ? (
              /* Authenticated User on Mobile */
              <>
                <NotificationBell />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#082B63] font-bold border border-blue-200 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                  aria-label="User Profile Menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                      alt={user.name}
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                    </span>
                  )}
                </button>
              </>
            ) : (
              /* Guest User on Mobile: Compact Login and Register buttons */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#082B63] bg-white border border-[#082B63] hover:bg-[#082B63] hover:text-white transition-colors flex items-center gap-1"
                >
                  <UserIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#FF6500] hover:bg-[#e05900] transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Hamburger Menu Toggle (☰ / ✕) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 rounded-xl text-[#082B63] hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-[#082B63]" />
              )}
            </button>
          </div>
        </div>

        {/* Opened Mobile Menu / Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden border-t border-slate-100 bg-white shadow-xl px-4 py-3 space-y-1"
            >
              {/* Authenticated User Header Card */}
              {isAuthenticated && user && (
                <div className="px-3.5 py-3 mb-2.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#082B63] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden ring-2 ring-white">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        className="w-full h-full object-cover"
                        alt={user.name}
                      />
                    ) : (
                      <span>
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold text-[#082B63] bg-blue-100/90 rounded-md tracking-wide">
                      {formatRole(user.role)}
                    </span>
                  </div>
                </div>
              )}

              {/* All 7 Public Navigation Links */}
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      active
                        ? 'text-[#FF6500] bg-[#FFF0E5] font-bold border-l-3 border-[#FF6500]'
                        : 'text-[#082B63] hover:text-[#FF6500] hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${active ? 'text-[#FF6500]' : 'text-[#082B63]/70'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              {/* Conditional Drawer Bottom Actions */}
              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
                {!isAuthenticated ? (
                  /* Guest: Large Login & Register buttons in drawer */
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#082B63] bg-white border-2 border-[#082B63] hover:bg-[#082B63] hover:text-white transition-colors"
                    >
                      <UserIcon className="w-4 h-4 fill-current" /> Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#e05900] transition-colors shadow-2xs"
                    >
                      <UserIcon className="w-4 h-4 fill-current" /> Register Now
                    </Link>
                  </div>
                ) : (
                  /* Authenticated Menu Items in Drawer */
                  <>
                    <Link
                      to={getDashboardPath(user?.role)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-slate-50 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#0A2540]" /> Dashboard
                    </Link>
                    <Link
                      to={getCoursesPath(user?.role)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-slate-50 transition-all"
                    >
                      <GraduationCap className="w-4 h-4 text-indigo-600" /> My Courses
                    </Link>
                    <Link
                      to={user?.role === 'student' || user?.role === 'user' ? '/student/notifications' : '/notifications'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-slate-50 transition-all"
                    >
                      <Bell className="w-4 h-4 text-amber-500" /> Notifications
                    </Link>
                    <Link
                      to={user?.role === 'student' || user?.role === 'user' ? '/student/settings' : '/settings'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-slate-50 transition-all"
                    >
                      <Settings className="w-4 h-4 text-slate-500" /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 w-full transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600" /> Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
