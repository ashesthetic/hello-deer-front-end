import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { dailySalesApi, vendorInvoicesApi, providerBillsApi, VendorInvoice, ProviderBill } from '../services/api';
import { DailySale } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { Pagination } from '../components/common/Pagination';
import { formatDateForDisplay } from '../utils/dateUtils';

interface BalanceItem {
  id: number;
  date: string;
  type: 'Safedrops' | 'Vendor Invoice' | 'Provider Bill';
  category: 'Income' | 'Expense';
  description: string;
  vendor?: string;
  provider?: string;
  invoice_number?: string;
  number_of_safedrops?: number;
  safedrops_amount?: number;
  subtotal?: number;
  gst?: number;
  total?: number;
  user?: string;
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

interface FilterOption {
  id: string;
  name: string;
  type: 'vendor' | 'provider';
}

// Utility function to get today's date in YYYY-MM-DD format using local timezone
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Test function to verify date calculation
const testDateCalculation = () => {
  const today = getTodayDate();
  const utcToday = new Date().toISOString().split('T')[0];
  const localDate = formatDateForDisplay(new Date().toISOString().split('T')[0]);
  
  console.log('=== Date Calculation Test ===');
  console.log('Local Today (YYYY-MM-DD):', today);
  console.log('UTC Today (YYYY-MM-DD):', utcToday);
  console.log('Local Date (MM/DD/YYYY):', localDate);
  console.log('Current Date Object:', new Date());
  console.log('Timezone Offset (minutes):', new Date().getTimezoneOffset());
  console.log('================================');
  
  return { today, utcToday, localDate };
};

const BalancePage: React.FC = () => {
  usePageTitle('Balance');
  const [balanceData, setBalanceData] = useState<BalanceItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Date range state - start with a wide range to show all data
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    selectedVendorsProviders: [] as string[],
    search: ''
  });

  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalItems: 0
  });

  // Initialize with a wide date range to show all data
  useEffect(() => {
    // Set to show last 2 years of data by default
    const now = new Date();
    const twoYearsAgo = `${now.getFullYear() - 2}-01-01`;
    const today = now.toISOString().split('T')[0]; // Use local date for API
    
    setDateRange({
      startDate: twoYearsAgo,
      endDate: today
    });
  }, []);

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

  const fetchBalanceData = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Test date calculation first
      const dateTest = testDateCalculation();
      
      // Check if today is within the selected date range - use local timezone
      const today = getTodayDate();
      const includeToday = today >= dateRange.startDate && today <= dateRange.endDate;

      console.log('Debug - Date Range:', { 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate, 
        today, 
        includeToday,
        dateTest 
      });
      


      // Build query parameters for daily sales (safedrops)
      const dailySalesParams: any = {
        page: currentPage,
        per_page: perPage,
        sort_by: 'date',
        sort_direction: 'desc',
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      };

      // Build query parameters for vendor invoices
      const vendorInvoicesParams: any = {
        page: currentPage,
        per_page: perPage,
        sort_by: 'payment_date',
        sort_direction: 'desc',
        payment_start_date: dateRange.startDate,
        payment_end_date: dateRange.endDate,
        status: 'Paid'
      };

      // Build query parameters for provider bills
      const providerBillsParams: any = {
        page: currentPage,
        per_page: perPage,
        sort_by: 'date_paid',
        sort_direction: 'desc',
        payment_start_date: dateRange.startDate,
        payment_end_date: dateRange.endDate,
        status: 'Paid'
      };

      // Add search filter if provided
      if (filters.search) {
        dailySalesParams.search = filters.search;
        vendorInvoicesParams.search = filters.search;
        providerBillsParams.search = filters.search;
      }

      // Add vendor/provider filters
      if (filters.selectedVendorsProviders.length > 0) {
        const vendorIds = filters.selectedVendorsProviders
          .filter(id => id.startsWith('vendor-'))
          .map(id => id.replace('vendor-', ''));
        
        const providerIds = filters.selectedVendorsProviders
          .filter(id => id.startsWith('provider-'))
          .map(id => id.replace('provider-', ''));

        if (vendorIds.length > 0) {
          vendorInvoicesParams.vendor_id = vendorIds.join(',');
        }
        if (providerIds.length > 0) {
          providerBillsParams.provider_id = providerIds.join(',');
        }
      }
      
      console.log('Debug - Daily Sales Params:', dailySalesParams);
      
      // Fetch daily sales for the date range (safedrops - income)
      const dailySalesResponse = await dailySalesApi.getAll(dailySalesParams);

      // Always fetch today's data if we're on page 1 and today is in range
      let todaySafedrops: DailySale[] = [];
      if (includeToday && currentPage === 1) {
        try {
          console.log('Debug - Fetching today\'s safedrops for date:', today);
          const todayResponse = await dailySalesApi.getAll({
            start_date: today,
            end_date: today,
            per_page: 1000, // Get all today's data
            sort_by: 'date',
            sort_direction: 'desc'
          });
          todaySafedrops = todayResponse.data.data || [];
          console.log('Debug - Today\'s safedrops found:', todaySafedrops.length);
          console.log('Debug - Today\'s safedrops data:', todaySafedrops);
        } catch (err) {
          console.error('Error fetching today\'s safedrops:', err);
        }
      }

      // Fetch vendor invoices for the date range (paid income and expense)
      const vendorInvoicesResponse = await vendorInvoicesApi.getAll(vendorInvoicesParams);

      // Fetch provider bills for the date range (paid - expense)
      const providerBillsResponse = await providerBillsApi.getAll(providerBillsParams);

      let dailySales: DailySale[] = dailySalesResponse.data.data || [];
      
      console.log('Debug - Main daily sales found:', dailySales.length);
      console.log('Debug - Today\'s safedrops found:', todaySafedrops.length);
      
      // Merge today's safedrops with the main daily sales data, avoiding duplicates
      if (todaySafedrops.length > 0) {
        const existingIds = new Set(dailySales.map(sale => sale.id));
        const uniqueTodaySafedrops = todaySafedrops.filter(sale => !existingIds.has(sale.id));
        dailySales = [...uniqueTodaySafedrops, ...dailySales];
        console.log('Debug - After merge, total daily sales:', dailySales.length);
      }

      const vendorInvoices: VendorInvoice[] = vendorInvoicesResponse.data.data || [];
      const providerBills: ProviderBill[] = providerBillsResponse.data.data || [];

      console.log('Debug - Daily Sales Count:', dailySales.length);
      console.log('Debug - Vendor Invoices Count:', vendorInvoices.length);
      console.log('Debug - Provider Bills Count:', providerBills.length);
      
      // Debug: Show some sample dates from the API
      if (dailySales.length > 0) {
        console.log('Debug - Sample Daily Sales dates:', dailySales.slice(0, 3).map(sale => ({ id: sale.id, date: sale.date, safedrops: sale.safedrops_amount })));
      }
      if (vendorInvoices.length > 0) {
        console.log('Debug - Sample Vendor Invoice dates:', vendorInvoices.slice(0, 3).map(invoice => ({ id: invoice.id, invoice_date: invoice.invoice_date, payment_date: invoice.payment_date })));
      }
      if (providerBills.length > 0) {
        console.log('Debug - Sample Provider Bill dates:', providerBills.slice(0, 3).map(bill => ({ id: bill.id, billing_date: bill.billing_date, date_paid: bill.date_paid })));
      }

      // Helper function to extract date from datetime string
      const extractDateFromDateTime = (dateTimeString: string): string => {
        if (!dateTimeString) return '';
        // Handle both date-only strings and datetime strings
        if (dateTimeString.includes('T')) {
          return dateTimeString.split('T')[0];
        }
        return dateTimeString;
      };

      // Transform daily sales to balance items (safedrops - income)
      const safedropsItems: BalanceItem[] = dailySales
        .filter(sale => {
          if (!sale.safedrops_amount || sale.safedrops_amount <= 0) return false;
          
          // Filter by date range
          const saleDate = extractDateFromDateTime(sale.date);
          return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        })
        .map(sale => {
          const saleDate = extractDateFromDateTime(sale.date);
          return {
            id: sale.id || 0,
            date: saleDate,
            type: 'Safedrops' as const,
            category: 'Income' as const,
            description: `Safedrops for ${formatDateForDisplay(saleDate)}`,
            number_of_safedrops: sale.number_of_safedrops || 0,
            safedrops_amount: typeof sale.safedrops_amount === 'string' ? parseFloat(sale.safedrops_amount) : (sale.safedrops_amount || 0),
            total: typeof sale.safedrops_amount === 'string' ? parseFloat(sale.safedrops_amount) : (sale.safedrops_amount || 0),
            user: sale.user?.name
          };
        });

      console.log('Debug - Safedrops items created:', safedropsItems.length);
      console.log('Debug - Safedrops dates:', safedropsItems.map(item => item.date));
      console.log('Debug - Safedrops dates (original):', dailySales.map(sale => sale.date));
      
      // Debug: Show filtered items with their dates
      console.log('Debug - Filtered Safedrops:', safedropsItems.slice(0, 3).map(item => ({ 
        id: item.id, 
        date: item.date, 
        description: item.description,
        amount: item.total 
      })));

      // Transform vendor invoices to balance items (paid income and expense)
      // Backend now filters by payment_date, so we just need to map the data
      const vendorInvoiceItems: BalanceItem[] = vendorInvoices
        .map(invoice => {
          const paymentDate = extractDateFromDateTime(invoice.payment_date || invoice.invoice_date);
          return {
            id: invoice.id,
            date: paymentDate,
            type: 'Vendor Invoice' as const,
            category: invoice.type as 'Income' | 'Expense',
            description: invoice.description || `Invoice ${invoice.invoice_number || invoice.id}`,
            vendor: invoice.vendor?.name,
            invoice_number: invoice.invoice_number,
            subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal,
            gst: typeof invoice.gst === 'string' ? parseFloat(invoice.gst) : invoice.gst,
            total: typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total,
            user: invoice.user?.name
          };
        });

      console.log('Debug - Vendor Invoice items created:', vendorInvoiceItems.length);
      if (vendorInvoiceItems.length > 0) {
        console.log('Debug - Filtered Vendor Invoices:', vendorInvoiceItems.slice(0, 3).map(item => ({ 
          id: item.id, 
          date: item.date, 
          description: item.description,
          amount: item.total 
        })));
      }

      // Transform provider bills to balance items (paid - expense)
      // Backend now filters by date_paid, so we just need to map the data
      const providerBillItems: BalanceItem[] = providerBills
        .map(bill => {
          const paymentDate = extractDateFromDateTime(bill.date_paid || bill.billing_date);
          return {
            id: bill.id,
            date: paymentDate,
            type: 'Provider Bill' as const,
            category: 'Expense' as const,
            description: `${bill.provider?.service || 'Service'} - ${bill.provider?.name || 'Provider'}`,
            provider: bill.provider?.name,
            subtotal: typeof bill.subtotal === 'string' ? parseFloat(bill.subtotal) : bill.subtotal,
            gst: typeof bill.gst === 'string' ? parseFloat(bill.gst) : bill.gst,
            total: typeof bill.total === 'string' ? parseFloat(bill.total) : bill.total,
            user: bill.user?.name
          };
        });

      console.log('Debug - Provider Bill items created:', providerBillItems.length);
      if (providerBillItems.length > 0) {
        console.log('Debug - Filtered Provider Bills:', providerBillItems.slice(0, 3).map(item => ({ 
          id: item.id, 
          date: item.date, 
          description: item.description,
          amount: item.total 
        })));
      }

      // Combine and sort by date
      const allItems = [...safedropsItems, ...vendorInvoiceItems, ...providerBillItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('Debug - Total items after combining:', allItems.length);
      console.log('Debug - All item dates:', allItems.map(item => ({ date: item.date, type: item.type })));
      
      // Debug: Show final items with their display dates
      console.log('Debug - Final Items (first 5):', allItems.slice(0, 5).map(item => ({ 
        id: item.id, 
        date: item.date, 
        displayDate: formatDateForDisplay(item.date),
        type: item.type,
        description: item.description,
        amount: item.total 
      })));

      setBalanceData(allItems);

      // Set pagination info - use the largest total from all three sources
      const dailySalesTotal = dailySalesResponse.data.meta?.total || 0;
      const vendorInvoicesTotal = vendorInvoicesResponse.data.meta?.total || 0;
      const providerBillsTotal = providerBillsResponse.data.meta?.total || 0;
      
      const maxTotal = Math.max(dailySalesTotal, vendorInvoicesTotal, providerBillsTotal);
      const maxPages = Math.max(
        dailySalesResponse.data.meta?.last_page || 1,
        vendorInvoicesResponse.data.meta?.last_page || 1,
        providerBillsResponse.data.meta?.last_page || 1
      );

      setTotalItems(maxTotal || allItems.length);
      setTotalPages(maxPages || 1);

      // Calculate totals
      const totalIncome = allItems
        .filter(item => item.category === 'Income')
        .reduce((sum, item) => sum + (item.total || 0), 0);
      
      const totalExpense = allItems
        .filter(item => item.category === 'Expense')
        .reduce((sum, item) => sum + (item.total || 0), 0);
      
      const balance = totalIncome - totalExpense;

      setTotals({
        totalIncome,
        totalExpense,
        balance,
        totalItems: allItems.length
      });

    } catch (err) {
      console.error('Error fetching balance data:', err);
      setError('Failed to load balance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, currentPage, perPage, filters]);

  useEffect(() => {
    fetchVendors();
    fetchProviders();
  }, [fetchVendors, fetchProviders]);

  useEffect(() => {
    fetchBalanceData();
  }, [fetchBalanceData]);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when date range changes
  };

  const handleFilterChange = (field: keyof typeof filters, value: any) => {
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

  const handleQuickDateSelect = (range: 'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'currentYear' | 'allTime') => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (range) {
      case 'currentMonth':
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
        break;
      case 'lastMonth':
        startDate = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth(), 0).getDate()}`;
        break;
      case 'last3Months':
        startDate = `${now.getFullYear()}-${String(now.getMonth() - 2).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
        break;
      case 'last6Months':
        startDate = `${now.getFullYear()}-${String(now.getMonth() - 5).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
        break;
      case 'currentYear':
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
        break;
      case 'allTime':
        startDate = '2020-01-01'; // Start from 2020
        endDate = new Date().toISOString().split('T')[0]; // Use local date for API
        break;
      default:
        return;
    }

    setDateRange({
      startDate,
      endDate
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      selectedVendorsProviders: [],
      search: ''
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  // Create combined filter options
  const filterOptions: FilterOption[] = [
    ...vendors.map(vendor => ({
      id: `vendor-${vendor.id}`,
      name: `Vendor: ${vendor.name}`,
      type: 'vendor' as const
    })),
    ...providers.map(provider => ({
      id: `provider-${provider.id}`,
      name: `Provider: ${provider.name} - ${provider.service}`,
      type: 'provider' as const
    }))
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Balance Report</h1>
            <p className="text-gray-600 mt-2">Income, expenses, and balance based on payment dates</p>
          </div>
          <button
            onClick={fetchBalanceData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Date Range Filter</h3>
            <p className="text-sm text-gray-600">Filter transactions by payment date</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Quick Date Selectors */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickDateSelect('allTime')}
                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                All Time
              </button>
              <button
                onClick={() => handleQuickDateSelect('currentYear')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Current Year
              </button>
              <button
                onClick={() => handleQuickDateSelect('currentMonth')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Current Month
              </button>
              <button
                onClick={() => handleQuickDateSelect('lastMonth')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Last Month
              </button>
              <button
                onClick={() => handleQuickDateSelect('last3Months')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Last 3 Months
              </button>
              <button
                onClick={() => handleQuickDateSelect('last6Months')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Last 6 Months
              </button>
            </div>

            {/* Custom Date Range */}
            <div className="flex gap-2">
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
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
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Filters</h3>
            <p className="text-sm text-gray-600">Filter by vendors, providers, and search terms</p>
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

            {/* Combined Vendor/Provider Filter */}
            <div>
              <label htmlFor="vendorsProviders" className="block text-xs font-medium text-gray-700 mb-1">
                Vendors & Providers
              </label>
              <select
                id="vendorsProviders"
                multiple
                value={filters.selectedVendorsProviders}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('selectedVendorsProviders', selectedOptions);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[80px]"
              >
                <option value="" disabled>Select vendors and/or providers</option>
                {filterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple
              </p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(totals.totalIncome)}</p>
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
              <p className="text-2xl font-semibold text-red-600">{formatCurrency(totals.totalExpense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Balance</p>
              <p className={`text-2xl font-semibold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totals.balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Balance Details</h3>
          <p className="text-sm text-gray-500 mt-1">
            {totalItems} transaction{totalItems !== 1 ? 's' : ''} found for {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
          </p>
        </div>

        {balanceData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No income or expense transactions recorded for the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number of Safedrops
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balanceData.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'Safedrops' 
                            ? 'bg-green-100 text-green-800'
                            : item.type === 'Vendor Invoice'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.category === 'Income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.type === 'Safedrops' 
                          ? item.description
                          : `${item.description}${item.vendor ? ` - ${item.vendor}` : ''}${item.provider ? ` - ${item.provider}` : ''}`
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.type === 'Safedrops' ? item.number_of_safedrops : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        item.category === 'Income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.category === 'Income' ? '+' : '-'}{formatCurrency(item.total || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                      Totals
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {balanceData.filter(item => item.type === 'Safedrops').reduce((sum, item) => sum + (item.number_of_safedrops || 0), 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      <div className="space-y-1">
                        <div className="text-green-600">+{formatCurrency(totals.totalIncome)}</div>
                        <div className="text-red-600">-{formatCurrency(totals.totalExpense)}</div>
                        <div className={`border-t pt-1 ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          = {formatCurrency(totals.balance)}
                        </div>
                      </div>
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

export default BalancePage; 