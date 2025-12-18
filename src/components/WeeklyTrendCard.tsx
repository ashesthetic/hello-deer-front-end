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
  createLineDataset, 
  formatCurrency, 
  formatWeek 
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



  const formatWeekCustom = (dateString: string) => {
    const date = parseDateSafely(dateString);
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6);
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const chartData = {
    labels: data.map(item => formatWeekCustom(item.week)),
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
      subtitle="Last 4 weeks trend"
      loading={loading}
    >
      <Line data={chartData} options={lineChartOptions} />
    </ChartCard>
  );
};

export default WeeklyTrendCard; 