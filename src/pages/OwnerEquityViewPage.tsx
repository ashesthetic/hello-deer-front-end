import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ownerEquitiesApi } from '../services/api';
import { OwnerEquity } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';


const OwnerEquityViewPage: React.FC = () => {
  usePageTitle('Equity Transaction Details');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<OwnerEquity | null>(null);

  useEffect(() => {
    if (id) {
      fetchTransaction(parseInt(id));
    }
  }, [id]);

  const fetchTransaction = async (transactionId: number) => {
    setLoading(true);
    try {
      const response = await ownerEquitiesApi.getById(transactionId);
      setTransaction(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/accounting/owner-equities');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Equity Transaction Details</h1>
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500">Owner</label>
            <p className="text-sm text-gray-900">{transaction.owner?.name || '-'}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500">Type</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              transaction.is_investment 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {transaction.type_display}
            </span>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500">Amount</label>
            <p className={`text-lg font-semibold ${transaction.is_investment ? 'text-green-600' : 'text-red-600'}`}>{transaction.formatted_amount}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500">Date</label>
            <p className="text-sm text-gray-900">{transaction.formatted_date}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500">Description</label>
            <p className="text-sm text-gray-900">{transaction.description || '-'}</p>
          </div>
          {transaction.note && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500">Note</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{transaction.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerEquityViewPage; 