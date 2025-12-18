import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { dailyFuelsApi } from '../services/api';
import { DailyFuel } from '../types';
import { canUpdateDailyFuel } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

const DailyFuelEditPage: React.FC = () => {
  usePageTitle('Edit Daily Fuel');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<DailyFuel>>({
    date: new Date().toISOString().split('T')[0],
    regular_quantity: undefined,
    regular_total_sale: undefined,
    plus_quantity: undefined,
    plus_total_sale: undefined,
    sup_plus_quantity: undefined,
    sup_plus_total_sale: undefined,
    diesel_quantity: undefined,
    diesel_total_sale: undefined,
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      fetchFuel(parseInt(id));
    }
  }, [isEditing, id]);

  const fetchFuel = async (fuelId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailyFuelsApi.getById(fuelId);
      setFormData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel entry');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DailyFuel, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && id) {
        await dailyFuelsApi.update(parseInt(id), formData);
      } else {
        await dailyFuelsApi.create(formData as Omit<DailyFuel, 'id'>);
      }
      navigate('/daily-fuels');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fuel entry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(quantity);
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Fuel Entry' : 'Add New Fuel Entry'}
          </h1>
          <button
            onClick={() => navigate('/daily-fuels')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={formData.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about this fuel entry..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Regular (87) */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">Regular (87)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.regular_quantity || ''}
                    onChange={(e) => handleInputChange('regular_quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Sale ($)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.regular_total_sale || ''}
                    onChange={(e) => handleInputChange('regular_total_sale', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>

            {/* Plus (91) */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-4">Plus (91)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.plus_quantity || ''}
                    onChange={(e) => handleInputChange('plus_quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Sale ($)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.plus_total_sale || ''}
                    onChange={(e) => handleInputChange('plus_total_sale', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>

            {/* Sup Plus (94) */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-4">Sup Plus (94)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sup_plus_quantity || ''}
                    onChange={(e) => handleInputChange('sup_plus_quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Sale ($)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.sup_plus_total_sale || ''}
                    onChange={(e) => handleInputChange('sup_plus_total_sale', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>

            {/* Diesel */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-4">Diesel</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.diesel_quantity || ''}
                    onChange={(e) => handleInputChange('diesel_quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Sale ($)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.diesel_total_sale || ''}
                    onChange={(e) => handleInputChange('diesel_total_sale', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Quantity</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatQuantity(
                    (formData.regular_quantity || 0) + 
                    (formData.plus_quantity || 0) + 
                    (formData.sup_plus_quantity || 0) + 
                    (formData.diesel_quantity || 0)
                  )}L
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    (formData.regular_total_sale || 0) + 
                    (formData.plus_total_sale || 0) + 
                    (formData.sup_plus_total_sale || 0) + 
                    (formData.diesel_total_sale || 0)
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Average Price</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const totalQty = (formData.regular_quantity || 0) + 
                                   (formData.plus_quantity || 0) + 
                                   (formData.sup_plus_quantity || 0) + 
                                   (formData.diesel_quantity || 0);
                    const totalAmount = (formData.regular_total_sale || 0) + 
                                      (formData.plus_total_sale || 0) + 
                                      (formData.sup_plus_total_sale || 0) + 
                                      (formData.diesel_total_sale || 0);
                    return totalQty > 0 ? formatCurrency(totalAmount / totalQty) : '$0.00';
                  })()}/L
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/daily-fuels')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyFuelEditPage; 