import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canCreate } from '../utils/permissions';
import api from '../services/api';

interface ScheduleWorkHourData {
  employee_id: number;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
}

const WorkHoursFromSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  
  const { scheduleData, weekRange } = location.state || { scheduleData: [], weekRange: '' };
  
  const [workHours, setWorkHours] = useState<ScheduleWorkHourData[]>(scheduleData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  if (!canCreate(currentUser)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">You don't have permission to create work hours.</p>
        </div>
      </div>
    );
  }

  // If no schedule data, redirect back
  if (!scheduleData || scheduleData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Schedule Data</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No schedule data was provided. Please go back to the schedule page and try again.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/work-schedules')}
                  className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200"
                >
                  Back to Schedules
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRemove = (index: number) => {
    setWorkHours(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (workHours.length === 0) {
      alert('No work hours to create');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Send bulk create request
      const response = await api.post('/work-hours/bulk', {
        work_hours: workHours.map(wh => ({
          employee_id: wh.employee_id,
          date: wh.date,
          start_time: wh.start_time,
          end_time: wh.end_time,
          project: null,
          description: `Auto-generated from schedule (${weekRange})`
        }))
      });

      alert(`Successfully created ${response.data.created} work hour entries!`);
      navigate('/work-hours');
    } catch (err: any) {
      console.error('Error creating work hours:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create work hours';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to schedule view
  };

  const totalEntries = workHours.length;
  const totalHours = workHours.reduce((sum, wh) => sum + Number(wh.total_hours), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Work Hours from Schedule</h1>
          <p className="text-gray-600 mt-1">
            Review and create work hours for: <span className="font-medium">{weekRange}</span>
          </p>
        </div>

        {error && (
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
        )}

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-600">Total Entries</p>
              <p className="text-2xl font-bold text-blue-900">{totalEntries}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-900">{totalHours.toFixed(2)}h</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Average Hours/Entry</p>
              <p className="text-2xl font-bold text-blue-900">
                {totalEntries > 0 ? (totalHours / totalEntries).toFixed(2) : '0.00'}h
              </p>
            </div>
          </div>
        </div>

        {/* Work Hours List */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workHours.map((wh, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{wh.employee_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(wh.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{wh.start_time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{wh.end_time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{wh.total_hours.toFixed(2)}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || workHours.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : `Create ${workHours.length} Work Hour ${workHours.length === 1 ? 'Entry' : 'Entries'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkHoursFromSchedulePage;
