import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fuelDeliveryApi } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

interface FormData {
  delivery_date: string;
  invoice_number: string;
  regular: string;
  premium: string;
  diesel: string;
}

const FuelDeliveryAddPage: React.FC = () => {
  usePageTitle('Add Fuel Delivery');
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    delivery_date: '',
    invoice_number: '',
    regular: '',
    premium: '',
    diesel: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regular = parseFloat(formData.regular) || 0;
  const premium = parseFloat(formData.premium) || 0;
  const diesel = parseFloat(formData.diesel) || 0;
  const total = regular + premium + diesel;
  const amount = (total * 0.03) * 1.05;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await fuelDeliveryApi.create({
        delivery_date: formData.delivery_date,
        invoice_number: formData.invoice_number || null,
        regular: formData.regular !== '' ? parseFloat(formData.regular) : null,
        premium: formData.premium !== '' ? parseFloat(formData.premium) : null,
        diesel: formData.diesel !== '' ? parseFloat(formData.diesel) : null,
      });
      navigate('/fuel-delivery');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create fuel delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/fuel-delivery')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Fuel Delivery</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. INV-2026-001"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regular (L)</label>
                <input
                  type="number"
                  name="regular"
                  value={formData.regular}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premium (L)</label>
                <input
                  type="number"
                  name="premium"
                  value={formData.premium}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diesel (L)</label>
                <input
                  type="number"
                  name="diesel"
                  value={formData.diesel}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Calculated fields */}
            <div className="bg-gray-50 rounded-md p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Volume (L)</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Amount</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">${amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/fuel-delivery')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FuelDeliveryAddPage;
