import React, { useState, useEffect, useCallback } from 'react';
import { dailySalesApi } from '../services/api';

interface WeeklyStats {
  totalSales: number;
  totalFuelSales: number;
  averageDailySales: number;
  averageDailyFuel: number;
  bestDay: string;
  bestDaySales: number;
  weekStart: string;
  weekEnd: string;
}

const WeeklyReportCard: React.FC = () => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyStats = useCallback(async () => {
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
        setStats(null);
        setLoading(false);
        return;
      }

      // Find the last entry date
      const lastEntryDate = new Date(salesData[0].date);
      const weekStart = new Date(lastEntryDate);
      weekStart.setDate(weekStart.getDate() - 6); // 7 days before the last entry

      // Format dates for API
      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = lastEntryDate.toISOString().split('T')[0];

      // Get data for the last 7 days from the last entry
      const rangeResponse = await dailySalesApi.getAll({
        start_date: startDateStr,
        end_date: endDateStr,
        per_page: 100
      });

      const rangeData = rangeResponse.data.data || [];
      
      // Calculate weekly statistics
      let totalSales = 0;
      let totalFuelSales = 0;
      let bestDaySales = 0;
      let bestDay = '';

      rangeData.forEach((sale: any) => {
        const reportedTotal = parseFloat(sale.reported_total) || 0;
        const fuelSale = parseFloat(sale.fuel_sale) || 0;
        
        totalSales += reportedTotal;
        totalFuelSales += fuelSale;

        if (reportedTotal > bestDaySales) {
          bestDaySales = reportedTotal;
          bestDay = sale.date.split('T')[0];
        }
      });

      const daysWithData = rangeData.length || 1;
      const averageDailySales = totalSales / daysWithData;
      const averageDailyFuel = totalFuelSales / daysWithData;

      setStats({
        totalSales,
        totalFuelSales,
        averageDailySales,
        averageDailyFuel,
        bestDay,
        bestDaySales,
        weekStart: startDateStr,
        weekEnd: endDateStr
      });

    } catch (error) {
      console.error('Failed to fetch weekly stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Report</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Report</h3>
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Sales</span>
          <span className="text-lg font-semibold text-blue-600">
            {formatCurrency(stats.totalSales)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Fuel Sales</span>
          <span className="text-lg font-semibold text-green-600">
            {formatCurrency(stats.totalFuelSales)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Avg Daily Sales</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(stats.averageDailySales)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Best Day</span>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatDate(stats.bestDay)}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(stats.bestDaySales)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {formatDate(stats.weekStart)} - {formatDate(stats.weekEnd)}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportCard; 