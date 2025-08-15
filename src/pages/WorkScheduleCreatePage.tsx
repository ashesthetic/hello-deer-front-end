import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { canCreate } from '../utils/permissions';
import { workScheduleApi, employeesApi, WorkScheduleFormData } from '../services/api';

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
  week_number: number;
}

interface Shift {
  id: string;
  employee_id: number;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: string;
  date: string;
  shifts: Shift[];
}

const WorkScheduleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  
  const [selectedWeek, setSelectedWeek] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const isAddingShift = useRef(false);



  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeesApi.getAll({ status: 'active' });
      // Filter only active employees
      const activeEmployees = (response.data.data || []).filter((emp: Employee) => emp.status === 'active');
      setEmployees(activeEmployees);
    } catch (err: any) {
      console.error('Employees error:', err);
      setError('Failed to fetch employees: ' + (err.response?.data?.message || err.message));
    }
  }, []);

  const fetchWeekOptions = useCallback(async () => {
    // Always use client-side generation for now to ensure correct dates
    const fallbackWeeks = generateWeekOptions();
    setWeekOptions(fallbackWeeks);
    if (fallbackWeeks.length > 0) {
      setSelectedWeek(fallbackWeeks[0].value);
    }
  }, []);

  const generateWeekOptions = (): WeekOption[] => {
    const weeks = [];
    const today = new Date();
    
    // Get the current week's Monday
    const currentWeekMonday = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
    currentWeekMonday.setDate(today.getDate() - daysToMonday);
    
    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(currentWeekMonday);
      weekStart.setDate(currentWeekMonday.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        value: weekStart.toISOString().split('T')[0],
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        week_number: Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
      });
    }
    
    return weeks;
  };

  const generateDaySchedules = useCallback(() => {
    if (!selectedWeek) return;

    // Parse the selected week date correctly to avoid timezone issues
    const [year, month, day] = selectedWeek.split('-').map(Number);
    const weekStart = new Date(year, month - 1, day); // Month is 0-indexed
    

    
    const schedules: DaySchedule[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      
      const dateString = dayDate.toISOString().split('T')[0];
      
      schedules.push({
        day_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i],
        date: dateString,
        shifts: []
      });
    }
    
    setDaySchedules(schedules);
  }, [selectedWeek]);

  useEffect(() => {
    fetchEmployees();
    fetchWeekOptions();
  }, [fetchEmployees, fetchWeekOptions]);

  useEffect(() => {
    if (selectedWeek) {
      generateDaySchedules();
    }
  }, [selectedWeek, generateDaySchedules]);

  const getDayName = (dateString: string) => {
    // Parse the date string correctly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Month is 0-indexed
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const addShift = (dayIndex: number) => {
    // Prevent multiple calls
    if (isAddingShift.current) {
      console.log('Already adding shift, ignoring call');
      return;
    }
    
    isAddingShift.current = true;
    console.log('Adding shift for day index:', dayIndex);
    
    setDaySchedules(prev => {
      const newSchedules = [...prev];
      
      // Check if we already have shifts for this day to prevent duplicates
      const currentShifts = newSchedules[dayIndex].shifts;
      console.log('Current shifts for this day:', currentShifts.length);
      
      // Only add one shift at a time
      const newShift: Shift = {
        id: `shift_${Date.now()}_${Math.random()}`,
        employee_id: 0,
        start_time: '',
        end_time: ''
      };
      console.log('Creating new shift with ID:', newShift.id);
      
      // Add only one shift
      newSchedules[dayIndex].shifts = [...currentShifts, newShift];
      
      console.log('Total shifts for this day after adding:', newSchedules[dayIndex].shifts.length);
      
      // Reset the flag after state update
      setTimeout(() => {
        isAddingShift.current = false;
      }, 100);
      
      return newSchedules;
    });
  };

  const copyShift = (dayIndex: number, shiftIndex: number) => {
    setDaySchedules(prev => {
      const newSchedules = [...prev];
      const shiftToCopy = newSchedules[dayIndex].shifts[shiftIndex];
      const newShift: Shift = {
        id: `shift_${Date.now()}_${Math.random()}`,
        employee_id: shiftToCopy.employee_id,
        start_time: shiftToCopy.start_time,
        end_time: shiftToCopy.end_time
      };
      newSchedules[dayIndex].shifts.push(newShift);
      return newSchedules;
    });
  };

  const copyShiftToDay = (fromDayIndex: number, shiftIndex: number, toDayIndex: number) => {
    setDaySchedules(prev => {
      const newSchedules = [...prev];
      const shiftToCopy = newSchedules[fromDayIndex].shifts[shiftIndex];
      const newShift: Shift = {
        id: `shift_${Date.now()}_${Math.random()}`,
        employee_id: shiftToCopy.employee_id,
        start_time: shiftToCopy.start_time,
        end_time: shiftToCopy.end_time
      };
      newSchedules[toDayIndex].shifts.push(newShift);
      return newSchedules;
    });
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    setDaySchedules(prev => {
      const newSchedules = [...prev];
      newSchedules[dayIndex].shifts.splice(shiftIndex, 1);
      return newSchedules;
    });
  };

  const updateShift = (dayIndex: number, shiftIndex: number, field: keyof Shift, value: any) => {
    setDaySchedules(prev => {
      const newSchedules = [...prev];
      newSchedules[dayIndex].shifts[shiftIndex] = {
        ...newSchedules[dayIndex].shifts[shiftIndex],
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

  const getDayTotalHours = (shifts: Shift[]): number => {
    return shifts.reduce((total, shift) => {
      return total + calculateHours(shift.start_time, shift.end_time);
    }, 0);
  };

  const getTotalHours = (): number => {
    return daySchedules.reduce((total, day) => {
      return total + getDayTotalHours(day.shifts);
    }, 0);
  };

  const getTotalShifts = (): number => {
    return daySchedules.reduce((total, day) => {
      return total + day.shifts.length;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    // Parse the date string correctly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreate(currentUser)) {
      alert('You do not have permission to create work schedules');
      return;
    }

    if (!selectedWeek) {
      setError('Please select a week');
      return;
    }

    // Convert day schedules to the format expected by the API
    const scheduleDays = daySchedules.map(day => {
      // If no shifts, create a day with no times
      if (day.shifts.length === 0) {
        return {
          day_of_week: day.day_of_week,
          start_time: '',
          end_time: '',
          notes: ''
        };
      }
      
      // If multiple shifts, combine them (you might want to handle this differently)
      const totalHours = getDayTotalHours(day.shifts);
      const firstShift = day.shifts[0];
      
      return {
        day_of_week: day.day_of_week,
        start_time: firstShift.start_time,
        end_time: firstShift.end_time,
        notes: `Multiple shifts: ${day.shifts.length} shifts, ${totalHours} total hours`
      };
    });

    const formData: WorkScheduleFormData = {
      employee_id: 0, // This will be set from the first shift
      week_start_date: selectedWeek,
      title,
      notes,
      status,
      schedule_days: scheduleDays
    };

    try {
      setLoading(true);
      setError(null);
      
      await workScheduleApi.create(formData);
      navigate('/work-schedules');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create work schedule');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Work Schedule</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create a flexible weekly work schedule with multiple shifts per day
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
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
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
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly Schedule"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
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

        {/* Daily Schedules */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Schedule</h3>
          <p className="text-sm text-gray-600 mb-6">
            Add shifts for each day. You can add multiple shifts per day and copy shifts between days.
          </p>

          <div className="space-y-6">
            {daySchedules.map((day, dayIndex) => (
              <div key={day.day_of_week} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{getDayName(day.date)}</h4>
                    <p className="text-sm text-gray-500">{formatDate(day.date)}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {day.shifts.length} shift(s) • {getDayTotalHours(day.shifts).toFixed(1)} hours
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Add Shift button clicked for day:', dayIndex);
                        
                        // Prevent multiple rapid clicks
                        const button = e.target as HTMLButtonElement;
                        button.disabled = true;
                        setTimeout(() => {
                          button.disabled = false;
                        }, 1000);
                        
                        addShift(dayIndex);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:bg-blue-400"
                    >
                      Add Shift
                    </button>
                  </div>
                </div>

                {day.shifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No shifts added for this day
                  </div>
                ) : (
                  <div className="space-y-3">
                    {day.shifts.map((shift, shiftIndex) => (
                      <div key={shift.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Shift {shiftIndex + 1}</h5>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => copyShift(dayIndex, shiftIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Copy to Same Day
                            </button>
                            <div className="relative group">
                              <button
                                type="button"
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Copy to Other Day
                              </button>
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <div className="py-1">
                                  {daySchedules.map((otherDay, otherDayIndex) => {
                                    if (otherDayIndex === dayIndex) return null;
                                    return (
                                      <button
                                        key={otherDay.day_of_week}
                                        type="button"
                                        onClick={() => copyShiftToDay(dayIndex, shiftIndex, otherDayIndex)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        {getDayName(otherDay.date)} ({formatDate(otherDay.date)})
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeShift(dayIndex, shiftIndex)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Employee *
                            </label>
                            <select
                              value={shift.employee_id}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'employee_id', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select Employee</option>
                              {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.preferred_name || employee.full_legal_name} - {employee.position}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Start Time *
                            </label>
                            <input
                              type="time"
                              value={shift.start_time}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'start_time', e.target.value)}
                              step="60"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              End Time *
                            </label>
                            <input
                              type="time"
                              value={shift.end_time}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'end_time', e.target.value)}
                              step="60"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        
                        {shift.start_time && shift.end_time && (
                          <div className="mt-2 text-sm text-gray-600">
                            Duration: {calculateHours(shift.start_time, shift.end_time).toFixed(1)} hours
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Shifts:</span>
                <span className="ml-2 font-medium text-gray-900">{getTotalShifts()}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Hours:</span>
                <span className="ml-2 font-medium text-gray-900">{getTotalHours().toFixed(1)}</span>
              </div>
              <div>
                <span className="text-gray-600">Days with Shifts:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {daySchedules.filter(day => day.shifts.length > 0).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Average per Day:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {daySchedules.filter(day => day.shifts.length > 0).length > 0 
                    ? (getTotalHours() / daySchedules.filter(day => day.shifts.length > 0).length).toFixed(1) 
                    : '0'} hours
                </span>
              </div>
            </div>
          </div>
        </div>

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
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkScheduleCreatePage;
