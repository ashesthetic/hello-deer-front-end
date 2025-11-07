import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loanApi, Loan, LoanFormData } from '../services/api';
import Modal from './Modal';
import LoanPaymentModal, { PaymentFormData } from './LoanPaymentModal';

const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('/edit');
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [formData, setFormData] = useState<LoanFormData>({
    name: '',
    amount: '',
    currency: 'CAD',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadLoan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await loanApi.getById(parseInt(id!));
      const data = response.data.data; // Backend returns { data: loan }
      setLoan(data);
      setFormData({
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        notes: data.notes || '',
      });
    } catch (err: any) {
      console.error('Error loading loan:', err);
      setError('Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await loanApi.getPaymentHistory(parseInt(id!));
      setPaymentHistory(response.data.data || []);
    } catch (err: any) {
      console.error('Error loading payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadLoan();
      if (!isEditMode) {
        loadPaymentHistory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Loan name is required';
    }

    if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
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
      setSaving(true);
      await loanApi.update(parseInt(id!), {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
      });
      navigate('/accounting/loan-accounts');
    } catch (err: any) {
      console.error('Error updating loan:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError('Failed to update loan');
      }
    } finally {
      setSaving(false);
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

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await loanApi.delete(parseInt(id!));
      navigate('/accounting/loan-accounts');
    } catch (err) {
      console.error('Error deleting loan:', err);
      setError('Failed to delete loan');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
  };

  const handleAddPayment = () => {
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    try {
      await loanApi.processPayment(parseInt(id!), {
        date: data.date,
        amount: data.amount as number,
        type: data.type,
        bank_account_id: parseInt(data.bank_account_id.toString()),
        notes: data.notes,
      });
      // Reload loan data and payment history to get updated amount and new transaction
      await loadLoan();
      await loadPaymentHistory();
      setPaymentModalOpen(false);
    } catch (err) {
      console.error('Error processing payment:', err);
      throw err; // Let the modal handle the error
    }
  };

  const handlePaymentClose = () => {
    setPaymentModalOpen(false);
  };

  const formatCurrency = (amount: string, currency: string = 'CAD') => {
    const numAmount = parseFloat(amount);
    const symbol = currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'BDT' ? '৳' : currency;
    return `${symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => navigate('/accounting/loan-accounts')}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Loan Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/accounting/loan-accounts')}
          className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Loan Accounts
        </button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Loan Account' : 'Loan Account Details'}
          </h1>
          
          {!isEditMode && (
            <div className="flex space-x-3">
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Payment
              </button>
              <button
                onClick={() => navigate(`/accounting/loan-accounts/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={saving || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {isEditMode ? (
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            {/* Loan Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Small Business Loan - Bank of America"
                disabled={saving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount *
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
                    disabled={saving}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
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
                  disabled={saving}
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="BDT">BDT</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional details about the loan (interest rate, term, purpose, etc.)"
                disabled={saving}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/accounting/loan-accounts/${id}/view`)}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Update Loan'
              )}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Loan Name
                  </label>
                  <p className="text-lg text-gray-900">{loan?.name}</p>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Amount
                </label>
                <p className="text-lg font-semibold text-green-600">
                  {loan?.amount && loan?.currency ? formatCurrency(loan.amount, loan.currency) : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created Date
                </label>
                <p className="text-lg text-gray-900">
                  {loan?.created_at ? new Date(loan.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </label>
                <p className="text-lg text-gray-900">
                  {loan?.updated_at ? new Date(loan.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {loan?.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Notes
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{loan.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        <div className="mt-6 bg-white shadow-sm rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
          
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payment history yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Bank Account
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? 'Withdrawal' : 'Deposit'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 hidden sm:table-cell">
                          <div className="max-w-[150px] truncate" title={transaction.bank_account?.account_name}>
                            {transaction.bank_account?.account_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 hidden lg:table-cell">
                          <div className="max-w-[200px] truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          <div className="max-w-[120px] truncate" title={transaction.reference_number}>
                            {transaction.reference_number || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Loan Account"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete the loan account <b>{loan?.name}</b>?
        <br />
        <br />
        Amount: <b>{loan?.amount && loan?.currency ? formatCurrency(loan.amount, loan.currency) : 'N/A'}</b>
        <br />
        <br />
        This action cannot be undone.
      </Modal>

      {/* Payment Modal */}
      <LoanPaymentModal
        isOpen={paymentModalOpen}
        loanName={loan?.name || ''}
        onClose={handlePaymentClose}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default LoanDetailsPage;
