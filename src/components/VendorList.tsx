import React from 'react';
import { Vendor } from '../types';
import Modal from './Modal';

interface VendorListProps {
  vendors: Vendor[];
  loading: boolean;
  onEdit: (vendor: Vendor) => void;
  onView: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
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

const VendorList: React.FC<VendorListProps> = ({
  vendors,
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
  const [vendorToDelete, setVendorToDelete] = React.useState<Vendor | null>(null);
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

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'PAD':
        return 'PAD';
      case 'Credit Card':
        return 'Credit Card';
      case 'E-transfer':
        return 'E-transfer';
      case 'Direct Deposit':
        return 'Direct Deposit';
      default:
        return method;
    }
  };

  const handleDeleteClick = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!vendorToDelete) return;
    setDeleting(true);
    await onDelete(vendorToDelete);
    setDeleting(false);
    setDeleteModalOpen(false);
    setVendorToDelete(null);
  };
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setVendorToDelete(null);
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
          Showing {vendors.length} of {totalItems} vendors
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <span className="text-blue-600">{getSortIcon('name')}</span>
                </div>
              </th>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('payment_method')}
              >
                <div className="flex items-center space-x-1">
                  <span>Payment Method</span>
                  <span className="text-blue-600">{getSortIcon('payment_method')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Person
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
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'No vendors found matching your search.' : 'No vendors found.'}
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {formatPaymentMethod(vendor.payment_method)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">
                      {vendor.contact_person_name ? (
                        <div>
                          <div className="font-medium">{vendor.contact_person_name}</div>
                          {vendor.contact_person_title && (
                            <div className="text-xs text-gray-500">{vendor.contact_person_title}</div>
                          )}
                          {vendor.contact_person_email && (
                            <div className="text-xs text-gray-500">{vendor.contact_person_email}</div>
                          )}
                          {vendor.contact_person_phone && (
                            <div className="text-xs text-gray-500">{vendor.contact_person_phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No contact person</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">{vendor.user?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onView(vendor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => onEdit(vendor)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(vendor)}
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
        title="Delete Vendor"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
      >
        Are you sure you want to delete vendor <b>{vendorToDelete?.name}</b>?
      </Modal>
    </div>
  );
};

export default VendorList; 