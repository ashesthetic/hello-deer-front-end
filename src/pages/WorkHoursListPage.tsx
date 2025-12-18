import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canCreate, canUpdate, canDelete } from '../utils/permissions';
import { workHoursApi, WorkHour } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const WorkHoursListPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkHour, setSelectedWorkHour] = useState<WorkHour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'employee' | 'total_hours'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchWorkHours();
  }, []);

  const fetchWorkHours = async () => {
    try {
      setLoading(true);
      const response = await workHoursApi.getAll();
      setWorkHours(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setWorkHours([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (workHour: WorkHour) => {
    setSelectedWorkHour(workHour);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedWorkHour) return;
    
    try {
      await workHoursApi.delete(selectedWorkHour.id);
      setWorkHours(workHours.filter(wh => wh.id !== selectedWorkHour.id));
      setShowDeleteModal(false);
      setSelectedWorkHour(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSort = (field: 'date' | 'employee' | 'total_hours') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedWorkHours = workHours
    .filter(workHour => {
      const matchesSearch = searchTerm === '' || 
        workHour.employee?.full_legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workHour.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workHour.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter === '' || workHour.date === dateFilter;
      
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          // Extract date parts for comparison to avoid timezone issues
          const dateOnlyA = a.date.split('T')[0];
          const dateOnlyB = b.date.split('T')[0];
          const [yearA, monthA, dayA] = dateOnlyA.split('-').map(Number);
          const [yearB, monthB, dayB] = dateOnlyB.split('-').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'employee':
          comparison = (a.employee?.full_legal_name || '').localeCompare(b.employee?.full_legal_name || '');
          break;
        case 'total_hours':
          comparison = Number(a.total_hours) - Number(b.total_hours);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    // Extract just the date part (YYYY-MM-DD) from the ISO string to avoid timezone issues
    const dateOnly = date.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    
    return dateObj.toLocaleDateString('en-CA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading work hours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Hours</h1>
            <p className="text-gray-600">Manage and track employee work hours</p>
          </div>
          {canCreate(currentUser) && (
            <button
              onClick={() => navigate('/work-hours/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Work Hours
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by employee, project, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                }}
                className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Work Hours Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date
                    {sortBy === 'date' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('employee')}
                  >
                    Employee
                    {sortBy === 'employee' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_hours')}
                  >
                    Hours
                    {sortBy === 'total_hours' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedWorkHours.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || dateFilter ? 'No work hours found matching your filters.' : 'No work hours found.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedWorkHours.map((workHour) => (
                    <tr key={workHour.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(workHour.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workHour.employee?.full_legal_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(workHour.start_time)} - {formatTime(workHour.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(workHour.total_hours).toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workHour.project || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {workHour.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/work-hours/${workHour.id}/view`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {canUpdate(currentUser) && (
                            <button
                              onClick={() => navigate(`/work-hours/${workHour.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete(currentUser) && (
                            <button
                              onClick={() => handleDelete(workHour)}
                              className="text-red-600 hover:text-red-900"
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

        {/* Summary */}
        {filteredAndSortedWorkHours.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAndSortedWorkHours.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedWorkHours.reduce((sum, wh) => sum + Number(wh.total_hours), 0).toFixed(2)}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Hours per Entry</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(filteredAndSortedWorkHours.reduce((sum, wh) => sum + Number(wh.total_hours), 0) / filteredAndSortedWorkHours.length).toFixed(2)}h
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Work Hours"
        message={`Are you sure you want to delete the work hours entry for ${selectedWorkHour?.employee?.full_legal_name} on ${selectedWorkHour ? formatDate(selectedWorkHour.date) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default WorkHoursListPage; 