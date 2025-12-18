import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelVolumeApi } from '../services/api';
import { canCreate, canDelete } from '../utils/permissions';
import { FuelVolume } from '../types';
import { formatDateForDisplay } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';

const FuelVolumeViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [fuelVolume, setFuelVolume] = useState<FuelVolume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchFuelVolume = async () => {
      try {
        setLoading(true);
        const response = await fuelVolumeApi.show(parseInt(id!));
        setFuelVolume(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch fuel volume');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFuelVolume();
    }
  }, [id]);

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00';
    }
    return Number(value).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fuelVolume) return;

    try {
      await fuelVolumeApi.delete(fuelVolume.id!);
      setShowDeleteModal(false);
      navigate('/fuel-volumes'); // Redirect to list after deletion
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel volume');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fuelVolume) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Fuel volume not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Volume Details</h1>
          <p className="mt-2 text-sm text-gray-700">
            View fuel volume entry for {formatDate(fuelVolume.date)} - {fuelVolume.shift.charAt(0).toUpperCase() + fuelVolume.shift.slice(1)} Shift
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={() => navigate('/fuel-volumes')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Back to List
          </button>
          {canCreate(currentUser) && (
            <button
              onClick={() => navigate(`/fuel-volumes/${fuelVolume.id}/edit`)}
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(fuelVolume.date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Shift</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  fuelVolume.shift === 'morning' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {fuelVolume.shift.charAt(0).toUpperCase() + fuelVolume.shift.slice(1)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{fuelVolume.user?.name || 'Unknown'}</dd>
            </div>
          </dl>
        </div>

        {/* Volume End of Day */}
        {fuelVolume.volume_end_of_day && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Volume End of Day</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Regular</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatNumber(fuelVolume.volume_end_of_day.regular)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Premium</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatNumber(fuelVolume.volume_end_of_day.premium)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Diesel</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatNumber(fuelVolume.volume_end_of_day.diesel)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Fuel Details */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Fuel Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Regular Fuel */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Regular Fuel</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">TC Volume</dt>
                  <dd className="text-sm text-gray-900">{formatNumber(fuelVolume.regular_tc_volume)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Height</dt>
                  <dd className="text-sm text-gray-900">{formatNumber(fuelVolume.regular_product_height)}</dd>
                </div>
              </dl>
            </div>

            {/* Premium Fuel */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Premium Fuel</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">TC Volume</dt>
                  <dd className="text-sm text-gray-900">{formatNumber(fuelVolume.premium_tc_volume)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Height</dt>
                  <dd className="text-sm text-gray-900">{formatNumber(fuelVolume.premium_product_height)}</dd>
                </div>
              </dl>
            </div>

            {/* Diesel Fuel */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Diesel Fuel</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">TC Volume</dt>
                  <dd className="text-sm text-gray-900">{formatNumber(fuelVolume.diesel_tc_volume)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Height</dt>
                  <dd className="text-sm text-gray-900">{formatNumber(fuelVolume.diesel_product_height)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Added Fuel */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Added Fuel</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Regular</dt>
              <dd className="mt-1 text-lg text-gray-900">{formatNumber(fuelVolume.added_regular)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Premium</dt>
              <dd className="mt-1 text-lg text-gray-900">{formatNumber(fuelVolume.added_premium)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Diesel</dt>
              <dd className="mt-1 text-lg text-gray-900">{formatNumber(fuelVolume.added_diesel)}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Related Shifts */}
      {(fuelVolume.morning_shift || fuelVolume.evening_shift) && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Related Shifts</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {fuelVolume.morning_shift && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Morning Shift</h4>
                  <p className="text-sm text-gray-600">
                    Regular: {formatNumber(fuelVolume.morning_shift.regular_tc_volume)} | 
                    Premium: {formatNumber(fuelVolume.morning_shift.premium_tc_volume)} | 
                    Diesel: {formatNumber(fuelVolume.morning_shift.diesel_tc_volume)}
                  </p>
                </div>
              )}
              {fuelVolume.evening_shift && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Evening Shift</h4>
                  <p className="text-sm text-gray-600">
                    Regular: {formatNumber(fuelVolume.evening_shift.regular_tc_volume)} | 
                    Premium: {formatNumber(fuelVolume.evening_shift.premium_tc_volume)} | 
                    Diesel: {formatNumber(fuelVolume.evening_shift.diesel_tc_volume)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Fuel Volume"
        message={`Are you sure you want to delete the fuel volume entry for ${fuelVolume ? formatDate(fuelVolume.date) : ''} - ${fuelVolume?.shift ? fuelVolume.shift.charAt(0).toUpperCase() + fuelVolume.shift.slice(1) : ''} Shift? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default FuelVolumeViewPage; 