import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && user) {
    const userRole = user.role || 'student';
    // Superadmin has full access to anything accessible to admin
    const hasRole = roles.includes(userRole) || (userRole === 'superadmin' && roles.includes('admin'));

    if (!hasRole) {
      // If they have the wrong role, redirect them to their respective dashboard
      if (userRole === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
      if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (userRole === 'student' || userRole === 'user') return <Navigate to="/student/dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
