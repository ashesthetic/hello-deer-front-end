import React, { useState, useEffect } from 'react';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import DailySalesList from '../components/DailySalesList';
import DailySalesForm from '../components/DailySalesForm';
import DailySalesDetail from '../components/DailySalesDetail';

type ViewMode = 'list' | 'form' | 'detail';

const DailySalesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sales, setSales] = useState<DailySale[]>([]);
  const [selectedSale, setSelectedSale] = useState<DailySale | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchSales();
    }
  }, [viewMode]);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailySalesApi.getAll();
      setSales(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSale(null);
    setViewMode('form');
  };

  const handleView = (sale: DailySale) => {
    setSelectedSale(sale);
    setViewMode('detail');
  };

  const handleEdit = (sale: DailySale) => {
    setSelectedSale(sale);
    setViewMode('form');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) {
      return;
    }

    setLoading(true);
    try {
      await dailySalesApi.delete(id);
      await fetchSales();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sale');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: DailySale) => {
    setLoading(true);
    setError(null);
    try {
      if (selectedSale?.id) {
        await dailySalesApi.update(selectedSale.id, data);
      } else {
        await dailySalesApi.create(data);
      }
      setViewMode('list');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save sale');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSale(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'form':
        return (
          <DailySalesForm
            initialData={selectedSale || undefined}
            onSubmit={handleSubmit}
            onCancel={handleBackToList}
            loading={loading}
          />
        );
      case 'detail':
        return selectedSale ? (
          <DailySalesDetail
            sale={selectedSale}
            onBack={handleBackToList}
            onEdit={() => handleEdit(selectedSale)}
          />
        ) : null;
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Daily Sales</h1>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add New Sale
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <DailySalesList
              sales={sales}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default DailySalesPage; 