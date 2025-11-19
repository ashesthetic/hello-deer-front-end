import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { smokesCategoryApi, SmokesCategory, SmokesCategoryFormData } from '../services/api';
import { canUpdate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

const SmokesCategoryEditPage: React.FC = () => {
  usePageTitle('Edit Smokes Category');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SmokesCategoryFormData>({
    name: '',
  });

  useEffect(() => {
    fetchCategory();
    // eslint-disable-next-line
  }, [id]);

  const fetchCategory = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await smokesCategoryApi.getById(Number(id));
      const category: SmokesCategory = response.data.data;
      setFormData({
        name: category.name,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch category');
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
      await smokesCategoryApi.update(Number(id), formData);
      navigate('/entry/smokes-categories');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/entry/smokes-categories');
  };

  // Check if user can edit
  if (!canUpdate(currentUser)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to edit categories.
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
          ← Back to Categories
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Smokes Category</h1>
      
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
      
      {loading && !formData.name ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Category'}
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

export default SmokesCategoryEditPage;
