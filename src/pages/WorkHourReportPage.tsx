import React, { useState, useEffect } from 'react';
import { employeesApi } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

interface PayDay {
  date: string;
  label: string;
  type: 'previous' | 'current' | 'upcoming';
}

interface Employee {
  id: number;
  full_legal_name: string;
  preferred_name: string | null;
  position: string;
  sin_number: string;
  hourly_rate: number;
}

interface ReportData {
  pay_day: string;
  period_start: string;
  period_end: string;
  employees: Array<{
    name: string;
    position: string;
    sin_number: string;
    total_hours: number;
    hourly_rate: number;
    total_earnings: number;
  }>;
  html: string;
}

const WorkHourReportPage: React.FC = () => {
  usePageTitle('Work Hour Report');
  const [payDays, setPayDays] = useState<PayDay[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPayDay, setSelectedPayDay] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pay days and employees in parallel
      const [payDaysResponse, employeesResponse] = await Promise.all([
        employeesApi.getPayDays(),
        employeesApi.getAll()
      ]);

      setPayDays(payDaysResponse.data.data);
      
      // Sort employees: Managers at the end, others alphabetically by position
      const sortedEmployees = employeesResponse.data.data.sort((a: Employee, b: Employee) => {
        const aIsManager = a.position.toLowerCase().includes('manager');
        const bIsManager = b.position.toLowerCase().includes('manager');
        
        if (aIsManager && !bIsManager) return 1; // Manager goes after non-manager
        if (!aIsManager && bIsManager) return -1; // Non-manager goes before manager
        
        // If both are managers or both are not managers, sort alphabetically by position
        return a.position.localeCompare(b.position);
      });
      
      setEmployees(sortedEmployees);
      
      // Set default selected pay day to current pay day
      const currentPayDay = payDaysResponse.data.data.find((pd: PayDay) => pd.type === 'current');
      if (currentPayDay) {
        setSelectedPayDay(currentPayDay.date);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
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

  const generateReport = async () => {
    if (!selectedPayDay) {
      setError('Please select a pay day');
      return;
    }

    if (selectedEmployees.length === 0) {
      setError('Please select at least one employee');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await employeesApi.generateWorkHourReport({
        pay_day: selectedPayDay,
        employee_ids: selectedEmployees
      });

      // Create and download the report
      const reportData: ReportData = response.data.data;
      
      // Create a new window with the HTML content
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(reportData.html);
        newWindow.document.close();
        
        // Print the report
        newWindow.print();
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
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
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchData}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Hour Report</h1>
            <p className="mt-2 text-sm text-gray-700">
              Generate individual work hour reports for specific pay periods (one employee per page)
            </p>
          </div>
        </div>

        {/* Pay Day Selection */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Pay Day</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {payDays.map((payDay) => (
                <div
                  key={payDay.date}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedPayDay === payDay.date
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedPayDay(payDay.date)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payDay.label}</p>
                      <p className={`text-xs mt-1 ${
                        payDay.type === 'current' ? 'text-blue-600' :
                        payDay.type === 'upcoming' ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {payDay.type === 'current' ? 'Current' :
                         payDay.type === 'upcoming' ? 'Upcoming' :
                         'Previous'}
                      </p>
                    </div>
                    {selectedPayDay === payDay.date && (
                      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Employees</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === employees.length && employees.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SIN Number</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.preferred_name || employee.full_legal_name}
                        </div>
                        {employee.preferred_name && (
                          <div className="text-sm text-gray-500">{employee.full_legal_name}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {employee.sin_number}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(employee.hourly_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Generate Report Button */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedEmployees.length} employee(s) selected - Each employee will be on a separate page
                </p>
              </div>
              <button
                onClick={generateReport}
                disabled={!selectedPayDay || selectedEmployees.length === 0 || generating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !selectedPayDay || selectedEmployees.length === 0 || generating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {generating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkHourReportPage; 