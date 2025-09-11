import React from 'react';
import { BankAccount } from '../types';

interface BankAccountViewProps {
  bankAccount: BankAccount;
  onEdit: () => void;
  onBack: () => void;
  canEdit: boolean;
}

const BankAccountView: React.FC<BankAccountViewProps> = ({
  bankAccount,
  onEdit,
  onBack,
  canEdit,
}) => {
  const formatCurrency = (amount: number | string, currency: string = 'CAD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const symbol = currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency;
    return `${symbol}${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{bankAccount.account_name}</h1>
              <p className="text-sm text-gray-500">at {bankAccount.bank_name}</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Bank Account
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bank Name</label>
                <p className="text-sm text-gray-900">{bankAccount.bank_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Name</label>
                <p className="text-sm text-gray-900">{bankAccount.account_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                <p className="text-sm text-gray-900 font-mono">{maskAccountNumber(bankAccount.account_number)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Type</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {bankAccount.account_type}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  bankAccount.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bankAccount.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Current Balance</label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(bankAccount.balance, bankAccount.currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Currency</label>
                <p className="text-sm text-gray-900">{bankAccount.currency}</p>
              </div>

              {bankAccount.routing_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Routing Number</label>
                  <p className="text-sm text-gray-900 font-mono">{bankAccount.routing_number}</p>
                </div>
              )}

              {bankAccount.swift_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">SWIFT Code</label>
                  <p className="text-sm text-gray-900 font-mono">{bankAccount.swift_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {bankAccount.notes && (
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{bankAccount.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="md:col-span-2 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                <p className="text-gray-900">{bankAccount.user?.name || 'Unknown'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <p className="text-gray-900">
                  {bankAccount.created_at ? formatDate(bankAccount.created_at) : 'Unknown'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900">
                  {bankAccount.updated_at ? formatDate(bankAccount.updated_at) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountView;
