import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';

const SettingsPage: React.FC = () => {
  usePageTitle('Settings');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <p className="text-gray-600">Settings page coming soon...</p>
    </div>
  );
};

export default SettingsPage; 