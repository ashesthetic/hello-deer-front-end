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
import { ChartCard } from './common/ChartCard';
import { 
  lineChartOptions, 
  createLineDataset
} from '../utils/chartConfigs';
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
      startDate.setDate(startDate.getDate() - 55); // 8 weeks (56 days) before the last entry

      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = lastEntryDate.toISOString().split('T')[0];

      // Get data for the last 8 weeks from the last entry
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
        // Calculate Monday as start of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = saleDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; otherwise go back (dayOfWeek - 1) days
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        
        // Use timezone-aware date formatting for the week key
        const weekKey = weekStart.toLocaleDateString('en-CA', {
          timeZone: 'America/Edmonton',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        
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
        .slice(-8); // Take only the last 8 weeks

      setData(sortedData);

      // Calculate percentage change - compare first and last weeks
      if (sortedData.length >= 2) {
        const firstWeekValue = sortedData[0].value;
        const lastWeekValue = sortedData[sortedData.length - 1].value;
        const change = firstWeekValue !== 0 ? ((lastWeekValue - firstWeekValue) / firstWeekValue) * 100 : 0;
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



  const formatWeekCustom = (dateString: string) => {
    const date = parseDateSafely(dateString);
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6); // Monday + 6 days = Sunday
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Edmonton' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Edmonton' })}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartData = {
    labels: data.map(item => formatWeekCustom(item.week)),
    datasets: [createLineDataset(title, data.map(item => item.value), color)],
  };

  const customOptions = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
      datalabels: {
        ...lineChartOptions.plugins.datalabels,
        formatter: function(value: any, context: any) {
          const numValue = parseFloat(value) || 0;
          const index = context.dataIndex;
          
          if (index === 0) {
            // First week - no comparison
            return formatCurrency(numValue);
          } else {
            // Calculate difference from previous week
            const previousValue = data[index - 1].value;
            const difference = numValue - previousValue;
            const percentChange = previousValue !== 0 ? ((difference / previousValue) * 100) : 0;
            const sign = difference >= 0 ? '+' : '';
            
            return `${formatCurrency(numValue)}\n(${sign}${percentChange.toFixed(1)}%)`;
          }
        },
        font: function(context: any) {
          const index = context.dataIndex;
          if (index === 0) {
            return {
              weight: 'bold' as const,
              size: 10
            };
          }
          
          const previousValue = data[index - 1].value;
          const currentValue = data[index].value;
          const difference = currentValue - previousValue;
          
          return {
            weight: 'bold' as const,
            size: 10
          };
        },
        color: function(context: any) {
          const index = context.dataIndex;
          if (index === 0) {
            return '#374151'; // Default gray for first week
          }
          
          const previousValue = data[index - 1].value;
          const currentValue = data[index].value;
          const difference = currentValue - previousValue;
          
          // Return color based on change
          if (difference > 0) {
            return '#10B981'; // Green for positive
          } else if (difference < 0) {
            return '#EF4444'; // Red for negative
          } else {
            return '#374151'; // Gray for no change
          }
        },
      }
    }
  };

  return (
    <ChartCard 
      title={
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <div className={`text-sm font-medium ${
            percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
          </div>
        </div>
      }
      subtitle="First to last week trend"
      loading={loading}
    >
      <Line data={chartData} options={customOptions} />
    </ChartCard>
  );
};

export default WeeklyTrendCard; 