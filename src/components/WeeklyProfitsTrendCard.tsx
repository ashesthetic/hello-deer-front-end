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

const WeeklyProfitsTrendCard: React.FC<WeeklyProfitsTrendCardProps> = ({ title, color }) => {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentageChange, setPercentageChange] = useState<number>(0);

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
        setPercentageChange(0);
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

      // Calculate percentage change - compare first and last days
      if (sortedData.length >= 2) {
        const firstDayValue = sortedData[0].value;
        const lastDayValue = sortedData[sortedData.length - 1].value;
        const change = firstDayValue !== 0 ? ((lastDayValue - firstDayValue) / firstDayValue) * 100 : 0;
        setPercentageChange(change);
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

  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [createLineDataset(title, data.map(item => item.value), color)],
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
      subtitle="First to last date trend"
      loading={loading}
    >
      <Line data={chartData} options={lineChartOptions} />
    </ChartCard>
  );
};

export default WeeklyProfitsTrendCard;
