import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import DailySalesPage from './pages/DailySalesPage';
import DailySalesViewPage from './pages/DailySalesViewPage';
import DailySalesEditPage from './pages/DailySalesEditPage';
import DailyFuelsPage from './pages/DailyFuelsPage';
import ReportGraphPage from './pages/ReportGraphPage';
import DailySalesGraphPage from './pages/DailySalesGraphPage';

const App: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token');
    if (token && !user) {
      // You could dispatch an action to fetch user profile here
      // For now, we'll just check if the token exists
    }
  }, [user]);

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
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales" 
            element={isAuthenticated ? <DailySalesPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales/:id" 
            element={isAuthenticated ? <DailySalesViewPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales/:id/edit" 
            element={isAuthenticated ? <DailySalesEditPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales/new" 
            element={isAuthenticated ? <DailySalesEditPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-fuels" 
            element={isAuthenticated ? <DailyFuelsPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/report-graph" 
            element={isAuthenticated ? <ReportGraphPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-sales-graph" 
            element={isAuthenticated ? <DailySalesGraphPage /> : <Navigate to="/login" />} 
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
