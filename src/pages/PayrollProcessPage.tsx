import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface PayrollFormData {
  employee_id: string;
  pay_date: string;
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

const PayrollProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees] = useState([]);
  const [formData, setFormData] = useState<PayrollFormData>({
    employee_id: '',
    pay_date: '',
    regular_hours: '0.00',
    regular_rate: '0.00',
    regular_current: '0.00',
    regular_ytd: '0.00',
    stat_hours: '0.00',
    stat_rate: '0.00',
    stat_current: '0.00',
    stat_ytd: '0.00',
    overtime_hours: '0.00',
    overtime_rate: '0.00',
    overtime_current: '0.00',
    overtime_ytd: '0.00',
    total_hours: '0.00',
    total_current: '0.00',
    total_ytd: '0.00',
    cpp_emp_current: '0.00',
    cpp_emp_ytd: '0.00',
    ei_emp_current: '0.00',
    ei_emp_ytd: '0.00',
    fit_current: '0.00',
    fit_ytd: '0.00',
    total_deduction_current: '0.00',
    total_deduction_ytd: '0.00',
    vac_earned_current: '0.00',
    vac_earned_ytd: '0.00',
    vac_paid_current: '0.00',
    vac_paid_ytd: '0.00',
    net_pay: '0.00',
    payment_date: '',
  });

  useEffect(() => {
    // TODO: Fetch report data and extract information from PDF
    // TODO: Fetch employees list
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO: Replace with actual API calls
        // const reportData = await fetchReportById(id);
        // const extractedData = await extractDataFromPDF(reportData.file_path);
        // setFormData(extractedData);
        // const employeesList = await fetchEmployees();
        // setEmployees(employeesList);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Implement actual save API call
      // await savePayrollData(formData);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Payroll data saved successfully!');
      navigate('/employees/payroll');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save payroll data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="mb-6">
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
            <p className="text-gray-600 mt-2">Review and verify the extracted data before saving</p>
          </div>

          {/* Info Alert */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Review Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  The data below has been extracted from the PDF. Please review all fields carefully before saving.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
                  <input
                    type="date"
                    name="pay_date"
                    value={formData.pay_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Regular Pay */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Regular Pay</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    name="regular_hours"
                    value={formData.regular_hours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="regular_rate"
                    value={formData.regular_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                  <input
                    type="number"
                    step="0.01"
                    name="regular_current"
                    value={formData.regular_current}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                  <input
                    type="number"
                    step="0.01"
                    name="regular_ytd"
                    value={formData.regular_ytd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Stat Pay */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stat Pay</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stat_hours"
                    value={formData.stat_hours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stat_rate"
                    value={formData.stat_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stat_current"
                    value={formData.stat_current}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stat_ytd"
                    value={formData.stat_ytd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Overtime Pay */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overtime Pay</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    name="overtime_hours"
                    value={formData.overtime_hours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="overtime_rate"
                    value={formData.overtime_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                  <input
                    type="number"
                    step="0.01"
                    name="overtime_current"
                    value={formData.overtime_current}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                  <input
                    type="number"
                    step="0.01"
                    name="overtime_ytd"
                    value={formData.overtime_ytd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Totals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    name="total_hours"
                    value={formData.total_hours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Current</label>
                  <input
                    type="number"
                    step="0.01"
                    name="total_current"
                    value={formData.total_current}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total YTD</label>
                  <input
                    type="number"
                    step="0.01"
                    name="total_ytd"
                    value={formData.total_ytd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Deductions</h2>
              
              {/* CPP */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">CPP Employee</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cpp_emp_current"
                      value={formData.cpp_emp_current}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cpp_emp_ytd"
                      value={formData.cpp_emp_ytd}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* EI */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">EI Employee</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                    <input
                      type="number"
                      step="0.01"
                      name="ei_emp_current"
                      value={formData.ei_emp_current}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                    <input
                      type="number"
                      step="0.01"
                      name="ei_emp_ytd"
                      value={formData.ei_emp_ytd}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* FIT */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Federal Income Tax</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                    <input
                      type="number"
                      step="0.01"
                      name="fit_current"
                      value={formData.fit_current}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                    <input
                      type="number"
                      step="0.01"
                      name="fit_ytd"
                      value={formData.fit_ytd}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Total Deductions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Deductions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_deduction_current"
                      value={formData.total_deduction_current}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YTD</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_deduction_ytd"
                      value={formData.total_deduction_ytd}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vacation */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vacation</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Earned Current</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vac_earned_current"
                    value={formData.vac_earned_current}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Earned YTD</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vac_earned_ytd"
                    value={formData.vac_earned_ytd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Current</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vac_paid_current"
                    value={formData.vac_paid_current}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid YTD</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vac_paid_ytd"
                    value={formData.vac_paid_ytd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Net Pay</h2>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Pay Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="net_pay"
                  value={formData.net_pay}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save to Payroll
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayrollProcessPage;
