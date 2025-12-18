import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateTimeForDisplay } from '../utils/dateUtils';

interface TransactionViewProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionView: React.FC<TransactionViewProps> = ({ transaction, onClose }) => {
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'expense':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'transfer':
        return (
          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-100';
      case 'expense':
        return 'text-red-600 bg-red-100';
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTransactionAmount = (amount: number | string): number => {
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getTransactionTypeIcon(transaction.type)}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
              <p className="text-sm text-gray-500">ID: {transaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getTransactionTypeColor(transaction.type)}`}>
                {transaction.type}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <p className={`text-lg font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 
                transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                {formatCurrency(formatTransactionAmount(transaction.amount))}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="text-sm text-gray-900">{formatDateTimeForDisplay(transaction.created_at || '')}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1 text-sm text-gray-900">{transaction.description || 'No description provided'}</p>
          </div>

          {/* Bank Account Information */}
          {transaction.type === 'transfer' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">From Account</label>
                <p className="text-sm text-gray-900">
                  {transaction.bank_account ? 
                    `${transaction.bank_account.bank_name} - ${transaction.bank_account.account_name}` : 
                    'Unknown'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To Account</label>
                <p className="text-sm text-gray-900">
                  {transaction.to_bank_account ? 
                    `${transaction.to_bank_account.bank_name} - ${transaction.to_bank_account.account_name}` : 
                    'Unknown'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Account</label>
              <p className="text-sm text-gray-900">
                {transaction.bank_account ? 
                  `${transaction.bank_account.bank_name} - ${transaction.bank_account.account_name}` : 
                  'Unknown'
                }
              </p>
            </div>
          )}

          {/* Reference Information */}
          {transaction.reference_number && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference Number</label>
              <p className="text-sm text-gray-900">{transaction.reference_number}</p>
            </div>
          )}

          {/* Vendor Invoice Link */}
          {transaction.vendor_invoice_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Related Vendor Invoice</label>
              <p className="text-sm text-blue-600">
                Invoice ID: {transaction.vendor_invoice_id}
              </p>
            </div>
          )}

          {/* Created By */}
          {transaction.user && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Created By</label>
              <p className="text-sm text-gray-900">{transaction.user.name}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">Created At</label>
              <p className="text-sm text-gray-500">{formatDateTimeForDisplay(transaction.created_at || '')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Updated At</label>
              <p className="text-sm text-gray-500">{formatDateTimeForDisplay(transaction.updated_at || '')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionView;
