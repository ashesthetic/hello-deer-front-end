import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { dailyFuelsApi } from '../services/api';
import { DailyFuel } from '../types';
import DailyFuelsList from '../components/DailyFuelsList';
import { canCreate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';
import { useUrlState } from '../hooks/useUrlState';

type SortField = 'date' | 'total_quantity' | 'total_amount' | 'regular_total_sale' | 'plus_total_sale' | 'sup_plus_total_sale' | 'diesel_total_sale';

const PER_PAGE_OPTIONS = [50, 100, 150, 200];

const DailyFuelsPage: React.FC = () => {
  usePageTitle('Daily Fuels');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [fuels, setFuels] = useState<DailyFuel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // URL state management
  const {
    perPage,
    currentPage,
    sortField,
    sortDirection,
    startDate,
    endDate,
    setPerPage,
    setCurrentPage,
    setSortField,
    setSortDirection,
    setStartDate,
    setEndDate,
    clearFilters
  } = useUrlState({
    defaultPerPage: 50,
    defaultSortField: 'date',
    defaultSortDirection: 'desc'
  });

  useEffect(() => {
    fetchFuels(currentPage);
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage, startDate, endDate]);

  const fetchFuels = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { 
        page, 
        per_page: perPage,
        sort_by: sortField,
        sort_direction: sortDirection
      };

      // Add date filters if provided
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await dailyFuelsApi.getAll(params);
      setFuels(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/fuels/new');
  };

  const handleView = (id: number) => {
    navigate(`/fuels/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/fuels/${id}/edit`);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await dailyFuelsApi.delete(id);
      await fetchFuels(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel entry');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
  };

  const handleDateFilterChange = () => {
    // This is handled automatically by the URL state hook
  };

  // Calculate totals for the current page
  const calculateTotals = () => {
    return fuels.reduce((totals, fuel) => ({
      regular_quantity: totals.regular_quantity + (parseFloat(fuel.regular_quantity?.toString() || '0')),
      regular_total_sale: totals.regular_total_sale + (parseFloat(fuel.regular_total_sale?.toString() || '0')),
      plus_quantity: totals.plus_quantity + (parseFloat(fuel.plus_quantity?.toString() || '0')),
      plus_total_sale: totals.plus_total_sale + (parseFloat(fuel.plus_total_sale?.toString() || '0')),
      sup_plus_quantity: totals.sup_plus_quantity + (parseFloat(fuel.sup_plus_quantity?.toString() || '0')),
      sup_plus_total_sale: totals.sup_plus_total_sale + (parseFloat(fuel.sup_plus_total_sale?.toString() || '0')),
      diesel_quantity: totals.diesel_quantity + (parseFloat(fuel.diesel_quantity?.toString() || '0')),
      diesel_total_sale: totals.diesel_total_sale + (parseFloat(fuel.diesel_total_sale?.toString() || '0')),
      total_quantity: totals.total_quantity + (parseFloat(fuel.total_quantity?.toString() || '0')),
      total_amount: totals.total_amount + (parseFloat(fuel.total_amount?.toString() || '0')),
    }), {
      regular_quantity: 0,
      regular_total_sale: 0,
      plus_quantity: 0,
      plus_total_sale: 0,
      sup_plus_quantity: 0,
      sup_plus_total_sale: 0,
      diesel_quantity: 0,
      diesel_total_sale: 0,
      total_quantity: 0,
      total_amount: 0,
    });
  };

  const totals = calculateTotals();
  
  // Calculate average price for totals
  const totalsWithAverage = {
    ...totals,
    average_price: totals.total_quantity > 0 ? totals.total_amount / totals.total_quantity : 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Fuels</h1>
            {canCreate(currentUser) && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Fuel
              </button>
            )}
          </div>

          {/* Filters Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleDateFilterChange();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleDateFilterChange();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-1">
                  Rows per page
                </label>
                <select
                  id="perPage"
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <DailyFuelsList
            fuels={fuels}
            currentUser={currentUser}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
            sortField={sortField as SortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            totals={totalsWithAverage}
          />

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages} ({totalItems} total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default DailyFuelsPage; 