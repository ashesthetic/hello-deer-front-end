import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { usePageTitle } from '../hooks/usePageTitle';
import { isStaff } from '../utils/permissions';
import SalesReportCard from './SalesReportCard';
import WeeklyReportCard from './WeeklyReportCard';
import WeeklyTrendCard from './WeeklyTrendCard';
import WeeklyFuelTrendCard from './WeeklyFuelTrendCard';
import MonthlySalesTrendCard from './MonthlySalesTrendCard';
import MonthlyFuelTrendCard from './MonthlyFuelTrendCard';
import FuelTrendCard from './FuelTrendCard';

const Dashboard: React.FC = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);

  const handleNavigateToDailySales = () => {
    navigate('/daily-sales');
  };

  const handleNavigateToDailyFuels = () => {
    navigate('/daily-fuels');
  };

  // If user is staff, show a simple welcome message
  if (isStaff(currentUser)) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-20 h-20 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome, {currentUser?.name}!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              You're logged in as a Staff member. Your profile settings are available in the settings menu.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> As a staff member, you have limited access to the system. 
                If you need additional permissions, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0 space-y-8">
        {/* Dashboard Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          <div className="grid grid-cols-1 gap-6">
            <SalesReportCard 
              title="Total Sales Trend" 
              dataField="reported_total" 
              color="#3B82F6" 
            />
            <SalesReportCard 
              title="Fuel Sales Trend ($$$)" 
              dataField="fuel_sale" 
              color="#10B981" 
            />
            <FuelTrendCard 
              title="Fuel Sales Trend (Litre)" 
              dataField="total_quantity" 
              color="#EF4444" 
            />
            <WeeklyTrendCard 
              title="Weekly Total Sales" 
              dataField="reported_total" 
              color="#8B5CF6" 
            />
            <WeeklyTrendCard 
              title="Weekly Fuel Sales" 
              dataField="fuel_sale" 
              color="#F59E0B" 
            />
          </div>
        </div>

        {/* Fuel Dashboard Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fuel Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <WeeklyTrendCard 
              title="Weekly Sales" 
              dataField="reported_total" 
              color="#3B82F6" 
            />
            <WeeklyTrendCard 
              title="Weekly Fuel Sales" 
              dataField="fuel_sale" 
              color="#10B981" 
            />
            <WeeklyFuelTrendCard 
              title="Weekly Fuel Amounts" 
              dataField="total_amount" 
              color="#8B5CF6" 
            />
            <WeeklyFuelTrendCard 
              title="Weekly Fuel Quantities" 
              dataField="total_quantity" 
              color="#F59E0B" 
            />
          </div>
        </div>

        {/* Monthly Sales Trend Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Sales Trend</h2>
          <div className="grid grid-cols-1 gap-6">
            <MonthlySalesTrendCard 
              title="Current Month Total Sales" 
              dataField="reported_total" 
              color="#3B82F6" 
            />
          </div>
        </div>

        {/* Monthly Fuel Trend Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Fuel Trend</h2>
          <div className="grid grid-cols-1 gap-6">
            <MonthlyFuelTrendCard 
              title="Current Month Fuel Sales" 
              dataField="total_amount" 
              color="#10B981" 
            />
          </div>
        </div>

        {/* Report Summary Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Report Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WeeklyReportCard />
          </div>
        </div>

        {/* Quick Links Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Daily Sales Block */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={handleNavigateToDailySales}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Daily Sales</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Manage daily sales records including fuel sales, store sales, and counter sales.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>View Details</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Daily Fuels Block */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={handleNavigateToDailyFuels}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Daily Fuels</h3>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Track fuel consumption, prices, and inventory management for all fuel types.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <span>View Details</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Report Graph Block */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/report-graph')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Report Graph</h3>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13v4a4 4 0 004 4h6" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V5a4 4 0 00-4-4H7" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Visualize sales and fuel data trends over time with interactive charts.
              </p>
              <div className="flex items-center text-purple-600 font-medium">
                <span>View the Report</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 