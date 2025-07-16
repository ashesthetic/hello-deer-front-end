import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import DailySalesList from '../components/DailySalesList';

const PER_PAGE = 10;

const DailySalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchSales(currentPage);
    // eslint-disable-next-line
  }, [currentPage]);

  const fetchSales = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dailySalesApi.getAll(page, PER_PAGE);
      setSales(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/daily-sales/new');
  };

  const handleView = (sale: DailySale) => {
    if (sale.id) {
      navigate(`/daily-sales/${sale.id}`);
    }
  };

  const handleEdit = (sale: DailySale) => {
    if (sale.id) {
      navigate(`/daily-sales/${sale.id}/edit`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) {
      return;
    }

    setLoading(true);
    try {
      await dailySalesApi.delete(id);
      await fetchSales(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sale');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages} ({totalItems} total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesPage; 