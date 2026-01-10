import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelPriceApi } from '../services/api';
import { canDelete, isStaff } from '../utils/permissions';
import { FuelPrice } from '../types';
import { formatDateForDisplay } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import { usePageTitle } from '../hooks/usePageTitle';

const FuelPriceViewPage: React.FC = () => {
  usePageTitle('Fuel Price Details');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [fuelPrice, setFuelPrice] = useState<FuelPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchFuelPrice = async () => {
      // Don't fetch if user is not loaded yet
      if (!currentUser) {
        return;
      }

      try {
        setLoading(true);
        const response = isStaff(currentUser)
          ? await fuelPriceApi.getForStaff(parseInt(id!))
          : await fuelPriceApi.show(parseInt(id!));
        setFuelPrice(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch fuel price');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFuelPrice();
    }
  }, [id, currentUser]);

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.000';
    }
    return Number(value).toFixed(3);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fuelPrice?.id) return;
    
    try {
      await fuelPriceApi.delete(fuelPrice.id);
      navigate('/fuel-prices');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel price');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !fuelPrice) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading fuel price</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Price Details</h1>
          <p className="mt-2 text-sm text-gray-500">
            Created on {formatDate(fuelPrice.created_at || '')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={() => navigate('/fuel-prices')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Back to List
          </button>
          {(!isStaff(currentUser) || (isStaff(currentUser) && fuelPrice.user_id === currentUser?.id)) && (
            <button
              onClick={() => navigate(`/fuel-prices/${fuelPrice.id}/edit`)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Edit
            </button>
          )}
          {canDelete(currentUser) && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(fuelPrice.created_at || '')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{fuelPrice.user?.name || 'Unknown'}</dd>
            </div>
            {fuelPrice.updated_at && fuelPrice.updated_at !== fuelPrice.created_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(fuelPrice.updated_at)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Fuel Prices */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Fuel Prices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Regular (87) */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-700 font-medium text-sm uppercase tracking-wide mb-2">
                Regular (87)
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">
                ${formatPrice(fuelPrice.regular_87)}
              </div>
              <div className="text-green-600 text-sm">
                per liter
              </div>
            </div>

            {/* Midgrade (91) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-700 font-medium text-sm uppercase tracking-wide mb-2">
                Midgrade (91)
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">
                ${formatPrice(fuelPrice.midgrade_91)}
              </div>
              <div className="text-blue-600 text-sm">
                per liter
              </div>
            </div>

            {/* Premium (94) */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-purple-700 font-medium text-sm uppercase tracking-wide mb-2">
                Premium (94)
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                ${formatPrice(fuelPrice.premium_94)}
              </div>
              <div className="text-purple-600 text-sm">
                per liter
              </div>
            </div>

            {/* Diesel */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="text-orange-700 font-medium text-sm uppercase tracking-wide mb-2">
                Diesel
              </div>
              <div className="text-3xl font-bold text-orange-900 mb-1">
                ${formatPrice(fuelPrice.diesel)}
              </div>
              <div className="text-orange-600 text-sm">
                per liter
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Fuel Price"
        message="Are you sure you want to delete this fuel price entry? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
};

export default FuelPriceViewPage;