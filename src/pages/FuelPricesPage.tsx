import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelPriceApi } from '../services/api';
import { canCreate, canDelete, isStaff } from '../utils/permissions';
import { FuelPrice } from '../types';
import { formatDateForDisplay } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import { usePageTitle } from '../hooks/usePageTitle';

const FuelPricesPage: React.FC = () => {
  usePageTitle('Fuel Prices');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    sort_by: 'created_at',
    sort_direction: 'desc',
    per_page: 50
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 50
  });
  const [fuelPriceToDelete, setFuelPriceToDelete] = useState<FuelPrice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchFuelPrices = useCallback(async () => {
    // Don't fetch if user is not loaded yet
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      
      // Fetch paginated data for display
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = isStaff(currentUser)
        ? await fuelPriceApi.getAllForStaff(params.toString())
        : await fuelPriceApi.index(params.toString());
      
      setFuelPrices(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        per_page: response.data.per_page
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel prices');
      setFuelPrices([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    fetchFuelPrices();
  }, [fetchFuelPrices]);

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_direction: prev.sort_by === field && prev.sort_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.000';
    }
    return Number(value).toFixed(3);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const handleDelete = (fuelPrice: FuelPrice) => {
    setFuelPriceToDelete(fuelPrice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fuelPriceToDelete?.id) return;
    
    try {
      await fuelPriceApi.delete(fuelPriceToDelete.id);
      setFuelPrices(prev => prev.filter(fp => fp.id !== fuelPriceToDelete.id));
      setShowDeleteModal(false);
      setFuelPriceToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel price');
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading fuel prices</h3>
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
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Prices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage fuel prices for all fuel types
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {(canCreate(currentUser) || isStaff(currentUser)) && (
            <button
              onClick={() => navigate('/fuel-prices/new')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Fuel Price
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Date Created
                      {filters.sort_by === 'created_at' && (
                        <span className="ml-1">
                          {filters.sort_direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Regular (87)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Midgrade (91)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium (94)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diesel
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fuelPrices.map((fuelPrice) => (
                    <tr key={fuelPrice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(fuelPrice.created_at || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-mono text-green-600">${formatPrice(fuelPrice.regular_87)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-mono text-blue-600">${formatPrice(fuelPrice.midgrade_91)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-mono text-purple-600">${formatPrice(fuelPrice.premium_94)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-mono text-orange-600">${formatPrice(fuelPrice.diesel)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fuelPrice.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/fuel-prices/${fuelPrice.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        {(!isStaff(currentUser) || (isStaff(currentUser) && fuelPrice.user_id === currentUser?.id)) && (
                          <button
                            onClick={() => navigate(`/fuel-prices/${fuelPrice.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(currentUser) && (
                          <button
                            onClick={() => handleDelete(fuelPrice)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, pagination.current_page - 1) }))}
              disabled={pagination.current_page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, pagination.current_page + 1) }))}
              disabled={pagination.current_page === pagination.last_page}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.max(1, (pagination.current_page - 1) * pagination.per_page + 1)}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.total, pagination.current_page * pagination.per_page)}
                </span> of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFuelPriceToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Fuel Price"
        message={`Are you sure you want to delete this fuel price entry? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
};

export default FuelPricesPage;