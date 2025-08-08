import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelVolumeApi } from '../services/api';
import { canCreate, canDelete } from '../utils/permissions';
import { FuelVolume } from '../types';
import { formatDateForDisplay } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';

const FuelVolumesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [fuelVolumes, setFuelVolumes] = useState<FuelVolume[]>([]);
  const [allFuelVolumes, setAllFuelVolumes] = useState<FuelVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    shift: '',
    sort_by: 'date',
    sort_direction: 'desc',
    per_page: 10
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });
  const [fuelVolumeToDelete, setFuelVolumeToDelete] = useState<FuelVolume | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchFuelVolumes = async () => {
    try {
      setLoading(true);
      
      // Fetch paginated data for display
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await fuelVolumeApi.index(params.toString());
      setFuelVolumes(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        per_page: response.data.per_page
      });

      // Fetch all data for volume difference calculations (without pagination)
      const allDataParams = new URLSearchParams();
      if (filters.start_date) allDataParams.append('start_date', filters.start_date);
      if (filters.end_date) allDataParams.append('end_date', filters.end_date);
      if (filters.shift) allDataParams.append('shift', filters.shift);
      allDataParams.append('per_page', '1000'); // Get a large number to ensure we have enough data

      const allDataResponse = await fuelVolumeApi.index(allDataParams.toString());
      setAllFuelVolumes(allDataResponse.data.data || []);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel volumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelVolumes();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_direction: prev.sort_by === field && prev.sort_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00';
    }
    return Number(value).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const getVolumeEndOfDay = (fuelVolume: FuelVolume) => {
    // For evening shifts, return the volume end of day if available
    if (fuelVolume.shift === 'evening' && fuelVolume.volume_end_of_day) {
      return fuelVolume.volume_end_of_day;
    }
    
    // For morning shifts, find the corresponding evening shift for the same date
    if (fuelVolume.shift === 'morning') {
      const eveningShift = allFuelVolumes.find(fv => 
        fv.date === fuelVolume.date && fv.shift === 'evening'
      );
      if (eveningShift && eveningShift.volume_end_of_day) {
        return eveningShift.volume_end_of_day;
      }
    }
    
    return null;
  };

  const getVolumeDifference = (currentFuelVolume: FuelVolume, allFuelVolumes: FuelVolume[]) => {
    // Only calculate for evening shifts
    if (currentFuelVolume.shift !== 'evening') {
      return null;
    }

    // Get previous day's date - handle both date string and datetime formats
    const currentDate = new Date(currentFuelVolume.date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().split('T')[0];

    console.log('Debug - Looking for previous day:', {
      currentDate: currentFuelVolume.date,
      previousDateString,
      currentData: {
        regular: currentFuelVolume.regular_tc_volume,
        premium: currentFuelVolume.premium_tc_volume,
        diesel: currentFuelVolume.diesel_tc_volume
      }
    });

    // Find previous day's evening shift - normalize date comparison
    const previousEveningShift = allFuelVolumes.find(fv => {
      const fvDate = new Date(fv.date).toISOString().split('T')[0];
      return fvDate === previousDateString && fv.shift === 'evening';
    });

    console.log('Debug - Previous evening shift found:', previousEveningShift);

    if (!previousEveningShift) {
      console.log('Debug - No previous evening shift found. Available dates:', 
        allFuelVolumes.map(fv => ({ 
          date: fv.date, 
          normalizedDate: new Date(fv.date).toISOString().split('T')[0],
          shift: fv.shift 
        }))
      );
      return null;
    }

    console.log('Debug - Previous day data:', {
      previousDate: previousEveningShift.date,
      previousData: {
        regular: previousEveningShift.regular_tc_volume,
        premium: previousEveningShift.premium_tc_volume,
        diesel: previousEveningShift.diesel_tc_volume
      }
    });

    // Simple subtraction: Current - Previous
    const result = {
      regular: (currentFuelVolume.regular_tc_volume || 0) - (previousEveningShift.regular_tc_volume || 0),
      premium: (currentFuelVolume.premium_tc_volume || 0) - (previousEveningShift.premium_tc_volume || 0),
      diesel: (currentFuelVolume.diesel_tc_volume || 0) - (previousEveningShift.diesel_tc_volume || 0)
    };

    console.log('Debug - Calculated difference:', result);
    return result;
  };

  const formatVolumeDifference = (difference: number | null) => {
    if (difference === null || isNaN(difference)) {
      return '-';
    }
    const sign = difference >= 0 ? '+' : '';
    return `${sign}${difference.toFixed(2)}`;
  };

  const getVolumeDifferenceColor = (difference: number | null) => {
    if (difference === null || isNaN(difference)) {
      return 'text-gray-400';
    }
    if (difference > 0) {
      return 'text-green-600';
    } else if (difference < 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const handleDelete = (fuelVolume: FuelVolume) => {
    setFuelVolumeToDelete(fuelVolume);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fuelVolumeToDelete) return;

    try {
      await fuelVolumeApi.delete(fuelVolumeToDelete.id!);
      setShowDeleteModal(false);
      setFuelVolumeToDelete(null);
      fetchFuelVolumes(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel volume');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Volumes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track fuel volumes by shift with end of day calculations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {canCreate(currentUser) && (
            <button
              onClick={() => navigate('/fuel-volumes/new')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Fuel Volume
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Shift</label>
            <select
              value={filters.shift}
              onChange={(e) => handleFilterChange('shift', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Per Page</label>
            <select
              value={filters.per_page}
              onChange={(e) => handleFilterChange('per_page', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {filters.sort_by === 'date' && (
                        <span className="ml-1">
                          {filters.sort_direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('shift')}
                    >
                      Shift
                      {filters.sort_by === 'shift' && (
                        <span className="ml-1">
                          {filters.sort_direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Regular
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diesel
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume End of Day
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume Difference
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fuelVolumes.map((fuelVolume) => {
                    const endOfDay = getVolumeEndOfDay(fuelVolume);
                    const difference = getVolumeDifference(fuelVolume, allFuelVolumes);
                    return (
                      <tr key={fuelVolume.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(fuelVolume.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fuelVolume.shift === 'morning' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {fuelVolume.shift.charAt(0).toUpperCase() + fuelVolume.shift.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>TC: {formatNumber(fuelVolume.regular_tc_volume)}</div>
                          <div>Height: {formatNumber(fuelVolume.regular_product_height)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>TC: {formatNumber(fuelVolume.premium_tc_volume)}</div>
                          <div>Height: {formatNumber(fuelVolume.premium_product_height)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>TC: {formatNumber(fuelVolume.diesel_tc_volume)}</div>
                          <div>Height: {formatNumber(fuelVolume.diesel_product_height)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>R: {formatNumber(fuelVolume.added_regular)}</div>
                          <div>P: {formatNumber(fuelVolume.added_premium)}</div>
                          <div>D: {formatNumber(fuelVolume.added_diesel)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {endOfDay ? (
                            <div>
                              <div>R: {formatNumber(endOfDay.regular)}</div>
                              <div>P: {formatNumber(endOfDay.premium)}</div>
                              <div>D: {formatNumber(endOfDay.diesel)}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fuelVolume.shift === 'evening' ? (
                            difference ? (
                              <div>
                                <div className={getVolumeDifferenceColor(difference.regular)}>
                                  R: {formatVolumeDifference(difference.regular)}
                                </div>
                                <div className={getVolumeDifferenceColor(difference.premium)}>
                                  P: {formatVolumeDifference(difference.premium)}
                                </div>
                                <div className={getVolumeDifferenceColor(difference.diesel)}>
                                  D: {formatVolumeDifference(difference.diesel)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No prev. data</span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/fuel-volumes/${fuelVolume.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </button>
                          {canCreate(currentUser) && (
                            <button
                              onClick={() => navigate(`/fuel-volumes/${fuelVolume.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete(currentUser) && (
                            <button
                              onClick={() => handleDelete(fuelVolume)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, pagination.current_page - 1) }))}
              disabled={pagination.current_page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, pagination.current_page + 1) }))}
              disabled={pagination.current_page === pagination.last_page}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setFilters(prev => ({ ...prev, page }))}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pagination.current_page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFuelVolumeToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Fuel Volume"
        message={`Are you sure you want to delete the fuel volume entry for ${fuelVolumeToDelete ? formatDate(fuelVolumeToDelete.date) : ''} - ${fuelVolumeToDelete?.shift ? fuelVolumeToDelete.shift.charAt(0).toUpperCase() + fuelVolumeToDelete.shift.slice(1) : ''} Shift? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default FuelVolumesPage; 