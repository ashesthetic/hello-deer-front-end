import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { dailySalesApi } from '../services/api';
import { dailyFuelsApi } from '../services/api';
import { DailySale, DailyFuel } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';
import { exportSalesReportToPDF } from '../utils/pdfExport';
import { useSearchParams } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

type ReportMode = 'current-month' | 'previous-month' | 'custom-date' | 'month-dropdown';

const SalesReportPage: React.FC = () => {
  usePageTitle('Sales Report');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sales, setSales] = useState<DailySale[]>([]);
  const [fuels, setFuels] = useState<DailyFuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reportMode, setReportMode] = useState<ReportMode>('current-month');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  // Initialize from URL parameters and fetch data
  useEffect(() => {
    const mode = searchParams.get('mode') as ReportMode || 'current-month';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    setReportMode(mode);
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedYear(year);
    setSelectedMonth(month);
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);

    // Fetch data immediately with the URL parameters
    fetchDataWithParams(mode, year, month, startDate, endDate);
  }, [searchParams]);

  // Handle state changes for interactive features
  useEffect(() => {
    // Only fetch data if this is not the initial load (when searchParams change)
    if (reportMode && currentYear && currentMonth) {
      fetchData();
    }
  }, [reportMode, currentYear, currentMonth, selectedYear, selectedMonth]);

  const updateURL = (mode: ReportMode, year?: number, month?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    
    if (year && month) {
      params.set('year', year.toString());
      params.set('month', month.toString());
    }
    
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    setSearchParams(params);
  };

  const fetchDataWithParams = async (mode: ReportMode, year: number, month: number, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      let salesResponse;
      let fuelsResponse;
      
      let finalStartDate: string;
      let finalEndDate: string;
      
      if (mode === 'custom-date') {
        if (!startDate || !endDate) {
          setError('Please select both start and end dates');
          setLoading(false);
          return;
        }
        finalStartDate = startDate;
        finalEndDate = endDate;
      } else if (mode === 'month-dropdown') {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        finalStartDate = firstDay.toISOString().split('T')[0];
        finalEndDate = lastDay.toISOString().split('T')[0];
      } else {
        // current-month or previous-month
        let finalYear = year;
        let finalMonth = month;
        
        if (mode === 'previous-month') {
          if (finalMonth === 1) {
            finalMonth = 12;
            finalYear = finalYear - 1;
          } else {
            finalMonth = finalMonth - 1;
          }
        }
        
        const firstDay = new Date(finalYear, finalMonth - 1, 1);
        const lastDay = new Date(finalYear, finalMonth, 0);
        finalStartDate = firstDay.toISOString().split('T')[0];
        finalEndDate = lastDay.toISOString().split('T')[0];
      }
      
      // Fetch sales data
      salesResponse = await dailySalesApi.getAll({
        start_date: finalStartDate,
        end_date: finalEndDate,
        per_page: 1000 // Request a large number to get all data
      });
      
      // Fetch fuels data
      fuelsResponse = await dailyFuelsApi.getAll({
        start_date: finalStartDate,
        end_date: finalEndDate,
        per_page: 1000 // Request a large number to get all data
      });
      
      setSales(salesResponse.data.data || []);
      setFuels(fuelsResponse.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await fetchDataWithParams(reportMode, currentYear, currentMonth, customStartDate, customEndDate);
  };

  const handlePreviousMonth = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    let newYear = currentYear;
    let newMonth = currentMonth;
    
    if (currentMonth === 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    updateURL('current-month', newYear, newMonth);
  };

  const handleNextMonth = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    let newYear = currentYear;
    let newMonth = currentMonth;
    
    if (currentMonth === 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    updateURL('current-month', newYear, newMonth);
  };

  const handleMonthDropdownChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    updateURL('month-dropdown', year, month);
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      setReportMode('custom-date');
      updateURL('custom-date', undefined, undefined, customStartDate, customEndDate);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) {
      alert('Report content not found');
      return;
    }

    setExporting(true);
    try {
      const reportTitle = getReportTitle();
      await exportSalesReportToPDF(reportRef.current, reportTitle);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(2024, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const getReportTitle = () => {
    if (reportMode === 'current-month') {
      const currentDate = new Date();
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (reportMode === 'previous-month') {
      const date = new Date(currentYear, currentMonth - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (reportMode === 'month-dropdown') {
      const date = new Date(selectedYear, selectedMonth - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (reportMode === 'custom-date') {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Sales Report';
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
    const dayStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC'
    });
    return `${dateStr}\n${dayStr}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatLiters = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' L';
  };

  const createChartData = (metric: keyof DailySale, label: string, color: string) => {
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const data = sortedSales.map(sale => Number(sale[metric]) || 0);
    
    const dataWithIndices = data.map((value, index) => ({ value, index }));
    const sortedByValue = [...dataWithIndices].sort((a, b) => b.value - a.value);
    const top3Indices = sortedByValue.slice(0, 3).map(item => item.index);
    
    const backgroundColors = data.map((_, index) => {
      if (top3Indices.includes(index)) {
        const top3Rank = top3Indices.indexOf(index);
        const top3Colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
        return top3Colors[top3Rank];
      }
      return color;
    });
    
    return {
      labels: sortedSales.map(sale => formatDate(sale.date)),
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const createFuelChartData = (metric: keyof DailyFuel, label: string, color: string, isLiters: boolean = false) => {
    const sortedFuels = [...fuels].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const data = sortedFuels.map(fuel => Number(fuel[metric]) || 0);
    
    const dataWithIndices = data.map((value, index) => ({ value, index }));
    const sortedByValue = [...dataWithIndices].sort((a, b) => b.value - a.value);
    const top3Indices = sortedByValue.slice(0, 3).map(item => item.index);
    
    const backgroundColors = data.map((_, index) => {
      if (top3Indices.includes(index)) {
        const top3Rank = top3Indices.indexOf(index);
        const top3Colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
        return top3Colors[top3Rank];
      }
      return color;
    });
    
    return {
      labels: sortedFuels.map(fuel => formatDate(fuel.date)),
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const createDayOfWeekChartData = (metric: keyof DailySale, label: string, color: string) => {
    const dayOfWeekData: { [key: string]: number[] } = {
      'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': [], 'Sun': []
    };
    
    sales.forEach(sale => {
      const [year, month, day] = sale.date.split('T')[0].split('-');
      const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      dayOfWeekData[dayName].push(Number(sale[metric]) || 0);
    });
    
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = dayLabels.map(day => {
      const values = dayOfWeekData[day];
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    const dayColors = {
      'Mon': '#3B82F6', 'Tue': '#10B981', 'Wed': '#F59E0B', 'Thu': '#8B5CF6',
      'Fri': '#EF4444', 'Sat': '#06B6D4', 'Sun': '#84CC16'
    };
    
    const backgroundColors = dayLabels.map(day => dayColors[day as keyof typeof dayColors]);
    
    return {
      labels: dayLabels,
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const createFuelDayOfWeekChartData = (metric: keyof DailyFuel, label: string, color: string) => {
    const dayOfWeekData: { [key: string]: number[] } = {
      'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': [], 'Sun': []
    };
    
    fuels.forEach(fuel => {
      const [year, month, day] = fuel.date.split('T')[0].split('-');
      const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      dayOfWeekData[dayName].push(Number(fuel[metric]) || 0);
    });
    
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = dayLabels.map(day => {
      const values = dayOfWeekData[day];
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    });
    
    const dayColors = {
      'Mon': '#3B82F6', 'Tue': '#10B981', 'Wed': '#F59E0B', 'Thu': '#8B5CF6',
      'Fri': '#EF4444', 'Sat': '#06B6D4', 'Sun': '#84CC16'
    };
    
    const backgroundColors = dayLabels.map(day => dayColors[day as keyof typeof dayColors]);
    
    return {
      labels: dayLabels,
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const createWeeklyGroupChartData = (metric: keyof DailySale, label: string, color: string) => {
    const weeklyGroupData: { [key: number]: number[] } = {};
    
    sales.forEach(sale => {
      const [year, month, day] = sale.date.split('T')[0].split('-');
      const dayOfMonth = parseInt(day);
      if (!weeklyGroupData[dayOfMonth]) {
        weeklyGroupData[dayOfMonth] = [];
      }
      weeklyGroupData[dayOfMonth].push(Number(sale[metric]) || 0);
    });
    
    const weeklyOrder = [
      1, 8, 15, 22, 29, 2, 9, 16, 23, 30, 3, 10, 17, 24, 31,
      4, 11, 18, 25, 5, 12, 19, 26, 6, 13, 20, 27, 7, 14, 21, 28
    ];
    
    const availableDays = weeklyOrder.filter(day => weeklyGroupData[day] && weeklyGroupData[day].length > 0);
    
    const data = availableDays.map(day => {
      const values = weeklyGroupData[day];
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    const labels = availableDays.map(day => {
      const firstSaleWithThisDay = sales.find(sale => {
        const [year, month, dayStr] = sale.date.split('T')[0].split('-');
        return parseInt(dayStr) === day;
      });
      
      if (firstSaleWithThisDay) {
        const [year, month, dayStr] = firstSaleWithThisDay.date.split('T')[0].split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(dayStr)));
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        return `${monthStr} ${day}\n${dayName}`;
      }
      
      return `${day}`;
    });
    
    const dayColors = {
      'Mon': '#3B82F6', 'Tue': '#10B981', 'Wed': '#F59E0B', 'Thu': '#8B5CF6',
      'Fri': '#EF4444', 'Sat': '#06B6D4', 'Sun': '#84CC16'
    };
    
    const backgroundColors = labels.map(label => {
      const dayMatch = label.match(/\n([A-Za-z]{3})$/);
      if (dayMatch) {
        const dayOfWeek = dayMatch[1];
        return dayColors[dayOfWeek as keyof typeof dayColors] || color;
      }
      return color;
    });
    
    return {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
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
            return formatCurrency(value);
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
          return formatCurrency(numValue);
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
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            const numValue = parseFloat(value) || 0;
            return formatCurrency(numValue);
          }
        },
      },
    },
  };

  const fuelChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      datalabels: {
        ...chartOptions.plugins.datalabels,
        formatter: function(value: any) {
          const numValue = parseFloat(value) || 0;
          return formatLiters(numValue);
        }
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: function(value: any) {
            const numValue = parseFloat(value) || 0;
            return formatLiters(numValue);
          }
        }
      }
    }
  };

  const DayOfWeekLegend = () => {
    const dayColors = {
      'Mon': '#3B82F6', 'Tue': '#10B981', 'Wed': '#F59E0B', 'Thu': '#8B5CF6',
      'Fri': '#EF4444', 'Sat': '#06B6D4', 'Sun': '#84CC16'
    };

    const dayNames = {
      'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday',
      'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
    };

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {Object.entries(dayColors).map(([day, color]) => (
          <div key={day} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-sm text-gray-600">{dayNames[day as keyof typeof dayNames]}</span>
          </div>
        ))}
      </div>
    );
  };

  // Generate month options for dropdown
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Generate options for current year and previous 2 years
    for (let year = currentYear - 2; year <= currentYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const date = new Date(year, month - 1, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long' });
        options.push({
          value: `${year}-${month}`,
          label: `${monthName} ${year}`,
          year,
          month
        });
      }
    }
    
    return options.reverse(); // Most recent first
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
            <p className="text-gray-600">Comprehensive analysis of daily sales performance - {getReportTitle()}</p>
          </div>
                        <button
                type="button"
                onClick={handleExportPDF}
                disabled={exporting || loading || sales.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Report Period Selection */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Month Navigation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Month Navigation</label>
              <div className="flex items-center space-x-2 mb-4">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  disabled={loading || reportMode !== 'current-month'}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                  {getMonthName(currentMonth)} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={loading || reportMode !== 'current-month'}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportMode('current-month');
                    updateURL('current-month', currentYear, currentMonth);
                  }}
                  className={`px-3 py-2 text-sm rounded-md ${
                    reportMode === 'current-month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Current Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportMode('previous-month');
                    updateURL('previous-month', currentYear, currentMonth);
                  }}
                  className={`px-3 py-2 text-sm rounded-md ${
                    reportMode === 'previous-month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous Month
                </button>
              </div>
            </div>

            {/* Month Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  handleMonthDropdownChange(year, month);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
                             <button
                 type="button"
                 onClick={() => {
                   setReportMode('month-dropdown');
                   updateURL('month-dropdown', selectedYear, selectedMonth);
                 }}
                 className={`mt-2 px-3 py-2 text-sm rounded-md ${
                   reportMode === 'month-dropdown' 
                     ? 'bg-blue-600 text-white' 
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 Use Selected Month
               </button>
            </div>

                         {/* Custom Date Range */}
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">Custom Date Range</label>
               <div className="flex space-x-4">
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                   <input
                     type="date"
                     value={customStartDate}
                     onChange={(e) => setCustomStartDate(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                       }
                     }}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     style={{ minWidth: '140px' }}
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">End Date</label>
                   <input
                     type="date"
                     value={customEndDate}
                     onChange={(e) => setCustomEndDate(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                       }
                     }}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     style={{ minWidth: '140px' }}
                   />
                 </div>
                 <div className="flex items-end">
                   <button
                     type="button"
                     onClick={handleCustomDateChange}
                     disabled={!customStartDate || !customEndDate}
                     className={`px-3 py-2 text-sm rounded-md ${
                       reportMode === 'custom-date' 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                     } disabled:opacity-50 disabled:cursor-not-allowed`}
                   >
                     Use Custom Range
                   </button>
                 </div>
               </div>
               <div className="mt-2 text-xs text-gray-500">
                 Click on the date fields to open the calendar picker
               </div>
             </div>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-500 text-center">No sales data available for the selected period.</p>
          </div>
        ) : (
          <div ref={reportRef} className="space-y-6">
            {/* Date vs Reported Total */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Reported Total</h3>
              <div className="h-80">
                <Bar data={createChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
              </div>
            </div>

            {/* Weekly Groups vs Reported Total */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Groups vs Reported Total</h3>
              <p className="text-sm text-gray-600 mb-4">Grouped by: 1,8,15,22,29 | 2,9,16,23,30 | 3,10,17,24,31 | etc.</p>
              <div className="h-80">
                <Bar data={createWeeklyGroupChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
              </div>
              <DayOfWeekLegend />
            </div>

            {/* Date vs Fuel ($$$) */}
            {fuels.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Fuel ($$$)</h3>
                <div className="h-80">
                  <Bar data={createFuelChartData('total_amount', 'Fuel Total', '#10B981')} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Date vs Fuel (Ltr) */}
            {fuels.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Fuel (Ltr)</h3>
                <div className="h-80">
                  <Bar data={createFuelChartData('total_quantity', 'Fuel Quantity', '#10B981')} options={fuelChartOptions} />
                </div>
              </div>
            )}

            {/* Date vs Store Sale */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Store Sale</h3>
              <div className="h-80">
                <Bar data={createChartData('store_sale', 'Store Sale', '#F59E0B')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Card</h3>
              <div className="h-80">
                <Bar data={createChartData('card', 'Card', '#8B5CF6')} options={chartOptions} />
              </div>
            </div>

            {/* Date vs Cash */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date vs Cash</h3>
              <div className="h-80">
                <Bar data={createChartData('cash', 'Cash', '#EF4444')} options={chartOptions} />
              </div>
            </div>

            {/* Day of Week vs Reported Total (Average) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Reported Total (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('reported_total', 'Reported Total', '#3B82F6')} options={chartOptions} />
              </div>
              <DayOfWeekLegend />
            </div>

            {/* Day of Week vs Store Sale (Average) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Store Sale (Average)</h3>
              <div className="h-80">
                <Bar data={createDayOfWeekChartData('store_sale', 'Store Sale', '#F59E0B')} options={chartOptions} />
              </div>
              <DayOfWeekLegend />
            </div>

                         {/* Day of Week vs Fuel Sale (Ltr) (Average) */}
             {fuels.length > 0 && (
               <div className="bg-white rounded-lg shadow-lg p-6">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week vs Fuel Sale (Ltr) (Average)</h3>
                 <div className="h-80">
                   <Bar data={createFuelDayOfWeekChartData('total_quantity', 'Fuel Quantity', '#10B981')} options={fuelChartOptions} />
                 </div>
                 <DayOfWeekLegend />
               </div>
             )}

            {/* Data Table View */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Table View</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Sale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Sale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.reported_total || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.fuel_sale || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.store_sale || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.gst || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.card || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.cash || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.coupon || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.delivery || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReportPage; 