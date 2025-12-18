import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ownerEquitiesApi, ownersApi } from '../services/api';
import { OwnerEquity, UpdateOwnerEquityData, Owner } from '../types';
import { canUpdate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

const OwnerEquityEditPage: React.FC = () => {
  usePageTitle('Edit Equity Transaction');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<OwnerEquity | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [formData, setFormData] = useState<UpdateOwnerEquityData>({
    owner_id: 0,
    transaction_type: 'contribution',
    amount: 0,
    transaction_date: '',
    reference_number: '',
    payment_method: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchTransaction(parseInt(id));
    }
    fetchOwners();
  }, [id]);

  const fetchTransaction = async (transactionId: number) => {
    setLoading(true);
    try {
      const response = await ownerEquitiesApi.getById(transactionId);
      const transactionData = response.data;
      setTransaction(transactionData);
      
      // Format the date for the input field (YYYY-MM-DD format)
      const formattedDate = transactionData.transaction_date ? 
        new Date(transactionData.transaction_date).toISOString().split('T')[0] : 
        '';
      
      setFormData({
        owner_id: transactionData.owner_id,
        transaction_type: transactionData.transaction_type,
        amount: transactionData.amount,
        transaction_date: formattedDate,
        reference_number: transactionData.reference_number || '',
        payment_method: transactionData.payment_method || '',
        description: transactionData.description || '',
        notes: transactionData.notes || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await ownersApi.getAll({ per_page: 1000 });
      setOwners(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch owners:', err);
    }
  };

  if (!canUpdate(currentUser)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit equity transactions.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Ensure the data is in the correct format for the backend
      const submitData = {
        ...formData,
        transaction_date: formData.transaction_date, // Already in YYYY-MM-DD format
        transaction_type: formData.transaction_type, // Ensure this is properly set
      };
      
      await ownerEquitiesApi.update(parseInt(id), submitData);
      navigate('/accounting/owner-equities');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounting/owner-equities');
  };

  if (loading && !transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Equity Transaction</h1>
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transaction Details */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
            </div>

            <div>
              <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-2">
                Owner *
              </label>
              <select
                id="owner_id"
                name="owner_id"
                value={formData.owner_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.ownership_percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <select
                id="transaction_type"
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="contribution">Contribution</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="distribution">Distribution</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date *
              </label>
              <input
                type="date"
                id="transaction_date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                id="reference_number"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleInputChange}
                placeholder="Check number, transfer ID, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <input
                type="text"
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                placeholder="Cash, Check, E-transfer, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Additional Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the transaction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Additional notes about this transaction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerEquityEditPage; 