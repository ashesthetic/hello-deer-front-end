import React, { useState, useEffect } from 'react';
import { BankAccount, CreateBankAccountData, UpdateBankAccountData } from '../types';

interface BankAccountFormProps {
  onSubmit: (data: CreateBankAccountData | UpdateBankAccountData) => void;
  onCancel: () => void;
  loading: boolean;
  initialData: BankAccount | null;
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateBankAccountData>({
    bank_name: '',
    account_name: '',
    account_number: '',
    account_type: 'Checking',
    routing_number: '',
    swift_code: '',
    currency: 'CAD',
    balance: 0,
    is_active: true,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountTypes = ['Checking', 'Savings', 'Business', 'Credit', 'Investment'] as const;
  const currencies = [
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
  ];

  useEffect(() => {
    if (initialData) {
      console.log('Setting form data from initialData:', initialData);
      const newFormData = {
        bank_name: initialData.bank_name,
        account_name: initialData.account_name,
        account_number: initialData.account_number,
        account_type: initialData.account_type,
        routing_number: initialData.routing_number || '',
        swift_code: initialData.swift_code || '',
        currency: initialData.currency || 'CAD',
        balance: typeof initialData.balance === 'string' ? parseFloat(initialData.balance) || 0 : initialData.balance || 0,
        is_active: initialData.is_active ?? true,
        notes: initialData.notes || '',
      };
      console.log('New form data:', newFormData);
      setFormData(newFormData);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }

    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required';
    }

    if (!formData.account_type) {
      newErrors.account_type = 'Account type is required';
    }

    if (formData.balance !== undefined && formData.balance < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    if (formData.currency && formData.currency.length !== 3) {
      newErrors.currency = 'Currency must be a 3-letter code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission - formData:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form submission - submitData:', formData);
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Show loading state if we're in edit mode but don't have initial data yet
  if (initialData && !formData.bank_name) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="ml-3 text-gray-600">Loading bank account data...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name *
          </label>
          <input
            type="text"
            value={formData.bank_name}
            onChange={(e) => handleInputChange('bank_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.bank_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter bank name"
          />
          {errors.bank_name && <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Name *
          </label>
          <input
            type="text"
            value={formData.account_name}
            onChange={(e) => handleInputChange('account_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.account_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter account name"
          />
          {errors.account_name && <p className="text-red-500 text-sm mt-1">{errors.account_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number *
          </label>
          <input
            type="text"
            value={formData.account_number}
            onChange={(e) => handleInputChange('account_number', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.account_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter account number"
          />
          {errors.account_number && <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type *
          </label>
          <select
            value={formData.account_type}
            onChange={(e) => handleInputChange('account_type', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.account_type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.account_type && <p className="text-red-500 text-sm mt-1">{errors.account_type}</p>}
        </div>

        {/* Additional Details */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Routing Number
          </label>
          <input
            type="text"
            value={formData.routing_number || ''}
            onChange={(e) => handleInputChange('routing_number', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter routing number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SWIFT Code
          </label>
          <input
            type="text"
            value={formData.swift_code || ''}
            onChange={(e) => handleInputChange('swift_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter SWIFT code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.currency ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Balance
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.balance}
            onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.balance ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter current balance"
          />
          {errors.balance && <p className="text-red-500 text-sm mt-1">{errors.balance}</p>}
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Account is active
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about this bank account"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || (!!initialData && !formData.bank_name)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData ? 'Update Bank Account' : 'Create Bank Account'}
        </button>
      </div>
    </form>
  );
};

export default BankAccountForm;
