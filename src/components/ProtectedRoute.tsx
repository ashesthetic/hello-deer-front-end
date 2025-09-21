import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canManageUsers, isStaff } from '../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: 'admin' | 'canManageUsers' | 'notStaff';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  fallbackPath = '/dashboard'
}) => {
  const { user: currentUser, loading } = useSelector((state: RootState) => (state as any).auth);

  // Show loading while fetching user profile
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check specific permissions
  switch (requiredPermission) {
    case 'admin':
      if (currentUser.role !== 'admin') {
        return <Navigate to={fallbackPath} replace />;
      }
      break;
    
    case 'canManageUsers':
      if (!canManageUsers(currentUser)) {
        return <Navigate to={fallbackPath} replace />;
      }
      break;
    
    case 'notStaff':
      if (isStaff(currentUser)) {
        return <Navigate to={fallbackPath} replace />;
      }
      break;
    
    default:
      // No specific permission required, just authenticated
      break;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
