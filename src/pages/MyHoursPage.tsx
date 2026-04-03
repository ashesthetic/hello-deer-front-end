import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface WorkHour {
  id: number;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM:SS
  end_time: string;    // HH:MM:SS
  total_hours: number | string;
  project?: string;
  description?: string;
}

const DAYS: { key: number; label: string }[] = [
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
  { key: 0, label: 'Sun' },
];

function fmt12(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m}${ampm}`;
}

function isoWeekKey(dateStr: string): string {
  // Returns "YYYY-Www" e.g. "2026-W14"
  const d = new Date(dateStr + 'T00:00:00');
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const diff = d.getTime() - startOfWeek1.getTime();
  const week = Math.floor(diff / (7 * 86400000)) + 1;
  // Determine year of the ISO week
  const weekYear = week < 1
    ? d.getFullYear() - 1
    : (week > 52 && d.getMonth() === 0) ? d.getFullYear() - 1 : d.getFullYear();
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

function weekRange(weekKey: string): string {
  // Get Mon and Sun dates for the ISO week
  const [yearStr, wStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function formatHours(val: number | string): string {
  const n = parseFloat(String(val));
  if (isNaN(n)) return '—';
  return n === Math.floor(n) ? `${n} hr${n !== 1 ? 's' : ''}` : `${n.toFixed(2)} hrs`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const MyHoursPage: React.FC = () => {
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/staff/my-hours');
        setWorkHours(res.data?.data ?? []);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load hours.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your hours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // Group by ISO week, preserving descending order
  const weekMap = new Map<string, WorkHour[]>();
  for (const wh of workHours) {
    const key = isoWeekKey(wh.date);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(wh);
  }
  const weeks = Array.from(weekMap.entries()); // already desc from API

  // Total hours
  const totalHours = workHours.reduce((sum, wh) => sum + parseFloat(String(wh.total_hours) || '0'), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">My Hours</h1>
            <p className="text-gray-500 text-sm">{workHours.length} entries · {formatHours(totalHours)} total</p>
          </div>
        </div>

        {weeks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            No hours recorded yet.
          </div>
        ) : (
          <div className="space-y-6">
            {weeks.map(([weekKey, entries]) => {
              // Build a map of dayOfWeek -> entry for this week
              const dayMap = new Map<number, WorkHour>();
              for (const e of entries) {
                const dow = new Date(e.date + 'T00:00:00').getDay(); // 0=Sun,1=Mon...
                dayMap.set(dow, e);
              }

              const weekTotal = entries.reduce(
                (sum, e) => sum + parseFloat(String(e.total_hours) || '0'), 0
              );

              return (
                <div key={weekKey} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Week header */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-700">{weekRange(weekKey)}</span>
                    <span className="text-sm text-blue-700 font-medium">{formatHours(weekTotal)} this week</span>
                  </div>

                  {/* Day grid */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {DAYS.map(({ key, label }) => (
                            <th
                              key={key}
                              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider text-center ${
                                dayMap.has(key) ? 'text-blue-700' : 'text-gray-400'
                              }`}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {DAYS.map(({ key, label }) => {
                            const entry = dayMap.get(key);
                            return (
                              <td
                                key={key}
                                className={`px-4 py-4 text-center align-top border-r last:border-r-0 border-gray-100 ${
                                  entry ? 'bg-blue-50' : 'bg-white'
                                }`}
                              >
                                {entry ? (
                                  <div className="space-y-1">
                                    <div className="text-xs text-gray-500 font-medium">
                                      {formatDate(entry.date)}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-800">
                                      {fmt12(entry.start_time)}
                                    </div>
                                    <div className="text-xs text-gray-400">to</div>
                                    <div className="text-sm font-semibold text-gray-800">
                                      {fmt12(entry.end_time)}
                                    </div>
                                    <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                      {formatHours(entry.total_hours)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-200 text-lg">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHoursPage;
