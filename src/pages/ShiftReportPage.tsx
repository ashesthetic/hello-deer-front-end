import React, { useState, useEffect } from 'react';
import { shiftReportApi, SftFileInfo } from '../services/api/shiftReportApi';
import { SftProcessResult } from '../services/api/fileImportsApi';
import { dailySalesApi, dailyFuelsApi, profitApi, ProfitPercentages } from '../services/api';
import { mapSftDataToForms, validateMappedData } from '../utils/sftMapping';
import { SftToFormMapping } from '../types/sftMapping';

const ShiftReportPage: React.FC = () => {
  const [allFiles, setAllFiles] = useState<SftFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [saveDate, setSaveDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sftProcessResult, setSftProcessResult] = useState<SftProcessResult | null>(null);
  const [mappedData, setMappedData] = useState<SftToFormMapping | null>(null);
  const [savingData, setSavingData] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profitPercentages, setProfitPercentages] = useState<ProfitPercentages | null>(null);

  useEffect(() => {
    profitApi.getPercentages()
      .then(res => setProfitPercentages(res.data))
      .catch(() => setProfitPercentages({
        fuel_percentage: 4,
        tobacco_25_percentage: 8,
        tobacco_20_percentage: 8,
        lottery_percentage: 2,
        prepay_percentage: 1,
        store_sale_percentage: 50,
      }));

    shiftReportApi.listFiles()
      .then(res => setAllFiles(res.data))
      .catch(() => setLoadError('Failed to load SFT files from receive directory.'))
      .finally(() => setLoadingFiles(false));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-CA', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleToggleFile = (fileName: string, fileDate: string | null) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      // Auto-populate saveDate from first selected file with a date
      if (next.size > 0 && !saveDate) {
        const firstWithDate = allFiles.find(f => next.has(f.name) && f.date);
        if (firstWithDate?.date) setSaveDate(firstWithDate.date);
      } else if (next.size === 1 && fileDate) {
        setSaveDate(fileDate);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set());
    } else {
      const allNames = new Set(allFiles.map(f => f.name));
      setSelectedFiles(allNames);
      if (!saveDate) {
        const firstWithDate = allFiles.find(f => f.date);
        if (firstWithDate?.date) setSaveDate(firstWithDate.date);
      }
    }
  };

  const handleProcess = async () => {
    if (selectedFiles.size === 0) return;

    setProcessing(true);
    setSftProcessResult(null);
    setMappedData(null);
    setSaveSuccess(false);

    try {
      const result = await shiftReportApi.processFiles(Array.from(selectedFiles));
      setSftProcessResult(result);

      if (result.success && result.data) {
        const mapped = mapSftDataToForms(result.data, saveDate);
        setMappedData(mapped);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to process SFT files.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setSftProcessResult({ success: false, message: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveMappedData = async () => {
    if (!mappedData || !saveDate) return;

    const validation = validateMappedData(mappedData);
    if (!validation.valid) {
      setSaveError(`Validation errors: ${validation.errors.join(', ')}`);
      return;
    }

    setSavingData(true);
    setSaveSuccess(false);
    setSaveError(null);

    const salesDataWithDate = { ...mappedData.salesData, date: saveDate };
    const fuelDataWithDate = { ...mappedData.fuelData, date: saveDate };

    const isDateConflict = (err: any) =>
      err.response?.status === 422 && err.response?.data?.errors?.date;

    try {
      if (mappedData.salesData) {
        try {
          await dailySalesApi.create(salesDataWithDate as any);
        } catch (err: any) {
          if (isDateConflict(err)) {
            const existing = await dailySalesApi.getAll({ start_date: saveDate, end_date: saveDate });
            const record = existing.data?.data?.[0] ?? existing.data?.[0];
            if (record?.id) {
              await dailySalesApi.update(record.id, salesDataWithDate as any);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }

      if (mappedData.fuelData) {
        try {
          await dailyFuelsApi.create(fuelDataWithDate as any);
        } catch (err: any) {
          if (isDateConflict(err)) {
            const existing = await dailyFuelsApi.getAll({ start_date: saveDate, end_date: saveDate });
            const record = existing.data?.data?.[0] ?? existing.data?.[0];
            if (record?.id) {
              await dailyFuelsApi.update(record.id, fuelDataWithDate as any);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }

      await shiftReportApi.saveItemSales(saveDate, Array.from(selectedFiles));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving mapped data:', error);
      let msg = 'Failed to save data.';
      if (error.response?.data?.message) {
        msg = `Save failed: ${error.response.data.message}`;
      } else if (error.response?.data?.errors) {
        const errs = Object.values(error.response.data.errors).flat() as string[];
        msg = `Save failed: ${errs.join(', ')}`;
      }
      setSaveError(msg);
    } finally {
      setSavingData(false);
    }
  };

  const allSelected = allFiles.length > 0 && selectedFiles.size === allFiles.length;
  const someSelected = selectedFiles.size > 0 && selectedFiles.size < allFiles.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shift Report</h1>
          <p className="text-gray-600">
            Select shift files from the receive directory and process them.
          </p>
        </div>

        {/* SFT File List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {loadingFiles ? 'Loading files…' : `${allFiles.length} SFT file${allFiles.length !== 1 ? 's' : ''} in receive directory`}
            </h2>
            <button
              onClick={handleProcess}
              disabled={selectedFiles.size === 0 || processing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing…
                </>
              ) : (
                `Process${selectedFiles.size > 0 ? ` (${selectedFiles.size})` : ''}`
              )}
            </button>
          </div>

          {loadError && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-red-800 text-sm">{loadError}</p>
            </div>
          )}

          {loadingFiles ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <svg className="animate-spin mx-auto h-6 w-6 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading…
            </div>
          ) : allFiles.length === 0 && !loadError ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              No .sft files found in the receive directory.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allFiles.map((file, index) => (
                    <tr
                      key={index}
                      className={`cursor-pointer hover:bg-gray-50 ${selectedFiles.has(file.name) ? 'bg-blue-50' : ''}`}
                      onClick={() => handleToggleFile(file.name, file.date)}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.name)}
                          onChange={() => handleToggleFile(file.name, file.date)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(file.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.size)}
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
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">POS Payout</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${(sftProcessResult.data.pos_payout || 0).toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Lotto Payout</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${(sftProcessResult.data.lotto_payout || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Cashback Payout</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${(sftProcessResult.data.cashback_payout || 0).toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Uhaul Payout</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${(sftProcessResult.data.uhaul_payout || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">Vendor Payout</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${(sftProcessResult.data.vendor_payout || 0).toFixed(2)}</td>
                            <td></td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Approximate Profit */}
                  {profitPercentages && (() => {
                    const d = sftProcessResult.data!;
                    const cashbackDeduction = d.cashback_payout || 0;
                    const storeSaleCalc = d.item_sales - d.tobacco_25 - d.tobacco_20 - d.lottery_total - d.prepay_total - d.gst - cashbackDeduction;
                    const fuelProfit = (d.fuel_sales * profitPercentages.fuel_percentage) / 100;
                    const tobacco25Profit = (d.tobacco_25 * profitPercentages.tobacco_25_percentage) / 100;
                    const tobacco20Profit = (d.tobacco_20 * profitPercentages.tobacco_20_percentage) / 100;
                    const lotteryProfit = (d.lottery_total * profitPercentages.lottery_percentage) / 100;
                    const prepayProfit = (d.prepay_total * profitPercentages.prepay_percentage) / 100;
                    const storeSaleProfit = (storeSaleCalc * profitPercentages.store_sale_percentage) / 100;
                    const totalProfit = fuelProfit + tobacco25Profit + tobacco20Profit + lotteryProfit + prepayProfit + storeSaleProfit;
                    return (
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-900">Approximate Profit</h4>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Total Profit</div>
                            <div className="text-xl font-bold text-green-600">${totalProfit.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Fuel Profit ({profitPercentages.fuel_percentage}%)</label>
                            <p className="text-sm text-gray-600">Amount: ${d.fuel_sales.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-green-600">Profit: ${fuelProfit.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tobacco 25 Profit ({profitPercentages.tobacco_25_percentage}%)</label>
                            <p className="text-sm text-gray-600">Amount: ${d.tobacco_25.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-green-600">Profit: ${tobacco25Profit.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tobacco 20 Profit ({profitPercentages.tobacco_20_percentage}%)</label>
                            <p className="text-sm text-gray-600">Amount: ${d.tobacco_20.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-green-600">Profit: ${tobacco20Profit.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Lottery Profit ({profitPercentages.lottery_percentage}%)</label>
                            <p className="text-sm text-gray-600">Amount: ${d.lottery_total.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-green-600">Profit: ${lotteryProfit.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Prepay Profit ({profitPercentages.prepay_percentage}%)</label>
                            <p className="text-sm text-gray-600">Amount: ${d.prepay_total.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-green-600">Profit: ${prepayProfit.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Store Sale Profit ({profitPercentages.store_sale_percentage}%)</label>
                            <p className="text-sm text-gray-600">Amount: ${storeSaleCalc.toFixed(2)}</p>
                            <p className="text-lg font-semibold text-green-600">Profit: ${storeSaleProfit.toFixed(2)}</p>
                          </div>
                          {cashbackDeduction > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Cashback Payout (Deduction)</label>
                              <p className="text-sm text-gray-600">Amount: ${cashbackDeduction.toFixed(2)}</p>
                              <p className="text-lg font-semibold text-red-600">- ${cashbackDeduction.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Transaction Details */}
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Transaction Details</h4>

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

                  {/* Transaction Summary */}
                  <div className="bg-teal-50 p-6 rounded-lg border border-teal-200 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Transaction Summary</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <tbody className="divide-y divide-teal-200">
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Total Transactions</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.total_transactions}</td>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Fuel Transactions</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.fuel_transactions}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 text-sm font-medium text-teal-900">Store Transactions</td>
                            <td className="py-2 px-4 text-sm text-teal-900">{sftProcessResult.data.store_transactions}</td>
                            <td></td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
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

              {/* Mapped Data + Save */}
              {mappedData && (
                <div className="mt-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Mapped Data for Forms</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        {saveSuccess && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Data saved successfully!
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Save date:</label>
                          <input
                            type="date"
                            value={saveDate}
                            onChange={e => setSaveDate(e.target.value)}
                            className="border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleSaveMappedData}
                          disabled={savingData || !saveDate}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                        >
                          {savingData ? 'Saving…' : 'Save Data'}
                        </button>
                      </div>
                    </div>
                    {saveError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{saveError}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h5 className="text-md font-medium text-gray-900 mb-3">Daily Sales Data</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{saveDate || mappedData.salesData.date}</span>
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
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payouts:</span>
                            <span className="font-medium">${(mappedData.salesData.payouts || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">POS Payout:</span>
                            <span className="font-medium">${(mappedData.salesData.pos_payout || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lotto Payout:</span>
                            <span className="font-medium">${(mappedData.salesData.lottery_payout || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cashback Payout:</span>
                            <span className="font-medium">${(mappedData.salesData.cashback_payout || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Uhaul Payout:</span>
                            <span className="font-medium">${(mappedData.salesData.uhaul_payout || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendor Payout:</span>
                            <span className="font-medium">${(mappedData.salesData.vendor_payout || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Transactions:</span>
                            <span className="font-medium">{mappedData.salesData.total_transactions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fuel Transactions:</span>
                            <span className="font-medium">{mappedData.salesData.fuel_transactions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Store Transactions:</span>
                            <span className="font-medium">{mappedData.salesData.store_transactions || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h5 className="text-md font-medium text-gray-900 mb-3">Daily Fuel Data</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{saveDate || mappedData.fuelData.date}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
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
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Sales</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Sales</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safedrops</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safedrops $</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash on Hand</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payouts</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journey</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aeroplan</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sftProcessResult.data.processed_files.map((file, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{file.file_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.total_sales.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.item_sales.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.fuel_sales.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.gst.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{file.safedrops_count}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.safedrops_amount.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.cash_on_hand.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.payouts.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.journey_discount.toFixed(2)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${file.aeroplan_discount.toFixed(2)}</td>
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
      </div>
    </div>
  );
};

export default ShiftReportPage;
