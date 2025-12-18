import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { dailyAtmApi } from '../services/api';
import { isAdmin } from '../utils/permissions';
import { formatDateForDisplay } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';

interface DailyAtm {
  id: number;
  date: string;
  no_of_transactions: number;
  withdraw: string;
  fee: string;
  resolved: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const DailyAtmPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [dailyAtms, setDailyAtms] = useState<DailyAtm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    sort_by: 'date',
    sort_direction: 'desc',
    per_page: 10
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });
  const [atmToDelete, setAtmToDelete] = useState<DailyAtm | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchDailyAtms = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await dailyAtmApi.index(params.toString());
      setDailyAtms(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        per_page: response.data.per_page
      });
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ATM records');
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    fetchDailyAtms();
  }, [fetchDailyAtms]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_direction: prev.sort_by === field && prev.sort_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteClick = (atm: DailyAtm) => {
    setAtmToDelete(atm);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!atmToDelete) return;

    try {
      await dailyAtmApi.delete(atmToDelete.id);
      setShowDeleteModal(false);
      setAtmToDelete(null);
      fetchDailyAtms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete ATM record');
      setShowDeleteModal(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, per_page: pagination.per_page }));
    window.scrollTo(0, 0);
    fetchDailyAtms();
  };

  const getSortIcon = (field: string) => {
    if (filters.sort_by !== field) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return filters.sort_direction === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };

  if (loading && dailyAtms.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ATM Records</h1>
        {isAdmin(currentUser) && (
          <button
            onClick={() => navigate('/daily-atm/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add ATM Record
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
            <select
              value={filters.per_page}
              onChange={(e) => handleFilterChange('per_page', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('date')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  onClick={() => handleSort('no_of_transactions')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  No of Transactions {getSortIcon('no_of_transactions')}
                </th>
                <th 
                  onClick={() => handleSort('withdraw')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Withdraw {getSortIcon('withdraw')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyAtms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No ATM records found
                  </td>
                </tr>
              ) : (
                dailyAtms.map((atm) => {
                  const withdraw = parseFloat(atm.withdraw);
                  const fee = parseFloat(atm.fee);
                  const balance = withdraw + fee;
                  
                  return (
                    <tr key={atm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateForDisplay(atm.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {atm.no_of_transactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${withdraw.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${fee.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${balance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {atm.resolved ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/daily-atm/${atm.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        {isAdmin(currentUser) && (
                          <>
                            <button
                              onClick={() => navigate(`/daily-atm/${atm.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(atm)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                  <span className="font-medium">{pagination.last_page}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAtmToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete ATM Record"
        message={`Are you sure you want to delete the ATM record for ${atmToDelete ? formatDateForDisplay(atmToDelete.date) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default DailyAtmPage;
