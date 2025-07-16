import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import DailySalesList from '../components/DailySalesList';
import { canCreate } from '../utils/permissions';

type SortField = 'date' | 'total_product_sale' | 'total_counter_sale' | 'reported_total';
type SortDirection = 'asc' | 'desc';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const DailySalesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // New filter states
  const [perPage, setPerPage] = useState(10);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchSales(currentPage);
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage, startDate, endDate]);

  const fetchSales = async (page: number) => {
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

      const response = await dailySalesApi.getAll(params);
      setSales(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/daily-sales/new');
  };

  const handleView = (sale: DailySale) => {
    if (sale.id) {
      navigate(`/daily-sales/${sale.id}`);
    }
  };

  const handleEdit = (sale: DailySale) => {
    if (sale.id) {
      navigate(`/daily-sales/${sale.id}/edit`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) {
      return;
    }

    setLoading(true);
    try {
      await dailySalesApi.delete(id);
      await fetchSales(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sale');
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
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const handleDateFilterChange = () => {
    setCurrentPage(1); // Reset to first page when changing date filters
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Calculate totals for the current page
  const calculateTotals = () => {
    return sales.reduce((totals, sale) => ({
      total_product_sale: totals.total_product_sale + (sale.total_product_sale || 0),
      total_counter_sale: totals.total_counter_sale + (sale.total_counter_sale || 0),
      reported_total: totals.reported_total + (sale.reported_total || 0),
    }), {
      total_product_sale: 0,
      total_counter_sale: 0,
      reported_total: 0,
    });
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Daily Sales</h1>
            {canCreate(currentUser) && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add New Sale
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

          <DailySalesList
            sales={sales}
            currentUser={currentUser}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            totals={totals}
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
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default DailySalesPage; 