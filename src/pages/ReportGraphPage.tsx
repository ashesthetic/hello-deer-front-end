import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReportGraphPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToDailySalesGraph = () => {
    navigate('/daily-sales-graph');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Report Graph</h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={handleNavigateToDailySalesGraph}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Daily Sales Graph</h2>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h14" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13v4a4 4 0 004 4h6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V5a4 4 0 00-4-4H7" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            View bar charts for current month sales data including Reported Total, Fuel Sale, Store Sale, Card, and Cash.
          </p>
          <div className="flex items-center text-blue-600 font-medium">
            <span>View Charts</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGraphPage; 