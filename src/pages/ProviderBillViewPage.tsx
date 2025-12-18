import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { providerBillsApi, ProviderBill } from '../services/api';

const ProviderBillViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [providerBill, setProviderBill] = useState<ProviderBill | null>(null);
  const [loading, setLoading] = useState(true);



  const fetchProviderBill = useCallback(async () => {
    try {
      setLoading(true);
      const response = await providerBillsApi.getById(parseInt(id!));
      setProviderBill(response.data);
    } catch (error) {
      console.error('Error fetching provider bill:', error);
      alert('Failed to load provider bill. Please try again.');
      navigate('/accounting/provider-bills');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchProviderBill();
    }
  }, [id, fetchProviderBill]);

  const handleDownloadInvoice = async () => {
    if (!providerBill?.invoice_file_path) {
      alert('No invoice file available for download.');
      return;
    }

    try {
      const response = await providerBillsApi.downloadFile(providerBill.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', providerBill.invoice_file_path.split('/').pop() || 'invoice');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice file.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!providerBill) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Provider bill not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Provider Bill Details</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/accounting/provider-bills')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Provider Bills
            </button>
            <button
              onClick={() => navigate(`/accounting/provider-bills/${providerBill.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Provider Bill
            </button>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Bill #{providerBill.id}
              </h2>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(providerBill.status)}`}>
                {providerBill.status}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Provider Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Provider Name</label>
                  <p className="mt-1 text-sm text-gray-900">{providerBill.provider?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Service</label>
                  <p className="mt-1 text-sm text-gray-900">{providerBill.provider?.service}</p>
                </div>
              </div>

              {/* Billing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Billing Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Billing Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(providerBill.billing_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Subtotal</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(providerBill.subtotal)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">GST</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(providerBill.gst)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Total</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(providerBill.total)}</p>
                </div>
              </div>
            </div>

                        {/* Notes */}
            {providerBill.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Notes
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{providerBill.notes}</p>
                </div>
              </div>
            )}

            {/* Service Period and Due Date */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Service Period & Due Date
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Service Period</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(providerBill.service_date_from)} - {formatDate(providerBill.service_date_to)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Due Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(providerBill.due_date)}</p>
                </div>

                {providerBill.status === 'Paid' && providerBill.date_paid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date Paid</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(providerBill.date_paid)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice File */}
            {providerBill.invoice_file_path && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Invoice File
                </h3>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      File: {providerBill.invoice_file_path.split('/').pop()}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadInvoice}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{providerBill.user?.name || 'Unknown'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(providerBill.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(providerBill.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderBillViewPage; 