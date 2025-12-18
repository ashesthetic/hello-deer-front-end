import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { providerBillsApi, vendorInvoicesApi, ProviderBill, VendorInvoice } from '../services/api';
import { formatCurrency } from '../utils/currencyUtils';
import { Pagination } from '../components/common/Pagination';

interface ExpenseItem {
  id: number;
  date: string;
  type: 'Provider Bill' | 'Vendor Invoice';
  description: string;
  provider?: string;
  vendor?: string;
  subtotal: number;
  gst: number;
  total: number;
  status: string;
  payment_date?: string;
}

interface Vendor {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
  service: string;
}

const ExpensePage: React.FC = () => {
  usePageTitle('Expenses');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    vendorId: '',
    providerId: '',
    search: ''
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    gst: 0,
    total: 0
  });

  // Fetch vendors and providers for filter dropdowns
  const fetchVendors = useCallback(async () => {
    try {
      const response = await vendorInvoicesApi.getVendors();
      setVendors(response.data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await providerBillsApi.getProviders();
      setProviders(response.data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params: any = {
        page: currentPage,
        per_page: perPage,
        sort_by: 'date',
        sort_direction: 'desc'
      };

      // Add filters
      if (filters.startDate) {
        params.start_date = filters.startDate;
      }
      if (filters.endDate) {
        params.end_date = filters.endDate;
      }
      if (filters.vendorId) {
        params.vendor_id = filters.vendorId;
      }
      if (filters.providerId) {
        params.provider_id = filters.providerId;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      
      // Fetch paid provider bills
      const providerBillsResponse = await providerBillsApi.getAll({
        ...params,
        status: 'Paid'
      });
      
      // Fetch paid vendor invoices (expense type)
      const vendorInvoicesResponse = await vendorInvoicesApi.getAll({
        ...params,
        status: 'Paid',
        type: 'Expense'
      });

      const providerBills: ProviderBill[] = providerBillsResponse.data.data || [];
      const vendorInvoices: VendorInvoice[] = vendorInvoicesResponse.data.data || [];

      // Transform provider bills to expense items (only paid ones)
      const providerBillExpenses: ExpenseItem[] = providerBills
        .filter(bill => bill.status === 'Paid')
        .map(bill => ({
          id: bill.id,
          date: bill.date_paid || bill.billing_date,
          type: 'Provider Bill',
          description: `${bill.provider?.service || 'Service'} - ${bill.provider?.name || 'Provider'}`,
          provider: bill.provider?.name,
          subtotal: typeof bill.subtotal === 'string' ? parseFloat(bill.subtotal) : bill.subtotal,
          gst: typeof bill.gst === 'string' ? parseFloat(bill.gst) : bill.gst,
          total: typeof bill.total === 'string' ? parseFloat(bill.total) : bill.total,
          status: bill.status,
          payment_date: bill.date_paid
        }));

      // Transform vendor invoices to expense items (only paid ones)
      const vendorInvoiceExpenses: ExpenseItem[] = vendorInvoices
        .filter(invoice => invoice.status === 'Paid' && invoice.type === 'Expense')
        .map(invoice => ({
          id: invoice.id,
          date: invoice.payment_date || invoice.invoice_date,
          type: 'Vendor Invoice',
          description: invoice.description || `Invoice ${invoice.invoice_number || invoice.id}`,
          vendor: invoice.vendor?.name,
          subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal,
          gst: typeof invoice.gst === 'string' ? parseFloat(invoice.gst) : invoice.gst,
          total: typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total,
          status: invoice.status,
          payment_date: invoice.payment_date
        }));

      // Combine and sort by date
      const allExpenses = [...providerBillExpenses, ...vendorInvoiceExpenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setExpenses(allExpenses);

      // Set pagination info from provider bills response (assuming it has pagination)
      if (providerBillsResponse.data.meta) {
        setTotalItems(providerBillsResponse.data.meta.total || allExpenses.length);
        setTotalPages(providerBillsResponse.data.meta.last_page || 1);
      } else {
        setTotalItems(allExpenses.length);
        setTotalPages(1);
      }

      // Calculate totals
      const totalSubtotal = allExpenses.reduce((sum, expense) => sum + expense.subtotal, 0);
      const totalGst = allExpenses.reduce((sum, expense) => sum + expense.gst, 0);
      const totalAmount = allExpenses.reduce((sum, expense) => sum + expense.total, 0);

      setTotals({
        subtotal: totalSubtotal,
        gst: totalGst,
        total: totalAmount
      });

    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, filters]);

  useEffect(() => {
    fetchVendors();
    fetchProviders();
  }, [fetchVendors, fetchProviders]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when per page changes
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      vendorId: '',
      providerId: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-2">All expenses from paid provider bills and vendor invoices</p>
          </div>
          <button
            onClick={fetchExpenses}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Filters</h3>
            <p className="text-sm text-gray-600">Filter expense data by date range, vendor, and provider</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search descriptions..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Vendor Filter */}
            <div>
              <label htmlFor="vendor" className="block text-xs font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                id="vendor"
                value={filters.vendorId}
                onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <label htmlFor="provider" className="block text-xs font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                id="provider"
                value={filters.providerId}
                onChange={(e) => handleFilterChange('providerId', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Providers</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.service}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Subtotal</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">GST</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.gst)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Expense Details</h3>
          <p className="text-sm text-gray-500 mt-1">
            {totalItems} expense{totalItems !== 1 ? 's' : ''} found
          </p>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No paid expenses found for the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider/Vendor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={`${expense.type}-${expense.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          expense.type === 'Provider Bill' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {expense.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.provider || expense.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(expense.subtotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(expense.gst)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(expense.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                      Totals
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(totals.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(totals.gst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(totals.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ExpensePage; 