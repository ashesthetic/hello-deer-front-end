import React from 'react';
import { DailySale } from '../types';

interface DailySalesDetailProps {
  sale: DailySale;
  onBack: () => void;
  onEdit: () => void;
}

const DailySalesDetail: React.FC<DailySalesDetailProps> = ({
  sale,
  onBack,
  onEdit
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const handleBack = () => {
    onBack();
  };

  const handleEdit = () => {
    onEdit();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Sale Details</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Date:</span>
              <p className="text-gray-900">{formatDate(sale.date)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Created:</span>
              <p className="text-gray-900">{sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Last Updated:</span>
              <p className="text-gray-900">{sale.updated_at ? new Date(sale.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Summary</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Total Product Sale:</span>
              <p className="text-lg font-semibold text-blue-900">{formatCurrency(sale.total_product_sale || 0)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Total Counter Sale:</span>
              <p className="text-lg font-semibold text-blue-900">{formatCurrency(sale.total_counter_sale || 0)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Reported Total:</span>
              <p className="text-lg font-semibold text-yellow-700">{formatCurrency(sale.reported_total || 0)}</p>
            </div>
            <div className="border-t pt-3">
              <span className="text-sm font-medium text-gray-600">Grand Total:</span>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(sale.reported_total || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Sale Details */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Product Sale Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">Fuel Sale:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.fuel_sale || 0)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Store Sale:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.store_sale || 0)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">GST:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.gst || 0)}</p>
          </div>
        </div>
      </div>

      {/* Counter Sale Details */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Counter Sale Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">Card:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.card || 0)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Cash:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.cash || 0)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Coupon:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.coupon || 0)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Delivery:</span>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.delivery || 0)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Notes</h3>
          <div className="whitespace-pre-wrap text-gray-900">
            {sale.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySalesDetail; 