import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Payroll {
  id: number;
  pay_period: string;
  pay_date: string;
  employee?: {
    full_legal_name: string;
  };
  total_hours: number;
  total_current: number;
  total_deduction_current: number;
  net_pay: number;
}

const PayrollPage: React.FC = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payrolls');
      setPayrolls(response.data.data || []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPayPeriod = (payPeriod: string | null) => {
    if (!payPeriod) return '-';
    
    // Try to parse date range in MM/DD/YYYY format (e.g., "10/24/2025- 11/06/2025")
    const dateRangePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = payPeriod.match(dateRangePattern);
    
    if (match) {
      const [, startMonth, startDay, startYear, endMonth, endDay, endYear] = match;
      
      // Create date objects
      const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
      const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
      
      // Format as "Month day, year"
      const formatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedStart = startDate.toLocaleDateString('en-US', formatOptions);
      const formattedEnd = endDate.toLocaleDateString('en-US', formatOptions);
      
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    return payPeriod;
  };

  // Group payrolls by pay period
  const groupByPayPeriod = () => {
    const grouped: { [key: string]: Payroll[] } = {};
    
    payrolls.forEach(payroll => {
      const period = payroll.pay_period || 'Unknown';
      if (!grouped[period]) {
        grouped[period] = [];
      }
      grouped[period].push(payroll);
    });

    // Sort periods by the end date (descending - newest first)
    const sortedPeriods = Object.keys(grouped).sort((a, b) => {
      const getEndDate = (period: string) => {
        const match = period.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, , , , endMonth, endDay, endYear] = match;
          return new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay)).getTime();
        }
        return 0;
      };
      
      return getEndDate(b) - getEndDate(a);
    });

    return { grouped, sortedPeriods };
  };

  const renderPayrollRow = (payroll: Payroll) => (
    <tr key={payroll.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(payroll.pay_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {payroll.employee?.full_legal_name || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {payroll.total_hours}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${Number(payroll.total_current).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${Number(payroll.total_deduction_current).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${Number(payroll.net_pay).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          onClick={() => navigate(`/employees/payroll/${payroll.id}`)}
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </button>
      </td>
    </tr>
  );

  const renderPayPeriodTable = (period: string, periodPayrolls: Payroll[], isOlder: boolean = false) => (
    <div key={period} className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">
        {isOlder ? 'Older Pay Periods' : formatPayPeriod(period)}
      </h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isOlder && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pay Period
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pay Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross Pay
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Pay
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isOlder ? (
              periodPayrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPayPeriod(payroll.pay_period)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payroll.pay_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payroll.employee?.full_legal_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payroll.total_hours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Number(payroll.total_current).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Number(payroll.total_deduction_current).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${Number(payroll.net_pay).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => navigate(`/employees/payroll/${payroll.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              periodPayrolls.map(renderPayrollRow)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payrolls</h1>
          <p className="text-gray-600 mt-2">Manage employee payroll records</p>
        </div>
        <button
          onClick={() => navigate('/employees/payroll/reports')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Payroll Report
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center py-12">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll records yet</h3>
            <p className="text-gray-500 mb-4">Get started by uploading a payroll report</p>
            <button
              onClick={() => navigate('/employees/payroll/reports')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Upload First Report
            </button>
          </div>
        </div>
      ) : (() => {
        const { grouped, sortedPeriods } = groupByPayPeriod();
        const recentPeriods = sortedPeriods.slice(0, 3);
        const olderPeriods = sortedPeriods.slice(3);

        return (
          <>
            {/* Recent 3 pay periods - each in its own table */}
            {recentPeriods.map(period => renderPayPeriodTable(period, grouped[period]))}

            {/* Older pay periods - all in one table */}
            {olderPeriods.length > 0 && renderPayPeriodTable(
              'older',
              olderPeriods.flatMap(period => grouped[period]),
              true
            )}
          </>
        );
      })()}
    </div>
  );
};

export default PayrollPage;
