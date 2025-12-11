import React, { useState, useEffect } from 'react';
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
  employee: {
    id: number;
    full_legal_name: string;
    preferred_name: string | null;
    position: string;
    status: string;
  };
}

const CurrentWeekSchedule: React.FC = () => {
  const [scheduleWeeks, setScheduleWeeks] = useState<{ schedules: Schedule[], week_start_date: string, week_end_date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLastTwoSchedules();
  }, []);

  const fetchLastTwoSchedules = async () => {
    try {
      setLoading(true);
      
      // Use staff-specific endpoint to get all schedules
      const response = await api.get('/staff/schedules');
      
      console.log('Schedule API response:', response.data);
      
      const allSchedules: Schedule[] = response.data.data;
      
      // Group schedules by week_start_date
      const weekGroups: { [key: string]: Schedule[] } = {};
      allSchedules.forEach(schedule => {
        const weekKey = schedule.week_start_date;
        if (!weekGroups[weekKey]) {
          weekGroups[weekKey] = [];
        }
        weekGroups[weekKey].push(schedule);
      });
      
      // Sort weeks by start date (most recent first) and take last 2
      const sortedWeeks = Object.keys(weekGroups)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .slice(0, 2);
      
      // Create array of week data
      const weekData = sortedWeeks.map(weekStart => ({
        schedules: weekGroups[weekStart],
        week_start_date: weekStart,
        week_end_date: weekGroups[weekStart][0].week_end_date
      }));
      
      console.log('Number of weeks:', weekData.length);
      
      setScheduleWeeks(weekData);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('Error fetching schedules:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to fetch schedules: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getWeekRangeString = (startDate: string, endDate: string) => {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    return `Mon ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Sun ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getDayLabel = (date: string): string => {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayName}\n${monthDay}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Schedules</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || scheduleWeeks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Schedules</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No schedules available.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Recent Schedules</h2>
      {scheduleWeeks.map((weekData, weekIndex) => {
        const schedules = weekData.schedules;
        const weekDates: string[] = [];
        const [startYear, startMonth, startDay] = weekData.week_start_date.split('-').map(Number);
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(startYear, startMonth - 1, startDay + i);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          weekDates.push(`${year}-${month}-${day}`);
        }

        return (
          <div key={weekData.week_start_date} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Week: {getWeekRangeString(weekData.week_start_date, weekData.week_end_date)}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-xl font-bold text-gray-900">{schedules.length}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                      Employee
                    </th>
                    {weekDates.map(date => (
                      <th key={date} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-pre-line border-r border-gray-200">
                        {getDayLabel(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule: Schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.employee.preferred_name || schedule.employee.full_legal_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {schedule.employee.position}
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const shift = schedule.shift_info.find((s: ShiftInfo) => s.date === date);
                        return (
                          <td key={date} className="px-2 py-4 text-center border-r border-gray-200">
                            {shift ? (
                              <div className="text-xs">
                                <div className="font-medium text-gray-900">{shift.start_time}</div>
                                <div className="text-gray-600">to</div>
                                <div className="font-medium text-gray-900">{shift.end_time}</div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                      Total:
                    </td>
                    {weekDates.map(date => {
                      const dayTotal = schedules.reduce((sum: number, schedule: Schedule) => {
                        const shift = schedule.shift_info.find((s: ShiftInfo) => s.date === date);
                        return sum + (shift ? Number(shift.total_hour) : 0);
                      }, 0);
                      return (
                        <td key={date} className="px-2 py-4 text-center border-r border-gray-200">
                          <div className="text-sm font-bold text-gray-900">
                            {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

            {schedules[0]?.notes && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs font-medium text-blue-800 mb-1">Notes:</div>
                <div className="text-sm text-blue-900 whitespace-pre-wrap">
                  {schedules[0].notes}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CurrentWeekSchedule;
