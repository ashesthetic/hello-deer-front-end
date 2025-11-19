import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { smokesApi, smokesCategoryApi, Smokes, SmokesFormData, SmokesCategory } from '../services/api';
import { canUpdate, isStaff } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

const SmokesEditPage: React.FC = () => {
  usePageTitle('Edit Smoke Entry');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SmokesCategory[]>([]);
  const [formData, setFormData] = useState<SmokesFormData>({
    date: '',
    item: '',
    shift: 'Morning',
    start: '',
    end: '',
    added: '0',
  });

  useEffect(() => {
    fetchCategories();
    fetchSmoke();
    // eslint-disable-next-line
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await smokesCategoryApi.getAll({ per_page: 100, sort_by: 'name', sort_direction: 'asc' });
      setCategories(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSmoke = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await smokesApi.getById(Number(id));
      const smoke: Smokes = response.data.data;
      setFormData({
        date: new Date(smoke.date).toISOString().split('T')[0],
        item: smoke.item,
        shift: smoke.shift,
        start: smoke.start.toString(),
        end: smoke.end.toString(),
        added: smoke.added.toString(),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch smoke entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await smokesApi.update(Number(id), formData);
      navigate('/entry/smokes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update smoke entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/entry/smokes');
  };

  // Check if user can edit
  if (!canUpdate(currentUser) && !isStaff(currentUser)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to edit smoke entries.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Smokes
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Smoke Entry</h1>
      
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
      
      {loading && !formData.date ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-2">
                Shift *
              </label>
              <select
                id="shift"
                required
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as 'Morning' | 'Evening' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-2">
                Item *
              </label>
              <select
                id="item"
                required
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an item</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-2">
                Start *
              </label>
              <input
                type="number"
                id="start"
                required
                step="0.01"
                min="0"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-2">
                End *
              </label>
              <input
                type="number"
                id="end"
                required
                step="0.01"
                min="0"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="added" className="block text-sm font-medium text-gray-700 mb-2">
                Added
              </label>
              <input
                type="number"
                id="added"
                step="0.01"
                min="0"
                value={formData.added}
                onChange={(e) => setFormData({ ...formData, added: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Entry'}
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
      )}
    </div>
  );
};

export default SmokesEditPage;
