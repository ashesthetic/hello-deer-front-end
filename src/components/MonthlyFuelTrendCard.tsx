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
import { formatDateForDisplay } from '../utils/dateUtils';

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

interface MonthlyFuelTrendCardProps {
  title: string;
  dataField: 'total_amount' | 'total_quantity' | 'regular_total_sale' | 'plus_total_sale' | 'sup_plus_total_sale' | 'diesel_total_sale';
  color: string;
}

interface FuelData {
  date: string;
  value: number;
}

const MonthlyFuelTrendCard: React.FC<MonthlyFuelTrendCardProps> = ({ title, dataField, color }) => {
  const [data, setData] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [percentageChange, setPercentageChange] = useState<number>(0);

  const fetchCurrentMonthData = useCallback(async () => {
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
        setTotalValue(0);
        setPercentageChange(0);
        setLoading(false);
        return;
      }

      // Find the last entry date
      const lastEntryDate = new Date(fuelData[0].date);
      
      // Get the month of the last entry
      const lastEntryYear = lastEntryDate.getFullYear();
      const lastEntryMonth = lastEntryDate.getMonth();
      
      const startOfMonth = new Date(lastEntryYear, lastEntryMonth, 1);
      const endOfMonth = new Date(lastEntryYear, lastEntryMonth + 1, 0); // Last day of the month
      
      // Format dates for API
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      console.log('MonthlyFuelTrendCard - Fetching data for:', { startDateStr, endDateStr, dataField });

      // Get data for the current month
      const rangeResponse = await dailyFuelsApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 1000
      });

      console.log('MonthlyFuelTrendCard - API Response:', rangeResponse);
      console.log('MonthlyFuelTrendCard - Response data:', rangeResponse.data);

      const rangeData = rangeResponse.data.data || [];
      console.log('MonthlyFuelTrendCard - Fuel data received:', rangeData);
      
      // Create a map of dates to values
      const dateMap = new Map<string, number>();
      
      console.log('MonthlyFuelTrendCard - Processing fuel data for field:', dataField);
      
      // Fill in actual data
      rangeData.forEach((fuel: any) => {
        const fuelDate = fuel.date.split('T')[0];
        const currentValue = dateMap.get(fuelDate) || 0;
        let newValue = 0;
        
        console.log('MonthlyFuelTrendCard - Processing fuel record:', {
          date: fuelDate,
          regular_total_sale: fuel.regular_total_sale,
          plus_total_sale: fuel.plus_total_sale,
          sup_plus_total_sale: fuel.sup_plus_total_sale,
          diesel_total_sale: fuel.diesel_total_sale
        });
        
        if (dataField === 'total_amount') {
          newValue = parseFloat(fuel.regular_total_sale || 0) + parseFloat(fuel.plus_total_sale || 0) + parseFloat(fuel.sup_plus_total_sale || 0) + parseFloat(fuel.diesel_total_sale || 0);
        } else if (dataField === 'total_quantity') {
          newValue = parseFloat(fuel.regular_quantity || 0) + parseFloat(fuel.plus_quantity || 0) + parseFloat(fuel.sup_plus_quantity || 0) + parseFloat(fuel.diesel_quantity || 0);
        } else if (dataField === 'regular_total_sale') {
          newValue = parseFloat(fuel.regular_total_sale || 0);
        } else if (dataField === 'plus_total_sale') {
          newValue = parseFloat(fuel.plus_total_sale || 0);
        } else if (dataField === 'sup_plus_total_sale') {
          newValue = parseFloat(fuel.sup_plus_total_sale || 0);
        } else if (dataField === 'diesel_total_sale') {
          newValue = parseFloat(fuel.diesel_total_sale || 0);
        }
        
        console.log('MonthlyFuelTrendCard - Calculated value for', fuelDate, ':', newValue);
        dateMap.set(fuelDate, currentValue + newValue);
      });

      // Create array for all days in current month
      const allDays: FuelData[] = [];
      const currentDate = new Date(startOfMonth);
      
      while (currentDate <= endOfMonth) {
        // Use timezone-aware date formatting
        const dateStr = currentDate.toLocaleDateString('en-CA', {
          timeZone: 'America/Edmonton',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        const value = dateMap.get(dateStr) || 0;
        allDays.push({ date: dateStr, value });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('MonthlyFuelTrendCard - Final allDays array:', allDays);
      console.log('MonthlyFuelTrendCard - Date map:', Object.fromEntries(dateMap));
      
      setData(allDays);

      // Calculate total for the month
      const total = allDays.reduce((sum, day) => sum + day.value, 0);
      console.log('MonthlyFuelTrendCard - Total for month:', total);
      setTotalValue(total);

      // Calculate percentage change (comparing to last entry date)
      if (allDays.length >= 2 && fuelData.length > 0) {
        try {
          // Find the last entry date from the original fuel data
          const lastEntryDate = new Date(fuelData[0].date);
          const lastEntryDateStr = lastEntryDate.toLocaleDateString('en-CA', {
            timeZone: 'America/Edmonton',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\//g, '-');
          
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
        } catch (error) {
          console.error('Error calculating percentage change:', error);
          setPercentageChange(0);
        }
      } else {
        setPercentageChange(0);
      }

    } catch (error: any) {
      console.error('Failed to fetch monthly fuel data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
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

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(quantity) + 'L';
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const isQuantityField = dataField === 'total_quantity';

  console.log('MonthlyFuelTrendCard - Creating chart data with:', {
    dataLength: data.length,
    labels: data.map(item => formatDate(item.date)),
    values: data.map(item => item.value),
    title,
    color
  });

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
            return isQuantityField ? formatQuantity(value) : formatCurrency(value);
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
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
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
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-600">
            {isQuantityField ? formatQuantity(totalValue) : formatCurrency(totalValue)}
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

export default MonthlyFuelTrendCard; 