import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { dailySalesApi, vendorInvoicesApi, VendorInvoice } from '../services/api';
import { DailySale } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

interface IncomeItem {
  id: number;
  date: string;
  type: 'Safedrops' | 'Vendor Invoice';
  description: string;
  number_of_safedrops?: number;
  safedrops_amount?: number;
  vendor?: string;
  invoice_number?: string;
  subtotal?: number;
  gst?: number;
  total?: number;
  user?: string;
}

const IncomePage: React.FC = () => {
  usePageTitle('Income');
  const [incomeData, setIncomeData] = useState<IncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    totalSafedrops: 0,
    totalAmount: 0,
    totalDays: 0
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

  const fetchIncomeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getCurrentMonthRange();
      
      // Fetch daily sales for this month
      const dailySalesResponse = await dailySalesApi.getAll({
        start_date: startDate,
        end_date: endDate,
        per_page: 1000 // Get all records for the month
      });

      // Fetch vendor invoices for this month (paid and income type)
      const vendorInvoicesResponse = await vendorInvoicesApi.getAll({
        status: 'Paid',
        type: 'Income',
        start_date: startDate,
        end_date: endDate,
        per_page: 1000 // Get all records for the month
      });

      const dailySales: DailySale[] = dailySalesResponse.data.data || [];
      const vendorInvoices: VendorInvoice[] = vendorInvoicesResponse.data.data || [];

      // Transform daily sales to income items (focusing on safedrops)
      const safedropsItems: IncomeItem[] = dailySales
        .filter(sale => sale.safedrops_amount && sale.safedrops_amount > 0) // Only show days with safedrops
        .map(sale => ({
          id: sale.id || 0,
          date: sale.date,
          type: 'Safedrops' as const,
          description: `Safedrops for ${new Date(sale.date).toLocaleDateString('en-CA')}`,
          number_of_safedrops: sale.number_of_safedrops || 0,
          safedrops_amount: typeof sale.safedrops_amount === 'string' ? parseFloat(sale.safedrops_amount) : (sale.safedrops_amount || 0),
          user: sale.user?.name
        }));

      // Transform vendor invoices to income items (paid and income type)
      const vendorInvoiceItems: IncomeItem[] = vendorInvoices
        .filter(invoice => invoice.status === 'Paid' && invoice.type === 'Income') // Additional safety filter
        .map(invoice => ({
          id: invoice.id,
          date: invoice.payment_date || invoice.invoice_date,
          type: 'Vendor Invoice' as const,
          description: invoice.description || `Invoice ${invoice.invoice_number || invoice.id}`,
          vendor: invoice.vendor?.name,
          invoice_number: invoice.invoice_number,
          subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal,
          gst: typeof invoice.gst === 'string' ? parseFloat(invoice.gst) : invoice.gst,
          total: typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total,
          user: invoice.user?.name
        }));

      // Combine and sort by date
      const incomeItems = [...safedropsItems, ...vendorInvoiceItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setIncomeData(incomeItems);

      // Calculate totals
      const totalSafedrops = incomeItems.reduce((sum, item) => sum + (item.number_of_safedrops || 0), 0);
      const totalAmount = incomeItems.reduce((sum, item) => {
        if (item.type === 'Safedrops') {
          return sum + (item.safedrops_amount || 0);
        } else {
          return sum + (item.total || 0);
        }
      }, 0);
      const totalDays = incomeItems.length;

      setTotals({
        totalSafedrops,
        totalAmount,
        totalDays
      });

    } catch (err) {
      console.error('Error fetching income data:', err);
      setError('Failed to load income data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomeData();
  }, [fetchIncomeData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
                         <h1 className="text-2xl font-bold text-gray-900">Income Report</h1>
             <p className="text-gray-600 mt-2">This month's income from safedrops and vendor invoices</p>
          </div>
          <button
            onClick={fetchIncomeData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Safedrops</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalSafedrops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Days with Safedrops</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-200">
           <h3 className="text-lg font-medium text-gray-900">Income Details</h3>
           <p className="text-sm text-gray-500 mt-1">
             {incomeData.length} income item{incomeData.length !== 1 ? 's' : ''} found
           </p>
         </div>

        {incomeData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
                         <h3 className="mt-2 text-sm font-medium text-gray-900">No income found</h3>
             <p className="mt-1 text-sm text-gray-500">
               No safedrops or vendor invoices recorded for this month.
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
                {incomeData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                         item.type === 'Safedrops' 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-blue-100 text-blue-800'
                       }`}>
                         {item.type}
                       </span>
                     </td>
                                         <td className="px-6 py-4 text-sm text-gray-900">
                       {item.type === 'Safedrops' 
                         ? item.description
                         : `${item.description}${item.vendor ? ` - ${item.vendor}` : ''}`
                       }
                     </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                       {item.type === 'Safedrops' ? item.number_of_safedrops : '-'}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                       {item.type === 'Safedrops' 
                         ? formatCurrency(item.safedrops_amount || 0)
                         : formatCurrency(item.total || 0)
                       }
                     </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">
                    Totals
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {totals.totalSafedrops}
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                     {formatCurrency(totals.totalAmount)}
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

export default IncomePage; 