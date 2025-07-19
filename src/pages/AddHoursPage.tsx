import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HoursForm {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  project: string;
  description: string;
}

interface Employee {
  id: number;
  name: string;
  position: string;
}

const AddHoursPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<HoursForm>({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    breakTime: '0',
    project: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo employee data
  const employees: Employee[] = [
    { id: 1, name: 'John Smith', position: 'Sales Manager' },
    { id: 2, name: 'Sarah Johnson', position: 'Accountant' },
    { id: 3, name: 'Mike Davis', position: 'Fuel Technician' },
    { id: 4, name: 'Lisa Wilson', position: 'Store Clerk' },
    { id: 5, name: 'Tom Brown', position: 'Driver' }
  ];

  const projects = [
    'Fuel Station Operations',
    'Store Management',
    'Sales & Marketing',
    'Administrative Tasks',
    'Maintenance & Repairs',
    'Customer Service',
    'Inventory Management',
    'Training & Development'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const breakMinutes = parseInt(formData.breakTime) || 0;
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalHours = diffHours - (breakMinutes / 60);
    
    return Math.max(0, totalHours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo success message
    alert('Hours added successfully!');
    navigate('/employees');
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  const totalHours = calculateTotalHours();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Add Work Hours</h1>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Time Entry</h2>
            <p className="mt-1 text-sm text-gray-600">
              Record work hours for employees. All fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Employee Selection */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                Employee *
              </label>
              <select
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Break Time and Total Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="breakTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Break Time (minutes)
                </label>
                <input
                  type="number"
                  id="breakTime"
                  name="breakTime"
                  value={formData.breakTime}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Hours
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {totalHours.toFixed(2)} hours
                </div>
              </div>
            </div>

            {/* Project and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                  Project/Activity
                </label>
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select project</option>
                  {projects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the work performed..."
                />
              </div>
            </div>

            {/* Quick Entry Buttons */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Entry</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      startTime: '09:00',
                      endTime: '17:00',
                      breakTime: '60'
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Full Day (9 AM - 5 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      startTime: '08:00',
                      endTime: '16:00',
                      breakTime: '30'
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Early Shift (8 AM - 4 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      startTime: '10:00',
                      endTime: '18:00',
                      breakTime: '30'
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Late Shift (10 AM - 6 PM)
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totalHours <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding Hours...' : 'Add Hours'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Hours Summary */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Hours Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">156</p>
                <p className="text-sm text-gray-600">Hours This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">31.2</p>
                <p className="text-sm text-gray-600">Avg Hours/Day</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-yellow-600">5</p>
                <p className="text-sm text-gray-600">Employees Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-purple-600">$2,340</p>
                <p className="text-sm text-gray-600">Total Payroll</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHoursPage; 