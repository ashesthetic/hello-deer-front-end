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

const DailySalesGraphPage: React.FC = () => {
  usePageTitle('Daily Sales Graph');
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
      const dayOfMonth = parseInt(sale.date.split('T')[0].split('-')[2]);
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
        const dayStr = sale.date.split('T')[0].split('-')[2];
        return parseInt(dayStr) === day;
      });
      
      if (firstSaleWithThisDay) {
        const date = new Date(Date.UTC(parseInt(firstSaleWithThisDay.date.split('T')[0].split('-')[0]), parseInt(firstSaleWithThisDay.date.split('T')[0].split('-')[1]) - 1, parseInt(firstSaleWithThisDay.date.split('T')[0].split('-')[2])));
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
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      },
      // Custom plugin to show values on top of bars
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 4,
        color: '#374151',
        font: {
          size: 11,
          weight: 'bold' as const
        },
        formatter: function(value: any) {
          return formatCurrency(value);
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Sales Graph</h1>
          <p className="text-gray-600 mt-2">Current Month: {currentMonthName}</p>
        </div>

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-500 text-center">No sales data available for the current month.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Animated Bar Charts - Weekly Groups */}
            <div className="grid grid-cols-1 gap-6">
              {/* Weekly Group vs Reported Total */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Groups vs Reported Total (Average)</h3>
                <p className="text-sm text-gray-600 mb-4">Grouped by: 1,8,15,22,29 | 2,9,16,23,30 | 3,10,17,24,31 | etc.</p>
                <div className="h-64">
                  <Bar data={createWeeklyGroupChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Animated Bar Charts - By Date */}
            <div className="grid grid-cols-1 gap-6">
              {/* Date vs Reported Total */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Reported Total</h3>
                <div className="h-64">
                  <Bar data={createChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
                </div>
              </div>

              {/* Date vs Fuel Sale */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Fuel Sale</h3>
                <div className="h-64">
                  <Bar data={createChartData('fuel_sale', 'Fuel Sale', '#10B981')} options={chartOptions} />
                </div>
              </div>

              {/* Date vs Store Sale */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Store Sale</h3>
                <div className="h-64">
                  <Bar data={createChartData('store_sale', 'Store Sale', '#F59E0B')} options={chartOptions} />
                </div>
              </div>

              {/* Date vs Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Card</h3>
                <div className="h-64">
                  <Bar data={createChartData('card', 'Card', '#8B5CF6')} options={chartOptions} />
                </div>
              </div>

              {/* Date vs Cash */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Cash</h3>
                <div className="h-64">
                  <Bar data={createChartData('cash', 'Cash', '#EF4444')} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Animated Bar Charts - By Day of Week */}
            <div className="grid grid-cols-1 gap-6">
              {/* Day of Week vs Reported Total */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Reported Total (Average)</h3>
                <div className="h-64">
                  <Bar data={createDayOfWeekChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
                </div>
              </div>

              {/* Day of Week vs Fuel Sale */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Fuel Sale (Average)</h3>
                <div className="h-64">
                  <Bar data={createDayOfWeekChartData('fuel_sale', 'Fuel Sale', '#10B981')} options={chartOptions} />
                </div>
              </div>

              {/* Day of Week vs Store Sale */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Store Sale (Average)</h3>
                <div className="h-64">
                  <Bar data={createDayOfWeekChartData('store_sale', 'Store Sale', '#F59E0B')} options={chartOptions} />
                </div>
              </div>

              {/* Day of Week vs Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Card (Average)</h3>
                <div className="h-64">
                  <Bar data={createDayOfWeekChartData('card', 'Card', '#8B5CF6')} options={chartOptions} />
                </div>
              </div>

              {/* Day of Week vs Cash */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Cash (Average)</h3>
                <div className="h-64">
                  <Bar data={createDayOfWeekChartData('cash', 'Cash', '#EF4444')} options={chartOptions} />
                </div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.reported_total || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.fuel_sale || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.store_sale || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.card || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.cash || 0)}</td>
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

export default DailySalesGraphPage; 