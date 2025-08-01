import React from 'react';
import { DailySale, User } from '../types';
import { canUpdateDailySale, canDelete } from '../utils/permissions';
import Modal from './Modal';
import { DataTable, TableColumn, ActionButtons, ActionButton } from './common/DataTable';
import { formatCurrency, formatDate } from '../utils/chartConfigs';

type SortField = 'date' | 'fuel_sale' | 'store_sale' | 'gst' | 'card' | 'cash' | 'reported_total' | 'approximate_profit';
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
    gst: number;
    card: number;
    cash: number;
    reported_total: number;
    approximate_profit: number;
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

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field as SortField);
    }
  };

  const columns: TableColumn<DailySale>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: !!onSort,
      render: (sale: DailySale) => formatDate(sale.date)
    },
    {
      key: 'fuel_sale',
      header: 'Fuel Sale',
      sortable: !!onSort,
      render: (sale: DailySale) => formatCurrency(sale.fuel_sale ?? 0)
    },
    {
      key: 'store_sale',
      header: 'Store Sale',
      sortable: !!onSort,
      render: (sale: DailySale) => formatCurrency(sale.store_sale ?? 0)
    },
    {
      key: 'gst',
      header: 'GST',
      sortable: !!onSort,
      render: (sale: DailySale) => formatCurrency(sale.gst ?? 0)
    },
    {
      key: 'card',
      header: 'Card Sale',
      sortable: !!onSort,
      render: (sale: DailySale) => formatCurrency(sale.card ?? 0)
    },
    {
      key: 'cash',
      header: 'Cash Sale',
      sortable: !!onSort,
      render: (sale: DailySale) => formatCurrency(sale.cash ?? 0)
    },

    {
      key: 'reported_total',
      header: 'Grand Total',
      sortable: !!onSort,
      className: 'table-cell-bold',
      render: (sale: DailySale) => formatCurrency(sale.reported_total ?? 0)
    },
    {
      key: 'approximate_profit',
      header: 'Approximate Profit',
      sortable: !!onSort,
      className: 'table-cell-bold text-green-600',
      render: (sale: DailySale) => formatCurrency(sale.approximate_profit ?? 0)
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'table-cell-actions',
      render: (sale: DailySale) => {
        const actions: ActionButton[] = [
          {
            label: 'View',
            onClick: () => onView(sale),
            variant: 'view'
          }
        ];

        if (canUpdateDailySale(currentUser, sale)) {
          actions.push({
            label: 'Edit',
            onClick: () => onEdit(sale),
            variant: 'edit'
          });
        }

        if (canDelete(currentUser)) {
          actions.push({
            label: 'Delete',
            onClick: () => handleDeleteClick(sale),
            variant: 'delete'
          });
        }

        return <ActionButtons actions={actions} />;
      }
    }
  ];

  return (
    <>
      <DataTable
        data={sales}
        columns={columns}
        loading={loading}
        emptyMessage="No sales found."
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        rowKey={(sale) => sale.id!}
        className="table-compact"
        footer={totals && (
          <tr className="table-row bg-gray-100 font-semibold">
            <td className="table-cell">Total</td>
            <td className="table-cell">{formatCurrency(totals.fuel_sale ?? 0)}</td>
            <td className="table-cell">{formatCurrency(totals.store_sale ?? 0)}</td>
            <td className="table-cell">{formatCurrency(totals.gst ?? 0)}</td>
            <td className="table-cell">{formatCurrency(totals.card ?? 0)}</td>
            <td className="table-cell">{formatCurrency(totals.cash ?? 0)}</td>

            <td className="table-cell">{formatCurrency(totals.reported_total ?? 0)}</td>
            <td className="table-cell text-green-600 font-bold">{formatCurrency(totals.approximate_profit ?? 0)}</td>
            <td className="table-cell"></td>
          </tr>
        )}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        title="Delete Sale"
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete the sale for {saleToDelete ? formatDate(saleToDelete.date) : ''}? This action cannot be undone.
      </Modal>
    </>
  );
};

export default DailySalesList; 