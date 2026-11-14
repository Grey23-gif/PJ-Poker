import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { currentUser, isAuthenticated, hasPermission } = useAuthStore();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If player tries to access admin pages, redirect to player portal
    if (currentUser.role === 'PLAYER') {
      return <Navigate to="/player/portal" replace />;
    }
    // If cashier tries to access pure admin pages
    return <Navigate to="/pos" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto my-12">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="text-lg font-bold text-slate-100">Không Có Quyền Truy Cập</h3>
        <p className="text-xs text-slate-400 mt-2">
          Tài khoản của bạn ({currentUser.role}) không có quyền thực hiện chức năng này ({requiredPermission}).
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

