import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ownersApi } from '../services/api';
import { Owner } from '../types';
import { canUpdate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCurrency } from '../utils/dateUtils';

const OwnerViewPage: React.FC = () => {
  usePageTitle('Owner Details');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);

  useEffect(() => {
    if (id) {
      fetchOwner(parseInt(id));
    }
  }, [id]);

  const fetchOwner = async (ownerId: number) => {
    setLoading(true);
    try {
      const response = await ownersApi.getById(ownerId);
      setOwner(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch owner');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/accounting/owners/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/accounting/owners');
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

  if (!owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Owner Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Owner Details</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            {canUpdate(currentUser) && (
              <button
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Edit Owner
              </button>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Basic Information */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{owner.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{owner.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm text-gray-900">{owner.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Ownership Percentage</label>
                <p className="text-sm text-gray-900">{owner.ownership_percentage}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  owner.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {owner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {(owner.address || owner.city || owner.province || owner.postal_code) && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owner.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm text-gray-900">{owner.address}</p>
                  </div>
                )}
                {owner.city && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">City</label>
                    <p className="text-sm text-gray-900">{owner.city}</p>
                  </div>
                )}
                {owner.province && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Province</label>
                    <p className="text-sm text-gray-900">{owner.province}</p>
                  </div>
                )}
                {owner.postal_code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Postal Code</label>
                    <p className="text-sm text-gray-900">{owner.postal_code}</p>
                  </div>
                )}
                {owner.country && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Country</label>
                    <p className="text-sm text-gray-900">{owner.country}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equity Information */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equity Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Equity</label>
                <p className="text-sm text-gray-900 font-semibold">{formatCurrency(owner.total_equity || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Investments</label>
                <p className="text-sm text-gray-900">{formatCurrency(owner.total_investments || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Withdrawals</label>
                <p className="text-sm text-gray-900">{formatCurrency(owner.total_withdrawals || 0)}</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          {owner.equity_transactions && owner.equity_transactions.length > 0 && (
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {owner.equity_transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.formatted_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.is_investment 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.formatted_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {owner.notes && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{owner.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerViewPage; 