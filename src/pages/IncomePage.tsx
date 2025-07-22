import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';

const IncomePage: React.FC = () => {
  usePageTitle('Income');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Income</h1>
      <p className="text-gray-600">Income tracking coming soon...</p>
    </div>
  );
};

export default IncomePage; 