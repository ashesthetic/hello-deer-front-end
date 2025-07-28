import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canUpdate, canDelete } from '../utils/permissions';
import ConfirmationModal from '../components/ConfirmationModal';
import { vendorInvoicesApi, VendorInvoice } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDateForDisplay, formatDateDetailed, formatDateTimeForDisplay, formatCurrency } from '../utils/dateUtils';

const VendorInvoiceViewPage: React.FC = () => {
  usePageTitle('Vendor Invoice Details');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [invoice, setInvoice] = useState<VendorInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await vendorInvoicesApi.getById(parseInt(id));
      setInvoice(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/accounting/vendor-invoices/${id}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!invoice) return;
    
    try {
      await vendorInvoicesApi.delete(invoice.id);
      navigate('/accounting/vendor-invoices');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    navigate('/accounting/vendor-invoices');
  };

  const handleDownloadFile = async () => {
    if (!invoice) return;
    
    try {
      const response = await vendorInvoicesApi.downloadFile(invoice.id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = invoice.invoice_file_path?.split('/').pop() || 'invoice';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Failed to download file');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'Paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getTypeBadgeClass = (type: string) => {
    return type === 'Income' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoice details...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Vendor Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Invoice Details</h1>
            <p className="text-gray-600">
              {invoice.vendor?.name} • {formatDateDetailed(invoice.invoice_date)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            {canUpdate(currentUser) && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            {canDelete(currentUser) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Invoice Information */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Invoice Information</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Vendor Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                <p className="text-gray-900">{invoice.vendor?.name}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <p className="text-gray-900">{formatDateDetailed(invoice.invoice_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(Number(invoice.amount))}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getTypeBadgeClass(invoice.type)}`}>
                    {invoice.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information - Only show if status is Paid */}
            {invoice.status === 'Paid' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <p className="text-gray-900">{formatDateDetailed(invoice.payment_date!)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <p className="text-gray-900">{invoice.payment_method}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice File */}
            {invoice.invoice_file_path && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice File</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      File: {invoice.invoice_file_path.split('/').pop()}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadFile}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            {invoice.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{invoice.description}</p>
                </div>
              </div>
            )}

            {/* Record Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded By</label>
                  <p className="text-gray-900">{invoice.user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded On</label>
                  <p className="text-gray-900">
                    {formatDateTimeForDisplay(invoice.created_at)}
                  </p>
                </div>
                {invoice.updated_at !== invoice.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-gray-900">
                      {formatDateTimeForDisplay(invoice.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor Invoice"
        message={`Are you sure you want to delete the invoice for ${invoice.vendor?.name} on ${formatDateDetailed(invoice.invoice_date)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default VendorInvoiceViewPage; 