import React from 'react';
import { Vendor } from '../types';

interface VendorViewProps {
  vendor: Vendor;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const VendorView: React.FC<VendorViewProps> = ({
  vendor,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="text-gray-600 mt-2">
            Created by {vendor.user?.name || 'Unknown'} on {formatDate(vendor.created_at!)}
          </p>
        </div>
        <div className="flex space-x-3">
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Edit Vendor
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Vendor
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Basic Information */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
              <p className="text-gray-900">{vendor.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {formatPaymentMethod(vendor.payment_method)}
              </span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Possible Products</label>
              <p className="text-gray-900 whitespace-pre-wrap">{vendor.possible_products}</p>
            </div>
          </div>
        </div>

        {/* Contact Person */}
        {(vendor.contact_person_name || vendor.contact_person_email || vendor.contact_person_phone || vendor.contact_person_title) && (
          <>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contact Person</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vendor.contact_person_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <p className="text-gray-900">{vendor.contact_person_name}</p>
                  </div>
                )}
                {vendor.contact_person_title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <p className="text-gray-900">{vendor.contact_person_title}</p>
                  </div>
                )}
                {vendor.contact_person_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">
                      <a href={`mailto:${vendor.contact_person_email}`} className="text-blue-600 hover:text-blue-800">
                        {vendor.contact_person_email}
                      </a>
                    </p>
                  </div>
                )}
                {vendor.contact_person_phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <p className="text-gray-900">
                      <a href={`tel:${vendor.contact_person_phone}`} className="text-blue-600 hover:text-blue-800">
                        {vendor.contact_person_phone}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Payment Details */}
        {(vendor.payment_method === 'E-transfer' || vendor.payment_method === 'Direct Deposit') && (
          <>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vendor.payment_method === 'E-transfer' && vendor.etransfer_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-transfer Email</label>
                    <p className="text-gray-900">{vendor.etransfer_email}</p>
                  </div>
                )}
                {vendor.payment_method === 'Direct Deposit' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <p className="text-gray-900">{vendor.bank_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transit Number</label>
                      <p className="text-gray-900">{vendor.transit_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Institute Number</label>
                      <p className="text-gray-900">{vendor.institute_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <p className="text-gray-900">{vendor.account_number}</p>
                    </div>
                    {vendor.void_check_path && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Void Check</label>
                        <a
                          href={`/storage/${vendor.void_check_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Void Check
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {vendor.notes && (
          <>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-900 whitespace-pre-wrap">{vendor.notes}</p>
            </div>
          </>
        )}

        {/* Metadata */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span> {formatDate(vendor.created_at!)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(vendor.updated_at!)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorView; 