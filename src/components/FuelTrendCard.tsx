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
import { formatDateForDisplay, parseDateSafely } from '../utils/dateUtils';

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

interface FuelTrendCardProps {
  title: string;
  dataField: 'total_quantity' | 'total_amount';
  color: string;
}

interface FuelData {
  date: string;
  value: number;
}

interface TrendData {
  trend1: number;
  trend2: number;
  trend3: number;
}

const FuelTrendCard: React.FC<FuelTrendCardProps> = ({ title, dataField, color }) => {
  const [data, setData] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<TrendData>({ trend1: 0, trend2: 0, trend3: 0 });

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatQuantity = (quantity: number) => {
    return `${quantity.toFixed(2)} L`;
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const fetchLast7DaysData = useCallback(async () => {
    setLoading(true);
    try {
      // First, get the last entry date from the database
      const lastEntryResponse = await dailyFuelsApi.getAll({
        per_page: 1,
        sort: 'date',
        order: 'desc'
      });

      const lastEntry = lastEntryResponse.data.data?.[0];
      if (!lastEntry) {
        console.log('FuelTrendCard - No fuel data found');
        setData([]);
        setLoading(false);
        return;
      }

      // Parse the last entry date
      const lastEntryDate = parseDateSafely(lastEntry.date);
      const lastEntryDateStr = lastEntryDate.toLocaleDateString('en-CA');

      // Calculate 15 days before the last entry date
      const rangeStartDate = new Date(lastEntryDate);
      rangeStartDate.setDate(rangeStartDate.getDate() - 14); // 15 days total (including last entry date)
      const startDateStr = rangeStartDate.toLocaleDateString('en-CA');





      // Get data for the 8 days ending on the last entry date
      const rangeResponse = await dailyFuelsApi.getAll({
        start_date: startDateStr,
        end_date: lastEntryDateStr,
        per_page: 100
      });

      const rangeData = rangeResponse.data.data || [];
      
      // Create a map of dates to values
      const dateMap = new Map<string, number>();
      
      // Fill in actual data first
      rangeData.forEach((fuel: any) => {
        const fuelDate = parseDateSafely(fuel.date).toLocaleDateString('en-CA');
        const currentValue = dateMap.get(fuelDate) || 0;
        let newValue = 0;
        
        if (dataField === 'total_quantity') {
          newValue = parseFloat(fuel.regular_quantity || 0) + parseFloat(fuel.plus_quantity || 0) + parseFloat(fuel.sup_plus_quantity || 0) + parseFloat(fuel.diesel_quantity || 0);
        } else if (dataField === 'total_amount') {
          newValue = parseFloat(fuel.regular_total_sale || 0) + parseFloat(fuel.plus_total_sale || 0) + parseFloat(fuel.sup_plus_total_sale || 0) + parseFloat(fuel.diesel_total_sale || 0);
        }
        

        
        dateMap.set(fuelDate, currentValue + newValue);
      });

      // Create a continuous 15-day range and fill in zeros for missing dates
      const allDates: FuelData[] = [];
      const chartStartDate = parseDateSafely(startDateStr); // Use parseDateSafely for consistency
      const currentDate = new Date(chartStartDate);
      

      
      for (let i = 0; i < 15; i++) {
        const dateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const value = dateMap.get(dateStr) || 0;
        allDates.push({ date: dateStr, value });
        

        
        currentDate.setDate(currentDate.getDate() + 1);
      }


      
      setData(allDates);

      // Calculate percentage changes
      if (allDates.length >= 3) {
        const firstValue = allDates[0].value;
        const middleIndex = Math.floor(allDates.length / 2);
        const middleValue = allDates[middleIndex].value;
        const lastValue = allDates[allDates.length - 1].value;
        
        // First to middle, middle to last, first to last
        const trend1 = firstValue !== 0 ? ((middleValue - firstValue) / firstValue) * 100 : 0;
        const trend2 = middleValue !== 0 ? ((lastValue - middleValue) / middleValue) * 100 : 0;
        const trend3 = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        
        setPercentageChange({ trend1, trend2, trend3 });
      } else {
        setPercentageChange({ trend1: 0, trend2: 0, trend3: 0 });
      }
    } catch (error) {
      console.error('Error fetching fuel trend data:', error);
      setData([]);
      setPercentageChange({ trend1: 0, trend2: 0, trend3: 0 });
    } finally {
      setLoading(false);
    }
  }, [dataField]);

  useEffect(() => {
    fetchLast7DaysData();
  }, [fetchLast7DaysData]);

  // Create point colors array - first, middle, and last points get yellow color
  const getPointColors = () => {
    const colors = data.map(() => color);
    if (data.length > 0) {
      colors[0] = '#EAB308'; // Yellow for first
      if (data.length > 2) {
        const middleIndex = Math.floor(data.length / 2);
        colors[middleIndex] = '#EAB308'; // Yellow for middle
      }
      colors[data.length - 1] = '#EAB308'; // Yellow for last
    }
    return colors;
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
        pointBackgroundColor: getPointColors(),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            if (dataField === 'total_quantity') {
              return `${context.dataset.label}: ${formatQuantity(value)}`;
            } else {
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            }
          }
        }
      },
      datalabels: {
        display: true,
        color: (context: any) => {
          const index = context.dataIndex;
          if (index === 0) return '#EAB308'; // Yellow for first
          if (data.length > 2 && index === Math.floor(data.length / 2)) return '#EAB308'; // Yellow for middle
          if (index === data.length - 1) return '#EAB308'; // Yellow for last
          return '#374151';
        },
        font: {
          weight: 'bold' as const,
          size: 11
        },
        formatter: function(value: any) {
          const numValue = parseFloat(value) || 0;
          if (dataField === 'total_quantity') {
            return formatQuantity(numValue);
          } else {
            return formatCurrency(numValue);
          }
        },
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 4,
        padding: {
          top: 2,
          bottom: 2,
          left: 4,
          right: 4
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        display: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            if (dataField === 'total_quantity') {
              return formatQuantity(value);
            } else {
              return formatCurrency(value);
            }
          }
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">1st→2nd:</span>
            <span className={`font-medium ${percentageChange.trend1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentageChange.trend1 >= 0 ? '+' : ''}{percentageChange.trend1.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">2nd→3rd:</span>
            <span className={`font-medium ${percentageChange.trend2 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentageChange.trend2 >= 0 ? '+' : ''}{percentageChange.trend2.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">1st→3rd:</span>
            <span className={`font-medium ${percentageChange.trend3 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentageChange.trend3 >= 0 ? '+' : ''}{percentageChange.trend3.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default FuelTrendCard; 