import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { bankAccountsApi } from '../services/api';
import { BankAccount, UpdateBankAccountData } from '../types';
import BankAccountForm from '../components/BankAccountForm';
import { usePageTitle } from '../hooks/usePageTitle';

const BankAccountEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(bankAccount ? `Edit ${bankAccount.account_name}` : 'Edit Bank Account');

  useEffect(() => {
    if (id) {
      fetchBankAccount();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchBankAccount = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await bankAccountsApi.getById(parseInt(id));
      setBankAccount(response.data);
      
      // Check if user can edit this bank account
      const bankAccountData = response.data;
      if (currentUser?.role === 'editor' && bankAccountData.user_id !== currentUser.id) {
        setError('You do not have permission to edit this bank account');
        return;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Bank account not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this bank account');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch bank account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateBankAccountData) => {
    if (!id || !bankAccount) return;
    
    setFormLoading(true);
    setError(null);
    
    try {
      await bankAccountsApi.update(parseInt(id), data);
      navigate('/accounting/bank-accounts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update bank account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounting/bank-accounts');
  };

  // Show loading state while fetching bank account
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="ml-3 text-gray-600">Loading bank account...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !bankAccount) {
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Bank Account</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Check if user can edit (additional check)
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
    navigate('/accounting/bank-accounts');
    return null;
  }

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
          <h1 className="text-2xl font-bold text-gray-900">
            Edit {bankAccount?.account_name || 'Bank Account'}
          </h1>
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

        {bankAccount && (
          <BankAccountForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={formLoading}
            initialData={bankAccount}
          />
        )}
      </div>
    </div>
  );
};

export default BankAccountEditPage;
