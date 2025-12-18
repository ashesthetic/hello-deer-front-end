import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { vendorInvoicesApi, VendorInvoice } from '../services/api';
import { Vendor } from '../types';
import { canCreate, isStaff } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';
import { useUrlState } from '../hooks/useUrlState';
import { formatDateForDisplay, formatCurrency } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';

type SortField = 'invoice_date' | 'status' | 'type' | 'total' | 'payment_date' | 'created_at' | 'updated_at';

const PER_PAGE_OPTIONS = [50, 100, 150, 200];

const VendorInvoicesPage: React.FC = () => {
  usePageTitle('Vendor Invoices');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // URL state management
  const {
    perPage,
    currentPage,
    sortField,
    sortDirection,
    searchTerm,
    statusFilter,
    typeFilter,
    referenceFilter,
    vendorFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
    setPerPage,
    setCurrentPage,
    setSortField,
    setSortDirection,
    setSearchTerm,
    setStatusFilter,
    setTypeFilter,
    setReferenceFilter,
    setVendorFilter,
    setStartDate: setStartDateFilter,
    setEndDate: setEndDateFilter,
    clearFilters
  } = useUrlState({
    defaultPerPage: 50,
    defaultSortField: 'invoice_date',
    defaultSortDirection: 'desc'
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<VendorInvoice | null>(null);

  // Fetch vendors for filter dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = isStaff(currentUser) 
          ? await vendorInvoicesApi.getVendorsForStaff()
          : await vendorInvoicesApi.getVendors();
        setVendors(response.data || []);
      } catch (err) {
        // Error fetching vendors - silently handle
      }
    };
    fetchVendors();
  }, [currentUser]);

  useEffect(() => {
    fetchInvoices(currentPage);
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage, searchTerm, statusFilter, typeFilter, referenceFilter, vendorFilter, startDateFilter, endDateFilter]);

  const fetchInvoices = async (page: number) => {
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

      // Add additional filters
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (typeFilter) {
        params.type = typeFilter;
      }
      if (referenceFilter) {
        params.reference = referenceFilter;
      }
      if (vendorFilter) {
        params.vendor_id = vendorFilter;
      }
      if (startDateFilter && endDateFilter) {
        params.start_date = startDateFilter;
        params.end_date = endDateFilter;
      }

      const response = isStaff(currentUser)
        ? await vendorInvoicesApi.getAllForStaff(params)
        : await vendorInvoicesApi.getAll(params);
      setInvoices(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vendor invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = () => {
    if (isStaff(currentUser)) {
      navigate('/vendor-invoices/add');
    } else {
      navigate('/accounting/vendor-invoices/add');
    }
  };

  const handleEditInvoice = (invoice: VendorInvoice) => {
    if (isStaff(currentUser)) {
      // Staff users cannot edit invoices - redirect to view
      navigate(`/vendor-invoices/${invoice.id}`);
    } else {
      navigate(`/accounting/vendor-invoices/${invoice.id}/edit`);
    }
  };

  const handleViewInvoice = (invoice: VendorInvoice) => {
    if (isStaff(currentUser)) {
      navigate(`/vendor-invoices/${invoice.id}`);
    } else {
      navigate(`/accounting/vendor-invoices/${invoice.id}`);
    }
  };

  const handleDeleteInvoice = (invoice: VendorInvoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete || !invoiceToDelete.id) return;

    setLoading(true);
    try {
      await vendorInvoicesApi.delete(invoiceToDelete.id);
      await fetchInvoices(currentPage);
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor invoice');
    } finally {
      setLoading(false);
    }
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

  const clearAllFilters = () => {
    clearFilters();
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'Paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getTypeBadgeClass = (type: string) => {
    return type === 'Income' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Invoices</h1>
            <p className="text-gray-600">Manage vendor invoices and payments</p>
          </div>
          {(canCreate(currentUser) || isStaff(currentUser)) && (
            <button
              onClick={handleAddInvoice}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Invoice
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by vendor name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            {/* Reference Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All References</option>
                <option value="Vendor">Vendor</option>
                <option value="Ash">Ash</option>
                <option value="Nafi">Nafi</option>
              </select>
            </div>

            {/* Vendor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <select
                value={vendorFilter || ''}
                onChange={(e) => setVendorFilter(e.target.value || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  placeholder="Select start date"
                  data-lpignore="true"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  placeholder="Select end date"
                  data-lpignore="true"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Reference
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                    onClick={() => handleSort('invoice_date')}
                  >
                    Invoice Date
                    {sortField === 'invoice_date' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0">
                    Vendor
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('total')}
                  >
                    Total
                    {sortField === 'total' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('type')}
                  >
                    Type
                    {sortField === 'type' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortField === 'status' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Payment Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                      No vendor invoices found
                    </td>
                  </tr>
                ) : (
                  <>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.id}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.reference || '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateForDisplay(invoice.invoice_date)}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          <div className="truncate max-w-xs" title={invoice.vendor?.name}>
                            {invoice.vendor?.name}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(Number(invoice.total))}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(invoice.type)}`}>
                            {invoice.type}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.payment_date ? formatDateForDisplay(invoice.payment_date) : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              View
                            </button>
                            {!isStaff(currentUser) && (
                              <>
                                <button
                                  onClick={() => handleEditInvoice(invoice)}
                                  className="text-indigo-600 hover:text-indigo-900 text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-gray-50 border-t-2 border-gray-300">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Total
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0))}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Per page:</span>
                    <select
                      value={perPage}
                      onChange={(e) => handlePerPageChange(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      {PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vendor Invoice"
        message={invoiceToDelete ? `Are you sure you want to delete the invoice for ${invoiceToDelete.vendor?.name}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default VendorInvoicesPage; 