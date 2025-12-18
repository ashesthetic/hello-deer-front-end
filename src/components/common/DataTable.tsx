import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  className?: string;
  rowKey?: (item: T) => string | number;
  footer?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data found.',
  sortField,
  sortDirection,
  onSort,
  className = '',
  rowKey,
  footer
}: DataTableProps<T>) {
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="table-empty">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <div className="table-wrapper">
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.sortable
                      ? 'table-header-cell-sortable'
                      : 'table-header-cell'
                  }
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-blue-600">{getSortIcon(column.key)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {data.map((item, index) => (
              <tr key={rowKey ? rowKey(item) : index} className="table-row">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.className || 'table-cell'}
                  >
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot className="table-footer">
              {footer}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// Action buttons component for tables
export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'view' | 'edit' | 'delete' | 'edit-alt';
  disabled?: boolean;
}

export function ActionButtons({ actions }: { actions: ActionButton[] }) {
  return (
    <div className="flex space-x-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`btn-action ${
            action.variant === 'view'
              ? 'btn-action-view'
              : action.variant === 'edit'
              ? 'btn-action-edit'
              : action.variant === 'delete'
              ? 'btn-action-delete'
              : action.variant === 'edit-alt'
              ? 'btn-action-edit-alt'
              : 'btn-action-view'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// Loading skeleton for tables
export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="table">
          <thead className="table-header">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="table-header-cell">
                  <div className="loading-skeleton-title"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="table-row">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="table-cell">
                    <div className="loading-skeleton-text"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 