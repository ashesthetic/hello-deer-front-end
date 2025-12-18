import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { vendorsApi } from '../services/api';
import { Vendor, UpdateVendorData } from '../types';
import VendorForm from '../components/VendorForm';

const VendorEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!id) return;
      
      try {
        const response = await vendorsApi.getById(parseInt(id));
        setVendor(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch vendor');
      } finally {
        setFetching(false);
      }
    };

    fetchVendor();
  }, [id]);

  const handleSubmit = async (data: UpdateVendorData) => {
    if (!vendor) return;
    
    console.log('VendorEditPage - handleSubmit called with data:', data);
    
    setLoading(true);
    setError(null);
    
    try {
      await vendorsApi.update(vendor.id!, data);
      navigate('/accounting/vendors');
    } catch (err: any) {
      console.error('VendorEditPage - update error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounting/vendors');
  };

  // Check if user can edit this vendor
  const canEdit = currentUser?.role === 'admin' || 
    (currentUser?.role === 'editor' && vendor?.user_id === currentUser?.id);

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !vendor) {
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!canEdit) {
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to edit this vendor.
        </div>
      </div>
    );
  }

  if (!vendor) {
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Vendor not found.
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
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Vendor</h1>
      
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
        initialData={vendor}
      />
    </div>
  );
};

export default VendorEditPage; 