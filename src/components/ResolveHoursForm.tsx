import React, { useState } from 'react';
import { EmployeeWithHours, employeesApi } from '../services/api';

interface ResolveHoursFormProps {
  employee: EmployeeWithHours;
  onSuccess: () => void;
  onCancel: () => void;
}

const ResolveHoursForm: React.FC<ResolveHoursFormProps> = ({ employee, onSuccess, onCancel }) => {
  const [resolvedHours, setResolvedHours] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!resolvedHours || resolvedHours.trim() === '') {
      setError('Please enter the resolved hours');
      setLoading(false);
      return;
    }

    const resolvedHoursNum = parseFloat(resolvedHours);
    if (isNaN(resolvedHoursNum) || resolvedHoursNum < 0) {
      setError('Please enter a valid number of hours');
      setLoading(false);
      return;
    }

    if (resolvedHoursNum > employee.total_hours) {
      setError('Resolved hours cannot exceed total hours worked');
      setLoading(false);
      return;
    }

    try {
      await employeesApi.resolveHours(employee.id, {
        resolved_hours: resolvedHoursNum,
        notes: notes.trim() || undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve hours');
    } finally {
      setLoading(false);
    }
  };

  const resolvedHoursNum = parseFloat(resolvedHours);
  const additionalHours = !isNaN(resolvedHoursNum) ? resolvedHoursNum - employee.resolved_hours : 0;
  const additionalPayment = additionalHours * parseFloat(employee.hourly_rate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Resolve Hours</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Employee Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">{employee.full_legal_name}</h3>
            <p className="text-sm text-gray-600">{employee.position} - {employee.department}</p>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Hours:</span>
                <span className="ml-1 font-medium">{employee.total_hours.toFixed(2)}h</span>
              </div>
              <div>
                <span className="text-gray-500">Hourly Rate:</span>
                <span className="ml-1 font-medium">${employee.hourly_rate}</span>
              </div>
              <div>
                <span className="text-gray-500">Currently Resolved:</span>
                <span className="ml-1 font-medium">{employee.resolved_hours.toFixed(2)}h</span>
              </div>
              <div>
                <span className="text-gray-500">Unpaid Hours:</span>
                <span className="ml-1 font-medium text-red-600">{employee.unpaid_hours.toFixed(2)}h</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="resolvedHours" className="block text-sm font-medium text-gray-700 mb-2">
                Total Resolved Hours
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max={employee.total_hours}
                id="resolvedHours"
                value={resolvedHours}
                onChange={(e) => setResolvedHours(e.target.value)}
                placeholder="Enter resolved hours (e.g., 40.5)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {employee.total_hours.toFixed(2)} hours
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes about this payment resolution..."
              />
            </div>

            {/* Payment Preview */}
            {resolvedHours && !isNaN(resolvedHoursNum) && resolvedHoursNum !== employee.resolved_hours && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Additional Hours:</span>
                    <span className="font-medium">{additionalHours.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Rate:</span>
                    <span className="font-medium">${employee.hourly_rate}/hour</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1">
                    <span className="text-blue-700 font-medium">Additional Payment:</span>
                    <span className="font-semibold text-blue-900">
                      ${additionalPayment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">New Unpaid Hours:</span>
                    <span className="font-medium">
                      {Math.max(0, employee.total_hours - resolvedHoursNum).toFixed(2)}h
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Resolve Hours'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResolveHoursForm;
