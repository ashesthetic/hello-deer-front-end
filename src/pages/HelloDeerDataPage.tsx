import React from 'react';
import LiveTankVolumeCard from '../components/LiveTankVolumeCard';

const HelloDeerDataPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello Deer Data</h1>
        </div>
        <LiveTankVolumeCard staffMode={true} />
      </div>
    </div>
  );
};

export default HelloDeerDataPage;
