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
import DailyFuelViewPage from './pages/DailyFuelViewPage';
import DailyFuelEditPage from './pages/DailyFuelEditPage';
import SalesReportPage from './pages/SalesReportPage';
import FuelsReportPage from './pages/FuelsReportPage';
import VendorsPage from './pages/VendorsPage';
import VendorAddPage from './pages/VendorAddPage';
import VendorEditPage from './pages/VendorEditPage';
import VendorViewPage from './pages/VendorViewPage';
import IncomePage from './pages/IncomePage';
import ExpensePage from './pages/ExpensePage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import EmployeesPage from './pages/EmployeesPage';
import AddEmployeePage from './pages/AddEmployeePage';
import AddHoursPage from './pages/AddHoursPage';
import EmployeeViewPage from './pages/EmployeeViewPage';
import EmployeeEditPage from './pages/EmployeeEditPage';
import EmployeeEarningsPage from './pages/EmployeeEarningsPage';
import WorkHourReportPage from './pages/WorkHourReportPage';
import PayStubsPage from './pages/PayStubsPage';
import WorkHoursListPage from './pages/WorkHoursListPage';
import WorkHoursEditPage from './pages/WorkHoursEditPage';
import WorkHoursViewPage from './pages/WorkHoursViewPage';
import VendorInvoicesPage from './pages/VendorInvoicesPage';
import VendorInvoiceAddPage from './pages/VendorInvoiceAddPage';
import VendorInvoiceEditPage from './pages/VendorInvoiceEditPage';
import VendorInvoiceViewPage from './pages/VendorInvoiceViewPage';

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
          
          {/* Sales Routes */}
          <Route 
            path="/sales" 
            element={isAuthenticated ? <Layout><DailySalesPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/sales/:id" 
            element={isAuthenticated ? <Layout><DailySalesViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/sales/:id/edit" 
            element={isAuthenticated ? <Layout><DailySalesEditPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/sales/new" 
            element={isAuthenticated ? <Layout><DailySalesEditPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Fuels Routes */}
          <Route 
            path="/fuels" 
            element={isAuthenticated ? <Layout><DailyFuelsPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuels/:id" 
            element={isAuthenticated ? <Layout><DailyFuelViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuels/:id/edit" 
            element={isAuthenticated ? <Layout><DailyFuelEditPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuels/new" 
            element={isAuthenticated ? <Layout><DailyFuelEditPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Employees Routes */}
          <Route 
            path="/employees" 
            element={isAuthenticated ? <Layout><EmployeesPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/add" 
            element={isAuthenticated ? <Layout><AddEmployeePage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/hours" 
            element={isAuthenticated ? <Layout><AddHoursPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/earnings" 
            element={isAuthenticated ? <Layout><EmployeeEarningsPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/work-hour-report" 
            element={isAuthenticated ? <Layout><WorkHourReportPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/pay-stubs" 
            element={isAuthenticated ? <Layout><PayStubsPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/:id" 
            element={isAuthenticated ? <Layout><EmployeeViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/:id/edit" 
            element={isAuthenticated ? <Layout><EmployeeEditPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Work Hours Routes */}
          <Route 
            path="/work-hours" 
            element={isAuthenticated ? <Layout><WorkHoursListPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/create" 
            element={isAuthenticated ? <Layout><WorkHoursEditPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/:id" 
            element={isAuthenticated ? <Layout><WorkHoursViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/:id/edit" 
            element={isAuthenticated ? <Layout><WorkHoursEditPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Reports Routes */}
          <Route 
            path="/reports/sales" 
            element={isAuthenticated ? <Layout><SalesReportPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/reports/fuels" 
            element={isAuthenticated ? <Layout><FuelsReportPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Accounting Routes */}
          <Route 
            path="/accounting/vendors" 
            element={isAuthenticated ? <Layout><VendorsPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendors/add" 
            element={isAuthenticated ? <Layout><VendorAddPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendors/:id" 
            element={isAuthenticated ? <Layout><VendorViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendors/:id/edit" 
            element={isAuthenticated ? <Layout><VendorEditPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/income" 
            element={isAuthenticated ? <Layout><IncomePage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/expense" 
            element={isAuthenticated ? <Layout><ExpensePage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices" 
            element={isAuthenticated ? <Layout><VendorInvoicesPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices/add" 
            element={isAuthenticated ? <Layout><VendorInvoiceAddPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices/:id" 
            element={isAuthenticated ? <Layout><VendorInvoiceViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices/:id/edit" 
            element={isAuthenticated ? <Layout><VendorInvoiceEditPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Users Route */}
          <Route 
            path="/users" 
            element={isAuthenticated ? <Layout><UserManagementPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Settings Route */}
          <Route 
            path="/settings" 
            element={isAuthenticated ? <Layout><SettingsPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Legacy Routes - Redirect to new structure */}
          <Route 
            path="/daily-sales" 
            element={<Navigate to="/sales" />} 
          />
          <Route 
            path="/daily-sales/:id" 
            element={<Navigate to="/sales/:id" />} 
          />
          <Route 
            path="/daily-sales/:id/edit" 
            element={<Navigate to="/sales/:id/edit" />} 
          />
          <Route 
            path="/daily-sales/new" 
            element={<Navigate to="/sales/new" />} 
          />
          <Route 
            path="/daily-fuels" 
            element={<Navigate to="/fuels" />} 
          />
          <Route 
            path="/daily-fuels/:id" 
            element={<Navigate to="/fuels/:id" />} 
          />
          <Route 
            path="/daily-fuels/:id/edit" 
            element={<Navigate to="/fuels/:id/edit" />} 
          />
          <Route 
            path="/daily-fuels/new" 
            element={<Navigate to="/fuels/new" />} 
          />
          <Route 
            path="/report-graph" 
            element={<Navigate to="/reports/sales" />} 
          />
          <Route 
            path="/daily-sales-graph" 
            element={<Navigate to="/reports/sales" />} 
          />
          <Route 
            path="/daily-fuels-graph" 
            element={<Navigate to="/reports/fuels" />} 
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

