import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ownerEquitiesApi } from '../services/api';
import { OwnerEquity, OwnerEquitySummary } from '../types';
import { canCreate, canDelete } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';
import { useUrlState } from '../hooks/useUrlState';
import { formatCurrency } from '../utils/dateUtils';
import Modal from '../components/Modal';
import { ownersApi } from '../services/api';

type SortField = 'date' | 'amount' | 'type' | 'created_at' | 'updated_at';

const PER_PAGE_OPTIONS = [50, 100, 150, 200];

const OwnerEquitiesPage: React.FC = () => {
  usePageTitle('Owner Equity Transactions');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [transactions, setTransactions] = useState<OwnerEquity[]>([]);
  const [summary, setSummary] = useState<OwnerEquitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<OwnerEquity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filteredOwnerName, setFilteredOwnerName] = useState<string | null>(null);

  // URL state management
  const {
    perPage,
    currentPage,
    sortField,
    sortDirection,
    searchTerm,
    setPerPage,
    setCurrentPage,
    setSortField,
    setSortDirection,
    setSearchTerm,
    clearFilters
  } = useUrlState({
    defaultPerPage: 50,
    defaultSortField: 'date',
    defaultSortDirection: 'desc'
  });

  // Get owner_id from URL params for filtering
  const urlParams = new URLSearchParams(window.location.search);
  const ownerIdFilter = urlParams.get('owner_id');

  useEffect(() => {
    fetchTransactions(currentPage);
    fetchSummary();
    
    // Fetch owner name if filtering by owner_id
    if (ownerIdFilter) {
      fetchOwnerName(parseInt(ownerIdFilter));
    } else {
      setFilteredOwnerName(null);
    }
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage, searchTerm, ownerIdFilter]);

  const fetchOwnerName = async (ownerId: number) => {
    try {
      const response = await ownersApi.getById(ownerId);
      setFilteredOwnerName(response.data.name);
    } catch (err: any) {
      console.error('Failed to fetch owner name:', err);
      setFilteredOwnerName('Unknown Owner');
    }
  };

  const fetchTransactions = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { 
        page, 
        per_page: perPage,
        sort_by: sortField,
        sort_direction: sortDirection
      };

      // Add search filter if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add owner filter if provided
      if (ownerIdFilter) {
        params.owner_id = ownerIdFilter;
      }

      const response = await ownerEquitiesApi.getAll(params);
      setTransactions(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await ownerEquitiesApi.getSummary();
      setSummary(response.data);
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const handleAddTransaction = () => {
    navigate('/accounting/owner-equities/add');
  };

  const handleEditTransaction = (transaction: OwnerEquity) => {
    navigate(`/accounting/owner-equities/${transaction.id}/edit`);
  };

  const handleViewTransaction = (transaction: OwnerEquity) => {
    navigate(`/accounting/owner-equities/${transaction.id}`);
  };

  const handleDeleteTransaction = async (transaction: OwnerEquity) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    
    setDeleting(true);
    try {
      await ownerEquitiesApi.delete(transactionToDelete.id!);
      await fetchTransactions(currentPage);
      await fetchSummary();
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Owner Equity Transactions
            {filteredOwnerName && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                - {filteredOwnerName}
              </span>
            )}
          </h1>
          {filteredOwnerName && (
            <p className="text-sm text-gray-500 mt-1">
              Showing transactions for {filteredOwnerName} only
            </p>
          )}
        </div>
        {canCreate(currentUser) && (
          <button
            onClick={handleAddTransaction}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Transaction
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Owners</h3>
            <p className="text-2xl font-bold text-gray-900">{summary.total_owners}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Owners</h3>
            <p className="text-2xl font-bold text-gray-900">{summary.active_owners}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Equity</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_equity)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Investments</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_investments)}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    Type {getSortIcon('type')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    Amount {getSortIcon('amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.formatted_date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.owner?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.is_investment 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        transaction.is_investment ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.formatted_amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {canCreate(currentUser) && (
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(currentUser) && (
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * perPage, totalItems)}
                    </span>{' '}
                    of <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No transactions found</div>
          {canCreate(currentUser) && (
            <button
              onClick={handleAddTransaction}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add your first transaction
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        title="Confirm Delete"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        loading={deleting}
      >
        <p>Are you sure you want to delete this equity transaction?</p>
        {transactionToDelete && (
          <div className="mt-2 text-sm text-gray-600">
            <p><strong>Owner:</strong> {transactionToDelete.owner?.name}</p>
            <p><strong>Type:</strong> {transactionToDelete.type_display}</p>
            <p><strong>Amount:</strong> {transactionToDelete.formatted_amount}</p>
            <p><strong>Date:</strong> {transactionToDelete.formatted_date}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OwnerEquitiesPage; 