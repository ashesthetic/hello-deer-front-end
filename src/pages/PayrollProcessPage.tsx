import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

interface PayrollFormData {
  employee_id: string;
  pay_date: string;
  pay_period: string;
  regular_hours: string;
  regular_rate: string;
  regular_current: string;
  regular_ytd: string;
  stat_hours: string;
  stat_rate: string;
  stat_current: string;
  stat_ytd: string;
  overtime_hours: string;
  overtime_rate: string;
  overtime_current: string;
  overtime_ytd: string;
  total_hours: string;
  total_current: string;
  total_ytd: string;
  cpp_emp_current: string;
  cpp_emp_ytd: string;
  ei_emp_current: string;
  ei_emp_ytd: string;
  fit_current: string;
  fit_ytd: string;
  total_deduction_current: string;
  total_deduction_ytd: string;
  vac_earned_current: string;
  vac_earned_ytd: string;
  vac_paid_current: string;
  vac_paid_ytd: string;
  net_pay: string;
  payment_date: string;
}

interface Employee {
  id: number;
  full_legal_name: string;
  preferred_name?: string;
}

const PayrollProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formsData, setFormsData] = useState<PayrollFormData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch employees
        const employeesResponse = await api.get('/employees');
        const employeesList = Array.isArray(employeesResponse.data) 
          ? employeesResponse.data 
          : employeesResponse.data.data || [];
        setEmployees(employeesList);
        
        // Fetch report and trigger processing if not already processed
        const reportResponse = await api.get(`/payroll-reports/${id}`);
        const report = reportResponse.data;
        
        if (report.status === 'pending') {
          setProcessing(true);
          const processResponse = await api.post(`/payroll-reports/${id}/process`);
          const processedReport = processResponse.data.report;
          
          if (processedReport.parsed_data && processedReport.parsed_data.employees) {
            initializeFormsFromParsedData(processedReport.parsed_data.employees, employeesList);
          }
          setProcessing(false);
        } else if (report.parsed_data && report.parsed_data.employees) {
          initializeFormsFromParsedData(report.parsed_data.employees, employeesList);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load report data');
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const initializeFormsFromParsedData = (employeesData: any[], employeesList: Employee[]) => {
    const forms: PayrollFormData[] = employeesData.map((empData) => {
      const parsed = empData.parsed_data || {};
      
      // Format date from MM/DD/YYYY to YYYY-MM-DD for HTML date input
      const formatPayDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      };
      
      // Try to match employee by name
      let matchedEmployeeId = '';
      if (parsed.employee_name) {
        const matched = employeesList.find(emp => 
          emp.full_legal_name.toLowerCase().includes(parsed.employee_name.toLowerCase()) ||
          (emp.preferred_name && emp.preferred_name.toLowerCase().includes(parsed.employee_name.toLowerCase()))
        );
        if (matched) {
          matchedEmployeeId = matched.id.toString();
        }
      }

      return {
        employee_id: matchedEmployeeId,
        pay_date: formatPayDate(parsed.pay_date || ''),
        pay_period: parsed.pay_period || '',
        regular_hours: parsed.regular_hours?.toString() || '0.00',
        regular_rate: parsed.regular_rate?.toString() || '0.00',
        regular_current: parsed.regular_current?.toString() || '0.00',
        regular_ytd: parsed.regular_ytd?.toString() || '0.00',
        stat_hours: parsed.stat_hours?.toString() || '0.00',
        stat_rate: parsed.stat_rate?.toString() || '0.00',
        stat_current: parsed.stat_current?.toString() || '0.00',
        stat_ytd: parsed.stat_ytd?.toString() || '0.00',
        overtime_hours: parsed.overtime_hours?.toString() || '0.00',
        overtime_rate: parsed.overtime_rate?.toString() || '0.00',
        overtime_current: parsed.overtime_current?.toString() || '0.00',
        overtime_ytd: parsed.overtime_ytd?.toString() || '0.00',
        total_hours: parsed.total_hours?.toString() || '0.00',
        total_current: parsed.total_current?.toString() || '0.00',
        total_ytd: parsed.total_ytd?.toString() || '0.00',
        cpp_emp_current: parsed.cpp_emp_current?.toString() || '0.00',
        cpp_emp_ytd: parsed.cpp_emp_ytd?.toString() || '0.00',
        ei_emp_current: parsed.ei_emp_current?.toString() || '0.00',
        ei_emp_ytd: parsed.ei_emp_ytd?.toString() || '0.00',
        fit_current: parsed.fit_current?.toString() || '0.00',
        fit_ytd: parsed.fit_ytd?.toString() || '0.00',
        total_deduction_current: parsed.total_deduction_current?.toString() || '0.00',
        total_deduction_ytd: parsed.total_deduction_ytd?.toString() || '0.00',
        vac_earned_current: parsed.vac_earned_current?.toString() || '0.00',
        vac_earned_ytd: parsed.vac_earned_ytd?.toString() || '0.00',
        vac_paid_current: parsed.vac_paid_current?.toString() || '0.00',
        vac_paid_ytd: parsed.vac_paid_ytd?.toString() || '0.00',
        net_pay: parsed.net_pay?.toString() || '0.00',
        payment_date: parsed.payment_date || '',
      };
    });

    setFormsData(forms);
  };

  const handleInputChange = (index: number, field: keyof PayrollFormData, value: string) => {
    const newFormsData = [...formsData];
    newFormsData[index] = {
      ...newFormsData[index],
      [field]: value,
    };
    setFormsData(newFormsData);
  };

  const handleDeleteSection = (index: number) => {
    if (formsData.length === 1) {
      alert('Cannot delete the last section. At least one employee record is required.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete Employee #${index + 1} section?`)) {
      const newFormsData = formsData.filter((_, i) => i !== index);
      setFormsData(newFormsData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all forms have employee selected and pay date
    const invalidForms = formsData.filter(form => !form.employee_id || !form.pay_date);
    if (invalidForms.length > 0) {
      alert('Please fill in Employee and Pay Date for all forms');
      return;
    }
    
    setSaving(true);

    try {
      await api.post('/payrolls/bulk', { payrolls: formsData });
      
      alert(`Successfully saved ${formsData.length} payroll record(s)!`);
      navigate('/employees/payroll');
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save payroll data';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading || processing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">
            {processing ? 'Processing PDF and extracting data...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (formsData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => navigate('/employees/payroll/reports')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reports
          </button>
          <div className="text-center py-12">
            <p className="text-gray-600">No employee data found in the PDF.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => navigate('/employees/payroll/reports')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Process Payroll Report</h1>
          <p className="text-gray-600 mt-2">
            Review and edit extracted data for {formsData.length} employee{formsData.length !== 1 ? 's' : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {formsData.map((formData, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Employee #{index + 1} - Page {index + 1}
                </h2>
                <button
                  type="button"
                  onClick={() => handleDeleteSection(index)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-md transition-colors flex items-center"
                  title="Delete this section"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => handleInputChange(index, 'employee_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.preferred_name || emp.full_legal_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
                  <input
                    type="text"
                    value={formData.pay_period}
                    onChange={(e) => handleInputChange(index, 'pay_period', e.target.value)}
                    placeholder="e.g., Nov 1-15, 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.pay_date}
                    onChange={(e) => handleInputChange(index, 'pay_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => handleInputChange(index, 'payment_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Earnings Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Earnings</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Hours</th>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Rate</th>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">YTD Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Regular */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">Regular</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.regular_hours} onChange={(e) => handleInputChange(index, 'regular_hours', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.regular_rate} onChange={(e) => handleInputChange(index, 'regular_rate', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.regular_current} onChange={(e) => handleInputChange(index, 'regular_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.regular_ytd} onChange={(e) => handleInputChange(index, 'regular_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* Stat Holiday Paid */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">Stat Holiday Paid</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.stat_hours} onChange={(e) => handleInputChange(index, 'stat_hours', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.stat_rate} onChange={(e) => handleInputChange(index, 'stat_rate', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.stat_current} onChange={(e) => handleInputChange(index, 'stat_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.stat_ytd} onChange={(e) => handleInputChange(index, 'stat_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* Overtime */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">Overtime</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.overtime_hours} onChange={(e) => handleInputChange(index, 'overtime_hours', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.overtime_rate} onChange={(e) => handleInputChange(index, 'overtime_rate', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.overtime_current} onChange={(e) => handleInputChange(index, 'overtime_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.overtime_ytd} onChange={(e) => handleInputChange(index, 'overtime_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* VAC Paid */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">VAC Paid</td>
                        <td className="px-2 py-2 border-b border-r">
                          <span className="text-gray-400 text-sm">-</span>
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <span className="text-gray-400 text-sm">-</span>
                        </td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.vac_paid_current} onChange={(e) => handleInputChange(index, 'vac_paid_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.vac_paid_ytd} onChange={(e) => handleInputChange(index, 'vac_paid_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* Total */}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-2 border-b border-r text-sm font-semibold text-gray-800">Total</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.total_hours} onChange={(e) => handleInputChange(index, 'total_hours', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b border-r"></td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.total_current} onChange={(e) => handleInputChange(index, 'total_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.total_ytd} onChange={(e) => handleInputChange(index, 'total_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Deductions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">YTD Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* CPP Employee */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">CPP - Employee</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.cpp_emp_current} onChange={(e) => handleInputChange(index, 'cpp_emp_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.cpp_emp_ytd} onChange={(e) => handleInputChange(index, 'cpp_emp_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* EI Employee */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">EI - Employee</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.ei_emp_current} onChange={(e) => handleInputChange(index, 'ei_emp_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.ei_emp_ytd} onChange={(e) => handleInputChange(index, 'ei_emp_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* Federal Income Tax */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">Federal Income Tax</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.fit_current} onChange={(e) => handleInputChange(index, 'fit_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.fit_ytd} onChange={(e) => handleInputChange(index, 'fit_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* Total Deductions */}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-2 border-b border-r text-sm font-semibold text-gray-800">Total Deductions</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.total_deduction_current} onChange={(e) => handleInputChange(index, 'total_deduction_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.total_deduction_ytd} onChange={(e) => handleInputChange(index, 'total_deduction_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vacation and Net Pay Table */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Vacation & Net Pay</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-2 border-b border-r text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">YTD Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* VAC Earned */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">VAC Earned</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.vac_earned_current} onChange={(e) => handleInputChange(index, 'vac_earned_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.vac_earned_ytd} onChange={(e) => handleInputChange(index, 'vac_earned_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* VAC Paid */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b border-r text-sm font-medium text-gray-700">VAC Paid</td>
                        <td className="px-2 py-2 border-b border-r">
                          <input type="number" step="0.01" value={formData.vac_paid_current} onChange={(e) => handleInputChange(index, 'vac_paid_current', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-2 py-2 border-b">
                          <input type="number" step="0.01" value={formData.vac_paid_ytd} onChange={(e) => handleInputChange(index, 'vac_paid_ytd', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>

                      {/* Net Pay */}
                      <tr className="bg-blue-50 font-semibold">
                        <td className="px-4 py-2 border-b border-r text-sm font-semibold text-gray-800">Net Pay</td>
                        <td className="px-2 py-2 border-b border-r" colSpan={2}>
                          <input type="number" step="0.01" value={formData.net_pay} onChange={(e) => handleInputChange(index, 'net_pay', e.target.value)} className="w-full px-3 py-2 border border-gray-400 rounded text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/employees/payroll/reports')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving {formsData.length} Record(s)...
                  </>
                ) : (
                  `Save All (${formsData.length} Record${formsData.length !== 1 ? 's' : ''})`
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollProcessPage;
