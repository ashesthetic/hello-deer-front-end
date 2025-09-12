import React, { useState, useEffect } from 'react';
import { Vendor, CreateVendorData, UpdateVendorData } from '../types';

interface VendorFormProps {
  onSubmit: (data: CreateVendorData | UpdateVendorData) => void;
  onCancel: () => void;
  loading: boolean;
  initialData: Vendor | null;
}

const VendorForm: React.FC<VendorFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateVendorData>({
    name: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    contact_person_title: '',
    possible_products: '',
    payment_method: 'PAD',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [voidCheckFile, setVoidCheckFile] = useState<File | null>(null);

  const paymentMethods = ['PAD', 'Credit Card', 'E-transfer', 'Direct Deposit'];

  useEffect(() => {
    if (initialData) {
      console.log('Setting form data from initialData:', initialData);
      const newFormData = {
        name: initialData.name,
        contact_person_name: initialData.contact_person_name || '',
        contact_person_email: initialData.contact_person_email || '',
        contact_person_phone: initialData.contact_person_phone || '',
        contact_person_title: initialData.contact_person_title || '',
        possible_products: initialData.possible_products,
        payment_method: initialData.payment_method,
        etransfer_email: initialData.etransfer_email,
        bank_name: initialData.bank_name,
        transit_number: initialData.transit_number,
        institute_number: initialData.institute_number,
        account_number: initialData.account_number,
        notes: initialData.notes || '',
      };
      console.log('New form data:', newFormData);
      setFormData(newFormData);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.possible_products.trim()) {
      newErrors.possible_products = 'Possible products is required';
    }

    if (formData.payment_method === 'E-transfer' && !formData.etransfer_email) {
      newErrors.etransfer_email = 'Email is required for E-transfer';
    }

    if (formData.payment_method === 'Direct Deposit') {
      if (!formData.bank_name) newErrors.bank_name = 'Bank name is required';
      if (!formData.transit_number) newErrors.transit_number = 'Transit number is required';
      if (!formData.institute_number) newErrors.institute_number = 'Institute number is required';
      if (!formData.account_number) newErrors.account_number = 'Account number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission - formData:', formData);
    console.log('Form submission - voidCheckFile:', voidCheckFile);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    const submitData = {
      ...formData,
      void_check: voidCheckFile || undefined,
    };

    console.log('Form submission - submitData:', submitData);
    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVoidCheckFile(file);
  };

  // Show loading state if we're in edit mode but don't have initial data yet
  if (initialData && !formData.name) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="ml-3 text-gray-600">Loading vendor data...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendor Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter vendor name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Possible Products to Buy *
          </label>
          <textarea
            value={formData.possible_products}
            onChange={(e) => handleInputChange('possible_products', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.possible_products ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the products this vendor can supply"
          />
          {errors.possible_products && <p className="text-red-500 text-sm mt-1">{errors.possible_products}</p>}
        </div>

        {/* Contact Person */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person Name
          </label>
          <input
            type="text"
            value={formData.contact_person_name || ''}
            onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter contact person name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person Email
          </label>
          <input
            type="email"
            value={formData.contact_person_email || ''}
            onChange={(e) => handleInputChange('contact_person_email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter contact person email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person Phone
          </label>
          <input
            type="tel"
            value={formData.contact_person_phone || ''}
            onChange={(e) => handleInputChange('contact_person_phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter contact person phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person Title
          </label>
          <input
            type="text"
            value={formData.contact_person_title || ''}
            onChange={(e) => handleInputChange('contact_person_title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter contact person title/position"
          />
        </div>

        {/* Payment Method */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => handleInputChange('payment_method', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.payment_method ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* E-transfer Email */}
        {formData.payment_method === 'E-transfer' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-transfer Email *
            </label>
            <input
              type="email"
              value={formData.etransfer_email || ''}
              onChange={(e) => handleInputChange('etransfer_email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.etransfer_email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email for E-transfer"
            />
            {errors.etransfer_email && <p className="text-red-500 text-sm mt-1">{errors.etransfer_email}</p>}
          </div>
        )}

        {/* Direct Deposit Fields */}
        {formData.payment_method === 'Direct Deposit' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bank_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter bank name"
              />
              {errors.bank_name && <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transit Number *
              </label>
              <input
                type="text"
                value={formData.transit_number || ''}
                onChange={(e) => handleInputChange('transit_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.transit_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter transit number"
              />
              {errors.transit_number && <p className="text-red-500 text-sm mt-1">{errors.transit_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institute Number *
              </label>
              <input
                type="text"
                value={formData.institute_number || ''}
                onChange={(e) => handleInputChange('institute_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.institute_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter institute number"
              />
              {errors.institute_number && <p className="text-red-500 text-sm mt-1">{errors.institute_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={formData.account_number || ''}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.account_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter account number"
              />
              {errors.account_number && <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Void Check (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, JPEG, PNG (max 2MB)</p>
            </div>
          </>
        )}

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about this vendor"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || (!!initialData && !formData.name)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </form>
  );
};

export default VendorForm; 