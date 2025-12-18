import React from 'react';
import { DailySale, User } from '../types';
import { canUpdateDailySale, canDelete, getRoleDisplayName } from '../utils/permissions';
import Tooltip from './Tooltip';
import Modal from './Modal';
import { DataTable, TableColumn, ActionButtons, ActionButton } from './common/DataTable';
import { formatCurrency, formatDate } from '../utils/chartConfigs';

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
      key: 'reported_total',
      header: 'Grand Total',
      sortable: !!onSort,
      className: 'table-cell-bold',
      render: (sale: DailySale) => formatCurrency(sale.reported_total ?? 0)
    },
    ...(currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor') ? [{
      key: 'user',
      header: 'Created By',
      render: (sale: DailySale) => sale.user ? (
        <Tooltip content={getRoleDisplayName(sale.user.role)} position="top">
          <span className="text-sm text-gray-900 cursor-help">
            {sale.user.name}
          </span>
        </Tooltip>
      ) : (
        <span className="text-sm text-gray-500">Unknown</span>
      )
    }] : []),
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
      />

      {/* Totals Row */}
      {totals && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-sm font-semibold">
            <div>Total</div>
            <div>{formatCurrency(totals.fuel_sale ?? 0)}</div>
            <div>{formatCurrency(totals.store_sale ?? 0)}</div>
            <div>{formatCurrency(totals.reported_total ?? 0)}</div>
          </div>
        </div>
      )}

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