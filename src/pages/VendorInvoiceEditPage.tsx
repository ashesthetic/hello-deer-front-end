import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { vendorInvoicesApi, VendorInvoiceFormData, VendorInvoice } from '../services/api';
import { canUpdate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

interface Vendor {
  id: number;
  name: string;
}

const VendorInvoiceEditPage: React.FC = () => {
  usePageTitle('Edit Vendor Invoice');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoice, setInvoice] = useState<VendorInvoice | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<VendorInvoiceFormData>({
    vendor_id: 0,
    invoice_date: '',
    status: 'Unpaid',
    type: 'Expense',
    payment_date: '',
    payment_method: undefined,
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchInvoice();
      fetchVendors();
    }
  }, [id]);

  const fetchInvoice = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await vendorInvoicesApi.getById(parseInt(id));
      const invoiceData = response.data;
      setInvoice(invoiceData);
      
      setFormData({
        vendor_id: invoiceData.vendor_id,
        invoice_date: invoiceData.invoice_date,
        status: invoiceData.status,
        type: invoiceData.type,
        payment_date: invoiceData.payment_date || '',
        payment_method: invoiceData.payment_method,
        amount: invoiceData.amount.toString(),
        description: invoiceData.description || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorInvoicesApi.getVendors();
      setVendors(response.data);
    } catch (err: any) {
      console.error('Vendor fetch error:', err);
      setError(`Failed to fetch vendors: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear payment fields if status is changed to Unpaid
    if (name === 'status' && value === 'Unpaid') {
      setFormData(prev => ({
        ...prev,
        payment_date: '',
        payment_method: undefined
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canUpdate(currentUser)) {
      setError('You do not have permission to update vendor invoices');
      return;
    }

    if (formData.vendor_id === 0) {
      setError('Please select a vendor');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (formData.status === 'Paid' && !formData.payment_date) {
      setError('Payment date is required for paid invoices');
      return;
    }

    if (formData.status === 'Paid' && !formData.payment_method) {
      setError('Payment method is required for paid invoices');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        invoice_file: selectedFile || undefined
      };

      await vendorInvoicesApi.update(parseInt(id!), submitData);
      navigate(`/accounting/vendor-invoices/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update vendor invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/accounting/vendor-invoices/${id}`);
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
            onClick={() => navigate('/accounting/vendor-invoices')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Vendor Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!canUpdate(currentUser)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to edit this vendor invoice.</p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Invoice
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Vendor Invoice</h1>
            <p className="text-gray-600">
              {invoice.vendor?.name} • Invoice #{invoice.id}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  placeholder="Select date"
                  data-lpignore="true"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Payment Date - Only show if status is Paid */}
            {formData.status === 'Paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    placeholder="Select payment date"
                    data-lpignore="true"
                    autoComplete="off"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method - Only show if status is Paid */}
            {formData.status === 'Paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select payment method</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
            )}

            {/* Invoice File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice File
              </label>
              {invoice.invoice_file_path && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Current file: {invoice.invoice_file_path.split('/').pop()}</p>
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, JPG, JPEG, PNG (max 10MB)
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Enter invoice description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorInvoiceEditPage; 