import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canCreate, canUpdate, canDelete } from '../utils/permissions';
import api from '../services/api';

interface ShiftInfo {
  date: string;
  start_time: string;
  end_time: string;
  total_hour: number;
}

interface Schedule {
  id: number;
  employee_id: number;
  week_start_date: string;
  week_end_date: string;
  weekly_total_hours: number;
  shift_info: ShiftInfo[];
  notes: string | null;
  user_id: number;
  employee: {
    id: number;
    full_legal_name: string;
    preferred_name: string | null;
    position: string;
    status: string;
  };
  user: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface WeekGroup {
  weekKey: string;
  week_start_date: string;
  week_end_date: string;
  schedules: Schedule[];
  totalEmployees: number;
  totalHours: number;
  totalShifts: number;
}

const WorkSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weekGroups, setWeekGroups] = useState<WeekGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedules');
      const schedulesData = response.data.data;
      setSchedules(schedulesData);
      
      // Group schedules by week
      const grouped = groupSchedulesByWeek(schedulesData);
      setWeekGroups(grouped);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const groupSchedulesByWeek = (schedules: Schedule[]): WeekGroup[] => {
    const groups: { [key: string]: WeekGroup } = {};
    
    schedules.forEach(schedule => {
      const weekKey = `${schedule.week_start_date}_${schedule.week_end_date}`;
      
      if (!groups[weekKey]) {
        groups[weekKey] = {
          weekKey,
          week_start_date: schedule.week_start_date,
          week_end_date: schedule.week_end_date,
          schedules: [],
          totalEmployees: 0,
          totalHours: 0,
          totalShifts: 0
        };
      }
      
      groups[weekKey].schedules.push(schedule);
      groups[weekKey].totalEmployees += 1;
      groups[weekKey].totalHours += Number(schedule.weekly_total_hours) || 0;
      groups[weekKey].totalShifts += schedule.shift_info.length;
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
    );
  };

  const handleDeleteWeek = async (weekStartDate: string) => {
    if (!canDelete(currentUser)) {
      alert('You do not have permission to delete schedules');
      return;
    }

    const weekGroup = weekGroups.find(g => g.week_start_date === weekStartDate);
    if (!weekGroup) return;

    if (window.confirm(`Are you sure you want to delete all ${weekGroup.totalEmployees} schedules for this week?`)) {
      try {
        // Delete all schedules for this week
        await Promise.all(
          weekGroup.schedules.map(schedule => api.delete(`/schedules/${schedule.id}`))
        );
        fetchSchedules(); // Refresh the list
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete schedules');
      }
    }
  };

  const getWeekRangeString = (startDate: string, endDate: string) => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    return `Mon ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Sun ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const filteredWeekGroups = weekGroups.filter(group => {
    if (!searchTerm) return true;
    
    return group.schedules.some(schedule =>
      schedule.employee.full_legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.employee.preferred_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Schedules</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage employee weekly schedules
            </p>
          </div>
          {canCreate(currentUser) && (
            <button
              onClick={() => navigate('/work-schedules/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Create Schedule
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
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
          <div className="flex items-end">
            <button
              onClick={fetchSchedules}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Weeks Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredWeekGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No schedules found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Shifts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWeekGroups.map((weekGroup) => (
                  <tr key={weekGroup.weekKey} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getWeekRangeString(weekGroup.week_start_date, weekGroup.week_end_date)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(weekGroup.week_start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {weekGroup.totalEmployees}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {weekGroup.totalShifts}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {weekGroup.totalHours.toFixed(1)} hrs
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {weekGroup.schedules[0]?.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/work-schedules/view/${weekGroup.week_start_date}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {canUpdate(currentUser) && (
                        <button
                          onClick={() => navigate(`/work-schedules/edit/${weekGroup.week_start_date}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete(currentUser) && (
                        <button
                          onClick={() => handleDeleteWeek(weekGroup.week_start_date)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {weekGroups.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{weekGroups.length}</div>
              <div className="text-sm text-blue-600">Total Weeks</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{schedules.length}</div>
              <div className="text-sm text-green-600">Total Schedules</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(schedules.map(s => s.employee_id)).size}
              </div>
              <div className="text-sm text-purple-600">Unique Employees</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {schedules.reduce((sum, s) => sum + (Number(s.weekly_total_hours) || 0), 0).toFixed(1)}
              </div>
              <div className="text-sm text-orange-600">Total Hours</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkSchedulesPage;
