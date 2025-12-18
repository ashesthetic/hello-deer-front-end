import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { providerBillsApi, ProviderBill } from '../services/api';
import { canCreate, canDelete } from '../utils/permissions';

const ProviderBillsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [providerBills, setProviderBills] = useState<ProviderBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('billing_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);



  const fetchProviderBills = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        sort_by: sortBy,
        sort_direction: sortDirection,
        page: currentPage,
        per_page: perPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await providerBillsApi.getAll(params);
      setProviderBills(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error fetching provider bills:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, sortBy, sortDirection, currentPage, perPage]);

  useEffect(() => {
    fetchProviderBills();
  }, [searchTerm, statusFilter, sortBy, sortDirection, currentPage, fetchProviderBills]);

  const handleDelete = async (id: number) => {
    if (!canDelete(currentUser)) {
      alert('You do not have permission to delete provider bills.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this provider bill?')) {
      try {
        await providerBillsApi.delete(id);
        fetchProviderBills();
      } catch (error) {
        console.error('Error deleting provider bill:', error);
        alert('Failed to delete provider bill.');
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Provider Bills</h1>
        {canCreate(currentUser) && (
          <button
            onClick={() => navigate('/accounting/provider-bills/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Add Provider Bill
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by provider name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Provider Bills Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('billing_date')}
              >
                Billing Date
                {sortBy === 'billing_date' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Period
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('due_date')}
              >
                Due Date
                {sortBy === 'due_date' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
                             <th
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 onClick={() => handleSort('subtotal')}
               >
                 Subtotal
                 {sortBy === 'subtotal' && (
                   <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                 )}
               </th>
               <th
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 onClick={() => handleSort('gst')}
               >
                 GST
                 {sortBy === 'gst' && (
                   <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                 )}
               </th>

               <th
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 onClick={() => handleSort('total')}
               >
                 Total
                 {sortBy === 'total' && (
                   <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                 )}
               </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status
                {sortBy === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providerBills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(bill.billing_date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{bill.provider?.name}</div>
                  <div className="text-sm text-gray-500">{bill.provider?.service}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(bill.service_date_from)} - {formatDate(bill.service_date_to)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(bill.due_date)}</div>
                </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-gray-900">{formatCurrency(bill.subtotal)}</div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm text-gray-900">{formatCurrency(bill.gst)}</div>
                 </td>

                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-semibold text-gray-900">{formatCurrency(bill.total)}</div>
                 </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/accounting/provider-bills/${bill.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/accounting/provider-bills/${bill.id}/edit`)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Edit
                    </button>
                    {canDelete(currentUser) && (
                      <button
                        onClick={() => handleDelete(bill.id)}
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

        {providerBills.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No provider bills found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ProviderBillsPage; 