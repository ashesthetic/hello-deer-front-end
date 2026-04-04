import React, { useState, useEffect } from 'react';
import { fuelDeliveryApi } from '../services/api';
import { FuelDelivery } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

interface RowState {
  issued: boolean;
  issued_date: string;
  resolved: boolean;
  resolved_date: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

const CrossLeasePage: React.FC = () => {
  usePageTitle('Cross Lease');
  const [deliveries, setDeliveries] = useState<FuelDelivery[]>([]);
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await fuelDeliveryApi.getAll({ per_page: 200, sort_by: 'delivery_date', sort_direction: 'desc' });
        const data: FuelDelivery[] = response.data.data || [];
        setDeliveries(data);

        const states: Record<number, RowState> = {};
        data.forEach((d) => {
          states[d.id!] = {
            issued: d.issued,
            issued_date: d.issued_date || '',
            resolved: d.resolved,
            resolved_date: d.resolved_date || '',
            saving: false,
            saved: false,
            error: null,
          };
        });
        setRowStates(states);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch fuel deliveries');
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
  }, []);

  const updateRow = (id: number, patch: Partial<RowState>) => {
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleSave = async (id: number) => {
    const row = rowStates[id];
    updateRow(id, { saving: true, saved: false, error: null });
    try {
      await fuelDeliveryApi.update(id, {
        issued: row.issued,
        issued_date: row.issued_date || null,
        resolved: row.resolved,
        resolved_date: row.resolved_date || null,
      });
      updateRow(id, { saving: false, saved: true });
      // Clear "saved" indicator after 2 seconds
      setTimeout(() => updateRow(id, { saved: false }), 2000);
    } catch (err: any) {
      updateRow(id, {
        saving: false,
        error: err.response?.data?.message || 'Failed to save',
      });
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cross Lease</h1>

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Volume (L)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Save</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No fuel deliveries found.</td>
                  </tr>
                ) : (
                  deliveries.map((d) => {
                    const row = rowStates[d.id!];
                    if (!row) return null;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{d.delivery_date}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{d.invoice_number || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{d.total != null ? Number(d.total).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{d.amount != null ? `$${Number(d.amount).toFixed(2)}` : '—'}</td>

                        {/* Issued checkbox */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.issued}
                            onChange={(e) => updateRow(d.id!, { issued: e.target.checked, saved: false })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>

                        {/* Issued date */}
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.issued_date}
                            onChange={(e) => updateRow(d.id!, { issued_date: e.target.value, saved: false })}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Resolved checkbox */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.resolved}
                            onChange={(e) => updateRow(d.id!, { resolved: e.target.checked, saved: false })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>

                        {/* Resolved date */}
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.resolved_date}
                            onChange={(e) => updateRow(d.id!, { resolved_date: e.target.value, saved: false })}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Save button */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(d.id!)}
                              disabled={row.saving}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {row.saving ? '...' : 'Save'}
                            </button>
                            {row.saved && (
                              <span className="text-xs text-green-600 font-medium">Saved</span>
                            )}
                            {row.error && (
                              <span className="text-xs text-red-600">{row.error}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossLeasePage;
