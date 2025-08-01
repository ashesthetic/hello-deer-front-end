import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dailySalesApi, SettlementReportEntry } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { exportSalesReportToPDF } from '../utils/pdfExport';

const SettlementReportPage: React.FC = () => {
  usePageTitle('Settlement Report');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
  const [toDate, setToDate] = useState(searchParams.get('to') || '');
  const [specificDates, setSpecificDates] = useState<string[]>([]);
  const [newSpecificDate, setNewSpecificDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<SettlementReportEntry[]>([]);
  const [showReport, setShowReport] = useState(false);
  const hasInitialized = useRef(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('From date cannot be after to date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await dailySalesApi.generateSettlementReport(fromDate, toDate, specificDates);
      setReportData(response.data.data);
      setShowReport(true);
      
      // Update URL with date parameters
      setSearchParams({ from: fromDate, to: toDate });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate settlement report');
    } finally {
      setLoading(false);
    }
  };

  const addSpecificDate = () => {
    if (newSpecificDate && !specificDates.includes(newSpecificDate)) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newSpecificDate)) {
        setError('Please enter a valid date in YYYY-MM-DD format');
        return;
      }
      
      setSpecificDates([...specificDates, newSpecificDate]);
      setNewSpecificDate('');
      setError(null);
    }
  };

  const removeSpecificDate = (dateToRemove: string) => {
    setSpecificDates(specificDates.filter(date => date !== dateToRemove));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const calculateTotals = () => {
    return reportData.reduce((totals, entry) => ({
      debit: totals.debit + (parseFloat(entry.debit?.toString() || '0')),
      credit: totals.credit + (parseFloat(entry.credit?.toString() || '0')),
    }), { debit: 0, credit: 0 });
  };

  const totals = calculateTotals();

  const handleExportPDF = async () => {
    if (!reportRef.current) {
      alert('Report content not found');
      return;
    }

    setExporting(true);
    try {
      const dateRange = `${fromDate} to ${toDate}`;
      await exportSalesReportToPDF(reportRef.current, `settlement-report-${dateRange.replace(/\s+/g, '-')}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Auto-generate report if URL parameters are present
  useEffect(() => {
    if (fromDate && toDate && !showReport && !hasInitialized.current) {
      hasInitialized.current = true;
      handleGenerate();
    }
  }, [fromDate, toDate, showReport]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Settlement Report</h1>
          <div className="flex items-center space-x-4">
            {showReport && reportData.length > 0 && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => navigate('/sales')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Back to Sales
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Settlement Report</h2>
          
          {/* Date Range Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Specific Dates Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Additional Specific Dates (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add specific dates to include in the report in addition to the date range above.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {specificDates.map((date, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {date}
                  <button
                    type="button"
                    onClick={() => removeSpecificDate(date)}
                    className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={newSpecificDate}
                onChange={(e) => setNewSpecificDate(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecificDate();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select a date"
              />
              <button
                type="button"
                onClick={addSpecificDate}
                disabled={!newSpecificDate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Date
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Report Section */}
        {showReport && reportData.length > 0 && (
          <div ref={reportRef} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Settlement Report ({reportData.length} entries)
                </h3>
                <div className="text-sm text-gray-600">
                  {fromDate} to {toDate}
                  {specificDates.length > 0 && (
                    <span className="ml-2 text-blue-600">
                      + {specificDates.length} specific date{specificDates.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              {specificDates.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Additional dates: {specificDates.join(', ')}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.remarks}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-sm text-gray-900 border-b" colSpan={2}>
                      Totals
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right border-b">
                      {formatCurrency(totals.debit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right border-b">
                      {formatCurrency(totals.credit)}
                    </td>
                  </tr>
                  {/* Net Amount Row */}
                  <tr className="bg-blue-50 font-bold">
                    <td className="px-6 py-4 text-sm text-gray-900 border-b" colSpan={2}>
                      Net Amount
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right border-b" colSpan={2}>
                      {formatCurrency(totals.credit - totals.debit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showReport && reportData.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
            <div className="text-center">
              <p className="text-gray-500">No data found for the selected date range.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementReportPage; 