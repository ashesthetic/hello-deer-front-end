import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fuelDeliveryApi } from '../services/api';
import { FuelDelivery } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

const FuelDeliveryViewPage: React.FC = () => {
  usePageTitle('View Fuel Delivery');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<FuelDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fuelDeliveryApi.getById(Number(id));
        setDelivery(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch fuel delivery');
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">Loading...</div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || 'Delivery not found'}</p>
        </div>
        <button onClick={() => navigate('/fuel-delivery')} className="mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Fuel Deliveries
        </button>
      </div>
    );
  }

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Fuel Delivery</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Field label="Delivery Date" value={delivery.delivery_date} />
            <Field label="Invoice Number" value={delivery.invoice_number} />
            <Field label="Regular (L)" value={delivery.regular != null ? Number(delivery.regular).toLocaleString() : null} />
            <Field label="Premium (L)" value={delivery.premium != null ? Number(delivery.premium).toLocaleString() : null} />
            <Field label="Diesel (L)" value={delivery.diesel != null ? Number(delivery.diesel).toLocaleString() : null} />
            <Field label="Total Volume (L)" value={delivery.total != null ? Number(delivery.total).toLocaleString() : null} />
            <Field label="Amount" value={delivery.amount != null ? `$${Number(delivery.amount).toFixed(2)}` : null} />
            <Field
              label="Issued"
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${delivery.issued ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {delivery.issued ? 'Yes' : 'No'}
                </span>
              }
            />
            <Field label="Issued Date" value={delivery.issued_date} />
            <Field
              label="Resolved"
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${delivery.resolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {delivery.resolved ? 'Yes' : 'No'}
                </span>
              }
            />
            <Field label="Resolved Date" value={delivery.resolved_date} />
            {delivery.note && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{delivery.note}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => navigate(`/fuel-delivery/${delivery.id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </button>
            <button
              onClick={() => navigate('/fuel-delivery')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelDeliveryViewPage;
