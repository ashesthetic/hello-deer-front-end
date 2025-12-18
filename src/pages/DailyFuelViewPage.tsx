import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canUpdateDailyFuel, canDeleteDailyFuel } from '../utils/permissions';
import { dailyFuelsApi } from '../services/api';
import { DailyFuel } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

const DailyFuelViewPage: React.FC = () => {
  usePageTitle('Daily Fuel Details');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [fuel, setFuel] = useState<DailyFuel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFuel(parseInt(id));
    }
  }, [id]);

  const fetchFuel = async (fuelId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailyFuelsApi.getById(fuelId);
      setFuel(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (fuel?.id) {
      navigate(`/daily-fuels/${fuel.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!fuel?.id || !window.confirm('Are you sure you want to delete this fuel entry?')) {
      return;
    }

    setLoading(true);
    try {
      await dailyFuelsApi.delete(fuel.id);
      navigate('/daily-fuels');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel entry');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!fuel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Fuel entry not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Fuel Entry Details</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/daily-fuels')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Back to List
            </button>
            {canUpdateDailyFuel(currentUser, fuel) && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Edit
              </button>
            )}
            {canDeleteDailyFuel(currentUser, fuel) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="text-sm text-gray-900">{formatDate(fuel.date)}</dd>
                </div>
                {fuel.user && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created By</dt>
                    <dd className="text-sm text-gray-900">{fuel.user.name}</dd>
                  </div>
                )}
                {fuel.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="text-sm text-gray-900">{fuel.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Quantity</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatQuantity(fuel.total_quantity || 0)}L</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(fuel.total_amount || 0)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Average Price</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(fuel.average_price || 0)}/L</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fuel Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Regular (87) */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Regular (87)</h3>
                <dl className="space-y-1">
                  <div>
                    <dt className="text-xs text-blue-700">Quantity</dt>
                    <dd className="text-sm font-semibold text-blue-900">{formatQuantity(fuel.regular_quantity || 0)}L</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-blue-700">Total Sale</dt>
                    <dd className="text-sm font-semibold text-blue-900">{formatCurrency(fuel.regular_total_sale || 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-blue-700">Price per Liter</dt>
                    <dd className="text-sm font-semibold text-blue-900">
                      {(() => {
                        const qty = fuel.regular_quantity || 0;
                        const totalSale = fuel.regular_total_sale || 0;
                        return qty > 0 ? formatCurrency(totalSale / qty) : '$0.000';
                      })()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-blue-700">Total</dt>
                    <dd className="text-sm font-semibold text-blue-900">{formatCurrency(fuel.regular_total_sale || 0)}</dd>
                  </div>
                </dl>
              </div>

              {/* Plus (91) */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Plus (91)</h3>
                <dl className="space-y-1">
                  <div>
                    <dt className="text-xs text-green-700">Quantity</dt>
                    <dd className="text-sm font-semibold text-green-900">{formatQuantity(fuel.plus_quantity || 0)}L</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-green-700">Total Sale</dt>
                    <dd className="text-sm font-semibold text-green-900">{formatCurrency(fuel.plus_total_sale || 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-green-700">Price per Liter</dt>
                    <dd className="text-sm font-semibold text-green-900">
                      {(() => {
                        const qty = fuel.plus_quantity || 0;
                        const totalSale = fuel.plus_total_sale || 0;
                        return qty > 0 ? formatCurrency(totalSale / qty) : '$0.000';
                      })()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-green-700">Total</dt>
                    <dd className="text-sm font-semibold text-green-900">{formatCurrency(fuel.plus_total_sale || 0)}</dd>
                  </div>
                </dl>
              </div>

              {/* Sup Plus (94) */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Sup Plus (94)</h3>
                <dl className="space-y-1">
                  <div>
                    <dt className="text-xs text-purple-700">Quantity</dt>
                    <dd className="text-sm font-semibold text-purple-900">{formatQuantity(fuel.sup_plus_quantity || 0)}L</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-purple-700">Total Sale</dt>
                    <dd className="text-sm font-semibold text-purple-900">{formatCurrency(fuel.sup_plus_total_sale || 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-purple-700">Price per Liter</dt>
                    <dd className="text-sm font-semibold text-purple-900">
                      {(() => {
                        const qty = fuel.sup_plus_quantity || 0;
                        const totalSale = fuel.sup_plus_total_sale || 0;
                        return qty > 0 ? formatCurrency(totalSale / qty) : '$0.000';
                      })()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-purple-700">Total</dt>
                    <dd className="text-sm font-semibold text-purple-900">{formatCurrency(fuel.sup_plus_total_sale || 0)}</dd>
                  </div>
                </dl>
              </div>

              {/* Diesel */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Diesel</h3>
                <dl className="space-y-1">
                  <div>
                    <dt className="text-xs text-orange-700">Quantity</dt>
                    <dd className="text-sm font-semibold text-orange-900">{formatQuantity(fuel.diesel_quantity || 0)}L</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-orange-700">Total Sale</dt>
                    <dd className="text-sm font-semibold text-orange-900">{formatCurrency(fuel.diesel_total_sale || 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-orange-700">Price per Liter</dt>
                    <dd className="text-sm font-semibold text-orange-900">
                      {(() => {
                        const qty = fuel.diesel_quantity || 0;
                        const totalSale = fuel.diesel_total_sale || 0;
                        return qty > 0 ? formatCurrency(totalSale / qty) : '$0.000';
                      })()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-orange-700">Total</dt>
                    <dd className="text-sm font-semibold text-orange-900">{formatCurrency(fuel.diesel_total_sale || 0)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyFuelViewPage; 