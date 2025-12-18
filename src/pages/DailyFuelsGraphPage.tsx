import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const DailyFuelsGraphPage: React.FC = () => {
  const navigate = useNavigate();
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
        data: fuels.map(fuel => fuel.regular_total || 0),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'Plus (91)',
        data: fuels.map(fuel => fuel.plus_total || 0),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Sup Plus (94)',
        data: fuels.map(fuel => fuel.sup_plus_total || 0),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1,
      },
      {
        label: 'Diesel',
        data: fuels.map(fuel => fuel.diesel_total || 0),
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
            return `${label}: ${isQuantity ? formatQuantity(value) : formatCurrency(value)}`;
          }
        }
      },
      datalabels: {
        display: false, // Hide data labels for better readability
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        },
      },
      y: {
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          callback: function(value: any) {
            const numValue = parseFloat(value) || 0;
            // For quantity chart, we'll use a different approach
            return formatCurrency(numValue);
          }
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Daily Fuels Graph</h1>
          <button
            onClick={() => navigate('/report-graph')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Reports
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Month Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {getMonthName(currentMonth)} {currentYear}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousMonth}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={handleCurrentMonth}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Current Month
              </button>
              <button
                onClick={handleNextMonth}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>

          {fuels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No fuel data found for {getMonthName(currentMonth)} {currentYear}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Fuel Amounts Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Fuel Amounts</h3>
                <div className="h-96">
                  <Bar data={amountsChartData} options={chartOptions} />
                </div>
              </div>

              {/* Fuel Quantities Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Fuel Quantities</h3>
                <div className="h-96">
                  <Bar data={quantitiesChartData} options={chartOptions} />
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Regular (87)</h4>
                  <div className="text-sm text-blue-700">
                    <div>Total Qty: {formatQuantity(fuels.reduce((sum, fuel) => sum + (fuel.regular_quantity || 0), 0))}</div>
                    <div>Total Amount: {formatCurrency(fuels.reduce((sum, fuel) => sum + (fuel.regular_total || 0), 0))}</div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Plus (91)</h4>
                  <div className="text-sm text-green-700">
                    <div>Total Qty: {formatQuantity(fuels.reduce((sum, fuel) => sum + (fuel.plus_quantity || 0), 0))}</div>
                    <div>Total Amount: {formatCurrency(fuels.reduce((sum, fuel) => sum + (fuel.plus_total || 0), 0))}</div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Sup Plus (94)</h4>
                  <div className="text-sm text-purple-700">
                    <div>Total Qty: {formatQuantity(fuels.reduce((sum, fuel) => sum + (fuel.sup_plus_quantity || 0), 0))}</div>
                    <div>Total Amount: {formatCurrency(fuels.reduce((sum, fuel) => sum + (fuel.sup_plus_total || 0), 0))}</div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Diesel</h4>
                  <div className="text-sm text-orange-700">
                    <div>Total Qty: {formatQuantity(fuels.reduce((sum, fuel) => sum + (fuel.diesel_quantity || 0), 0))}</div>
                    <div>Total Amount: {formatCurrency(fuels.reduce((sum, fuel) => sum + (fuel.diesel_total || 0), 0))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyFuelsGraphPage; 