import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { lotteryApi } from '../services/api';
import { canCreate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

interface LotteryEntry {
  item: string;
  start: string;
  end: string;
  added: string;
}

const LOTTERY_ITEMS = ['$1.00', '$2.00', '$3.00', '$4.00', '$5.00', '$7.00', '$10.00', '$20.00', '$30.00', '$50.00', '$100.00'];

const LotteryAddPage: React.FC = () => {
  usePageTitle('Add Lottery Entry');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'Morning' | 'Evening'>('Morning');
  const [entries, setEntries] = useState<Record<string, LotteryEntry>>({});

  useEffect(() => {
    // Initialize entries for all lottery items
    const initialEntries: Record<string, LotteryEntry> = {};
    LOTTERY_ITEMS.forEach((item) => {
      initialEntries[item] = {
        item: item,
        start: '',
        end: '',
        added: '',
      };
    });
    setEntries(initialEntries);
  }, []);

  const handleEntryChange = (itemName: string, field: 'start' | 'end' | 'added', value: string) => {
    setEntries(prev => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [field]: value,
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Submit all entries that have at least one field filled
      const promises = Object.values(entries)
        .filter(entry => entry.start || entry.end || entry.added)
        .map(entry => 
          lotteryApi.create({
            date,
            item: entry.item,
            shift,
            start: entry.start || '0',
            end: entry.end || '0',
            added: entry.added || '0',
          })
        );
      
      await Promise.all(promises);
      navigate('/entry/lottery');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lottery entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/entry/lottery');
  };

  // Check if user can create
  if (!canCreate(currentUser)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to create lottery entries.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Lottery
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Daily Store Report - Lottery</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              id="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="shift" className="block text-xs font-medium text-gray-700 mb-2">
              Shift *
            </label>
            <select
              id="shift"
              required
              value={shift}
              onChange={(e) => setShift(e.target.value as 'Morning' | 'Evening')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>

        {/* Lottery Table */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '35%' }}>
                  Item
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '21.66%' }}>
                  Start
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '21.66%' }}>
                  End
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '21.66%' }}>
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {LOTTERY_ITEMS.map((item, index) => (
                <tr key={item} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 text-xs font-medium text-gray-900 border-r border-gray-200" style={{ width: '35%' }}>
                    {item}
                  </td>
                  <td className="px-1 py-2 border-r border-gray-200" style={{ width: '21.66%' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entries[item]?.start || ''}
                      onChange={(e) => handleEntryChange(item, 'start', e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-1 py-2 border-r border-gray-200" style={{ width: '21.66%' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entries[item]?.end || ''}
                      onChange={(e) => handleEntryChange(item, 'end', e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-1 py-2" style={{ width: '21.66%' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entries[item]?.added || ''}
                      onChange={(e) => handleEntryChange(item, 'added', e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LotteryAddPage;
