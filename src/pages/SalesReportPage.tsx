import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const SalesReportPage: React.FC = () => {
  usePageTitle('Sales Report');
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentMonthSales();
  }, []);

  const fetchCurrentMonthSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailySalesApi.getByMonth();
      setSales(response.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch sales data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Split the date string and format it directly to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-');
    // Use UTC to avoid timezone issues
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
    const dayStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC'
    });
    return `${dateStr}\n${dayStr}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const createChartData = (metric: keyof DailySale, label: string, color: string) => {
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const data = sortedSales.map(sale => Number(sale[metric]) || 0);
    
    // Find the top 3 values and their indices
    const dataWithIndices = data.map((value, index) => ({ value, index }));
    const sortedByValue = [...dataWithIndices].sort((a, b) => b.value - a.value);
    const top3Indices = sortedByValue.slice(0, 3).map(item => item.index);
    
    // Create background colors array
    const backgroundColors = data.map((_, index) => {
      if (top3Indices.includes(index)) {
        const top3Rank = top3Indices.indexOf(index);
        const top3Colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']; // Red, Teal, Blue for top 3
        return top3Colors[top3Rank];
      }
      return color; // Original color for other bars
    });
    
    return {
      labels: sortedSales.map(sale => formatDate(sale.date)),
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const createDayOfWeekChartData = (metric: keyof DailySale, label: string, color: string) => {
    // Group sales by day of week
    const dayOfWeekData: { [key: string]: number[] } = {
      'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': [], 'Sun': []
    };
    
    sales.forEach(sale => {
      const [year, month, day] = sale.date.split('T')[0].split('-');
      const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      dayOfWeekData[dayName].push(Number(sale[metric]) || 0);
    });
    
    // Calculate average for each day of week
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = dayLabels.map(day => {
      const values = dayOfWeekData[day];
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    // Find the top 3 days and their indices
    const dataWithIndices = data.map((value, index) => ({ value, index }));
    const sortedByValue = [...dataWithIndices].sort((a, b) => b.value - a.value);
    const top3Indices = sortedByValue.slice(0, 3).map(item => item.index);
    
    // Create background colors array
    const backgroundColors = data.map((_, index) => {
      if (top3Indices.includes(index)) {
        const top3Rank = top3Indices.indexOf(index);
        const top3Colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']; // Red, Teal, Blue for top 3
        return top3Colors[top3Rank];
      }
      return color; // Original color for other bars
    });
    
    return {
      labels: dayLabels,
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const createWeeklyGroupChartData = (metric: keyof DailySale, label: string, color: string) => {
    // Group sales by day of month (1st, 8th, 15th, 22nd, 29th, 2nd, 9th, 16th, 23rd, 30th, etc.)
    const weeklyGroupData: { [key: number]: number[] } = {};
    
    sales.forEach(sale => {
      const [year, month, day] = sale.date.split('T')[0].split('-');
      const dayOfMonth = parseInt(day);
      if (!weeklyGroupData[dayOfMonth]) {
        weeklyGroupData[dayOfMonth] = [];
      }
      weeklyGroupData[dayOfMonth].push(Number(sale[metric]) || 0);
    });
    
    // Create labels in the order: 1, 8, 15, 22, 29, 2, 9, 16, 23, 30, 3, 10, 17, 24, 31, 4, 11, 18, 25, 5, 12, 19, 26, 6, 13, 20, 27, 7, 14, 21, 28
    const weeklyOrder = [
      1, 8, 15, 22, 29,
      2, 9, 16, 23, 30,
      3, 10, 17, 24, 31,
      4, 11, 18, 25,
      5, 12, 19, 26,
      6, 13, 20, 27,
      7, 14, 21, 28
    ];
    
    // Filter only days that exist in our data
    const availableDays = weeklyOrder.filter(day => weeklyGroupData[day] && weeklyGroupData[day].length > 0);
    
    // Calculate average for each day group
    const data = availableDays.map(day => {
      const values = weeklyGroupData[day];
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    // Create labels with "Jul 1 Tue" format
    const labels = availableDays.map(day => {
      // Use the first occurrence of this day to get the month and day name
      const firstSaleWithThisDay = sales.find(sale => {
        const [year, month, dayStr] = sale.date.split('T')[0].split('-');
        return parseInt(dayStr) === day;
      });
      
      if (firstSaleWithThisDay) {
        const [year, month, dayStr] = firstSaleWithThisDay.date.split('T')[0].split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(dayStr)));
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        return `${monthStr} ${day}\n${dayName}`;
      }
      
      return `${day}`;
    });
    
    // Find the top 3 values and their indices
    const dataWithIndices = data.map((value, index) => ({ value, index }));
    const sortedByValue = [...dataWithIndices].sort((a, b) => b.value - a.value);
    const top3Indices = sortedByValue.slice(0, 3).map(item => item.index);
    
    // Create background colors array
    const backgroundColors = data.map((_, index) => {
      if (top3Indices.includes(index)) {
        const top3Rank = top3Indices.indexOf(index);
        const top3Colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']; // Red, Teal, Blue for top 3
        return top3Colors[top3Rank];
      }
      return color; // Original color for other bars
    });
    
    return {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 20,
        left: 15,
        right: 15
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = parseFloat(context.parsed.y) || 0;
            return formatCurrency(value);
          }
        }
      },
      datalabels: {
        display: true,
        color: '#374151',
        font: {
          weight: 'bold' as const,
          size: 10
        },
        formatter: function(value: any) {
          const numValue = parseFloat(value) || 0;
          return formatCurrency(numValue);
        },
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 4,
        padding: {
          top: 2,
          bottom: 2,
          left: 4,
          right: 4
        }
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
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

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600">Comprehensive analysis of daily sales performance - {currentMonthName}</p>
        </div>

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-500 text-center">No sales data available for the current month.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Groups vs Reported Total */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Groups vs Reported Total (Average)</h3>
              <p className="text-sm text-gray-600 mb-4">Grouped by: 1,8,15,22,29 | 2,9,16,23,30 | 3,10,17,24,31 | etc.</p>
              <div className="h-80">
                <Bar data={createWeeklyGroupChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Reported Total */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Reported Total</h3>
              <div className="h-80">
                <Bar data={createChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Fuel Sale */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Fuel Sale</h3>
              <div className="h-80">
                <Bar data={createChartData('fuel_sale', 'Fuel Sale', '#10B981')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Store Sale */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Store Sale</h3>
              <div className="h-80">
                <Bar data={createChartData('store_sale', 'Store Sale', '#F59E0B')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Card</h3>
              <div className="h-80">
                <Bar data={createChartData('card', 'Card', '#8B5CF6')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Cash */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Cash</h3>
              <div className="h-80">
                <Bar data={createChartData('cash', 'Cash', '#EF4444')} options={chartOptions} />
              </div>
            </div>

            {/* Day of Week vs Reported Total */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Reported Total (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
              </div>
            </div>

            {/* Day of Week vs Fuel Sale */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Fuel Sale (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('fuel_sale', 'Fuel Sale', '#10B981')} options={chartOptions} />
              </div>
            </div>

            {/* Day of Week vs Store Sale */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Store Sale (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('store_sale', 'Store Sale', '#F59E0B')} options={chartOptions} />
              </div>
            </div>

            {/* Day of Week vs Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Card (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('card', 'Card', '#8B5CF6')} options={chartOptions} />
              </div>
            </div>

            {/* Day of Week vs Cash */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Cash (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('cash', 'Cash', '#EF4444')} options={chartOptions} />
              </div>
            </div>

            {/* Data Table View */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Table View</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Sale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Sale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.reported_total || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.fuel_sale || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.store_sale || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.gst || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.card || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.cash || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.coupon || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.delivery || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReportPage; 