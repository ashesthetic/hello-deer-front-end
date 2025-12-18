import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { providersApi, Provider } from '../services/api';

const ProviderViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await providersApi.getById(parseInt(id!));
      setProvider(response.data);
    } catch (error) {
      console.error('Error fetching provider:', error);
      alert('Failed to load provider. Please try again.');
      navigate('/accounting/providers');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'PAD':
        return 'bg-blue-100 text-blue-800';
      case 'Credit Card':
        return 'bg-green-100 text-green-800';
      case 'E-transfer':
        return 'bg-purple-100 text-purple-800';
      case 'Direct Deposit':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Provider not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Provider Details</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/accounting/providers')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Providers
            </button>
            <button
              onClick={() => navigate(`/accounting/providers/${provider.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Provider
            </button>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{provider.name}</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{provider.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Service</label>
                  <p className="mt-1 text-sm text-gray-900">{provider.service}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                  <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(provider.payment_method)}`}>
                    {provider.payment_method}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Contact Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {provider.phone ? (
                      <a href={`tel:${provider.phone}`} className="text-blue-600 hover:text-blue-800">
                        {provider.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {provider.email ? (
                      <a href={`mailto:${provider.email}`} className="text-blue-600 hover:text-blue-800">
                        {provider.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{provider.user?.name || 'Unknown'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(provider.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(provider.updated_at).toLocaleDateString()}
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

export default ProviderViewPage; 