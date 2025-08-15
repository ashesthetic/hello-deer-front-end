import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { providerBillsApi, ProviderBillFormData } from '../services/api';
import { formatDateForAPI, parseDateSafely } from '../utils/dateUtils';

interface Provider {
  id: number;
  name: string;
  service: string;
}

const ProviderBillEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [formData, setFormData] = useState<ProviderBillFormData>({
    provider_id: 0,
    billing_date: '',
    service_date_from: '',
    service_date_to: '',
    due_date: '',
    gst: '',
    total: '',
    notes: '',
    status: 'Pending',
    date_paid: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');



  const fetchProviders = useCallback(async () => {
    try {
      const response = await providerBillsApi.getProviders();
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      alert('Failed to load providers. Please try again.');
    }
  }, []);

  const fetchProviderBill = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await providerBillsApi.getById(parseInt(id!));
      const bill = response.data;
      
      setFormData({
        provider_id: bill.provider_id,
        billing_date: formatDateForAPI(parseDateSafely(bill.billing_date)),
        service_date_from: formatDateForAPI(parseDateSafely(bill.service_date_from)),
        service_date_to: formatDateForAPI(parseDateSafely(bill.service_date_to)),
        due_date: formatDateForAPI(parseDateSafely(bill.due_date)),
        gst: bill.gst.toString(),
        total: bill.total.toString(),
        notes: bill.notes || '',
        status: bill.status,
        date_paid: bill.date_paid ? formatDateForAPI(parseDateSafely(bill.date_paid)) : '',
      });

      if (bill.invoice_file_path) {
        setCurrentFileName(bill.invoice_file_path.split('/').pop() || '');
      }
    } catch (error) {
      console.error('Error fetching provider bill:', error);
      alert('Failed to load provider bill. Please try again.');
      navigate('/accounting/provider-bills');
    } finally {
      setInitialLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchProviders();
      fetchProviderBill();
    }
  }, [id, fetchProviders, fetchProviderBill]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If status changes to Pending, clear date_paid
    if (name === 'status' && value === 'Pending') {
      setFormData(prev => ({
        ...prev,
        date_paid: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        invoice_file: selectedFile || undefined,
      };

      await providerBillsApi.update(parseInt(id!), submitData);
      navigate('/accounting/provider-bills');
    } catch (error) {
      console.error('Error updating provider bill:', error);
      alert('Failed to update provider bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Provider Bill</h1>
          <button
            onClick={() => navigate('/accounting/provider-bills')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Provider Bills
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label htmlFor="provider_id" className="block text-sm font-medium text-gray-700 mb-2">
                Select a Provider *
              </label>
              <select
                id="provider_id"
                name="provider_id"
                value={formData.provider_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.service}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Date */}
            <div>
              <label htmlFor="billing_date" className="block text-sm font-medium text-gray-700 mb-2">
                Billing Date *
              </label>
              <input
                type="date"
                id="billing_date"
                name="billing_date"
                value={formData.billing_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Service Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="service_date_from" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Date From *
                </label>
                <input
                  type="date"
                  id="service_date_from"
                  name="service_date_from"
                  value={formData.service_date_from}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="service_date_to" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Date To *
                </label>
                <input
                  type="date"
                  id="service_date_to"
                  name="service_date_to"
                  value={formData.service_date_to}
                  onChange={handleInputChange}
                  required
                  min={formData.service_date_from}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subtotal (Read-only) */}
            <div>
              <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700 mb-2">
                Subtotal (Calculated)
              </label>
              <input
                type="number"
                id="subtotal"
                name="subtotal"
                value={formData.total && formData.gst ? (Number(formData.total) - Number(formData.gst)).toFixed(2) : ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Calculated automatically"
              />
            </div>

            {/* GST */}
            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-2">
                GST *
              </label>
              <input
                type="number"
                id="gst"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Total */}
            <div>
              <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-2">
                Total *
              </label>
              <input
                type="number"
                id="total"
                name="total"
                value={formData.total}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes..."
              />
            </div>

            {/* Upload Invoice */}
            <div>
              <label htmlFor="invoice_file" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Invoice
              </label>
              {currentFileName && (
                <div className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
                  Current file: {currentFileName}
                </div>
              )}
              <input
                type="file"
                id="invoice_file"
                name="invoice_file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, JPG, JPEG, PNG (max 2MB)
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Date Paid - Only show if status is Paid */}
            {formData.status === 'Paid' && (
              <div>
                <label htmlFor="date_paid" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Paid *
                </label>
                <input
                  type="date"
                  id="date_paid"
                  name="date_paid"
                  value={formData.date_paid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/accounting/provider-bills')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Provider Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderBillEditPage; 