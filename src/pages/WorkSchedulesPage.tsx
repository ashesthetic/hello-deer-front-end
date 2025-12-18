import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canCreate, canUpdate, canDelete } from '../utils/permissions';
import { workScheduleApi } from '../services/api';

interface WorkScheduleDay {
  id: number;
  day_of_week: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  hours_worked: number;
  is_working_day: boolean;
  notes: string | null;
}

interface WorkSchedule {
  id: number;
  employee_id: number;
  week_start_date: string;
  week_end_date: string;
  title: string | null;
  notes: string | null;
  status: string;
  employee: {
    id: number;
    full_legal_name: string;
    preferred_name: string | null;
    position: string;
  };
  user: {
    id: number;
    name: string;
  };
  schedule_days: WorkScheduleDay[];
  created_at: string;
  updated_at: string;
}

const WorkSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');

  useEffect(() => {
    fetchWorkSchedules();
  }, []);

  const fetchWorkSchedules = async () => {
    try {
      setLoading(true);
      const response = await workScheduleApi.index();
      setWorkSchedules(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch work schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete(currentUser)) {
      alert('You do not have permission to delete work schedules');
      return;
    }

    if (window.confirm('Are you sure you want to delete this work schedule?')) {
      try {
        await workScheduleApi.destroy(id);
        setWorkSchedules(workSchedules.filter(schedule => schedule.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete work schedule');
      }
    }
  };

  const getTotalHoursForWeek = (scheduleDays: WorkScheduleDay[]): number => {
    return scheduleDays.reduce((total, day) => total + Number(day.hours_worked), 0);
  };

  const getWorkingDaysCount = (scheduleDays: WorkScheduleDay[]): number => {
    return scheduleDays.filter(day => day.is_working_day).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getWeekRangeString = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const filteredSchedules = workSchedules.filter(schedule => {
    const matchesSearch = 
      schedule.employee.full_legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.employee.preferred_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Schedules</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage employee weekly work schedules with flexible daily hours
            </p>
          </div>
          {canCreate(currentUser) && (
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/work-schedules/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Schedule
              </button>
              <button
                onClick={() => navigate('/work-schedules/current-week')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Current Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by employee name, position, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchWorkSchedules}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Work Schedules List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No work schedules found
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.employee.preferred_name || schedule.employee.full_legal_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.employee.position}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {getWeekRangeString(schedule.week_start_date, schedule.week_end_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.title || 'Weekly Schedule'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getWorkingDaysCount(schedule.schedule_days)} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTotalHoursForWeek(schedule.schedule_days).toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        schedule.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : schedule.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(schedule.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/work-schedules/${schedule.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {canUpdate(currentUser) && (
                          <button
                            onClick={() => navigate(`/work-schedules/${schedule.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(currentUser) && (
                          <button
                            onClick={() => handleDelete(schedule.id)}
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
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{workSchedules.length}</div>
            <div className="text-sm text-blue-600">Total Schedules</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {workSchedules.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-green-600">Active Schedules</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {workSchedules.filter(s => s.status === 'draft').length}
            </div>
            <div className="text-sm text-yellow-600">Draft Schedules</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(workSchedules.map(s => s.employee_id)).size}
            </div>
            <div className="text-sm text-purple-600">Employees with Schedules</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSchedulesPage;
