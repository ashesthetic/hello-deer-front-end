import React from 'react';
import { DailyFuel, User } from '../types';
import { canUpdateDailyFuel, canDeleteDailyFuel, getRoleDisplayName } from '../utils/permissions';
import Tooltip from './Tooltip';
import Modal from './Modal';

type SortField = 'date' | 'total_quantity' | 'total_amount' | 'regular_total_sale' | 'plus_total_sale' | 'sup_plus_total_sale' | 'diesel_total_sale';
type SortDirection = 'asc' | 'desc';

interface DailyFuelsListProps {
  fuels: DailyFuel[];
  currentUser: User | null;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  totals?: {
    regular_quantity: number;
    regular_total_sale: number;
    plus_quantity: number;
    plus_total_sale: number;
    sup_plus_quantity: number;
    sup_plus_total_sale: number;
    diesel_quantity: number;
    diesel_total_sale: number;
    total_quantity: number;
    total_amount: number;
    average_price: number;
  };
}

const DailyFuelsList: React.FC<DailyFuelsListProps> = ({
  fuels,
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

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(quantity);
  };

  const formatPrice3 = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
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
  const [fuelToDelete, setFuelToDelete] = React.useState<DailyFuel | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDeleteClick = (fuel: DailyFuel) => {
    setFuelToDelete(fuel);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!fuelToDelete) return;
    setDeleting(true);
    await onDelete(fuelToDelete.id!);
    setDeleting(false);
    setDeleteModalOpen(false);
    setFuelToDelete(null);
  };
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setFuelToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (fuels.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No fuels found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Regular (87)
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plus (91)
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sup Plus (94)
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diesel
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fuels.map((fuel) => (
            <tr key={fuel.id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(fuel.date)}
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(fuel.regular_quantity || 0)}L</div>
                <div className="text-xs text-gray-500">Sale: {formatCurrency(fuel.regular_total_sale || 0)}</div>
                <div className="text-xs text-gray-500">Price: {formatPrice3(fuel.regular_price_per_liter || 0)}/L</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(fuel.plus_quantity || 0)}L</div>
                <div className="text-xs text-gray-500">Sale: {formatCurrency(fuel.plus_total_sale || 0)}</div>
                <div className="text-xs text-gray-500">Price: {formatPrice3(fuel.plus_price_per_liter || 0)}/L</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(fuel.sup_plus_quantity || 0)}L</div>
                <div className="text-xs text-gray-500">Sale: {formatCurrency(fuel.sup_plus_total_sale || 0)}</div>
                <div className="text-xs text-gray-500">Price: {formatPrice3(fuel.sup_plus_price_per_liter || 0)}/L</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(fuel.diesel_quantity || 0)}L</div>
                <div className="text-xs text-gray-500">Sale: {formatCurrency(fuel.diesel_total_sale || 0)}</div>
                <div className="text-xs text-gray-500">Price: {formatPrice3(fuel.diesel_price_per_liter || 0)}/L</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(fuel.total_quantity || 0)}L</div>
                <div className="font-semibold">{formatCurrency(fuel.total_amount || 0)}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(fuel.id!)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  {canUpdateDailyFuel(currentUser, fuel) && (
                    <button
                      onClick={() => onEdit(fuel.id!)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteDailyFuel(currentUser, fuel) && (
                    <button
                      onClick={() => handleDeleteClick(fuel)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          
          {/* Total Row */}
          {fuels.length > 0 && totals && (
            <tr className="bg-gray-50 font-semibold">
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                <strong>TOTAL</strong>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(totals.regular_quantity)}L</div>
                <div className="font-semibold">{formatCurrency(totals.regular_total_sale)}</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(totals.plus_quantity)}L</div>
                <div className="font-semibold">{formatCurrency(totals.plus_total_sale)}</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(totals.sup_plus_quantity)}L</div>
                <div className="font-semibold">{formatCurrency(totals.sup_plus_total_sale)}</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(totals.diesel_quantity)}L</div>
                <div className="font-semibold">{formatCurrency(totals.diesel_total_sale)}</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                <div className="text-xs text-gray-500">Qty: {formatQuantity(totals.total_quantity)}L</div>
                <div className="font-semibold">{formatCurrency(totals.total_amount)}</div>
              </td>
              <td className="px-3 py-4"></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal for delete confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Fuel Record"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete this fuel record?
      </Modal>
    </div>
  );
};

export default DailyFuelsList; 