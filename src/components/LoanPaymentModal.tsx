import React, { useState, useEffect } from 'react';
import { bankAccountsApi } from '../services/api';

interface BankAccount {
  id: number;
  account_name: string;
  account_number: string;
  bank_name: string;
  is_active: boolean;
}

interface LoanPaymentModalProps {
  isOpen: boolean;
  loanName: string;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

export interface PaymentFormData {
  date: string;
  amount: number | string;
  type: 'deposit' | 'withdrawal';
  bank_account_id: number | string;
  notes: string;
}

const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
  isOpen,
  loanName,
  onClose,
  onSubmit,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'deposit',
    bank_account_id: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await bankAccountsApi.getAll();
      const accounts = response.data.data || response.data;
      setBankAccounts(accounts);
      
      // Set first active account as default
      const activeAccount = accounts.find((acc: BankAccount) => acc.is_active);
      if (activeAccount && !formData.bank_account_id) {
        setFormData(prev => ({ ...prev, bank_account_id: activeAccount.id }));
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.type) {
      newErrors.type = 'Payment type is required';
    }

    if (!formData.bank_account_id) {
      newErrors.bank_account_id = 'Bank account is required';
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
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount.toString()),
      });
      // Reset form
      const defaultAccount = bankAccounts.find(acc => acc.is_active);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'deposit',
        bank_account_id: defaultAccount?.id || '',
        notes: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      const defaultAccount = bankAccounts.find(acc => acc.is_active);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'deposit',
        bank_account_id: defaultAccount?.id || '',
        notes: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            Add Payment - {loanName}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="deposit">Deposit (Pay down loan)</option>
                <option value="withdrawal">Withdrawal (Take additional funds)</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.type === 'deposit' 
                  ? 'Deposit will reduce the loan amount and create an expense transaction'
                  : 'Withdrawal will increase the loan amount and create an income transaction'}
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Bank Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account *
              </label>
              <select
                value={formData.bank_account_id}
                onChange={(e) => handleInputChange('bank_account_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bank_account_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading || loadingAccounts}
              >
                <option value="">Select a bank account</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} - {account.bank_name} ({account.account_number})
                  </option>
                ))}
              </select>
              {errors.bank_account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.bank_account_id}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this payment..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Process Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanPaymentModal;
