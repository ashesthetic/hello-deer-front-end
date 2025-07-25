import React, { useState, useEffect } from 'react';
import { employeesApi } from '../services/api';

interface Employee {
  id: number;
  full_legal_name: string;
  preferred_name: string;
  position: string;
  status: string;
}

interface PayDay {
  date: string;
  label: string;
  type: 'previous' | 'current' | 'upcoming';
}

const PayStubsPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payDays, setPayDays] = useState<PayDay[]>([]);
  const [selectedPayDay, setSelectedPayDay] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPayDays, setLoadingPayDays] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchPayDays();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesApi.getAll();
      console.log('Employees response:', response); // Debug log
      
      // Ensure we have the correct data structure
      const employeesData = response.data?.data || response.data || [];
      
      if (Array.isArray(employeesData)) {
        const activeEmployees = employeesData.filter((emp: Employee) => emp.status === 'active');
        console.log('Active employees:', activeEmployees); // Debug log
        setEmployees(activeEmployees);
      } else {
        console.error('Employees data is not an array:', employeesData);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayDays = async () => {
    try {
      setLoadingPayDays(true);
      const response = await employeesApi.getPayDays();
      console.log('Pay days response:', response); // Debug log
      
      // Ensure we have the correct data structure
      const payDaysData = response.data?.data || response.data || [];
      
      if (Array.isArray(payDaysData)) {
        setPayDays(payDaysData);
        // Set current pay day as default
        const currentPayDay = payDaysData.find((day: PayDay) => day.type === 'current');
        if (currentPayDay) {
          setSelectedPayDay(currentPayDay.date);
        }
      } else {
        console.error('Pay days data is not an array:', payDaysData);
        setPayDays([]);
      }
    } catch (error) {
      console.error('Error fetching pay days:', error);
      setPayDays([]);
    } finally {
      setLoadingPayDays(false);
    }
  };

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const generatePayStubs = async (editable: boolean = false) => {
    if (!selectedPayDay || selectedEmployees.length === 0) {
      alert('Please select a pay day and at least one employee.');
      return;
    }

    try {
      setGenerating(true);
      console.log('Generating pay stubs with:', {
        pay_day: selectedPayDay,
        employee_ids: selectedEmployees,
        editable
      });

      const endpoint = editable ? '/employees/pay-stubs-editable' : '/employees/pay-stubs';
      const response = await employeesApi.generatePayStubs({
        pay_day: selectedPayDay,
        employee_ids: selectedEmployees
      }, endpoint);

      console.log('Pay stubs response:', response);
      console.log('Response data:', response.data);

      // Check for HTML content in different possible locations
      const htmlContent = response.data?.html || response.data?.data?.html || response.data?.data?.data?.html;
      
      if (htmlContent) {
        // Create a new window/tab with the HTML content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        } else {
          alert('Please allow pop-ups for this site to view the pay stubs.');
        }
      } else {
        console.error('No HTML content in response. Full response structure:', response.data);
        console.error('Available keys in response.data:', Object.keys(response.data || {}));
        alert('Error: No pay stub content received from server. Check console for details.');
      }
    } catch (error: any) {
      console.error('Error generating pay stubs:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Error generating pay stubs: ${error.response.data?.message || 'Unknown error'}`);
      } else {
        alert('Error generating pay stubs. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Pay Stubs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate pay stubs for employees with automatic calculations for earnings, deductions, and net pay.
          </p>
        </div>

        <div className="p-6">
          {/* Pay Day Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Pay Day
            </label>
            <select
              value={selectedPayDay}
              onChange={(e) => setSelectedPayDay(e.target.value)}
              disabled={loadingPayDays}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingPayDays ? 'Loading pay days...' : 'Select a pay day...'}
              </option>
              {Array.isArray(payDays) && payDays.map((payDay) => (
                <option key={payDay.date} value={payDay.date}>
                  {payDay.label} {payDay.type === 'current' && '(Current)'}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Employees ({selectedEmployees.length} selected)
              </label>
              {employees.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-md p-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading employees...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active employees found.</p>
                  <p className="text-sm text-gray-400 mt-1">Make sure employees are marked as active in the system.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {employees.map((employee) => (
                    <label
                      key={employee.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeToggle(employee.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.preferred_name || employee.full_legal_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {employee.position}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                console.log('Generate Pay Stubs button clicked');
                generatePayStubs(false);
              }}
              disabled={!selectedPayDay || selectedEmployees.length === 0 || generating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Pay Stubs'
              )}
            </button>

            <button
              onClick={() => {
                console.log('Generate Editable Pay Stubs button clicked');
                generatePayStubs(true);
              }}
              disabled={!selectedPayDay || selectedEmployees.length === 0 || generating}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Editable Pay Stubs'
              )}
            </button>
          </div>

          {/* Test Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                console.log('Test button clicked');
                console.log('Selected pay day:', selectedPayDay);
                console.log('Selected employees:', selectedEmployees);
                console.log('Can generate:', selectedPayDay && selectedEmployees.length > 0);
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Test Button (Check Console)
            </button>
          </div>

          {/* Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">About Pay Stubs</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Regular Pay Stubs:</strong> View-only format optimized for PDF export</li>
              <li>• <strong>Editable Pay Stubs:</strong> Interactive form allowing manual adjustments to all values</li>
              <li>• <strong>Automatic Calculations:</strong> CPP, EI, Federal Tax, and vacation pay are pre-calculated</li>
              <li>• <strong>Canadian Tax Rates:</strong> Uses 2025 rates for accurate calculations</li>
            </ul>
          </div>

          {/* Debug Information */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Total Employees Loaded:</strong> {employees.length}</p>
              <p><strong>Selected Employees:</strong> {selectedEmployees.length}</p>
              <p><strong>Pay Days Loaded:</strong> {payDays.length}</p>
              <p><strong>Selected Pay Day:</strong> {selectedPayDay || 'None'}</p>
              <button
                onClick={() => {
                  console.log('Employees state:', employees);
                  console.log('Pay days state:', payDays);
                }}
                className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                Log State to Console
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayStubsPage; 