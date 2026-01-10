import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelPriceApi } from '../services/api';
import { isStaff } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

interface FuelPriceForm {
  regular_87: string;
  midgrade_91: string;
  premium_94: string;
  diesel: string;
}

const FuelPriceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FuelPriceForm>({
    regular_87: '',
    midgrade_91: '',
    premium_94: '',
    diesel: '',
  });

  const isEditing = Boolean(id);
  
  usePageTitle(isEditing ? 'Edit Fuel Price' : 'Add Fuel Price');

  const fetchFuelPrice = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = isStaff(currentUser)
        ? await fuelPriceApi.getForStaff(parseInt(id))
        : await fuelPriceApi.show(parseInt(id));
      
      const fuelPrice = response.data;
      
      setFormData({
        regular_87: fuelPrice.regular_87?.toString() || '',
        midgrade_91: fuelPrice.midgrade_91?.toString() || '',
        premium_94: fuelPrice.premium_94?.toString() || '',
        diesel: fuelPrice.diesel?.toString() || '',
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel price');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    if (isEditing) {
      fetchFuelPrice();
    }
  }, [isEditing, fetchFuelPrice]);

  const handleInputChange = (field: keyof FuelPriceForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form data
    const regular87 = parseFloat(formData.regular_87);
    const midgrade91 = parseFloat(formData.midgrade_91);
    const premium94 = parseFloat(formData.premium_94);
    const diesel = parseFloat(formData.diesel);

    if (isNaN(regular87) || regular87 < 0) {
      setError('Regular (87) price must be a valid positive number');
      return;
    }
    if (isNaN(midgrade91) || midgrade91 < 0) {
      setError('Midgrade (91) price must be a valid positive number');
      return;
    }
    if (isNaN(premium94) || premium94 < 0) {
      setError('Premium (94) price must be a valid positive number');
      return;
    }
    if (isNaN(diesel) || diesel < 0) {
      setError('Diesel price must be a valid positive number');
      return;
    }

    const submitData = {
      regular_87: regular87,
      midgrade_91: midgrade91,
      premium_94: premium94,
      diesel: diesel,
    };

    try {
      setLoading(true);
      
      if (isEditing && id) {
        if (isStaff(currentUser)) {
          await fuelPriceApi.updateForStaff(parseInt(id), submitData);
        } else {
          await fuelPriceApi.update(parseInt(id), submitData);
        }
      } else {
        if (isStaff(currentUser)) {
          await fuelPriceApi.createForStaff(submitData);
        } else {
          await fuelPriceApi.store(submitData);
        }
      }
      
      navigate('/fuel-prices');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} fuel price`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Edit Fuel Price' : 'Add Fuel Price'}
          </h1>
        </div>
        <div className="mt-4 md:mt-0 md:ml-4">
          <button
            onClick={() => navigate('/fuel-prices')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Fuel Prices</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Enter the current prices for all fuel types. All prices should be in dollars per liter.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="regular_87" className="block text-sm font-medium text-gray-700">
                  Regular (87) - $/L
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="999.999"
                    id="regular_87"
                    value={formData.regular_87}
                    onChange={(e) => handleInputChange('regular_87', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 1.459"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="midgrade_91" className="block text-sm font-medium text-gray-700">
                  Midgrade (91) - $/L
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="999.999"
                    id="midgrade_91"
                    value={formData.midgrade_91}
                    onChange={(e) => handleInputChange('midgrade_91', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 1.559"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="premium_94" className="block text-sm font-medium text-gray-700">
                  Premium (94) - $/L
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="999.999"
                    id="premium_94"
                    value={formData.premium_94}
                    onChange={(e) => handleInputChange('premium_94', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 1.659"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="diesel" className="block text-sm font-medium text-gray-700">
                  Diesel - $/L
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="999.999"
                    id="diesel"
                    value={formData.diesel}
                    onChange={(e) => handleInputChange('diesel', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 1.759"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/fuel-prices')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Fuel Price' : 'Create Fuel Price'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FuelPriceEditPage;