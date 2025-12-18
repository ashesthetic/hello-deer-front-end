import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from './store/slices/authSlice';
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
import FuelVolumesPage from './pages/FuelVolumesPage';
import ImportDataPage from './pages/ImportDataPage';
import FileImportsListPage from './pages/FileImportsListPage';
import FileImportsByDatePage from './pages/FileImportsByDatePage';
import FuelVolumeViewPage from './pages/FuelVolumeViewPage';
import FuelVolumeEditPage from './pages/FuelVolumeEditPage';
import DailyAtmPage from './pages/DailyAtmPage';
import DailyAtmAddPage from './pages/DailyAtmAddPage';
import DailyAtmViewPage from './pages/DailyAtmViewPage';
import DailyAtmEditPage from './pages/DailyAtmEditPage';
import ResolveAtmPage from './pages/ResolveAtmPage';
import SalesReportPage from './pages/SalesReportPage';
import FuelsReportPage from './pages/FuelsReportPage';
import VendorsPage from './pages/VendorsPage';
import VendorAddPage from './pages/VendorAddPage';
import VendorEditPage from './pages/VendorEditPage';
import VendorViewPage from './pages/VendorViewPage';
import BankAccountsPage from './pages/BankAccountsPage';
import BankAccountAddPage from './pages/BankAccountAddPage';
import BankAccountEditPage from './pages/BankAccountEditPage';
import BankAccountViewPage from './pages/BankAccountViewPage';
import ResolvePendingPage from './pages/ResolvePendingPage';
import IncomePage from './pages/IncomePage';
import ExpensePage from './pages/ExpensePage';
import BalancePage from './pages/BalancePage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import EmployeesPage from './pages/EmployeesPage';
import AddEmployeePage from './pages/AddEmployeePage';
import AddHoursPage from './pages/AddHoursPage';
import WorkHoursFromSchedulePage from './pages/WorkHoursFromSchedulePage';
import EmployeeViewPage from './pages/EmployeeViewPage';
import EmployeeEditPage from './pages/EmployeeEditPage';
import EmployeeEarningsPage from './pages/EmployeeEarningsPage';
import WorkHourReportPage from './pages/WorkHourReportPage';
import PayStubsPage from './pages/PayStubsPage';
import PayrollPage from './pages/PayrollPage';
import PayrollReportsPage from './pages/PayrollReportsPage';
import PayrollUploadPage from './pages/PayrollUploadPage';
import PayrollProcessPage from './pages/PayrollProcessPage';
import ResolveHoursPage from './pages/ResolveHoursPage';
import WorkHoursListPage from './pages/WorkHoursListPage';
import ExpenseReportPage from './pages/ExpenseReportPage';
import IncomeReportPage from './pages/IncomeReportPage';
import WorkHoursEditPage from './pages/WorkHoursEditPage';
import WorkHoursViewPage from './pages/WorkHoursViewPage';
import WorkSchedulesPage from './pages/WorkSchedulesPage';
import ScheduleCreatePage from './pages/ScheduleCreatePage';
import ScheduleEditPage from './pages/ScheduleEditPage';
import ScheduleViewPage from './pages/ScheduleViewPage';
import VendorInvoicesPage from './pages/VendorInvoicesPage';
import VendorInvoiceAddPage from './pages/VendorInvoiceAddPage';
import VendorInvoiceEditPage from './pages/VendorInvoiceEditPage';
import VendorInvoiceViewPage from './pages/VendorInvoiceViewPage';
import SettlementReportPage from './pages/SettlementReportPage';
import ProvidersPage from './pages/ProvidersPage';
import ProviderAddPage from './pages/ProviderAddPage';
import ProviderEditPage from './pages/ProviderEditPage';
import ProviderViewPage from './pages/ProviderViewPage';
import ProviderBillsPage from './pages/ProviderBillsPage';
import ProviderBillAddPage from './pages/ProviderBillAddPage';
import ProviderBillEditPage from './pages/ProviderBillEditPage';
import ProviderBillViewPage from './pages/ProviderBillViewPage';
import OwnersPage from './pages/OwnersPage';
import OwnerAddPage from './pages/OwnerAddPage';
import OwnerEditPage from './pages/OwnerEditPage';
import OwnerViewPage from './pages/OwnerViewPage';
import OwnerEquitiesPage from './pages/OwnerEquitiesPage';
import OwnerEquityAddPage from './pages/OwnerEquityAddPage';
import OwnerEquityEditPage from './pages/OwnerEquityEditPage';
import OwnerEquityViewPage from './pages/OwnerEquityViewPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import LoansPage from './components/LoansPage';
import AddLoanPage from './components/AddLoanPage';
import LoanDetailsPage from './components/LoanDetailsPage';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => (state as any).auth);

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
          localStorage.removeItem('token');
          dispatch(logout());
        }
      };
      fetchUserProfile();
    }
  }, [user, dispatch]);

  // Show loading spinner while fetching user profile
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailySalesPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/sales/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailySalesViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/sales/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailySalesEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/sales/new" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailySalesEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Fuels Routes */}
          <Route 
            path="/fuels" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailyFuelsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuels/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailyFuelViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuels/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailyFuelEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuels/new" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><DailyFuelEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Fuel Volume Routes */}
          <Route 
            path="/fuel-volumes" 
            element={isAuthenticated ? <Layout><FuelVolumesPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuel-volumes/:id" 
            element={isAuthenticated ? <Layout><FuelVolumeViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuel-volumes/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><FuelVolumeEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/fuel-volumes/new" 
            element={isAuthenticated ? <Layout><FuelVolumeEditPage /></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Daily ATM Routes */}
          <Route 
            path="/daily-atm" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><DailyAtmPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-atm/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><DailyAtmAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-atm/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><DailyAtmViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/daily-atm/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><DailyAtmEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Import Data Route */}
          <Route 
            path="/import-data" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><ImportDataPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* File Imports List Route */}
          <Route 
            path="/file-imports" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><FileImportsListPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* File Imports by Date Route */}
          <Route 
            path="/file-imports/:date" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><FileImportsByDatePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Employees Routes */}
          <Route 
            path="/employees" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><EmployeesPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><AddEmployeePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/hours" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><AddHoursPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/earnings" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><EmployeeEarningsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/work-hour-report" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkHourReportPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/payroll" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><PayrollPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/payroll/reports" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><PayrollReportsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/payroll/reports/upload" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><PayrollUploadPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/payroll/reports/:id/process" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><PayrollProcessPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/pay-stubs" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><PayStubsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/resolve-hours" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ResolveHoursPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><EmployeeViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/employees/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><EmployeeEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Work Hours Routes */}
          <Route 
            path="/work-hours" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkHoursListPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/create" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkHoursEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/create-from-schedule" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkHoursFromSchedulePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkHoursViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-hours/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkHoursEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Work Schedule Routes */}
          <Route 
            path="/work-schedules" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><WorkSchedulesPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-schedules/create" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ScheduleCreatePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-schedules/edit/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ScheduleEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/work-schedules/view/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ScheduleViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Reports Routes */}
          <Route 
            path="/reports/sales" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><SalesReportPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/reports/fuels" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><FuelsReportPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/reports/settlement" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><SettlementReportPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/reports/expense" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ExpenseReportPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/reports/income" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><IncomeReportPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Accounting Routes */}
          <Route 
            path="/accounting/vendors" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendors/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendors/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendors/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/bank-accounts" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><BankAccountsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/bank-accounts/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><BankAccountAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/bank-accounts/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><BankAccountViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/bank-accounts/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><BankAccountEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Loan Accounts Routes (Admin only) */}
          <Route 
            path="/accounting/loan-accounts" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><LoansPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/loan-accounts/new" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><AddLoanPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/loan-accounts/:id/view" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><LoanDetailsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/loan-accounts/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><LoanDetailsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Transactions Routes */}
          <Route 
            path="/accounting/transactions" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><TransactionsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Resolve Pending Route (Admin only) */}
          <Route 
            path="/resolve-pending" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><ResolvePendingPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Resolve ATM Route (Admin only) */}
          <Route 
            path="/resolve-atm" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="admin"><ResolveAtmPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/accounting/income" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><IncomePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/expense" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ExpensePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/balance" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><BalancePage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorInvoicesPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorInvoiceAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Staff-specific invoice routes */}
          <Route 
            path="/vendor-invoices" 
            element={isAuthenticated ? <Layout><VendorInvoicesPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/vendor-invoices/add" 
            element={isAuthenticated ? <Layout><VendorInvoiceAddPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/vendor-invoices/:id" 
            element={isAuthenticated ? <Layout><VendorInvoiceViewPage /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorInvoiceViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/vendor-invoices/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><VendorInvoiceEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Provider Routes */}
          <Route 
            path="/accounting/providers" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProvidersPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/providers/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/providers/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/providers/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Provider Bill Routes */}
          <Route 
            path="/accounting/provider-bills" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderBillsPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/provider-bills/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderBillAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/provider-bills/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderBillViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/provider-bills/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><ProviderBillEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Owner Routes */}
          <Route 
            path="/accounting/owners" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnersPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/owners/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/owners/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/owners/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Owner Equity Routes */}
          <Route 
            path="/accounting/owner-equities" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerEquitiesPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/owner-equities/add" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerEquityAddPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/owner-equities/:id" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerEquityViewPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/accounting/owner-equities/:id/edit" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="notStaff"><OwnerEquityEditPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Users Route */}
          <Route 
            path="/users" 
            element={isAuthenticated ? <Layout><ProtectedRoute requiredPermission="canManageUsers"><UserManagementPage /></ProtectedRoute></Layout> : <Navigate to="/login" />} 
          />
          
          {/* Profile Route */}
          <Route 
            path="/profile" 
            element={isAuthenticated ? <Layout><ProfilePage /></Layout> : <Navigate to="/login" />} 
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

