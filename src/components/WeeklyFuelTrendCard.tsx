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
import { dailyFuelsApi } from '../services/api';

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

interface WeeklyFuelTrendCardProps {
  title: string;
  dataField: 'total_amount' | 'total_quantity' | 'regular_total' | 'plus_total' | 'sup_plus_total' | 'diesel_total' | 'regular_total_sale' | 'plus_total_sale' | 'sup_plus_total_sale' | 'diesel_total_sale';
  color: string;
}

interface WeeklyData {
  week: string;
  value: number;
}

const WeeklyFuelTrendCard: React.FC<WeeklyFuelTrendCardProps> = ({ title, dataField, color }) => {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<number>(0);



  const fetchWeeklyTrendData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all fuel data to find the last entry date
      const response = await dailyFuelsApi.getAll({
        per_page: 1000,
        sort_by: 'date',
        sort_direction: 'desc'
      });

      const fuelData = response.data.data || [];
      
      if (fuelData.length === 0) {
        setData([]);
        setPercentageChange(0);
        setLoading(false);
        return;
      }

      // Find the last entry date
      const lastEntryDate = new Date(fuelData[0].date);
      const startDate = new Date(lastEntryDate);
      startDate.setDate(startDate.getDate() - 27); // 4 weeks (28 days) before the last entry

      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = lastEntryDate.toISOString().split('T')[0];

      // Get data for the last 4 weeks from the last entry
      const rangeResponse = await dailyFuelsApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 1000
      });

      const rangeData = rangeResponse.data.data || [];
      
      // Group data by week
      const weekMap = new Map<string, number>();
      
      rangeData.forEach((fuel: any) => {
        const fuelDate = new Date(fuel.date);
        const weekStart = new Date(fuelDate);
        weekStart.setDate(weekStart.getDate() - fuelDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        const currentValue = weekMap.get(weekKey) || 0;
        let newValue = 0;
        
        if (dataField === 'total_amount') {
          newValue = (fuel.regular_total || 0) + (fuel.plus_total || 0) + (fuel.sup_plus_total || 0) + (fuel.diesel_total || 0);
        } else if (dataField === 'total_quantity') {
          newValue = (fuel.regular_quantity || 0) + (fuel.plus_quantity || 0) + (fuel.sup_plus_quantity || 0) + (fuel.diesel_quantity || 0);
        } else if (dataField === 'regular_total_sale') {
          newValue = fuel.regular_total_sale || 0;
        } else if (dataField === 'plus_total_sale') {
          newValue = fuel.plus_total_sale || 0;
        } else if (dataField === 'sup_plus_total_sale') {
          newValue = fuel.sup_plus_total_sale || 0;
        } else if (dataField === 'diesel_total_sale') {
          newValue = fuel.diesel_total_sale || 0;
        }
        
        weekMap.set(weekKey, currentValue + newValue);
      });

      // Convert to array and sort by week
      const sortedData: WeeklyData[] = Array.from(weekMap.entries())
        .map(([week, value]) => ({ week, value }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-4); // Take only the last 4 weeks

      setData(sortedData);

      // Calculate percentage change - compare last week with previous week
      if (sortedData.length >= 2) {
        const lastWeekValue = sortedData[sortedData.length - 1].value;
        const previousWeekValue = sortedData[sortedData.length - 2].value;
        const change = previousWeekValue !== 0 ? ((lastWeekValue - previousWeekValue) / previousWeekValue) * 100 : 0;
        setPercentageChange(change);
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

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(quantity) + 'L';
  };

  const formatWeek = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6);
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const isQuantityField = dataField === 'total_quantity';

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
            return isQuantityField ? formatQuantity(value) : formatCurrency(value);
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
          return isQuantityField ? formatQuantity(numValue) : formatCurrency(numValue);
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
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          stepSize: isQuantityField ? undefined : 500,
          callback: function(value: any) {
            const numValue = parseFloat(value) || 0;
            return isQuantityField ? formatQuantity(numValue) : formatCurrency(numValue);
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

export default WeeklyFuelTrendCard; 