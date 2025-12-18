import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { bankAccountsApi } from '../services/api';
import { CreateBankAccountData } from '../types';
import BankAccountForm from '../components/BankAccountForm';
import { usePageTitle } from '../hooks/usePageTitle';

const BankAccountAddPage: React.FC = () => {
  usePageTitle('Add Bank Account');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can create bank accounts
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
    navigate('/accounting/bank-accounts');
    return null;
  }

  const handleSubmit = async (data: CreateBankAccountData) => {
    setLoading(true);
    setError(null);
    
    try {
      await bankAccountsApi.create(data);
      navigate('/accounting/bank-accounts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounting/bank-accounts');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Bank Account</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <BankAccountForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          initialData={null}
        />
      </div>
    </div>
  );
};

export default BankAccountAddPage;
