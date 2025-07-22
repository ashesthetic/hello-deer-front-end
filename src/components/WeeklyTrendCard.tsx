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
import { parseDateSafely } from '../utils/dateUtils';

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

interface WeeklyTrendCardProps {
  title: string;
  dataField: 'reported_total' | 'fuel_sale';
  color: string;
}

interface WeeklyData {
  week: string;
  value: number;
}

const WeeklyTrendCard: React.FC<WeeklyTrendCardProps> = ({ title, dataField, color }) => {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<number>(0);

  const fetchWeeklyTrendData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all sales data to find the last entry date
      const response = await dailySalesApi.getAll({
        per_page: 1000,
        sort_by: 'date',
        sort_direction: 'desc'
      });

      const salesData = response.data.data || [];
      
      if (salesData.length === 0) {
        setData([]);
        setPercentageChange(0);
        setLoading(false);
        return;
      }

      // Find the last entry date
      const lastEntryDate = new Date(salesData[0].date);
      const startDate = new Date(lastEntryDate);
      startDate.setDate(startDate.getDate() - 27); // 4 weeks (28 days) before the last entry

      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = lastEntryDate.toISOString().split('T')[0];

      // Get data for the last 4 weeks from the last entry
      const rangeResponse = await dailySalesApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 1000
      });

      const rangeData = rangeResponse.data.data || [];
      
      // Group data by week
      const weekMap = new Map<string, number>();
      
      rangeData.forEach((sale: any) => {
        const saleDate = new Date(sale.date);
        const weekStart = new Date(saleDate);
        weekStart.setDate(weekStart.getDate() - saleDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        const currentValue = weekMap.get(weekKey) || 0;
        const newValue = dataField === 'reported_total' ? 
          parseFloat(sale.reported_total) || 0 : 
          parseFloat(sale.fuel_sale) || 0;
        weekMap.set(weekKey, currentValue + newValue);
      });

      // Convert to array and sort by week
      const sortedData: WeeklyData[] = Array.from(weekMap.entries())
        .map(([week, value]) => ({ week, value }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-4); // Take only the last 4 weeks

      setData(sortedData);

      // Calculate percentage change
      if (sortedData.length >= 2) {
        const firstValue = sortedData[0].value;
        const lastValue = sortedData[sortedData.length - 1].value;
        const change = lastValue - firstValue;
        const percentage = firstValue > 0 ? (change / firstValue) * 100 : 0;
        setPercentageChange(percentage);
      }

    } catch (error) {
      console.error('Failed to fetch weekly trend data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataField]);

  useEffect(() => {
    fetchWeeklyTrendData();
  }, [fetchWeeklyTrendData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatWeek = (dateString: string) => {
    const date = parseDateSafely(dateString);
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6);
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const chartData = {
    labels: data.map(item => formatWeek(item.week)),
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
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 50,
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
          size: 9
        },
        formatter: function(value: any) {
          const numValue = parseFloat(value) || 0;
          return formatCurrency(numValue);
        },
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 3,
        padding: {
          top: 1,
          bottom: 1,
          left: 3,
          right: 3
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
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          stepSize: 500,
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
        <div className={`text-sm font-medium ${
          percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
        </div>
      </div>
      
      <div className="h-56 mb-4 relative">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="text-sm text-gray-600">
        Last 4 weeks trend
      </div>
    </div>
  );
};

export default WeeklyTrendCard; 