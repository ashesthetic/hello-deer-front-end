import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReportGraphPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToDailySalesGraph = () => {
    navigate('/daily-sales-graph');
  };

  const handleNavigateToDailyFuelsGraph = () => {
    navigate('/daily-fuels-graph');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Report Graphs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Sales Graph */}
          <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={handleNavigateToDailySalesGraph}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Daily Sales Graph</h2>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              View bar charts for current month sales data including Reported Total, Fuel Sale, Store Sale, Card, and Cash.
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              <span>View Sales Charts</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Daily Fuels Graph */}
          <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={handleNavigateToDailyFuelsGraph}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Daily Fuels Graph</h2>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              View bar charts for current month fuel data including Regular, Plus, Sup Plus, Diesel quantities and amounts.
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>View Fuel Charts</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Additional Report Options */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Weekly Trends</h3>
              <p className="text-sm text-gray-600 mb-3">
                View weekly trend analysis for sales and fuel data.
              </p>
              <div className="text-xs text-gray-500">
                Available on Dashboard
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Monthly Reports</h3>
              <p className="text-sm text-gray-600 mb-3">
                Comprehensive monthly summaries and comparisons.
              </p>
              <div className="text-xs text-gray-500">
                Coming Soon
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Custom Reports</h3>
              <p className="text-sm text-gray-600 mb-3">
                Generate custom reports with date ranges and filters.
              </p>
              <div className="text-xs text-gray-500">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGraphPage; 