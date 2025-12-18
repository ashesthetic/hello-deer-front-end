import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { dailySalesApi, vendorInvoicesApi, providerBillsApi, VendorInvoice, ProviderBill } from '../services/api';
import { DailySale } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

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

const BalancePage: React.FC = () => {
  usePageTitle('Balance');
  const [balanceData, setBalanceData] = useState<BalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalItems: 0
  });

  // Get current month's date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    };
  };

  const fetchBalanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getCurrentMonthRange();
      
      // Fetch daily sales for this month (safedrops - income)
      const dailySalesResponse = await dailySalesApi.getAll({
        start_date: startDate,
        end_date: endDate,
        per_page: 1000
      });

      // Fetch vendor invoices for this month (paid income and expense)
      const vendorInvoicesResponse = await vendorInvoicesApi.getAll({
        status: 'Paid',
        start_date: startDate,
        end_date: endDate,
        per_page: 1000
      });

      // Fetch provider bills for this month (paid - expense)
      const providerBillsResponse = await providerBillsApi.getAll({
        status: 'Paid',
        start_date: startDate,
        end_date: endDate,
        per_page: 1000
      });

      const dailySales: DailySale[] = dailySalesResponse.data.data || [];
      const vendorInvoices: VendorInvoice[] = vendorInvoicesResponse.data.data || [];
      const providerBills: ProviderBill[] = providerBillsResponse.data.data || [];

      // Transform daily sales to balance items (safedrops - income)
      const safedropsItems: BalanceItem[] = dailySales
        .filter(sale => sale.safedrops_amount && sale.safedrops_amount > 0)
        .map(sale => ({
          id: sale.id || 0,
          date: sale.date,
          type: 'Safedrops' as const,
          category: 'Income' as const,
          description: `Safedrops for ${new Date(sale.date).toLocaleDateString('en-CA')}`,
          number_of_safedrops: sale.number_of_safedrops || 0,
          safedrops_amount: typeof sale.safedrops_amount === 'string' ? parseFloat(sale.safedrops_amount) : (sale.safedrops_amount || 0),
          total: typeof sale.safedrops_amount === 'string' ? parseFloat(sale.safedrops_amount) : (sale.safedrops_amount || 0),
          user: sale.user?.name
        }));

      // Transform vendor invoices to balance items (paid income and expense)
      const vendorInvoiceItems: BalanceItem[] = vendorInvoices
        .filter(invoice => invoice.status === 'Paid')
        .map(invoice => ({
          id: invoice.id,
          date: invoice.payment_date || invoice.invoice_date,
          type: 'Vendor Invoice' as const,
          category: invoice.type as 'Income' | 'Expense',
          description: invoice.description || `Invoice ${invoice.invoice_number || invoice.id}`,
          vendor: invoice.vendor?.name,
          invoice_number: invoice.invoice_number,
          subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal,
          gst: typeof invoice.gst === 'string' ? parseFloat(invoice.gst) : invoice.gst,
          total: typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total,
          user: invoice.user?.name
        }));

      // Transform provider bills to balance items (paid - expense)
      const providerBillItems: BalanceItem[] = providerBills
        .filter(bill => bill.status === 'Paid')
        .map(bill => ({
          id: bill.id,
          date: bill.date_paid || bill.billing_date,
          type: 'Provider Bill' as const,
          category: 'Expense' as const,
          description: `${bill.provider?.service || 'Service'} - ${bill.provider?.name || 'Provider'}`,
          provider: bill.provider?.name,
          subtotal: typeof bill.subtotal === 'string' ? parseFloat(bill.subtotal) : bill.subtotal,
          gst: typeof bill.gst === 'string' ? parseFloat(bill.gst) : bill.gst,
          total: typeof bill.total === 'string' ? parseFloat(bill.total) : bill.total,
          user: bill.user?.name
        }));

      // Combine and sort by date
      const allItems = [...safedropsItems, ...vendorInvoiceItems, ...providerBillItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setBalanceData(allItems);

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
  }, []);

  useEffect(() => {
    fetchBalanceData();
  }, [fetchBalanceData]);

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
            <h1 className="text-2xl font-bold text-gray-900">Balance Report</h1>
            <p className="text-gray-600 mt-2">This month's income, expenses, and balance</p>
          </div>
          <button
            onClick={fetchBalanceData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Refresh
          </button>
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
              <p className="text-2xl font-semibold text-gray-900">{totals.totalItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Balance Details</h3>
          <p className="text-sm text-gray-500 mt-1">
            {balanceData.length} transaction{balanceData.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {balanceData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No income or expense transactions recorded for this month.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default BalancePage; 