import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelDeliveryApi } from '../services/api';
import { FuelDelivery } from '../types';
import { canCreate, canDelete } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';
import { useUrlState } from '../hooks/useUrlState';

const PER_PAGE_OPTIONS = [25, 50, 100];

const FuelDeliveryPage: React.FC = () => {
  usePageTitle('Fuel Delivery');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [deliveries, setDeliveries] = useState<FuelDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const {
    perPage,
    currentPage,
    sortField,
    sortDirection,
    setPerPage,
    setCurrentPage,
    setSortField,
    setSortDirection,
  } = useUrlState({
    defaultPerPage: 25,
    defaultSortField: 'delivery_date',
    defaultSortDirection: 'desc',
  });

  useEffect(() => {
    fetchDeliveries(currentPage);
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage]);

  const fetchDeliveries = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fuelDeliveryApi.getAll({
        page,
        per_page: perPage,
        sort_by: sortField,
        sort_direction: sortDirection,
      });
      setDeliveries(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this fuel delivery?')) return;
    setLoading(true);
    try {
      await fuelDeliveryApi.delete(id);
      await fetchDeliveries(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel delivery');
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1 text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Fuel Delivery</h1>
          {canCreate(currentUser) && (
            <button
              onClick={() => navigate('/fuel-delivery/add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Delivery
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rows per page</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PER_PAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('delivery_date')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Date <SortIcon field="delivery_date" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th
                    onClick={() => handleSort('regular')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Regular <SortIcon field="regular" />
                  </th>
                  <th
                    onClick={() => handleSort('premium')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Premium <SortIcon field="premium" />
                  </th>
                  <th
                    onClick={() => handleSort('diesel')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Diesel <SortIcon field="diesel" />
                  </th>
                  <th
                    onClick={() => handleSort('total')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Total <SortIcon field="total" />
                  </th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Amount <SortIcon field="amount" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No fuel deliveries found.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{d.delivery_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{d.invoice_number || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{d.regular != null ? Number(d.regular).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{d.premium != null ? Number(d.premium).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{d.diesel != null ? Number(d.diesel).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{d.total != null ? Number(d.total).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{d.amount != null ? `$${Number(d.amount).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${d.issued ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${d.resolved ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/fuel-delivery/${d.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                          {canCreate(currentUser) && (
                            <button
                              onClick={() => navigate(`/fuel-delivery/${d.id}/edit`)}
                              className="text-yellow-600 hover:text-yellow-800 font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete(currentUser) && (
                            <button
                              onClick={() => handleDelete(d.id!)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages} ({totalItems} total)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelDeliveryPage;
