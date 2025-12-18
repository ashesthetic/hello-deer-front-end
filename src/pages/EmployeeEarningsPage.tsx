import React, { useState, useEffect } from 'react';
import { employeesApi } from '../services/api';

interface EmployeeEarning {
  id: number;
  full_legal_name: string;
  preferred_name: string | null;
  position: string;
  department: string;
  hourly_rate: string;
  total_hours: number;
  total_earnings: number;
  work_days: number;
  period_start: string;
  period_end: string;
  pay_day: string;
}

interface PeriodInfo {
  period_start: string;
  period_end: string;
  pay_day: string;
  days_until_pay: number;
}

interface PeriodData {
  employees: EmployeeEarning[];
  period_info: PeriodInfo;
}

interface EarningsData {
  current_period: PeriodData;
  next_period: PeriodData;
}

const EmployeeEarningsPage: React.FC = () => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeesApi.getEarnings();
      setEarningsData(response.data.data);
    } catch (err) {
      setError('Failed to load earnings data');
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (daysUntilPay: number) => {
    if (daysUntilPay <= 0) return 'text-green-600 bg-green-100';
    if (daysUntilPay <= 3) return 'text-orange-600 bg-orange-100';
    return 'text-blue-600 bg-blue-100';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h3 className="text-sm font-medium text-red-800">Error Loading Earnings</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchEarnings}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No earnings data available</h3>
        </div>
      </div>
    );
  }

  const currentTotalEarnings = earningsData.current_period.employees?.reduce((sum, emp) => sum + emp.total_earnings, 0) || 0;
  const currentTotalHours = earningsData.current_period.employees?.reduce((sum, emp) => sum + emp.total_hours, 0) || 0;
  
  const nextTotalEarnings = earningsData.next_period.employees?.reduce((sum, emp) => sum + emp.total_earnings, 0) || 0;
  const nextTotalHours = earningsData.next_period.employees?.reduce((sum, emp) => sum + emp.total_hours, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Earnings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Earnings for current and next pay periods
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={fetchEarnings}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Pay Periods Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Pay Period */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Current Pay Period</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(earningsData.current_period.period_info.days_until_pay)}`}>
                  {earningsData.current_period.period_info.days_until_pay} days until pay
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Period</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(earningsData.current_period.period_info.period_start)} - {formatDate(earningsData.current_period.period_info.period_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pay Day</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(earningsData.current_period.period_info.pay_day)}
                  </dd>
                </div>
              </div>

              {/* Current Period Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employees</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {earningsData.current_period.employees?.length || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Hours</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {currentTotalHours.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Earnings</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {formatCurrency(currentTotalEarnings)}
                  </dd>
                </div>
              </div>

              {/* Current Period Employees Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {earningsData.current_period.employees?.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.preferred_name || employee.full_legal_name}
                          </div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {employee.total_hours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(employee.total_earnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Next Pay Period */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Next Pay Period</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(earningsData.next_period.period_info.days_until_pay)}`}>
                  {earningsData.next_period.period_info.days_until_pay} days until pay
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Period</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(earningsData.next_period.period_info.period_start)} - {formatDate(earningsData.next_period.period_info.period_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pay Day</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(earningsData.next_period.period_info.pay_day)}
                  </dd>
                </div>
              </div>

              {/* Next Period Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employees</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {earningsData.next_period.employees?.length || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Hours</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {nextTotalHours.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Earnings</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {formatCurrency(nextTotalEarnings)}
                  </dd>
                </div>
              </div>

              {/* Next Period Employees Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {earningsData.next_period.employees?.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.preferred_name || employee.full_legal_name}
                          </div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {employee.total_hours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(employee.total_earnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Combined Summary</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {earningsData.current_period.employees?.length || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Current Period</dt>
                <dd className="mt-1 text-3xl font-semibold text-blue-600">
                  {formatCurrency(currentTotalEarnings)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Next Period</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {formatCurrency(nextTotalEarnings)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Combined Total</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatCurrency(currentTotalEarnings + nextTotalEarnings)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeEarningsPage; 