import React, { useState } from 'react';
import { PendingItem, BankAccount, ResolutionData } from '../types';
import { safedropResolutionApi } from '../services/api';

interface ResolutionModalProps {
  item: PendingItem;
  type: 'safedrops' | 'cash_in_hand';
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

const ResolutionModal: React.FC<ResolutionModalProps> = ({
  item,
  type,
  bankAccounts,
  onClose,
  onSuccess
}) => {
  const [resolutions, setResolutions] = useState<ResolutionData[]>([
    { bank_account_id: 0, amount: 0, notes: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingAmount = parseFloat((type === 'safedrops' ? item.safedrops.pending_amount : item.cash_in_hand.pending_amount).toString());
  const typeLabel = type === 'safedrops' ? 'Safedrops' : 'Cash in Hand';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-CA');
  };

  const addResolution = () => {
    setResolutions([...resolutions, { bank_account_id: 0, amount: 0, notes: '' }]);
  };

  const removeResolution = (index: number) => {
    if (resolutions.length > 1) {
      setResolutions(resolutions.filter((_, i) => i !== index));
    }
  };

  const updateResolution = (index: number, field: keyof ResolutionData, value: any) => {
    const updated = [...resolutions];
    updated[index] = { ...updated[index], [field]: value };
    setResolutions(updated);
  };

  const totalAllocated = resolutions.reduce((sum, res) => sum + (res.amount || 0), 0);
  // Round to 2 decimal places to avoid floating-point precision issues
  const totalAllocatedRounded = Math.round(totalAllocated * 100) / 100;
  const pendingAmountRounded = Math.round(pendingAmount * 100) / 100;
  const remaining = pendingAmountRounded - totalAllocatedRounded;

  const isValid = () => {
    // Check if all resolutions have valid bank accounts and amounts
    const hasValidResolutions = resolutions.every(res => 
      res.bank_account_id > 0 && res.amount > 0
    );
    
    // Check if total doesn't exceed pending amount (with tolerance for floating-point errors)
    const validTotal = totalAllocatedRounded <= pendingAmountRounded + 0.001 && totalAllocatedRounded > 0;
    
    return hasValidResolutions && validTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid()) return;

    try {
      setLoading(true);
      setError(null);

      await safedropResolutionApi.resolve({
        daily_sale_id: item.id,
        type,
        resolutions: resolutions.filter(res => res.amount > 0)
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while processing the resolution');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (resolutions.length === 1 && resolutions[0].bank_account_id > 0) {
      updateResolution(0, 'amount', pendingAmountRounded);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Resolve {typeLabel} - {formatDate(item.date)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Date:</span>
              <div className="font-medium">{formatDate(item.date)}</div>
            </div>
            <div>
              <span className="text-gray-600">User:</span>
              <div className="font-medium">{item.user?.name || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-600">Pending Amount:</span>
              <div className="font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
            </div>
            <div>
              <span className="text-gray-600">Remaining:</span>
              <div className={`font-bold ${remaining < 0 ? 'text-red-600' : remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(remaining)}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Resolutions */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold text-gray-900">Allocate to Bank Accounts</h4>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={resolutions.length !== 1 || resolutions[0].bank_account_id === 0}
                >
                  Auto-fill remaining
                </button>
                <button
                  type="button"
                  onClick={addResolution}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Another Account
                </button>
              </div>
            </div>

            {resolutions.map((resolution, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h5 className="font-medium text-gray-900">Allocation #{index + 1}</h5>
                  {resolutions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResolution(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Account *
                    </label>
                    <select
                      required
                      value={resolution.bank_account_id}
                      onChange={(e) => updateResolution(index, 'bank_account_id', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Select bank account...</option>
                      {bankAccounts
                        .filter(account => account.is_active)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} ({account.account_type}) - {formatCurrency(parseFloat(account.balance.toString()))}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={pendingAmountRounded}
                      required
                      value={resolution.amount || ''}
                      onChange={(e) => updateResolution(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={resolution.notes || ''}
                    onChange={(e) => updateResolution(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Add any notes about this allocation..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total Allocated:</span>
              <span className="font-bold text-blue-900">{formatCurrency(totalAllocatedRounded)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-700">Remaining:</span>
              <span className={`font-bold ${remaining < -0.001 ? 'text-red-600' : Math.abs(remaining) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
            {remaining < -0.001 && (
              <div className="text-red-600 text-xs mt-2">
                ⚠️ Total allocation exceeds pending amount
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Resolve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolutionModal;
