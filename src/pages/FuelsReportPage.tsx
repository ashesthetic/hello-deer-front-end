import React, { useState, useEffect, useRef } from 'react';
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
import { usePageTitle } from '../hooks/usePageTitle';
import { exportSalesReportToPDF } from '../utils/pdfExport';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

type ReportMode = 'current-month' | 'previous-month' | 'last-2-months' | 'last-3-months' | 'last-4-months' | 'last-5-months' | 'last-6-months' | 'last-7-months' | 'last-8-months' | 'last-9-months' | 'last-10-months' | 'last-11-months' | 'last-12-months';

const FuelsReportPage: React.FC = () => {
  usePageTitle('Fuels Report');
  const [fuels, setFuels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reportMode, setReportMode] = useState<ReportMode>('current-month');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFuelsData();
  }, [reportMode, currentYear, currentMonth]);

  const fetchFuelsData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      if (reportMode.startsWith('last-')) {
        // Handle last N months
        const monthsCount = parseInt(reportMode.split('-')[1]);
        const endDate = new Date(currentYear, currentMonth - 1, 0); // Last day of current month
        const startDate = new Date(currentYear, currentMonth - monthsCount, 1); // First day of N months ago
        
        response = await dailyFuelsApi.getAll({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });
      } else {
        // For current-month and previous-month modes
        let year = currentYear;
        let month = currentMonth;
        
        if (reportMode === 'previous-month') {
          if (month === 1) {
            month = 12;
            year = year - 1;
          } else {
            month = month - 1;
          }
        }
        
        response = await dailyFuelsApi.getByMonth(year, month);
      }
      
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

  const getReportTitle = () => {
    if (reportMode === 'current-month') {
      const currentDate = new Date();
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (reportMode === 'previous-month') {
      const date = new Date(currentYear, currentMonth - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (reportMode.startsWith('last-')) {
      const monthsCount = parseInt(reportMode.split('-')[1]);
      const endDate = new Date(currentYear, currentMonth - 1, 0);
      const startDate = new Date(currentYear, currentMonth - monthsCount, 1);
      return `Last ${monthsCount} Months (${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;
    }
    return 'Fuels Report';
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) {
      alert('Report content not found');
      return;
    }

    setExporting(true);
    try {
      let reportTitle = '';
      if (reportMode === 'current-month') {
        const currentDate = new Date();
        reportTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (reportMode === 'previous-month') {
        const date = new Date(currentYear, currentMonth - 1, 1);
        reportTitle = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        reportTitle = `${reportMode.replace('last-', '')} Months`;
      }
      
      await exportSalesReportToPDF(reportRef.current, `fuels-report-${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
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
            <p className="text-gray-600">Comprehensive analysis of daily fuel sales and quantities - {getReportTitle()}</p>
          </div>
          
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading || fuels.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Report Mode Selection */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="current-month"
                    checked={reportMode === 'current-month'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Current Month</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="previous-month"
                    checked={reportMode === 'previous-month'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Previous Month</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-2-months"
                    checked={reportMode === 'last-2-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 2 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-3-months"
                    checked={reportMode === 'last-3-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 3 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-4-months"
                    checked={reportMode === 'last-4-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 4 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-5-months"
                    checked={reportMode === 'last-5-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 5 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-6-months"
                    checked={reportMode === 'last-6-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 6 Months</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Extended Periods</label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-7-months"
                    checked={reportMode === 'last-7-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 7 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-8-months"
                    checked={reportMode === 'last-8-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 8 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-9-months"
                    checked={reportMode === 'last-9-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 9 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-10-months"
                    checked={reportMode === 'last-10-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 10 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-11-months"
                    checked={reportMode === 'last-11-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 11 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportMode"
                    value="last-12-months"
                    checked={reportMode === 'last-12-months'}
                    onChange={(e) => setReportMode(e.target.value as ReportMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Last 12 Months</span>
                </label>
              </div>
            </div>

            {/* Month Navigation (only show for current/previous month modes) */}
            {!reportMode.startsWith('last-') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousMonth}
                    disabled={loading}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                    {getMonthName(currentMonth)} {currentYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    disabled={loading}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    onClick={handleCurrentMonth}
                    disabled={loading}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Current Month
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="space-y-6">
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
    </div>
  );
};

export default FuelsReportPage; 