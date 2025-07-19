import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { dailyFuelsApi } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const FuelsReportPage: React.FC = () => {
  const [fuels, setFuels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchFuels();
  }, [currentYear, currentMonth]);

  const fetchFuels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailyFuelsApi.getByMonth(currentYear, currentMonth);
      setFuels(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(quantity) + 'L';
  };

  const getMonthName = (month: number) => {
    const date = new Date(2024, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  // Prepare chart data for amounts
  const amountsChartData = {
    labels: fuels.map(fuel => formatDate(fuel.date)),
    datasets: [
      {
        label: 'Regular (87)',
        data: fuels.map(fuel => fuel.regular_total_sale || 0),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'Plus (91)',
        data: fuels.map(fuel => fuel.plus_total_sale || 0),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Sup Plus (94)',
        data: fuels.map(fuel => fuel.sup_plus_total_sale || 0),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1,
      },
      {
        label: 'Diesel',
        data: fuels.map(fuel => fuel.diesel_total_sale || 0),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for quantities
  const quantitiesChartData = {
    labels: fuels.map(fuel => formatDate(fuel.date)),
    datasets: [
      {
        label: 'Regular (87)',
        data: fuels.map(fuel => fuel.regular_quantity || 0),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'Plus (91)',
        data: fuels.map(fuel => fuel.plus_quantity || 0),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Sup Plus (94)',
        data: fuels.map(fuel => fuel.sup_plus_quantity || 0),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1,
      },
      {
        label: 'Diesel',
        data: fuels.map(fuel => fuel.diesel_quantity || 0),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            const isQuantity = context.dataset.label === 'Regular (87)' || 
                             context.dataset.label === 'Plus (91)' || 
                             context.dataset.label === 'Sup Plus (94)' || 
                             context.dataset.label === 'Diesel';
            
            if (isQuantity) {
              return `${label}: ${formatQuantity(value)}`;
            } else {
              return `${label}: ${formatCurrency(value)}`;
            }
          }
        }
      },
      datalabels: {
        display: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45
        },
      },
      y: {
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            const numValue = parseFloat(value) || 0;
            return formatCurrency(numValue);
          }
        },
      },
    },
  };

  const quantityChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            const numValue = parseFloat(value) || 0;
            return formatQuantity(numValue);
          }
        },
      },
    },
  };

  // Calculate totals
  const totals = fuels.reduce((acc, fuel) => ({
    regular_quantity: acc.regular_quantity + (fuel.regular_quantity || 0),
    regular_total_sale: acc.regular_total_sale + (fuel.regular_total_sale || 0),
    plus_quantity: acc.plus_quantity + (fuel.plus_quantity || 0),
    plus_total_sale: acc.plus_total_sale + (fuel.plus_total_sale || 0),
    sup_plus_quantity: acc.sup_plus_quantity + (fuel.sup_plus_quantity || 0),
    sup_plus_total_sale: acc.sup_plus_total_sale + (fuel.sup_plus_total_sale || 0),
    diesel_quantity: acc.diesel_quantity + (fuel.diesel_quantity || 0),
    diesel_total_sale: acc.diesel_total_sale + (fuel.diesel_total_sale || 0),
    total_quantity: acc.total_quantity + (fuel.total_quantity || 0),
    total_amount: acc.total_amount + (fuel.total_amount || 0),
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fuels Report</h1>
            <p className="text-gray-600">Comprehensive analysis of daily fuel sales and quantities</p>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Previous
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {getMonthName(currentMonth)} {currentYear}
              </div>
            </div>
            
            <button
              onClick={handleNextMonth}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
            
            <button
              onClick={handleCurrentMonth}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Current
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Quantity</h3>
            <p className="text-2xl font-bold text-gray-900">{formatQuantity(totals.total_quantity)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.total_amount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Average Price/L</h3>
            <p className="text-2xl font-bold text-gray-900">
              {totals.total_quantity > 0 ? formatCurrency(totals.total_amount / totals.total_quantity) : '$0.00'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Days Recorded</h3>
            <p className="text-2xl font-bold text-gray-900">{fuels.length}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Amounts Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Sales by Date</h3>
            <div className="h-80">
              <Bar data={amountsChartData} options={chartOptions} />
            </div>
          </div>

          {/* Quantities Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Quantities by Date</h3>
            <div className="h-80">
              <Bar data={quantitiesChartData} options={quantityChartOptions} />
            </div>
          </div>
        </div>

        {/* Detailed Summary Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Type Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuel Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Price/L
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Regular (87)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(totals.regular_quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(totals.regular_total_sale)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totals.regular_quantity > 0 ? formatCurrency(totals.regular_total_sale / totals.regular_quantity) : '$0.00'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Plus (91)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(totals.plus_quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(totals.plus_total_sale)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totals.plus_quantity > 0 ? formatCurrency(totals.plus_total_sale / totals.plus_quantity) : '$0.00'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Sup Plus (94)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(totals.sup_plus_quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(totals.sup_plus_total_sale)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totals.sup_plus_quantity > 0 ? formatCurrency(totals.sup_plus_total_sale / totals.sup_plus_quantity) : '$0.00'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Diesel
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(totals.diesel_quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(totals.diesel_total_sale)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totals.diesel_quantity > 0 ? formatCurrency(totals.diesel_total_sale / totals.diesel_quantity) : '$0.00'}
                  </td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatQuantity(totals.total_quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(totals.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {totals.total_quantity > 0 ? formatCurrency(totals.total_amount / totals.total_quantity) : '$0.00'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelsReportPage; 