import React from 'react';
import { useNavigate } from 'react-router-dom';
import SalesReportCard from './SalesReportCard';
import WeeklyReportCard from './WeeklyReportCard';
import WeeklyTrendCard from './WeeklyTrendCard';
import WeeklyFuelTrendCard from './WeeklyFuelTrendCard';
import MonthlySalesTrendCard from './MonthlySalesTrendCard';
import MonthlyFuelTrendCard from './MonthlyFuelTrendCard';
import FuelTrendCard from './FuelTrendCard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToDailySales = () => {
    navigate('/daily-sales');
  };

  const handleNavigateToDailyFuels = () => {
    navigate('/daily-fuels');
  };

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