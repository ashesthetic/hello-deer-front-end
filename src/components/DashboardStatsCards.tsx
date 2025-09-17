import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface DashboardStats {
  total_money_in_banks: {
    total_balance: number;
    formatted_total_balance: string;
    account_count: number;
    accounts_by_type: Record<string, any>;
    bank_accounts: Array<{
      id: number;
      bank_name: string;
      account_name: string;
      account_type: string;
      balance: number;
      formatted_balance: string;
    }>;
  };
  total_unpaid_invoices: {
    total_amount: number;
    formatted_total_amount: string;
    invoice_count: number;
    expense_count: number;
    expense_amount: number;
    income_count: number;
    income_amount: number;
  };
  total_payments_last_30_days: {
    total_amount: number;
    formatted_total_amount: string;
    payment_count: number;
    payment_methods: Record<string, any>;
    expense_count: number;
    expense_amount: number;
    income_count: number;
    income_amount: number;
    period_start: string;
    period_end: string;
  };
  last_payments: {
    payments: Array<{
      id: number;
      invoice_number: string;
      vendor_name: string;
      amount: number;
      formatted_amount: string;
      payment_date: string;
      formatted_payment_date: string;
      payment_method: string;
      type: string;
      description: string;
      bank_account: {
        id: number;
        bank_name: string;
        account_name: string;
      } | null;
      user_name: string;
    }>;
    total_count: number;
  };
}

const DashboardStatsCards: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading dashboard statistics
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      {/* First Row - Total Money and Unpaid Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total Money in Banks Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Money</h3>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-3">
          {stats.total_money_in_banks.formatted_total_balance}
        </div>
        <div className="space-y-2">
          {stats.total_money_in_banks.bank_accounts.map((account) => (
            <div key={account.id} className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div className="font-medium">{account.bank_name}</div>
                <div className="text-xs text-gray-500">{account.account_name}</div>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {account.formatted_balance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Unpaid Invoices Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Unpaid Invoices</h3>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {stats.total_unpaid_invoices.formatted_total_amount}
        </div>
        <div className="text-sm text-gray-600">
          {stats.total_unpaid_invoices.invoice_count} unpaid invoices
        </div>
      </div>
      </div>

      {/* Second Row - Last 30 Days and Recent Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Payments Last 30 Days Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Last 30 Days</h3>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {stats.total_payments_last_30_days.formatted_total_amount}
        </div>
        <div className="text-sm text-gray-600">
          {stats.total_payments_last_30_days.payment_count} payments made
        </div>
      </div>

      {/* Last 10 Payments Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {stats.last_payments.payments.slice(0, 3).map((payment) => (
            <div key={payment.id} className="flex justify-between items-center text-sm">
              <div className="truncate">
                <div className="font-medium text-gray-900">{payment.vendor_name}</div>
                <div className="text-gray-500">{payment.formatted_payment_date}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{payment.formatted_amount}</div>
                <div className={`text-xs ${payment.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                  {payment.type}
                </div>
              </div>
            </div>
          ))}
          {stats.last_payments.payments.length > 3 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{stats.last_payments.payments.length - 3} more payments
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardStatsCards;
