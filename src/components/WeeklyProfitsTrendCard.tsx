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

interface WeeklyProfitsTrendCardProps {
  title: string;
  color: string;
}

interface DailyData {
  date: string;
  value: number;
}

interface TrendData {
  trend1: number;
  trend2: number;
  trend3: number;
}

const WeeklyProfitsTrendCard: React.FC<WeeklyProfitsTrendCardProps> = ({ title, color }) => {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<TrendData>({ trend1: 0, trend2: 0, trend3: 0 });

  const fetchDailyProfitsData = useCallback(async () => {
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
        setPercentageChange({ trend1: 0, trend2: 0, trend3: 0 });
        setLoading(false);
        return;
      }

      // Find the last entry date
      const lastEntryDate = new Date(salesData[0].date);
      const startDate = new Date(lastEntryDate);
      startDate.setDate(startDate.getDate() - 14); // 15 days (including today)

      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = lastEntryDate.toISOString().split('T')[0];

      // Get data for the last 15 days from the last entry
      const rangeResponse = await dailySalesApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 1000
      });

      const rangeData = rangeResponse.data.data || [];
      
      // Create a map of dates to values
      const dateMap = new Map<string, number>();
      
      // Fill in actual data
      rangeData.forEach((sale: any) => {
        const saleDate = sale.date.split('T')[0];
        const currentValue = dateMap.get(saleDate) || 0;
        const newValue = parseFloat(sale.approximate_profit) || 0;
        dateMap.set(saleDate, currentValue + newValue);
      });

      // Convert to array and sort by date
      const sortedData: DailyData[] = Array.from(dateMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-15); // Take only the last 15 entries

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
      console.error('Failed to fetch daily profits trend data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyProfitsData();
  }, [fetchDailyProfitsData]);

  const formatDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      timeZone: 'America/Edmonton' 
    });
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

  // Create label colors array - matching the point colors
  const getLabelColors = () => {
    const colors = data.map(() => '#374151');
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
    datasets: [{
      ...createLineDataset(title, data.map(item => item.value), color),
      pointBackgroundColor: getPointColors(),
    }],
  };

  const customOptions = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
      datalabels: {
        ...lineChartOptions.plugins.datalabels,
        color: (context: any) => {
          const colors = getLabelColors();
          return colors[context.dataIndex];
        },
      }
    }
  };

  return (
    <ChartCard 
      title={
        <div className="flex items-center justify-between w-full">
          <span>{title}</span>
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
      }
      subtitle="First to last date trend"
      loading={loading}
    >
      <Line data={chartData} options={customOptions} />
    </ChartCard>
  );
};

export default WeeklyProfitsTrendCard;
