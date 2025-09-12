import React, { useState, useEffect } from 'react';
import { BankAccount, CreateBankTransferData } from '../types';
import { bankAccountsApi } from '../services/api';
import { bankTransfersApi } from '../services/api/transactionsApi';
import { formatCurrency } from '../utils/dateUtils';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BankTransferModal: React.FC<BankTransferModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateBankTransferData>({
    from_bank_account_id: 0,
    to_bank_account_id: 0,
    amount: 0,
    description: '',
    reference_number: ''
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
    }
  }, [isOpen]);

  const fetchBankAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await bankAccountsApi.getAll({ is_active: true });
      
      // Handle different response structures
      let accounts = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          accounts = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          accounts = response.data.data;
        } else {
          console.warn('Unexpected API response structure:', response.data);
          console.warn('Response data type:', typeof response.data);
          console.warn('Response data keys:', Object.keys(response.data));
        }
      }
      
      console.log('Fetched bank accounts:', accounts);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : 
               (name === 'from_bank_account_id' || name === 'to_bank_account_id') ? parseInt(value) || 0 : 
               value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.from_bank_account_id) {
      newErrors.from_bank_account_id = 'From account is required';
    }
    if (!formData.to_bank_account_id) {
      newErrors.to_bank_account_id = 'To account is required';
    }
    if (formData.from_bank_account_id === formData.to_bank_account_id) {
      newErrors.to_bank_account_id = 'From and To accounts must be different';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await bankTransfersApi.transfer(formData);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      from_bank_account_id: 0,
      to_bank_account_id: 0,
      amount: 0,
      description: '',
      reference_number: ''
    });
    setErrors({});
    onClose();
  };

  const getAccountBalance = (accountId: number): string => {
    if (!Array.isArray(bankAccounts)) return '';
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (!account) return '';
    const balance = typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance;
    return formatCurrency(balance);
  };

  const isTransferValid = (): boolean => {
    if (!formData.from_bank_account_id || !formData.amount || !Array.isArray(bankAccounts)) return false;
    
    const fromAccount = bankAccounts.find(acc => acc.id === formData.from_bank_account_id);
    if (!fromAccount) return false;
    
    const balance = typeof fromAccount.balance === 'string' ? parseFloat(fromAccount.balance) : fromAccount.balance;
    return balance >= formData.amount;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">New Bank Transfer</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Account */}
          <div>
            <label htmlFor="from_bank_account_id" className="block text-sm font-medium text-gray-700">
              From Account *
            </label>
            <select
              id="from_bank_account_id"
              name="from_bank_account_id"
              value={formData.from_bank_account_id}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.from_bank_account_id ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loadingAccounts}
            >
              <option value="">Select from account</option>
              {Array.isArray(bankAccounts) && bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_name} ({getAccountBalance(account.id!)})
                </option>
              ))}
            </select>
            {errors.from_bank_account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.from_bank_account_id}</p>
            )}
          </div>

          {/* To Account */}
          <div>
            <label htmlFor="to_bank_account_id" className="block text-sm font-medium text-gray-700">
              To Account *
            </label>
            <select
              id="to_bank_account_id"
              name="to_bank_account_id"
              value={formData.to_bank_account_id}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.to_bank_account_id ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loadingAccounts}
            >
              <option value="">Select to account</option>
              {Array.isArray(bankAccounts) && bankAccounts
                .filter(account => account.id !== formData.from_bank_account_id)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - {account.account_name} ({getAccountBalance(account.id!)})
                  </option>
                ))}
            </select>
            {errors.to_bank_account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.to_bank_account_id}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`block w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            {formData.from_bank_account_id && formData.amount && !isTransferValid() && (
              <p className="mt-1 text-sm text-red-600">Insufficient balance for this transfer</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter transfer description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700">
              Reference Number
            </label>
            <input
              type="text"
              id="reference_number"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional reference number..."
            />
          </div>

          {/* Transfer Summary */}
          {formData.from_bank_account_id && formData.to_bank_account_id && formData.amount > 0 && Array.isArray(bankAccounts) && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Transfer Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <span className="font-medium">From:</span>{' '}
                  {bankAccounts.find(acc => acc.id === formData.from_bank_account_id)?.account_name || 'Unknown Account'}
                </p>
                <p>
                  <span className="font-medium">To:</span>{' '}
                  {bankAccounts.find(acc => acc.id === formData.to_bank_account_id)?.account_name || 'Unknown Account'}
                </p>
                <p>
                  <span className="font-medium">Amount:</span> {formatCurrency(formData.amount)}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingAccounts || !isTransferValid()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankTransferModal;
