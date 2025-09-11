import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { safedropResolutionApi, bankAccountsApi } from '../services/api';
import { PendingItem, BankAccount, SafedropResolution } from '../types';
import ResolutionModal from '../components/ResolutionModal';

const ResolvePendingPage: React.FC = () => {
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [resolutionHistory, setResolutionHistory] = useState<SafedropResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [selectedType, setSelectedType] = useState<'safedrops' | 'cash_in_hand' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Only admins can access this page
  const canResolve = currentUser?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, bankAccountsResponse, historyResponse] = await Promise.all([
        safedropResolutionApi.getPendingItems(),
        bankAccountsApi.getAll({ per_page: 1000 }),
        safedropResolutionApi.getHistory({ per_page: 20 })
      ]);

      setPendingItems(pendingResponse.data.data);
      setBankAccounts(bankAccountsResponse.data.data);
      setResolutionHistory(historyResponse.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(numAmount || 0);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-CA');
  };

  const handleResolve = (item: PendingItem, type: 'safedrops' | 'cash_in_hand') => {
    if (!canResolve) return;
    
    setSelectedItem(item);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedItem(null);
    setSelectedType(null);
  };

  const handleResolutionSuccess = () => {
    fetchData(); // Refresh the data
    handleModalClose();
  };

  if (!canResolve) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access the resolution system.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Resolve Pending Amounts</h1>
          <p className="mt-2 text-gray-600">
            Resolve safedrops and cash in hand amounts by allocating them to bank accounts.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Items ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resolution History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'pending' ? (
          // Pending Items Content
          pendingItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">There are no pending safedrops or cash in hand amounts to resolve.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Safedrops
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cash in Hand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.user?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{formatCurrency(item.safedrops.total_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Resolved:</span>
                              <span className="text-green-600">{formatCurrency(item.safedrops.resolved_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-bold text-orange-600">{formatCurrency(item.safedrops.pending_amount)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{formatCurrency(item.cash_in_hand.total_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Resolved:</span>
                              <span className="text-green-600">{formatCurrency(item.cash_in_hand.resolved_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-bold text-orange-600">{formatCurrency(item.cash_in_hand.pending_amount)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                          {parseFloat(item.safedrops.pending_amount.toString()) > 0 && (
                            <button
                              onClick={() => handleResolve(item, 'safedrops')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Resolve Safedrops
                            </button>
                          )}
                          {parseFloat(item.cash_in_hand.pending_amount.toString()) > 0 && (
                            <button
                              onClick={() => handleResolve(item, 'cash_in_hand')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-2"
                            >
                              Resolve Cash
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          // Resolution History Content
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resolved By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resolutionHistory.map((resolution) => (
                    <tr key={resolution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(resolution.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resolution.daily_sale ? formatDate(resolution.daily_sale.date) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resolution.type === 'safedrops' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {resolution.type === 'safedrops' ? 'Safedrops' : 'Cash in Hand'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(resolution.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resolution.bank_account?.account_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resolution.user?.name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {resolutionHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No resolution history found.</p>
              </div>
            )}
          </div>
        )}

        {/* Resolution Modal */}
        {showModal && selectedItem && selectedType && (
          <ResolutionModal
            item={selectedItem}
            type={selectedType}
            bankAccounts={bankAccounts}
            onClose={handleModalClose}
            onSuccess={handleResolutionSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ResolvePendingPage;
