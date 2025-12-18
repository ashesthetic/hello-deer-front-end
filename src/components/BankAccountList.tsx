import React from 'react';
import { BankAccount } from '../types';
import Modal from './Modal';

interface BankAccountListProps {
  bankAccounts: BankAccount[];
  loading: boolean;
  onEdit: (bankAccount: BankAccount) => void;
  onView: (bankAccount: BankAccount) => void;
  onDelete: (bankAccount: BankAccount) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortByChange: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const BankAccountList: React.FC<BankAccountListProps> = ({
  bankAccounts,
  loading,
  onEdit,
  onView,
  onDelete,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  totalPages,
  currentPage,
  totalItems,
  onPageChange,
  canEdit,
  canDelete,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [bankAccountToDelete, setBankAccountToDelete] = React.useState<BankAccount | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortByChange(field);
      onSortDirectionChange('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatAccountType = (type: string) => {
    return type;
  };

  const formatCurrency = (amount: number | string, currency: string = 'CAD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const symbol = currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency;
    return `${symbol}${numAmount.toFixed(2)}`;
  };

  const formatStatus = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const handleDeleteClick = (bankAccount: BankAccount) => {
    setBankAccountToDelete(bankAccount);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bankAccountToDelete) return;
    setDeleting(true);
    await onDelete(bankAccountToDelete);
    setDeleting(false);
    setDeleteModalOpen(false);
    setBankAccountToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setBankAccountToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {bankAccounts.length} of {totalItems} bank accounts
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('bank_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Bank Name</span>
                  <span className="text-blue-600">{getSortIcon('bank_name')}</span>
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('account_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Account Name</span>
                  <span className="text-blue-600">{getSortIcon('account_name')}</span>
                </div>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Number
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('account_type')}
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  <span className="text-blue-600">{getSortIcon('account_type')}</span>
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center space-x-1">
                  <span>Balance</span>
                  <span className="text-blue-600">{getSortIcon('balance')}</span>
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('is_active')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <span className="text-blue-600">{getSortIcon('is_active')}</span>
                </div>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bankAccounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'No bank accounts found matching your search.' : 'No bank accounts found.'}
                </td>
              </tr>
            ) : (
              bankAccounts.map((bankAccount) => (
                <tr key={bankAccount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm font-medium text-gray-900">{bankAccount.bank_name}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">{bankAccount.account_name}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900 font-mono">
                      {bankAccount.masked_account_number || 
                       (bankAccount.account_number.length > 4 
                         ? '*'.repeat(bankAccount.account_number.length - 4) + bankAccount.account_number.slice(-4)
                         : bankAccount.account_number)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {formatAccountType(bankAccount.account_type)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900 font-semibold">
                      {formatCurrency(bankAccount.balance, bankAccount.currency)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bankAccount.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatStatus(bankAccount.is_active)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">{bankAccount.user?.name || 'Unknown'}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onView(bankAccount)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => onEdit(bankAccount)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(bankAccount)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for delete confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Bank Account"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete bank account <b>{bankAccountToDelete?.account_name}</b> at <b>{bankAccountToDelete?.bank_name}</b>?
      </Modal>
    </div>
  );
};

export default BankAccountList;
