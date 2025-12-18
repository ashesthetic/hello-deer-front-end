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

interface SalesReportCardProps {
  title: string;
  dataField: 'reported_total' | 'fuel_sale';
  color: string;
}

interface SalesData {
  date: string;
  value: number;
}

interface TrendData {
  trend1: number;
  trend2: number;
  trend3: number;
}

const SalesReportCard: React.FC<SalesReportCardProps> = ({ title, dataField, color }) => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<TrendData>({ trend1: 0, trend2: 0, trend3: 0 });

  const fetchLast7DaysData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all sales data to find the last entry date
      const response = await dailySalesApi.getAll({
        per_page: 1000, // Get a large number to find the last entry
        sort_by: 'date',
        sort_direction: 'desc'
      });

      const salesData = response.data.data || [];
      
      if (salesData.length === 0) {
        setData([]);
        setPercentageChange({ trend1: 0, trend2: 0, trend3: 0 });
        setLoading(false);
        return;
      }

      // Find the last entry date - ensure it's in Alberta timezone
      const lastEntryDateStr = salesData[0].date.split('T')[0]; // Get just the date part
      const lastEntryDate = new Date(lastEntryDateStr + 'T00:00:00'); // Create date at midnight
      const startDate = new Date(lastEntryDate);
      startDate.setDate(startDate.getDate() - 14); // 15 days before the last entry

      // Format dates for API using timezone-aware formatting
      const startDateStr = startDate.toLocaleDateString('en-CA', {
        timeZone: 'America/Edmonton',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      const endDateStr = lastEntryDate.toLocaleDateString('en-CA', {
        timeZone: 'America/Edmonton',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');

      console.log('SalesReportCard - Date range:', {
        originalLastEntryDate: salesData[0].date,
        lastEntryDateStr,
        startDateStr,
        endDateStr,
        startDate: startDate.toISOString(),
        lastEntryDate: lastEntryDate.toISOString()
      });

      // Get data for the last 8 days from the last entry
      const rangeResponse = await dailySalesApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 100
      });

      const rangeData = rangeResponse.data.data || [];
      
      // Create a map of dates to values
      const dateMap = new Map<string, number>();
      
      // Fill in actual data first
      rangeData.forEach((sale: any) => {
        const saleDate = sale.date.split('T')[0];
        const currentValue = dateMap.get(saleDate) || 0;
        const newValue = dataField === 'reported_total' ? 
          parseFloat(sale.reported_total) || 0 : 
          parseFloat(sale.fuel_sale) || 0;
        dateMap.set(saleDate, currentValue + newValue);
      });

      // Only include dates that have actual data
      const sortedData: SalesData[] = Array.from(dateMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-15); // Take only the last 15 entries

      console.log('SalesReportCard - Final data:', {
        rangeDataCount: rangeData.length,
        dateMapEntries: Array.from(dateMap.entries()),
        sortedData: sortedData.map(item => ({ date: item.date, value: item.value, formattedDate: formatDateForDisplay(item.date) }))
      });

      setData(sortedData);

      // Calculate percentage changes
      if (sortedData.length >= 3) {
        const firstValue = sortedData[0].value;
        const middleIndex = Math.floor(sortedData.length / 2);
        const middleValue = sortedData[middleIndex].value;
        const lastValue = sortedData[sortedData.length - 1].value;
        
        // First to middle, middle to last, first to last
        const trend1 = firstValue !== 0 ? ((middleValue - firstValue) / firstValue) * 100 : 0;
        const trend2 = middleValue !== 0 ? ((lastValue - middleValue) / middleValue) * 100 : 0;
        const trend3 = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        
        setPercentageChange({ trend1, trend2, trend3 });
      } else {
        setPercentageChange({ trend1: 0, trend2: 0, trend3: 0 });
      }

    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataField]);

  useEffect(() => {
    fetchLast7DaysData();
  }, [fetchLast7DaysData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

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

    const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 40,
        bottom: 40,
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
          return formatCurrency(numValue);
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
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          stepSize: 300,
          callback: function(value: any, index: any, values: any) {
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
      
      <div className="h-56 mb-4 relative">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="text-sm text-gray-600">
        First to last date trend
      </div>
    </div>
  );
};

export default SalesReportCard; 