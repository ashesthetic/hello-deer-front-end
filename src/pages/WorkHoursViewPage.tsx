import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canUpdate, canDelete } from '../utils/permissions';
import { workHoursApi, WorkHour } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const WorkHoursViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [workHour, setWorkHour] = useState<WorkHour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchWorkHour();
  }, [id]);

  const fetchWorkHour = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await workHoursApi.getById(parseInt(id));
      setWorkHour(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setWorkHour(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/work-hours/${id}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!workHour) return;
    
    try {
      await workHoursApi.delete(workHour.id);
      navigate('/work-hours');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    navigate('/work-hours');
  };

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading work hours details...</div>
        </div>
      </div>
    );
  }

  if (!workHour) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Hours Not Found</h2>
          <p className="text-gray-600 mb-6">The work hours entry you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Work Hours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Hours Details</h1>
            <p className="text-gray-600">
              {workHour.employee?.full_legal_name} • {formatDate(workHour.date)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            {canUpdate(currentUser) && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            {canDelete(currentUser) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Work Hours Information */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Work Hours Information</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Employee Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                  <p className="text-gray-900">{workHour.employee?.full_legal_name}</p>
                </div>
                {workHour.employee?.preferred_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                    <p className="text-gray-900">{workHour.employee.preferred_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Time Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Date and Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(workHour.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                  <p className="text-gray-900">{formatDate(workHour.date).split(',')[0]}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <p className="text-gray-900">{formatTime(workHour.start_time)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <p className="text-gray-900">{formatTime(workHour.end_time)}</p>
                </div>
              </div>
            </div>

            {/* Hours Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hours Summary</h3>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-blue-600">Total Hours</p>
                    <p className="text-3xl font-bold text-blue-900">{Number(workHour.total_hours).toFixed(2)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Time Range</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {formatTime(workHour.start_time)} - {formatTime(workHour.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Duration</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {Math.floor(Number(workHour.total_hours))}h {Math.round((Number(workHour.total_hours) % 1) * 60)}m
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Information */}
            {workHour.project && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <p className="text-gray-900">{workHour.project}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {workHour.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Work Description</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{workHour.description}</p>
                </div>
              </div>
            )}

            {/* Record Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded By</label>
                  <p className="text-gray-900">{workHour.user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded On</label>
                  <p className="text-gray-900">
                                         {new Date(workHour.created_at).toLocaleDateString('en-CA', {
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                     })}
                  </p>
                </div>
                {workHour.updated_at !== workHour.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-gray-900">
                                             {new Date(workHour.updated_at).toLocaleDateString('en-CA', {
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit'
                       })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Work Hours"
        message={`Are you sure you want to delete the work hours entry for ${workHour.employee?.full_legal_name} on ${formatDate(workHour.date)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default WorkHoursViewPage; 