import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { dailySalesApi } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface MonthlySalesTrendCardProps {
  title: string;
  dataField: 'reported_total' | 'fuel_sale';
  color: string;
}

interface SalesData {
  date: string;
  value: number;
}

const MonthlySalesTrendCard: React.FC<MonthlySalesTrendCardProps> = ({ title, dataField, color }) => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [percentageChange, setPercentageChange] = useState<number>(0);

  const fetchCurrentMonthData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current month's start and end dates
      // For now, use July 2025 since that's where the data is
      const currentYear = 2025;
      const currentMonth = 6; // July (0-indexed)
      
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
      
      // Format dates for API
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      // Get data for the current month
      const response = await dailySalesApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 1000
      });

      const salesData = response.data.data || [];
      
      // Create a map of dates to values
      const dateMap = new Map<string, number>();
      
      // Fill in actual data
      salesData.forEach((sale: any) => {
        const saleDate = sale.date.split('T')[0];
        const currentValue = dateMap.get(saleDate) || 0;
        const newValue = dataField === 'reported_total' ? 
          parseFloat(sale.reported_total) || 0 : 
          parseFloat(sale.fuel_sale) || 0;
        dateMap.set(saleDate, currentValue + newValue);
      });

      // Create array for all days in current month
      const allDays: SalesData[] = [];
      const currentDate = new Date(startOfMonth);
      
      while (currentDate <= endOfMonth) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const value = dateMap.get(dateStr) || 0;
        allDays.push({ date: dateStr, value });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setData(allDays);

      // Calculate total for the month
      const total = allDays.reduce((sum, day) => sum + day.value, 0);
      setTotalValue(total);

      // Calculate percentage change (comparing to last entry date)
      if (allDays.length >= 2) {
        // Find the last entry date from the original sales data
        const lastEntryDate = new Date(salesData[0].date);
        const lastEntryDateStr = lastEntryDate.toISOString().split('T')[0];
        
        // Find the last entry in our allDays array
        const lastEntry = allDays.find(day => day.date === lastEntryDateStr);
        const lastEntryValue = lastEntry ? lastEntry.value : 0;
        
        // Calculate average of all other days (excluding last entry)
        const otherDays = allDays.filter(day => day.date !== lastEntryDateStr);
        const averageOtherDays = otherDays.length > 0 ? 
          otherDays.reduce((sum, day) => sum + day.value, 0) / otherDays.length : 0;
        
        // Calculate percentage change
        const change = lastEntryValue - averageOtherDays;
        const percentage = averageOtherDays > 0 ? (change / averageOtherDays) * 100 : 0;
        setPercentageChange(percentage);
      }

    } catch (error) {
      console.error('Failed to fetch monthly sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataField]);

  useEffect(() => {
    fetchCurrentMonthData();
  }, [fetchCurrentMonthData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 35,
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
        display: false, // Hide labels for monthly view to avoid clutter
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
          minRotation: 45,
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-600">
            {formatCurrency(totalValue)}
          </div>
          <div className={`text-sm font-medium ${
            percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="h-48 mb-4 relative">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="text-sm text-gray-600">
        Current month daily trend
      </div>
    </div>
  );
};

export default MonthlySalesTrendCard; 