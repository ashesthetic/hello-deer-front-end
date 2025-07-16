import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import DailySalesDetail from '../components/DailySalesDetail';

const DailySalesViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<DailySale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
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

  const handleBack = () => {
    navigate('/daily-sales');
  };

  const handleEdit = () => {
    if (sale?.id) {
      navigate(`/daily-sales/${sale.id}/edit`);
    }
  };

  if (loading) {
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
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Sale not found.</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        <DailySalesDetail
          sale={sale}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
};

export default DailySalesViewPage; 