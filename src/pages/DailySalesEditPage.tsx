import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canUpdate } from '../utils/permissions';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';
import DailySalesForm from '../components/DailySalesForm';

const DailySalesEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNewSale = !id || id === 'new';
  usePageTitle(isNewSale ? 'Add Daily Sale' : 'Edit Daily Sale');
  const navigate = useNavigate();
  const [sale, setSale] = useState<DailySale | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchSale(parseInt(id));
    }
  }, [id]);

  const fetchSale = async (saleId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailySalesApi.getById(saleId);
      setSale(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sale details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: DailySale) => {
    setLoading(true);
    setError(null);
    try {
      if (id && id !== 'new') {
        await dailySalesApi.update(parseInt(id), data);
      } else {
        await dailySalesApi.create(data);
      }
      navigate('/daily-sales');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save sale');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/daily-sales');
  };

  if (loading && id !== 'new') {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleCancel}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailySalesForm
          initialData={sale || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DailySalesEditPage; 