import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { vendorsApi } from '../services/api';
import { Vendor } from '../types';
import VendorList from '../components/VendorList';
import { canCreate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

type SortField = 'name' | 'payment_method' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const VendorsPage: React.FC = () => {
  usePageTitle('Vendors');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors(currentPage);
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage, searchTerm]);

  const fetchVendors = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { 
        page, 
        per_page: perPage,
        sort_by: sortField,
        sort_direction: sortDirection
      };

      // Add search filter if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await vendorsApi.getAll(params);
      setVendors(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    navigate('/accounting/vendors/add');
  };

  const handleEditVendor = (vendor: Vendor) => {
    navigate(`/accounting/vendors/${vendor.id}/edit`);
  };

  const handleViewVendor = (vendor: Vendor) => {
    navigate(`/accounting/vendors/${vendor.id}`);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    setLoading(true);
    try {
      await vendorsApi.delete(vendor.id!);
      await fetchVendors(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          {canCreate(currentUser) && (
            <button
              onClick={handleAddVendor}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Vendor
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-1">
                Rows per page
              </label>
              <select
                id="perPage"
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <VendorList
          vendors={vendors}
          loading={loading}
          onEdit={handleEditVendor}
          onView={handleViewVendor}
          onDelete={handleDeleteVendor}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortBy={sortField}
          onSortByChange={(field: string) => handleSort(field as SortField)}
          sortDirection={sortDirection}
          onSortDirectionChange={(direction: 'asc' | 'desc') => setSortDirection(direction)}
          totalPages={totalPages}
          currentPage={currentPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          canEdit={currentUser?.role === 'admin' || currentUser?.role === 'editor'}
          canDelete={currentUser?.role === 'admin'}
        />
      </div>
    </div>
  );
};

export default VendorsPage; 