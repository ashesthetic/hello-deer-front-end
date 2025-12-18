import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canUpdate } from '../utils/permissions';
import { employeesApi } from '../services/api';
import api from '../services/api';

interface Employee {
  id: number;
  full_legal_name: string;
  preferred_name: string | null;
  position: string;
  status: string;
}

interface WeekOption {
  value: string;
  label: string;
  startDate: string;
  endDate: string;
  dates: string[];
}

interface EmployeeShift {
  [date: string]: {
    start_time: string;
    end_time: string;
  };
}

interface EmployeeSchedule {
  [employeeId: number]: EmployeeShift;
}

const ScheduleEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // This is actually week_start_date now
  const weekStartDate = id; // Rename for clarity
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [notes, setNotes] = useState('');
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule>({});

  const TIME_OPTIONS = generateTimeOptions();

  function generateTimeOptions(): string[] {
    const options: string[] = [];
    // Generate times from 6:00 AM to 10:00 PM with 15-minute intervals
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        options.push(`${h}:${m}`);
      }
    }
    return options;
  }

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeesApi.getAll({ status: 'active' });
      const activeEmployees = (response.data.data || []).filter((emp: Employee) => emp.status === 'active');
      setEmployees(activeEmployees);
      
      // Initialize employee schedules
      const initialSchedules: EmployeeSchedule = {};
      activeEmployees.forEach((emp: Employee) => {
        initialSchedules[emp.id] = {};
      });
      setEmployeeSchedules(initialSchedules);
    } catch (err: any) {
      console.error('Employees error:', err);
      setError('Failed to fetch employees: ' + (err.response?.data?.message || err.message));
    }
  }, []);

  const generateWeekOptions = (): WeekOption[] => {
    const weeks: WeekOption[] = [];
    const today = new Date();
    
    // Get the current week's Monday (Monday = start of week)
    const currentWeekMonday = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
    currentWeekMonday.setDate(today.getDate() - daysToMonday);
    currentWeekMonday.setHours(0, 0, 0, 0); // Reset time to start of day
    
    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(currentWeekMonday);
      weekStart.setDate(currentWeekMonday.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday is 6 days after Monday
      
      const dates: string[] = [];
      // Generate 7 days starting from Monday
      for (let j = 0; j < 7; j++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + j);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      weeks.push({
        value: weekStart.toISOString().split('T')[0],
        label: `Mon ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Sun ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        dates
      });
    }
    
    return weeks;
  };

  useEffect(() => {
    fetchEmployees();
    const weeks = generateWeekOptions();
    setWeekOptions(weeks);
    
    // Fetch schedule data for the week
    if (weekStartDate) {
      fetchWeekSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEmployees, weekStartDate]);

  const fetchWeekSchedules = async () => {
    try {
      setFetching(true);
      // Extract just the date part (YYYY-MM-DD) from the URL parameter
      // The URL might have a full ISO timestamp like "2025-11-10T07:00:00.000000Z"
      const dateOnly = weekStartDate?.split('T')[0];
      
      // Fetch all schedules for this week
      const response = await api.get(`/schedules`, {
        params: {
          week_start_date: dateOnly
        }
      });
      const schedules = response.data.data;
      
      if (schedules.length === 0) {
        setError('No schedules found for this week');
        setFetching(false);
        return;
      }
      
      // Set notes from the first schedule (all schedules in a week should have the same notes)
      setNotes(schedules[0].notes || '');
      
      // Find and set the week
      const weeks = generateWeekOptions();
      setWeekOptions(weeks);
      const week = weeks.find(w => w.startDate === dateOnly);
      if (week) {
        setSelectedWeek(week);
      }
      
      // Convert all schedules to employeeSchedules format
      const scheduleData: EmployeeSchedule = {};
      
      schedules.forEach((schedule: any) => {
        scheduleData[schedule.employee_id] = {};
        schedule.shift_info.forEach((shift: any) => {
          scheduleData[schedule.employee_id][shift.date] = {
            start_time: shift.start_time,
            end_time: shift.end_time
          };
        });
      });
      
      setEmployeeSchedules(scheduleData);
      setFetching(false);
    } catch (err: any) {
      setError('Failed to fetch schedules: ' + (err.response?.data?.message || err.message));
      setFetching(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDayName = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const updateShift = (employeeId: number, date: string, field: 'start_time' | 'end_time', value: string) => {
    setEmployeeSchedules(prev => {
      const newSchedules = { ...prev };
      if (!newSchedules[employeeId]) {
        newSchedules[employeeId] = {};
      }
      if (!newSchedules[employeeId][date]) {
        newSchedules[employeeId][date] = { start_time: '', end_time: '' };
      }
      newSchedules[employeeId][date] = {
        ...newSchedules[employeeId][date],
        [field]: value
      };
      return newSchedules;
    });
  };

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const getEmployeeTotalHours = (employeeId: number): number => {
    const shifts = employeeSchedules[employeeId] || {};
    return Object.values(shifts).reduce((total, shift) => {
      return total + calculateHours(shift.start_time, shift.end_time);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canUpdate(currentUser)) {
      setError('You do not have permission to update schedules');
      return;
    }

    if (!selectedWeek) {
      setError('Please select a week');
      return;
    }

    // Prepare all employee schedules
    const schedulesToUpdate: any[] = [];
    
    for (const employeeIdStr in employeeSchedules) {
      const employeeId = parseInt(employeeIdStr);
      const employeeShifts = employeeSchedules[employeeId];
      const shiftInfo = [];
      
      for (const date in employeeShifts) {
        const shift = employeeShifts[date];
        if (shift.start_time && shift.end_time) {
          shiftInfo.push({
            date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            total_hour: calculateHours(shift.start_time, shift.end_time)
          });
        }
      }
      
      // Only include employees with at least one shift
      if (shiftInfo.length > 0) {
        schedulesToUpdate.push({
          employee_id: employeeId,
          week_start_date: selectedWeek.startDate,
          week_end_date: selectedWeek.endDate,
          shift_info: shiftInfo,
          notes: notes || null
        });
      }
    }

    if (schedulesToUpdate.length === 0) {
      setError('Please add at least one shift for at least one employee');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // First, get existing schedules for this week to know which IDs to update
      const existingResponse = await api.get(`/schedules`, {
        params: {
          week_start_date: weekStartDate
        }
      });
      const existingSchedules = existingResponse.data.data;
      
      // Create a map of employee_id to schedule id
      const employeeToScheduleId: { [key: number]: number } = {};
      existingSchedules.forEach((schedule: any) => {
        employeeToScheduleId[schedule.employee_id] = schedule.id;
      });
      
      // Update existing schedules and create new ones for any new employees
      const updatePromises = schedulesToUpdate.map(scheduleData => {
        const scheduleId = employeeToScheduleId[scheduleData.employee_id];
        if (scheduleId) {
          // Update existing schedule
          return api.put(`/schedules/${scheduleId}`, scheduleData);
        } else {
          // Create new schedule for this employee
          return api.post('/schedules', scheduleData);
        }
      });
      
      // Delete schedules for employees that no longer have shifts
      const deletePromises = existingSchedules
        .filter((schedule: any) => !schedulesToUpdate.find(s => s.employee_id === schedule.employee_id))
        .map((schedule: any) => api.delete(`/schedules/${schedule.id}`));
      
      await Promise.all([...updatePromises, ...deletePromises]);
      navigate('/work-schedules');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update schedules');
    } finally {
      setLoading(false);
    }
  };

  if (!canUpdate(currentUser)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                You do not have permission to create schedules.
              </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Schedule</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update weekly schedule for employee
            </p>
          </div>
          <button
            onClick={() => navigate('/work-schedules')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Back to Schedules
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

      {fetching ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week *
              </label>
              <select
                value={selectedWeek?.value || ''}
                onChange={(e) => {
                  const week = weekOptions.find(w => w.value === e.target.value);
                  setSelectedWeek(week || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Week</option>
                {weekOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes about this schedule..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Weekly Schedule Table */}
        {selectedWeek && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Schedule</h3>
            <p className="text-sm text-gray-600 mb-6">
              Set start and end times for each employee and day. Leave blank for days off.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                      Employee
                    </th>
                    {selectedWeek.dates.map(date => (
                      <th key={date} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[110px]">
                        <div>{getDayName(date)}</div>
                        <div className="text-gray-400 font-normal">{formatDate(date)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map(employee => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-r border-gray-200 sticky left-0 bg-white z-10">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.preferred_name || employee.full_legal_name} ({getEmployeeTotalHours(employee.id).toFixed(1)}h)
                        </div>
                        <div className="text-xs text-gray-500">{employee.position}</div>
                      </td>
                      {selectedWeek.dates.map(date => (
                        <td key={date} className="px-2 py-3 border-r border-gray-200">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Start</label>
                              <select
                                value={employeeSchedules[employee.id]?.[date]?.start_time || ''}
                                onChange={(e) => updateShift(employee.id, date, 'start_time', e.target.value)}
                                className="w-full text-xs px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">--</option>
                                {TIME_OPTIONS.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">End</label>
                              <select
                                value={employeeSchedules[employee.id]?.[date]?.end_time || ''}
                                onChange={(e) => updateShift(employee.id, date, 'end_time', e.target.value)}
                                className="w-full text-xs px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">--</option>
                                {TIME_OPTIONS.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            {employeeSchedules[employee.id]?.[date]?.start_time && 
                             employeeSchedules[employee.id]?.[date]?.end_time && (
                              <div className="text-xs text-gray-600 text-center font-medium pt-1">
                                {calculateHours(
                                  employeeSchedules[employee.id][date].start_time,
                                  employeeSchedules[employee.id][date].end_time
                                ).toFixed(1)}h
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/work-schedules')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || fetching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Updating...' : fetching ? 'Loading...' : 'Update Schedule'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default ScheduleEditPage;
