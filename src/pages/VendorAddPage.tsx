import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { vendorsApi } from '../services/api';
import { CreateVendorData } from '../types';
import VendorForm from '../components/VendorForm';
import { canCreate } from '../utils/permissions';

const VendorAddPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateVendorData) => {
    setLoading(true);
    setError(null);
    
    try {
      await vendorsApi.create(data);
      navigate('/accounting/vendors');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounting/vendors');
  };

  // Check if user can create vendors
  if (!canCreate(currentUser)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to create vendors.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Vendors
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Vendor</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      <VendorForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        initialData={null}
      />
    </div>
  );
};

export default VendorAddPage; 