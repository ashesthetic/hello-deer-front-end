import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { smokesApi, smokesCategoryApi, SmokesCategory } from '../services/api';
import { canCreate, isStaff } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

interface SmokesEntry {
  item: string;
  start: string;
  added: string;
  end: string;
}

const SmokesAddPage: React.FC = () => {
  usePageTitle('Add Smoke Entry');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SmokesCategory[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<Record<string, SmokesEntry>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await smokesCategoryApi.getAll({ per_page: 100, sort_by: 'name', sort_direction: 'asc' });
      const cats = response.data.data || [];
      setCategories(cats);
      
      // Initialize entries for all categories
      const initialEntries: Record<string, SmokesEntry> = {};
      cats.forEach((cat: SmokesCategory) => {
        initialEntries[cat.name] = {
          item: cat.name,
          start: '',
          added: '',
          end: '',
        };
      });
      setEntries(initialEntries);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleEntryChange = (itemName: string, field: 'start' | 'added' | 'end', value: string) => {
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
        .filter(entry => entry.start || entry.added || entry.end)
        .map(entry => 
          smokesApi.create({
            date,
            item: entry.item,
            start: entry.start || '0',
            added: entry.added || '0',
            end: entry.end || '0',
          })
        );
      
      await Promise.all(promises);
      navigate('/entry/smokes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create smoke entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/entry/smokes');
  };

  // Check if user can create
  if (!canCreate(currentUser) && !isStaff(currentUser)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to create smoke entries.
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
          ← Back to Smokes
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Daily Store Report - Smokes</h1>
      
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
        <div className="grid grid-cols-1 gap-6 mb-8">
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
        </div>

        {/* Smokes Table */}
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
                  Added
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '21.66%' }}>
                  End
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 text-xs font-medium text-gray-900 border-r border-gray-200" style={{ width: '35%' }}>
                    {category.name}
                  </td>
                  <td className="px-1 py-2 border-r border-gray-200" style={{ width: '21.66%' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entries[category.name]?.start || ''}
                      onChange={(e) => handleEntryChange(category.name, 'start', e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-1 py-2 border-r border-gray-200" style={{ width: '21.66%' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entries[category.name]?.added || ''}
                      onChange={(e) => handleEntryChange(category.name, 'added', e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-1 py-2" style={{ width: '21.66%' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entries[category.name]?.end || ''}
                      onChange={(e) => handleEntryChange(category.name, 'end', e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save All Entries'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SmokesAddPage;
