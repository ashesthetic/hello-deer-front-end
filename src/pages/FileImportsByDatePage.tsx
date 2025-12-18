import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fileImportsApi, FileImport, SaleDataProcessResult, SftProcessResult } from '../services/api/fileImportsApi';
import { dailySalesApi, dailyFuelsApi } from '../services/api';
import { mapSftDataToForms, validateMappedData } from '../utils/sftMapping';
import { SftToFormMapping } from '../types/sftMapping';

const FileImportsByDatePage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [fileImports, setFileImports] = useState<FileImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult] = useState<SaleDataProcessResult | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [sftProcessResult, setSftProcessResult] = useState<SftProcessResult | null>(null);
  const [mappedData, setMappedData] = useState<SftToFormMapping | null>(null);
  const [savingData, setSavingData] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (date) {
      fetchFileImportsByDate(date);
    }
  }, [date]);

  const fetchFileImportsByDate = async (importDate: string) => {
    try {
      setLoading(true);
      const response = await fileImportsApi.getAll();
      // Filter files by the specific date
      const filteredFiles = response.data.filter((file: FileImport) => file.import_date === importDate);
      setFileImports(filteredFiles || []);
    } catch (error) {
      console.error('Error fetching file imports for date:', error);
      setFileImports([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (processed: number) => {
    if (processed === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Processed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  const getDateStats = (files: FileImport[]) => {
    const totalFiles = files.length;
    const processedFiles = files.filter(f => f.processed === 1).length;
    const pendingFiles = totalFiles - processedFiles;
    const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);
    
    return { totalFiles, processedFiles, pendingFiles, totalSize };
  };

  const handleProcessSaleData = async () => {
    if (!date) return;

    setProcessing(true);
    setSftProcessResult(null); // Reset previous result
    setMappedData(null); // Reset mapped data
    setSaveSuccess(false); // Reset save success
    
    try {
      // Call the new SFT processing API
      const result = await fileImportsApi.processSftSalesData(date);
      setSftProcessResult(result);
      
      // Create mapped data for forms if processing was successful
      if (result.success && result.data) {
        const mapped = mapSftDataToForms(result.data, date);
        setMappedData(mapped);
      }
      
      // Refresh the file imports to show updated status
      await fetchFileImportsByDate(date);
    } catch (error: any) {
      console.error('Error processing SFT sale data:', error);
      console.error('Date being sent:', date);
      
      let errorMessage = 'Failed to process SFT sale data. Please ensure you have admin permissions and try again.';
      
      // Extract more specific error message if available
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat();
        errorMessage = `Validation error: ${errorMessages.join(', ')}`;
      }
      
      setSftProcessResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveMappedData = async () => {
    if (!mappedData || !date) return;

    const validation = validateMappedData(mappedData);
    if (!validation.valid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }

    setSavingData(true);
    setSaveSuccess(false);

    try {
      // Save to daily_sales table using the proper API
      if (mappedData.salesData) {
        await dailySalesApi.create(mappedData.salesData as any);
      }

      // Save to daily_fuels table using the proper API
      if (mappedData.fuelData) {
        await dailyFuelsApi.create(mappedData.fuelData as any);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Error saving mapped data:', error);
      alert('Failed to save data. Please check the console for details.');
    } finally {
      setSavingData(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading file imports...</p>
        </div>
      </div>
    );
  }

  const dateStats = getDateStats(fileImports || []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/file-imports')}
              className="mr-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to File Imports
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Files Imported on {date ? formatDate(date) : 'Unknown Date'}
          </h1>
          <p className="text-gray-600">
            {date && new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600">{dateStats.totalFiles}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600">{dateStats.processedFiles}</div>
            <div className="text-sm text-gray-600">Processed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-yellow-600">{dateStats.pendingFiles}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-purple-600">{formatFileSize(dateStats.totalSize)}</div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
        </div>

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Attached Files</h2>
            <button
              onClick={handleProcessSaleData}
              disabled={processing || !fileImports || fileImports.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Process Sale Data'
              )}
            </button>
          </div>
          
          {!fileImports || fileImports.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No files were imported on this date.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(fileImports || []).map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {file.original_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {file.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {file.mime_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(file.processed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(file.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {file.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SFT Process Results */}
        {sftProcessResult && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">SFT Sales Data Processing Results</h2>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  sftProcessResult.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {sftProcessResult.success ? '✓ Success' : '✗ Failed'}
                </div>
                <p className="mt-2 text-gray-600">{sftProcessResult.message}</p>
              </div>

              {/* Sales Summary - This is what the user requested */}
              {sftProcessResult.success && sftProcessResult.data && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Aggregated Sales Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">
                        ${sftProcessResult.data.total_sales.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-800 font-medium">Total Sales</div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-600">
                        ${sftProcessResult.data.item_sales.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-800 font-medium">Item Sales</div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600">
                        ${sftProcessResult.data.fuel_sales.toFixed(2)}
                      </div>
                      <div className="text-sm text-purple-800 font-medium">Fuel Sales</div>
                    </div>
                  </div>
                  
                  {/* Additional Financial Data Table */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Additional Financial Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">GST</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.gst.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Penny Rounding</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.penny_rounding.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Total POS Sale</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.total_pos.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Canadian Cash</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.canadian_cash.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Number of Safedrops</td>
                            <td className="py-2 px-4 text-sm text-gray-900">{sftProcessResult.data.safedrops_count}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Safedrops Amount</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.safedrops_amount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Cash on Hand</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.cash_on_hand.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Fuel Tax (GST)</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.fuel_tax_gst.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Payouts</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.payouts.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Loyalty Discounts</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${sftProcessResult.data.loyalty_discounts.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Transaction Details Tables */}
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Transaction Details</h4>
                    
                    {/* POS Transactions */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-purple-900 mb-3">POS Transactions</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <tbody className="divide-y divide-purple-200">
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">VISA</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_visa.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">MASTERCARD</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_mastercard.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">AMEX</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_amex.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">COMMERCIAL</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_commercial.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">UP CREDIT</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_up_credit.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">DISCOVER</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_discover.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">INTERAC DEBIT</td>
                              <td className="py-2 px-4 text-sm text-purple-900">${sftProcessResult.data.pos_interac_debit.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-purple-900">DEBIT TRANSACTIONS</td>
                              <td className="py-2 px-4 text-sm text-purple-900">{sftProcessResult.data.pos_debit_transaction_count}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* AFD Transactions */}
                    <div>
                      <h5 className="text-sm font-medium text-blue-900 mb-3">AFD Transactions</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <tbody className="divide-y divide-blue-200">
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">VISA</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_visa.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">MASTERCARD</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_mastercard.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">AMEX</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_amex.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">COMMERCIAL</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_commercial.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">UP CREDIT</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_up_credit.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">DISCOVER</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_discover.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">INTERAC DEBIT</td>
                              <td className="py-2 px-4 text-sm text-blue-900">${sftProcessResult.data.afd_interac_debit.toFixed(2)}</td>
                              <td className="py-2 px-4 text-sm font-medium text-blue-900">DEBIT TRANSACTIONS</td>
                              <td className="py-2 px-4 text-sm text-blue-900">{sftProcessResult.data.afd_debit_transaction_count}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Department Totals */}
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Department Totals</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <tbody className="divide-y divide-green-200">
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-green-900">Tobacco 25</td>
                            <td className="py-2 px-4 text-sm text-green-900">${sftProcessResult.data.tobacco_25.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-green-900">Tobacco 20</td>
                            <td className="py-2 px-4 text-sm text-green-900">${sftProcessResult.data.tobacco_20.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-green-900">Lottery Total</td>
                            <td className="py-2 px-4 text-sm text-green-900">${sftProcessResult.data.lottery_total.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-green-900">Prepay Total</td>
                            <td className="py-2 px-4 text-sm text-green-900">${sftProcessResult.data.prepay_total.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Loyalty Discounts */}
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Loyalty Discounts</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <tbody className="divide-y divide-orange-200">
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-orange-900">Journey Discount</td>
                            <td className="py-2 px-4 text-sm text-orange-900">${sftProcessResult.data.journey_discount.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-orange-900">Aeroplan Discount</td>
                            <td className="py-2 px-4 text-sm text-orange-900">${sftProcessResult.data.aeroplan_discount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Fuel Volume Data */}
                  <div className="bg-teal-50 p-6 rounded-lg border border-teal-200 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Fuel Volume Data</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <tbody className="divide-y divide-teal-200">
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Diesel Volume</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.diesel_volume.toFixed(2)} L</td>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Diesel Total</td>
                            <td className="py-2 px-4 text-sm text-teal-900">${sftProcessResult.data.diesel_total.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Regular Volume</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.regular_volume.toFixed(2)} L</td>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Regular Total</td>
                            <td className="py-2 px-4 text-sm text-teal-900">${sftProcessResult.data.regular_total.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Plus Volume</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.plus_volume.toFixed(2)} L</td>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Plus Total</td>
                            <td className="py-2 px-4 text-sm text-teal-900">${sftProcessResult.data.plus_total.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Sup Plus Volume</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.sup_plus_volume.toFixed(2)} L</td>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Sup Plus Total</td>
                            <td className="py-2 px-4 text-sm text-teal-900">${sftProcessResult.data.sup_plus_total.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Mapped Data for Sales and Fuels Forms */}
              {mappedData && (
                <div className="mt-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Mapped Data for Forms</h4>
                      <div className="flex items-center space-x-4">
                        {saveSuccess && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Data saved successfully!
                          </span>
                        )}
                        <button
                          onClick={handleSaveMappedData}
                          disabled={savingData}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                        >
                          {savingData ? 'Saving...' : 'Save Data'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sales Data Preview */}
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h5 className="text-md font-medium text-gray-900 mb-3">Daily Sales Data</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{mappedData.salesData.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fuel Sale:</span>
                            <span className="font-medium">${(mappedData.salesData.fuel_sale || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Store Sale:</span>
                            <span className="font-medium">${(mappedData.salesData.store_sale || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">GST:</span>
                            <span className="font-medium">${(mappedData.salesData.gst || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cash:</span>
                            <span className="font-medium">${(mappedData.salesData.cash || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Card:</span>
                            <span className="font-medium">${(mappedData.salesData.card || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loyalty Coupon:</span>
                            <span className="font-medium">${(mappedData.salesData.coupon || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reported Total:</span>
                            <span className="font-medium">${(mappedData.salesData.reported_total || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Safedrops:</span>
                            <span className="font-medium">{mappedData.salesData.number_of_safedrops || 0} (${(mappedData.salesData.safedrops_amount || 0).toFixed(2)})</span>
                          </div>
                        </div>
                      </div>

                      {/* Fuel Data Preview */}
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h5 className="text-md font-medium text-gray-900 mb-3">Daily Fuel Data</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{mappedData.fuelData.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Regular:</span>
                            <span className="font-medium">{(mappedData.fuelData.regular_quantity || 0).toFixed(2)}L - ${(mappedData.fuelData.regular_total_sale || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Plus:</span>
                            <span className="font-medium">{(mappedData.fuelData.plus_quantity || 0).toFixed(2)}L - ${(mappedData.fuelData.plus_total_sale || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sup Plus:</span>
                            <span className="font-medium">{(mappedData.fuelData.sup_plus_quantity || 0).toFixed(2)}L - ${(mappedData.fuelData.sup_plus_total_sale || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Diesel:</span>
                            <span className="font-medium">{(mappedData.fuelData.diesel_quantity || 0).toFixed(2)}L - ${(mappedData.fuelData.diesel_total_sale || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-100 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This data has been automatically mapped from the processed SFT files. 
                        Review the values above and click "Save Data" to store them in the daily_sales and daily_fuels tables.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Summary */}
              {sftProcessResult.success && sftProcessResult.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{sftProcessResult.data.files_processed}</div>
                    <div className="text-sm text-gray-800">SFT Files Processed</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{sftProcessResult.data.files_with_errors}</div>
                    <div className="text-sm text-red-800">Files with Errors</div>
                  </div>
                </div>
              )}

              {/* Processed Files Details */}
              {sftProcessResult.success && sftProcessResult.data && sftProcessResult.data.processed_files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Processed SFT Files</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            File Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Sales
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Sales
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fuel Sales
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GST
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Safedrops
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Safedrops $
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cash on Hand
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payouts
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Journey
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aeroplan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sftProcessResult.data.processed_files.map((file, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {file.file_name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.total_sales.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.item_sales.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.fuel_sales.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.gst.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {file.safedrops_count}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.safedrops_amount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.cash_on_hand.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.payouts.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.journey_discount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              ${file.aeroplan_discount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Processing Errors */}
              {sftProcessResult.success && sftProcessResult.data && sftProcessResult.data.errors.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Processing Errors</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    {sftProcessResult.data.errors.map((error, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <p className="text-sm font-medium text-red-800">{error.file_name}</p>
                        <p className="text-sm text-red-600">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legacy Process Results (keeping for backwards compatibility) */}
        {processResult && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Sale Data Processing Results</h2>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  processResult.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {processResult.success ? '✓ Success' : '✗ Failed'}
                </div>
                <p className="mt-2 text-gray-600">{processResult.message}</p>
                <p className="text-sm text-gray-500">
                  Processed at: {formatDateTime(processResult.processed_at)}
                </p>
              </div>

              {/* Processing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processResult.total_files}</div>
                  <div className="text-sm text-blue-800">Total Files</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{processResult.processed_files}</div>
                  <div className="text-sm text-green-800">Successfully Processed</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{processResult.failed_files}</div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>

              {/* Processed Files List */}
              {processResult.files && processResult.files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Processed Files</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            File Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(processResult.files || []).map((file) => (
                          <tr key={file.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{file.original_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatFileSize(file.file_size)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{file.mime_type}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {file.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors List */}
              {processResult.errors && processResult.errors.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Processing Errors</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    {(processResult.errors || []).map((error, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <p className="text-sm font-medium text-red-800">{error.file_name}</p>
                        <p className="text-sm text-red-600">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileImportsByDatePage;
