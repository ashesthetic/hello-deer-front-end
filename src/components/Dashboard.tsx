import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { usePageTitle } from '../hooks/usePageTitle';
import { isStaff } from '../utils/permissions';
import StaffDashboard from './StaffDashboard';

// Conditionally import admin components only if user is not staff
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));

const Dashboard: React.FC = () => {
  usePageTitle('Dashboard');
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);

  // If user is staff, show staff dashboard
  if (isStaff(currentUser)) {
    return <StaffDashboard />;
  }

  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"><div className="px-4 py-6 sm:px-0"><div className="animate-pulse"><div className="h-32 bg-gray-200 rounded mb-4"></div><div className="h-32 bg-gray-200 rounded mb-4"></div><div className="h-32 bg-gray-200 rounded mb-4"></div></div></div></div>}>
      <AdminDashboard />
    </React.Suspense>
  );
};

export default Dashboard; 