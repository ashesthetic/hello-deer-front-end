import { User } from '../types';

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const isEditor = (user: User | null): boolean => {
  return user?.role === 'editor';
};

export const isViewer = (user: User | null): boolean => {
  return user?.role === 'viewer';
};

export const isStaff = (user: User | null): boolean => {
  return user?.role === 'staff';
};

export const canCreate = (user: User | null): boolean => {
  return isAdmin(user) || isEditor(user);
};

export const canUpdate = (user: User | null): boolean => {
  return isAdmin(user) || isEditor(user);
};

export const canDelete = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canManageUsers = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canUpdateDailySale = (user: User | null, dailySale: any): boolean => {
  if (isAdmin(user)) {
    return true;
  }
  
  if (isEditor(user)) {
    return dailySale.user_id === user?.id;
  }
  
  return false;
};

export const canUpdateDailyFuel = (user: User | null, dailyFuel: any): boolean => {
  if (isAdmin(user)) {
    return true;
  }
  
  if (isEditor(user)) {
    return dailyFuel.user_id === user?.id;
  }
  
  return false;
};

export const canDeleteDailyFuel = (user: User | null, dailyFuel: any): boolean => {
  if (isAdmin(user)) {
    return true;
  }
  
  return false; // Only admins can delete
};

export const canViewDailySale = (user: User | null, dailySale: any): boolean => {
  if (isAdmin(user)) {
    return true;
  }
  
  if (isEditor(user)) {
    return dailySale.user_id === user?.id;
  }
  
  return true; // Viewers can view all
};

export const canViewDailyFuel = (user: User | null, dailyFuel: any): boolean => {
  if (isAdmin(user)) {
    return true;
  }
  
  if (isEditor(user)) {
    return dailyFuel.user_id === user?.id;
  }
  
  return true; // Viewers can view all
};

export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
    case 'staff':
      return 'Staff';
    default:
      return role;
  }
};

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'editor':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    case 'staff':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}; 