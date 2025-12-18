import React from 'react';
import { DailySale, User } from '../types';
import { canUpdateDailySale, canDelete, getRoleDisplayName } from '../utils/permissions';
import Tooltip from './Tooltip';

type SortField = 'date' | 'total_product_sale' | 'total_counter_sale' | 'reported_total';
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
    total_product_sale: number;
    total_counter_sale: number;
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
        <p className="text-gray-500">No daily sales found.</p>
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
              {renderSortableHeader('total_product_sale', 'Product Sale')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {renderSortableHeader('total_counter_sale', 'Counter Sale')}
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
                {formatCurrency(sale.total_product_sale || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(sale.total_counter_sale || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(sale.reported_total || 0)}
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
                      onClick={() => onDelete(sale.id!)}
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
                {formatCurrency(totals.total_product_sale)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(totals.total_counter_sale)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(totals.reported_total)}
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
    </div>
  );
};

export default DailySalesList; 