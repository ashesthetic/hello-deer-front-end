import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface BankAccount {
  id: number;
  bank_name: string;
  account_name: string;
  account_type: string;
  balance: number;
  formatted_balance: string;
}

interface UnpaidInvoice {
  id: number;
  invoice_number: string;
  vendor_name: string;
  invoice_date: string;
  formatted_date: string;
  amount: number;
  formatted_amount: string;
  type: string;
}

interface IncomeExpenseItem {
  id: number;
  invoice_number: string;
  vendor_name: string;
  payment_date: string;
  formatted_date: string;
  amount: number;
  formatted_amount: string;
  description: string;
}

interface ProfitBreakdownCategory {
  percentage: number;
  amount: number;
  formatted_amount: string;
  profit: number;
  formatted_profit: string;
}

interface ProfitBreakdown {
  fuel: ProfitBreakdownCategory;
  tobacco_25: ProfitBreakdownCategory;
  tobacco_20: ProfitBreakdownCategory;
  lottery: ProfitBreakdownCategory;
  prepay: ProfitBreakdownCategory;
  store_sale: ProfitBreakdownCategory;
}

interface DashboardStats {
  total_money_in_banks: {
    total_balance: number;
    formatted_total_balance: string;
    account_count: number;
    bank_accounts: BankAccount[];
  };
  total_unpaid_invoices: {
    total_amount: number;
    formatted_total_amount: string;
    invoice_count: number;
    invoices: UnpaidInvoice[];
  };
  yesterday_data: {
    has_data: boolean;
    date: string;
    formatted_date: string;
    profit?: number;
    formatted_profit?: string;
    total_sale?: number;
    formatted_total_sale?: string;
    debit_sale?: number;
    formatted_debit_sale?: string;
    credit_sale?: number;
    formatted_credit_sale?: string;
    cash_sale?: number;
    formatted_cash_sale?: string;
    safedrops?: number;
    formatted_safedrops?: string;
    cash_in_hand?: number;
    formatted_cash_in_hand?: string;
    fuel_sale_liters?: number;
    fuel_sale_amount?: number;
    formatted_fuel_sale_amount?: string;
    latest_fuel_volume?: {
      date: string;
      formatted_date: string;
      regular: number;
      premium: number;
      diesel: number;
    } | null;
    profit_breakdown?: ProfitBreakdown;
  };
  current_week_data: {
    has_data: boolean;
    period_start: string;
    period_end: string;
    formatted_period: string;
    profit?: number;
    formatted_profit?: string;
    total_sale?: number;
    formatted_total_sale?: string;
    debit_sale?: number;
    formatted_debit_sale?: string;
    credit_sale?: number;
    formatted_credit_sale?: string;
    cash_sale?: number;
    formatted_cash_sale?: string;
    safedrops?: number;
    formatted_safedrops?: string;
    cash_in_hand?: number;
    formatted_cash_in_hand?: string;
    fuel_sale_liters?: number;
    fuel_sale_amount?: number;
    formatted_fuel_sale_amount?: string;
    profit_breakdown?: ProfitBreakdown;
  };
  last_week_data: {
    has_data: boolean;
    period_start: string;
    period_end: string;
    formatted_period: string;
    profit?: number;
    formatted_profit?: string;
    total_sale?: number;
    formatted_total_sale?: string;
    debit_sale?: number;
    formatted_debit_sale?: string;
    credit_sale?: number;
    formatted_credit_sale?: string;
    cash_sale?: number;
    formatted_cash_sale?: string;
    safedrops?: number;
    formatted_safedrops?: string;
    cash_in_hand?: number;
    formatted_cash_in_hand?: string;
    fuel_sale_liters?: number;
    fuel_sale_amount?: number;
    formatted_fuel_sale_amount?: string;
    profit_breakdown?: ProfitBreakdown;
  };
  current_month_data: {
    has_data: boolean;
    period_start: string;
    period_end: string;
    formatted_period: string;
    profit?: number;
    formatted_profit?: string;
    total_sale?: number;
    formatted_total_sale?: string;
    debit_sale?: number;
    formatted_debit_sale?: string;
    credit_sale?: number;
    formatted_credit_sale?: string;
    cash_sale?: number;
    formatted_cash_sale?: string;
    safedrops?: number;
    formatted_safedrops?: string;
    cash_in_hand?: number;
    formatted_cash_in_hand?: string;
    fuel_sale_liters?: number;
    fuel_sale_amount?: number;
    formatted_fuel_sale_amount?: string;
    profit_breakdown?: ProfitBreakdown;
  };
  last_month_data: {
    has_data: boolean;
    period_start: string;
    period_end: string;
    formatted_period: string;
    profit?: number;
    formatted_profit?: string;
    total_sale?: number;
    formatted_total_sale?: string;
    debit_sale?: number;
    formatted_debit_sale?: string;
    credit_sale?: number;
    formatted_credit_sale?: string;
    cash_sale?: number;
    formatted_cash_sale?: string;
    safedrops?: number;
    formatted_safedrops?: string;
    cash_in_hand?: number;
    formatted_cash_in_hand?: string;
    fuel_sale_liters?: number;
    fuel_sale_amount?: number;
    formatted_fuel_sale_amount?: string;
    profit_breakdown?: ProfitBreakdown;
  };
  last_month_income: {
    total_income: number;
    formatted_total_income: string;
    income_count: number;
    formatted_period: string;
    incomes: IncomeExpenseItem[];
  };
  last_month_expenses: {
    total_expense: number;
    formatted_total_expense: string;
    expense_count: number;
    formatted_period: string;
    expenses: IncomeExpenseItem[];
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, index) => (
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
            <h3 className="text-lg font-semibold text-gray-900">Total Money in Banks</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {stats.total_money_in_banks.formatted_total_balance}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.total_money_in_banks.bank_accounts.map((account) => (
              <div key={account.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">{account.bank_name}</div>
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
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {stats.total_unpaid_invoices.formatted_total_amount}
          </div>
          <div className="text-sm text-gray-600 mb-3">
            {stats.total_unpaid_invoices.invoice_count} unpaid invoices
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.total_unpaid_invoices.invoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{invoice.vendor_name}</div>
                  <div className="text-xs text-gray-500">{invoice.formatted_date}</div>
                </div>
                <div className="text-right ml-2">
                  <div className="font-semibold text-gray-900">{invoice.formatted_amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row - Last Month Income and Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Last Month Income Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last Month Income</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.last_month_income.formatted_total_income}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {stats.last_month_income.income_count} income entries • {stats.last_month_income.formatted_period}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.last_month_income.incomes.map((income) => (
              <div key={income.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{income.vendor_name}</div>
                  <div className="text-xs text-gray-500">{income.formatted_date}</div>
                  {income.description && (
                    <div className="text-xs text-gray-500 truncate">{income.description}</div>
                  )}
                </div>
                <div className="text-right ml-2">
                  <div className="font-semibold text-green-600">{income.formatted_amount}</div>
                </div>
              </div>
            ))}
            {stats.last_month_income.incomes.length === 0 && (
              <div className="text-center text-gray-500 py-4">No income for last month</div>
            )}
          </div>
        </div>

        {/* Last Month Expenses Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last Month Expenses</h3>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {stats.last_month_expenses.formatted_total_expense}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {stats.last_month_expenses.expense_count} expense entries • {stats.last_month_expenses.formatted_period}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.last_month_expenses.expenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{expense.vendor_name}</div>
                  <div className="text-xs text-gray-500">{expense.formatted_date}</div>
                  {expense.description && (
                    <div className="text-xs text-gray-500 truncate">{expense.description}</div>
                  )}
                </div>
                <div className="text-right ml-2">
                  <div className="font-semibold text-red-600">{expense.formatted_amount}</div>
                </div>
              </div>
            ))}
            {stats.last_month_expenses.expenses.length === 0 && (
              <div className="text-center text-gray-500 py-4">No expenses for last month</div>
            )}
          </div>
        </div>
      </div>

      {/* Third Row - Yesterday's Data */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Yesterday's Performance</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          
          {stats.yesterday_data.has_data ? (
            <div>
              <div className="text-sm text-gray-600 mb-4">{stats.yesterday_data.formatted_date}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Profit</div>
                  <div className="text-lg font-bold text-green-600">{stats.yesterday_data.formatted_profit}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Total Sale</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.formatted_total_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Debit/Credit</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.formatted_debit_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.formatted_cash_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Safedrops</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.formatted_safedrops}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash in Hand</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.formatted_cash_in_hand}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel (Liters)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.fuel_sale_liters?.toLocaleString()}L</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel ($)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.yesterday_data.formatted_fuel_sale_amount}</div>
                </div>
              </div>
              {stats.yesterday_data.latest_fuel_volume && (
                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-2 font-medium">Latest Fuel Volume</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Regular</div>
                      <div className="font-semibold text-gray-900">{stats.yesterday_data.latest_fuel_volume.regular}L</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Premium</div>
                      <div className="font-semibold text-gray-900">{stats.yesterday_data.latest_fuel_volume.premium}L</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Diesel</div>
                      <div className="font-semibold text-gray-900">{stats.yesterday_data.latest_fuel_volume.diesel}L</div>
                    </div>
                  </div>
                </div>
              )}
              {stats.yesterday_data.profit_breakdown && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-3 font-medium">Profit Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Fuel ({stats.yesterday_data.profit_breakdown.fuel.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.yesterday_data.profit_breakdown.fuel.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.yesterday_data.profit_breakdown.fuel.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 25% ({stats.yesterday_data.profit_breakdown.tobacco_25.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.yesterday_data.profit_breakdown.tobacco_25.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.yesterday_data.profit_breakdown.tobacco_25.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 20% ({stats.yesterday_data.profit_breakdown.tobacco_20.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.yesterday_data.profit_breakdown.tobacco_20.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.yesterday_data.profit_breakdown.tobacco_20.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Lottery ({stats.yesterday_data.profit_breakdown.lottery.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.yesterday_data.profit_breakdown.lottery.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.yesterday_data.profit_breakdown.lottery.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Prepay ({stats.yesterday_data.profit_breakdown.prepay.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.yesterday_data.profit_breakdown.prepay.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.yesterday_data.profit_breakdown.prepay.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Store Sale ({stats.yesterday_data.profit_breakdown.store_sale.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.yesterday_data.profit_breakdown.store_sale.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.yesterday_data.profit_breakdown.store_sale.formatted_profit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No data available for yesterday ({stats.yesterday_data.formatted_date})
            </div>
          )}
        </div>
      </div>

      {/* Fourth Row - Current Week's Data */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-teal-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Week's Performance</h3>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          {stats.current_week_data.has_data ? (
            <div>
              <div className="text-sm text-gray-600 mb-4">{stats.current_week_data.formatted_period}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Profit</div>
                  <div className="text-lg font-bold text-green-600">{stats.current_week_data.formatted_profit}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Total Sale</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.formatted_total_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Debit/Credit</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.formatted_debit_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.formatted_cash_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Safedrops</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.formatted_safedrops}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash in Hand</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.formatted_cash_in_hand}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel (Liters)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.fuel_sale_liters?.toLocaleString()}L</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel ($)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_week_data.formatted_fuel_sale_amount}</div>
                </div>
              </div>
              {stats.current_week_data.profit_breakdown && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-3 font-medium">Profit Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Fuel ({stats.current_week_data.profit_breakdown.fuel.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_week_data.profit_breakdown.fuel.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_week_data.profit_breakdown.fuel.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 25% ({stats.current_week_data.profit_breakdown.tobacco_25.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_week_data.profit_breakdown.tobacco_25.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_week_data.profit_breakdown.tobacco_25.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 20% ({stats.current_week_data.profit_breakdown.tobacco_20.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_week_data.profit_breakdown.tobacco_20.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_week_data.profit_breakdown.tobacco_20.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Lottery ({stats.current_week_data.profit_breakdown.lottery.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_week_data.profit_breakdown.lottery.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_week_data.profit_breakdown.lottery.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Prepay ({stats.current_week_data.profit_breakdown.prepay.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_week_data.profit_breakdown.prepay.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_week_data.profit_breakdown.prepay.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Store Sale ({stats.current_week_data.profit_breakdown.store_sale.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_week_data.profit_breakdown.store_sale.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_week_data.profit_breakdown.store_sale.formatted_profit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No data available for current week ({stats.current_week_data.formatted_period})
            </div>
          )}
        </div>
      </div>

      {/* Fifth Row - Last Week's Data */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last Week's Performance</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          {stats.last_week_data.has_data ? (
            <div>
              <div className="text-sm text-gray-600 mb-4">{stats.last_week_data.formatted_period}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Profit</div>
                  <div className="text-lg font-bold text-green-600">{stats.last_week_data.formatted_profit}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Total Sale</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.formatted_total_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Debit/Credit</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.formatted_debit_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.formatted_cash_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Safedrops</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.formatted_safedrops}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash in Hand</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.formatted_cash_in_hand}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel (Liters)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.fuel_sale_liters?.toLocaleString()}L</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel ($)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_week_data.formatted_fuel_sale_amount}</div>
                </div>
              </div>
              {stats.last_week_data.profit_breakdown && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-3 font-medium">Profit Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Fuel ({stats.last_week_data.profit_breakdown.fuel.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_week_data.profit_breakdown.fuel.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_week_data.profit_breakdown.fuel.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 25% ({stats.last_week_data.profit_breakdown.tobacco_25.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_week_data.profit_breakdown.tobacco_25.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_week_data.profit_breakdown.tobacco_25.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 20% ({stats.last_week_data.profit_breakdown.tobacco_20.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_week_data.profit_breakdown.tobacco_20.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_week_data.profit_breakdown.tobacco_20.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Lottery ({stats.last_week_data.profit_breakdown.lottery.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_week_data.profit_breakdown.lottery.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_week_data.profit_breakdown.lottery.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Prepay ({stats.last_week_data.profit_breakdown.prepay.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_week_data.profit_breakdown.prepay.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_week_data.profit_breakdown.prepay.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Store Sale ({stats.last_week_data.profit_breakdown.store_sale.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_week_data.profit_breakdown.store_sale.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_week_data.profit_breakdown.store_sale.formatted_profit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No data available for last week ({stats.last_week_data.formatted_period})
            </div>
          )}
        </div>
      </div>

      {/* Sixth Row - Current Month's Performance */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Month's Performance</h3>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          {stats.current_month_data.has_data ? (
            <div>
              <div className="text-sm text-gray-600 mb-4">{stats.current_month_data.formatted_period}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Profit</div>
                  <div className="text-lg font-bold text-green-600">{stats.current_month_data.formatted_profit}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Total Sale</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.formatted_total_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Debit/Credit</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.formatted_debit_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.formatted_cash_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Safedrops</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.formatted_safedrops}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash in Hand</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.formatted_cash_in_hand}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel (Liters)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.fuel_sale_liters?.toLocaleString()}L</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel ($)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.current_month_data.formatted_fuel_sale_amount}</div>
                </div>
              </div>
              {stats.current_month_data.profit_breakdown && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-3 font-medium">Profit Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Fuel ({stats.current_month_data.profit_breakdown.fuel.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_month_data.profit_breakdown.fuel.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_month_data.profit_breakdown.fuel.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 25% ({stats.current_month_data.profit_breakdown.tobacco_25.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_month_data.profit_breakdown.tobacco_25.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_month_data.profit_breakdown.tobacco_25.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 20% ({stats.current_month_data.profit_breakdown.tobacco_20.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_month_data.profit_breakdown.tobacco_20.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_month_data.profit_breakdown.tobacco_20.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Lottery ({stats.current_month_data.profit_breakdown.lottery.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_month_data.profit_breakdown.lottery.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_month_data.profit_breakdown.lottery.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Prepay ({stats.current_month_data.profit_breakdown.prepay.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_month_data.profit_breakdown.prepay.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_month_data.profit_breakdown.prepay.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Store Sale ({stats.current_month_data.profit_breakdown.store_sale.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.current_month_data.profit_breakdown.store_sale.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.current_month_data.profit_breakdown.store_sale.formatted_profit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No data available for current month ({stats.current_month_data.formatted_period})
            </div>
          )}
        </div>
      </div>

      {/* Seventh Row - Last Month's Performance */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last Month's Performance</h3>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          {stats.last_month_data.has_data ? (
            <div>
              <div className="text-sm text-gray-600 mb-4">{stats.last_month_data.formatted_period}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Profit</div>
                  <div className="text-lg font-bold text-green-600">{stats.last_month_data.formatted_profit}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Total Sale</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.formatted_total_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Debit/Credit</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.formatted_debit_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.formatted_cash_sale}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Safedrops</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.formatted_safedrops}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Cash in Hand</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.formatted_cash_in_hand}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel (Liters)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.fuel_sale_liters?.toLocaleString()}L</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">Fuel ($)</div>
                  <div className="text-lg font-bold text-gray-900">{stats.last_month_data.formatted_fuel_sale_amount}</div>
                </div>
              </div>
              {stats.last_month_data.profit_breakdown && (
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-3 font-medium">Profit Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Fuel ({stats.last_month_data.profit_breakdown.fuel.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_month_data.profit_breakdown.fuel.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_month_data.profit_breakdown.fuel.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 25% ({stats.last_month_data.profit_breakdown.tobacco_25.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_month_data.profit_breakdown.tobacco_25.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_month_data.profit_breakdown.tobacco_25.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Tobacco 20% ({stats.last_month_data.profit_breakdown.tobacco_20.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_month_data.profit_breakdown.tobacco_20.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_month_data.profit_breakdown.tobacco_20.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Lottery ({stats.last_month_data.profit_breakdown.lottery.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_month_data.profit_breakdown.lottery.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_month_data.profit_breakdown.lottery.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Prepay ({stats.last_month_data.profit_breakdown.prepay.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_month_data.profit_breakdown.prepay.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_month_data.profit_breakdown.prepay.formatted_profit}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Store Sale ({stats.last_month_data.profit_breakdown.store_sale.percentage}%)</div>
                      <div className="text-sm font-semibold text-gray-900">{stats.last_month_data.profit_breakdown.store_sale.formatted_amount}</div>
                      <div className="text-xs text-green-600 font-medium mt-1">Profit: {stats.last_month_data.profit_breakdown.store_sale.formatted_profit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No data available for last month ({stats.last_month_data.formatted_period})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStatsCards;
