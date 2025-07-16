import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import { useDispatch } from 'react-redux';
import { loginSuccess } from './store/slices/authSlice';
import { authApi } from './services/api';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DailySalesPage from './pages/DailySalesPage';
import DailySalesViewPage from './pages/DailySalesViewPage';
import DailySalesEditPage from './pages/DailySalesEditPage';
import DailyFuelsPage from './pages/DailyFuelsPage';
import ReportGraphPage from './pages/ReportGraphPage';
import DailySalesGraphPage from './pages/DailySalesGraphPage';
import UserManagementPage from './pages/UserManagementPage';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => (state as any).auth);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token');
    if (token && !user) {
      // Fetch user profile to get current user data
      const fetchUserProfile = async () => {
        try {
          const response = await authApi.profile();
          dispatch(loginSuccess({ user: response.data, token }));
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
        }
      };
      fetchUserProfile();
    }
  }, [user, dispatch]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales" 
            element={isAuthenticated ? <Layout><DailySalesPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales/:id" 
            element={isAuthenticated ? <Layout><DailySalesViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales/:id/edit" 
            element={isAuthenticated ? <Layout><DailySalesEditPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales/new" 
            element={isAuthenticated ? <Layout><DailySalesEditPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-fuels" 
            element={isAuthenticated ? <Layout><DailyFuelsPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/report-graph" 
            element={isAuthenticated ? <Layout><ReportGraphPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales-graph" 
            element={isAuthenticated ? <Layout><DailySalesGraphPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/users" 
            element={isAuthenticated ? <Layout><UserManagementPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
