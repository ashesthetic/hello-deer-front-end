import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const ScheduleViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // This is actually week_start_date now
  const weekStartDate = id; // Rename for clarity
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (weekStartDate) {
      fetchWeekSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartDate]);

  const fetchWeekSchedules = async () => {
    try {
      setLoading(true);
      // Extract just the date part (YYYY-MM-DD) from the URL parameter
      // The URL might have a full ISO timestamp like "2025-11-10T07:00:00.000000Z"
      const dateOnly = weekStartDate?.split('T')[0];
      
      // Fetch all schedules for this week
      const response = await api.get(`/schedules`, {
        params: {
          week_start_date: dateOnly
        }
      });
      setSchedules(response.data.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch schedules: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getWeekRangeString = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `Mon ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Sun ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || schedules.length === 0) {
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
              <div className="mt-2 text-sm text-red-700">{error || 'No schedules found for this week'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get week dates from the first schedule
  const firstSchedule = schedules[0];
  const weekDates: string[] = [];
  const startDate = new Date(firstSchedule.week_start_date);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }

  const getDayLabel = (date: string): string => {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayName}\n${monthDay}`;
  };

  const totalWeeklyHours = schedules.reduce((sum, s) => sum + Number(s.weekly_total_hours), 0);

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('schedule-table-export');
      if (!element) {
        console.error('Element not found');
        return;
      }

      // Make element visible but off-screen for capture
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.width = '1200px';
      element.style.padding = '40px';
      element.style.backgroundColor = '#ffffff';

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 1200,
        windowWidth: 1200
      });

      // Hide element again
      element.style.display = 'none';
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';

      // Convert to JPEG with compression for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Create PDF with A4 landscape dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate dimensions to fit the image with margins
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image with margins
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      
      const fileName = `schedule_${firstSchedule.week_start_date}_to_${firstSchedule.week_end_date}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF: ' + (error as Error).message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Schedule</h1>
            <p className="mt-2 text-sm text-gray-600">
              {getWeekRangeString(firstSchedule.week_start_date, firstSchedule.week_end_date)}
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

      {/* Schedule Information */}
      <div className="space-y-6">
        {/* Summary Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Week Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
              <div className="text-sm text-gray-900">
                {getWeekRangeString(firstSchedule.week_start_date, firstSchedule.week_end_date)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Employees</label>
              <div className="text-sm text-gray-900 font-semibold">
                {schedules.length}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Weekly Hours</label>
              <div className="text-sm text-gray-900 font-semibold">
                {totalWeeklyHours.toFixed(1)} hours
              </div>
            </div>
            {firstSchedule.notes && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {firstSchedule.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shifts Table */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Employee Schedules</h3>
            <button
              onClick={handleExportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Export PDF</span>
            </button>
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
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.employee.preferred_name || schedule.employee.full_legal_name} ({Number(schedule.weekly_total_hours).toFixed(1)}h)
                      </div>
                      <div className="text-xs text-gray-500">
                        {schedule.employee.position}
                      </div>
                    </td>
                    {weekDates.map(date => {
                      const shift = schedule.shift_info.find(s => s.date === date);
                      return (
                        <td key={date} className="px-2 py-4 text-center border-r border-gray-200">
                          {shift ? (
                            <div className="text-xs">
                              <div className="font-medium text-gray-900">{shift.start_time}</div>
                              <div className="text-gray-600">to</div>
                              <div className="font-medium text-gray-900">{shift.end_time}</div>
                              <div className="text-blue-600 font-semibold mt-1">
                                {Number(shift.total_hour).toFixed(1)}h
                              </div>
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
                    const dayTotal = schedules.reduce((sum, schedule) => {
                      const shift = schedule.shift_info.find(s => s.date === date);
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
        </div>

        {/* Hidden export content */}
        <div id="schedule-table-export" style={{ display: 'none' }}>
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Schedules ({getWeekRangeString(firstSchedule.week_start_date, firstSchedule.week_end_date)})
            </h1>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                  Employee
                </th>
                {weekDates.map(date => (
                  <th key={date} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'pre-line' }}>
                    {getDayLabel(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule, idx) => (
                <tr key={schedule.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '12px 16px', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                      {schedule.employee.preferred_name || schedule.employee.full_legal_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {schedule.employee.position}
                    </div>
                  </td>
                  {weekDates.map(date => {
                    const shift = schedule.shift_info.find(s => s.date === date);
                    return (
                      <td key={date} style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        {shift ? (
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: '500', color: '#111827' }}>{shift.start_time}</div>
                            <div style={{ color: '#6b7280' }}>to</div>
                            <div style={{ fontWeight: '500', color: '#111827' }}>{shift.end_time}</div>
                          </div>
                        ) : (
                          <div style={{ color: '#9ca3af', fontSize: '12px' }}>-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Metadata */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Created By</label>
              <div className="text-gray-900">{firstSchedule.user.name}</div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Created At</label>
              <div className="text-gray-900">
                {new Date(firstSchedule.created_at).toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Total Employees</label>
              <div className="text-gray-900">{schedules.length}</div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Total Shifts</label>
              <div className="text-gray-900">
                {schedules.reduce((sum, s) => sum + s.shift_info.length, 0)} shifts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewPage;
