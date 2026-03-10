import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import GasBuddyPricesCard from '../components/GasBuddyPricesCard';

const GasBuddyPage: React.FC = () => {
  usePageTitle('GasBuddy Prices');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">GasBuddy Prices</h1>
        <p className="text-sm text-gray-500 mt-1">Live fuel prices for Red Deer stations, updated every 30 minutes.</p>
      </div>
      <GasBuddyPricesCard />
    </div>
  );
};

export default GasBuddyPage;
