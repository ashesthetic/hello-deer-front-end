import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelVolumeApi } from '../services/api';
import { getTodayAlberta } from '../utils/dateUtils';

interface FuelVolumeForm {
  date: string;
  shift: 'morning' | 'evening';
  regular_tc_volume: string;
  regular_product_height: string;
  premium_tc_volume: string;
  premium_product_height: string;
  diesel_tc_volume: string;
  diesel_product_height: string;
  added_regular: string;
  added_premium: string;
  added_diesel: string;
}

const FuelVolumeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FuelVolumeForm>({
    date: getTodayAlberta(),
    shift: 'morning',
    regular_tc_volume: '',
    regular_product_height: '',
    premium_tc_volume: '',
    premium_product_height: '',
    diesel_tc_volume: '',
    diesel_product_height: '',
    added_regular: '',
    added_premium: '',
    added_diesel: '',
  });

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && id) {
      fetchFuelVolume();
    }
  }, [id, isEditing]);

  const fetchFuelVolume = async () => {
    try {
      setLoading(true);
      const response = await fuelVolumeApi.show(parseInt(id!));
      const fuelVolume = response.data;
      
      setFormData({
        date: fuelVolume.date,
        shift: fuelVolume.shift,
        regular_tc_volume: fuelVolume.regular_tc_volume?.toString() || '',
        regular_product_height: fuelVolume.regular_product_height?.toString() || '',
        premium_tc_volume: fuelVolume.premium_tc_volume?.toString() || '',
        premium_product_height: fuelVolume.premium_product_height?.toString() || '',
        diesel_tc_volume: fuelVolume.diesel_tc_volume?.toString() || '',
        diesel_product_height: fuelVolume.diesel_product_height?.toString() || '',
        added_regular: fuelVolume.added_regular?.toString() || '',
        added_premium: fuelVolume.added_premium?.toString() || '',
        added_diesel: fuelVolume.added_diesel?.toString() || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel volume');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FuelVolumeForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        regular_tc_volume: parseFloat(formData.regular_tc_volume) || 0,
        regular_product_height: parseFloat(formData.regular_product_height) || 0,
        premium_tc_volume: parseFloat(formData.premium_tc_volume) || 0,
        premium_product_height: parseFloat(formData.premium_product_height) || 0,
        diesel_tc_volume: parseFloat(formData.diesel_tc_volume) || 0,
        diesel_product_height: parseFloat(formData.diesel_product_height) || 0,
        added_regular: parseFloat(formData.added_regular) || 0,
        added_premium: parseFloat(formData.added_premium) || 0,
        added_diesel: parseFloat(formData.added_diesel) || 0,
      };

      if (isEditing) {
        await fuelVolumeApi.update(parseInt(id!), submitData);
      } else {
        await fuelVolumeApi.store(submitData);
      }

      navigate('/fuel-volumes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fuel volume');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Edit Fuel Volume' : 'Add Fuel Volume'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {isEditing ? 'Update fuel volume entry' : 'Create a new fuel volume entry'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => navigate('/fuel-volumes')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
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
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700">
                Shift
              </label>
              <select
                id="shift"
                value={formData.shift}
                onChange={(e) => handleInputChange('shift', e.target.value as 'morning' | 'evening')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>
        </div>

        {/* Regular Fuel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Regular Fuel</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="regular_tc_volume" className="block text-sm font-medium text-gray-700">
                TC Volume
              </label>
              <input
                type="number"
                id="regular_tc_volume"
                step="0.01"
                min="0"
                value={formData.regular_tc_volume}
                onChange={(e) => handleInputChange('regular_tc_volume', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="regular_product_height" className="block text-sm font-medium text-gray-700">
                Product Height
              </label>
              <input
                type="number"
                id="regular_product_height"
                step="0.01"
                min="0"
                value={formData.regular_product_height}
                onChange={(e) => handleInputChange('regular_product_height', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Premium Fuel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Premium Fuel</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="premium_tc_volume" className="block text-sm font-medium text-gray-700">
                TC Volume
              </label>
              <input
                type="number"
                id="premium_tc_volume"
                step="0.01"
                min="0"
                value={formData.premium_tc_volume}
                onChange={(e) => handleInputChange('premium_tc_volume', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="premium_product_height" className="block text-sm font-medium text-gray-700">
                Product Height
              </label>
              <input
                type="number"
                id="premium_product_height"
                step="0.01"
                min="0"
                value={formData.premium_product_height}
                onChange={(e) => handleInputChange('premium_product_height', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Diesel Fuel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Diesel Fuel</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="diesel_tc_volume" className="block text-sm font-medium text-gray-700">
                TC Volume
              </label>
              <input
                type="number"
                id="diesel_tc_volume"
                step="0.01"
                min="0"
                value={formData.diesel_tc_volume}
                onChange={(e) => handleInputChange('diesel_tc_volume', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="diesel_product_height" className="block text-sm font-medium text-gray-700">
                Product Height
              </label>
              <input
                type="number"
                id="diesel_product_height"
                step="0.01"
                min="0"
                value={formData.diesel_product_height}
                onChange={(e) => handleInputChange('diesel_product_height', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Added Fuel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Added Fuel</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="added_regular" className="block text-sm font-medium text-gray-700">
                Regular
              </label>
              <input
                type="number"
                id="added_regular"
                step="0.01"
                min="0"
                value={formData.added_regular}
                onChange={(e) => handleInputChange('added_regular', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="added_premium" className="block text-sm font-medium text-gray-700">
                Premium
              </label>
              <input
                type="number"
                id="added_premium"
                step="0.01"
                min="0"
                value={formData.added_premium}
                onChange={(e) => handleInputChange('added_premium', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="added_diesel" className="block text-sm font-medium text-gray-700">
                Diesel
              </label>
              <input
                type="number"
                id="added_diesel"
                step="0.01"
                min="0"
                value={formData.added_diesel}
                onChange={(e) => handleInputChange('added_diesel', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/fuel-volumes')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              isEditing ? 'Update Fuel Volume' : 'Create Fuel Volume'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FuelVolumeEditPage; 