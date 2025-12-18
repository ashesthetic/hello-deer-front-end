import React, { useState, useEffect } from 'react';
import { DailySale } from '../types';

interface DailySalesFormProps {
  initialData?: DailySale;
  onSubmit: (data: DailySale) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DailySalesForm: React.FC<DailySalesFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<DailySale>({
    date: '',
    fuel_sale: 0,
    store_sale: 0,
    gst: 0,
    card: 0,
    cash: 0,
    coupon: 0,
    delivery: 0,
    reported_total: 0,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date.split('T')[0], // Convert to YYYY-MM-DD format
        fuel_sale: Number(initialData.fuel_sale) || 0,
        store_sale: Number(initialData.store_sale) || 0,
        gst: Number(initialData.gst) || 0,
        card: Number(initialData.card) || 0,
        cash: Number(initialData.cash) || 0,
        coupon: Number(initialData.coupon) || 0,
        delivery: Number(initialData.delivery) || 0,
        reported_total: Number(initialData.reported_total) || 0
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof DailySale, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleCancel = () => {
    onCancel();
  };

  // Calculate totals with safety checks
  const productSaleTotal = (Number(formData.fuel_sale) || 0) + (Number(formData.store_sale) || 0) + (Number(formData.gst) || 0);
  const counterSaleTotal = (Number(formData.card) || 0) + (Number(formData.cash) || 0) + (Number(formData.coupon) || 0) + (Number(formData.delivery) || 0);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {initialData ? 'Edit Daily Sale' : 'Add New Daily Sale'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Product Sale Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Product Sale</h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Product Sale</div>
              <div className="text-xl font-bold text-green-600">
                ${(productSaleTotal || 0).toFixed(2)} CAD
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Product Sale = Fuel + Store + GST
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Sale (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.fuel_sale}
                onChange={(e) => handleInputChange('fuel_sale', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Sale (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.store_sale}
                onChange={(e) => handleInputChange('store_sale', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.gst}
                onChange={(e) => handleInputChange('gst', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Counter Sale Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Counter Sale</h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Counter Sale</div>
              <div className="text-xl font-bold text-blue-600">
                ${(counterSaleTotal || 0).toFixed(2)} CAD
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Counter Sale = Card + Cash + Coupon + Delivery
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.card}
                onChange={(e) => handleInputChange('card', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.cash}
                onChange={(e) => handleInputChange('cash', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.coupon}
                onChange={(e) => handleInputChange('coupon', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery (CAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.delivery}
                onChange={(e) => handleInputChange('delivery', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Reported Total Section */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Reported Total</h3>
          <div className="text-sm text-gray-600 mb-3">
            The total amount reported for this day
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reported Total (CAD) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.reported_total}
              onChange={(e) => handleInputChange('reported_total', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            placeholder="Enter any additional notes or comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (initialData ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailySalesForm; 