import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { authApi } from '../services/api';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      {/* Main Content */}
      <main className="pt-4">
        {children}
      </main>
    </div>
  );
};

export default Layout; 