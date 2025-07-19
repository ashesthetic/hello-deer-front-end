import React from 'react';
import { DailySale, User } from '../types';
import { canUpdateDailySale, canDelete, getRoleDisplayName } from '../utils/permissions';
import Tooltip from './Tooltip';
import Modal from './Modal';

type SortField = 'date' | 'fuel_sale' | 'store_sale' | 'reported_total';
type SortDirection = 'asc' | 'desc';

interface DailySalesListProps {
  sales: DailySale[];
  currentUser: User | null;
  onView: (sale: DailySale) => void;
  onEdit: (sale: DailySale) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  totals?: {
    fuel_sale: number;
    store_sale: number;
    reported_total: number;
  };
}

const DailySalesList: React.FC<DailySalesListProps> = ({
  sales,
  currentUser,
  onView,
  onEdit,
  onDelete,
  loading = false,
  sortField,
  sortDirection,
  onSort,
  totals
}) => {
  const formatDate = (dateString: string) => {
    // Split the date string and format it directly to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const renderSortableHeader = (field: SortField, label: string) => {
    if (!onSort) {
      return <span>{label}</span>;
    }

    const isActive = sortField === field;
    const isAsc = sortDirection === 'asc';
    
    return (
      <button
        onClick={() => onSort(field)}
        className="flex items-center space-x-1 hover:text-blue-600 focus:outline-none focus:text-blue-600"
      >
        <span>{label}</span>
        {isActive && (
          <span className="text-blue-600">
            {isAsc ? '↑' : '↓'}
          </span>
        )}
      </button>
    );
  };

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [saleToDelete, setSaleToDelete] = React.useState<DailySale | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDeleteClick = (sale: DailySale) => {
    setSaleToDelete(sale);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    setDeleting(true);
    await onDelete(saleToDelete.id!);
    setDeleting(false);
    setDeleteModalOpen(false);
    setSaleToDelete(null);
  };
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setSaleToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sales found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {renderSortableHeader('date', 'Date')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {renderSortableHeader('fuel_sale', 'Fuel Sale')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {renderSortableHeader('store_sale', 'Store Sale')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {renderSortableHeader('reported_total', 'Grand Total')}
            </th>
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatDate(sale.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(sale.fuel_sale ?? 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(sale.store_sale ?? 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(sale.reported_total ?? 0)}
              </td>
              {currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.user ? (
                    <Tooltip content={getRoleDisplayName(sale.user.role)} position="top">
                      <span className="text-sm text-gray-900 cursor-help">
                        {sale.user.name}
                      </span>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-gray-500">Unknown</span>
                  )}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(sale)}
                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-xs"
                  >
                    View
                  </button>
                  {canUpdateDailySale(currentUser, sale) && (
                    <button
                      onClick={() => onEdit(sale)}
                      className="text-green-600 hover:text-green-900 px-2 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete(currentUser) && (
                    <button
                      onClick={() => handleDeleteClick(sale)}
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          
          {/* Totals Row */}
          {totals && (
            <tr className="bg-gray-100 font-semibold">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(totals.fuel_sale ?? 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(totals.store_sale ?? 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(totals.reported_total ?? 0)}
              </td>
              {currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* Empty cell for alignment */}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {/* Empty cell for alignment */}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal for delete confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Sale"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete this sale record?
      </Modal>
    </div>
  );
};

export default DailySalesList; 