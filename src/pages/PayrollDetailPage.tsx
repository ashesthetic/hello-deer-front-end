import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

interface Payroll {
  id: number;
  pay_date: string;
  pay_period: string | null;
  payment_date: string | null;
  employee_id: number;
  employee?: {
    id: number;
    preferred_name: string;
    full_legal_name: string;
  };
  regular_hours: number;
  regular_rate: number;
  regular_current: number;
  regular_ytd: number;
  stat_hours: number;
  stat_rate: number;
  stat_current: number;
  stat_ytd: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_current: number;
  overtime_ytd: number;
  vac_paid_current: number;
  vac_paid_ytd: number;
  total_hours: number;
  total_current: number;
  total_ytd: number;
  cpp_emp_current: number;
  cpp_emp_ytd: number;
  ei_emp_current: number;
  ei_emp_ytd: number;
  fit_current: number;
  fit_ytd: number;
  total_deduction_current: number;
  total_deduction_ytd: number;
  vac_earned_current: number;
  vac_earned_ytd: number;
  net_pay: number;
  created_at: string;
  updated_at: string;
}

const PayrollDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayroll();
  }, [id]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/payrolls/${id}`);
      setPayroll(response.data.data);
    } catch (error: any) {
      console.error('Error fetching payroll:', error);
      setError(error.response?.data?.message || 'Failed to load payroll record');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '0.00';
    return Number(num).toFixed(2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payroll</h3>
            <p className="text-gray-500 mb-4">{error || 'Payroll record not found'}</p>
            <button
              onClick={() => navigate('/employees/payroll')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Payroll List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
            <p className="text-gray-600 mt-2">
              {payroll.employee?.full_legal_name || 'Unknown Employee'}
            </p>
          </div>
          <button
            onClick={() => navigate('/employees/payroll')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </button>
        </div>

        {/* Pay Period Information */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <p className="text-gray-900 font-semibold">
              {payroll.employee?.full_legal_name || 'Unknown'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
            <p className="text-gray-900">{formatPayPeriod(payroll.pay_period)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
            <p className="text-gray-900">{formatDate(payroll.pay_date)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <p className="text-gray-900">{formatDate(payroll.payment_date)}</p>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Earnings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 border border-gray-300 text-center text-sm font-semibold text-gray-700">Hours</th>
                  <th className="px-4 py-2 border border-gray-300 text-center text-sm font-semibold text-gray-700">Rate</th>
                  <th className="px-4 py-2 border border-gray-300 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-2 border border-gray-300 text-right text-sm font-semibold text-gray-700">YTD Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">Regular</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatNumber(payroll.regular_hours)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatCurrency(payroll.regular_rate)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.regular_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.regular_ytd)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">Stat Holiday Paid</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatNumber(payroll.stat_hours)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatCurrency(payroll.stat_rate)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.stat_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.stat_ytd)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">Overtime</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatNumber(payroll.overtime_hours)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatCurrency(payroll.overtime_rate)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.overtime_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.overtime_ytd)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">VAC Paid</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">-</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">-</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.vac_paid_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.vac_paid_ytd)}</td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-2 border border-gray-300 text-sm">Total</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">{formatNumber(payroll.total_hours)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-center text-sm">-</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.total_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.total_ytd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Deductions Table */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Deductions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 border border-gray-300 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-2 border border-gray-300 text-right text-sm font-semibold text-gray-700">YTD Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">CPP - Employee</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.cpp_emp_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.cpp_emp_ytd)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">EI - Employee</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.ei_emp_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.ei_emp_ytd)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">Federal Income Tax</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.fit_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.fit_ytd)}</td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-2 border border-gray-300 text-sm">Total Deductions</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.total_deduction_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.total_deduction_ytd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Vacation & Net Pay Table */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Vacation & Net Pay</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 border border-gray-300 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-2 border border-gray-300 text-right text-sm font-semibold text-gray-700">YTD Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">VAC Earned</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.vac_earned_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.vac_earned_ytd)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">VAC Paid</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.vac_paid_current)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">{formatCurrency(payroll.vac_paid_ytd)}</td>
                </tr>
                <tr className="bg-blue-50 font-bold">
                  <td className="px-4 py-2 border border-gray-300 text-sm">Net Pay</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm text-blue-700">{formatCurrency(payroll.net_pay)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-right text-sm">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span> {formatDate(payroll.created_at)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(payroll.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDetailPage;
