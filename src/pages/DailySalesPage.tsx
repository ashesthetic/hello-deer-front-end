import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { dailySalesApi } from '../services/api';
import { DailySale } from '../types';
import DailySalesList from '../components/DailySalesList';
import { canCreate } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';
import { useUrlState } from '../hooks/useUrlState';

type SortField = 'date' | 'fuel_sale' | 'store_sale' | 'gst' | 'card' | 'cash' | 'reported_total' | 'approximate_profit';

const PER_PAGE_OPTIONS = [50, 100, 150, 200];

const DailySalesPage: React.FC = () => {
  usePageTitle('Daily Sales');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // URL state management
  const {
    perPage,
    currentPage,
    sortField,
    sortDirection,
    startDate,
    endDate,
    setPerPage,
    setCurrentPage,
    setSortField,
    setSortDirection,
    setStartDate,
    setEndDate,
    clearFilters
  } = useUrlState({
    defaultPerPage: 50,
    defaultSortField: 'date',
    defaultSortDirection: 'desc'
  });

  useEffect(() => {
    fetchSales(currentPage);
    // eslint-disable-next-line
  }, [currentPage, sortField, sortDirection, perPage, startDate, endDate]);

  const fetchSales = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { 
        page, 
        per_page: perPage,
        sort_by: sortField,
        sort_direction: sortDirection
      };

      // Add date filters if provided
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await dailySalesApi.getAll(params);
      setSales(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/sales/new');
  };

  const handleView = (sale: DailySale) => {
    if (sale.id) {
      navigate(`/sales/${sale.id}`);
    }
  };

  const handleEdit = (sale: DailySale) => {
    if (sale.id) {
      navigate(`/sales/${sale.id}/edit`);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await dailySalesApi.delete(id);
      await fetchSales(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sale');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
  };

  const handleDateFilterChange = () => {
    // This is handled automatically by the URL state hook
  };

    // Calculate totals for the current page
  const calculateTotals = () => {
    return sales.reduce((totals, sale) => ({
      fuel_sale: totals.fuel_sale + (parseFloat(sale.fuel_sale?.toString() || '0')),
      store_sale: totals.store_sale + (parseFloat(sale.store_sale?.toString() || '0')),
      gst: totals.gst + (parseFloat(sale.gst?.toString() || '0')),
      card: totals.card + (parseFloat(sale.card?.toString() || '0')),
      cash: totals.cash + (parseFloat(sale.cash?.toString() || '0')),
      reported_total: totals.reported_total + (parseFloat(sale.reported_total?.toString() || '0')),
      approximate_profit: totals.approximate_profit + (parseFloat(sale.approximate_profit?.toString() || '0')),
    }), {
      fuel_sale: 0,
      store_sale: 0,
      gst: 0,
      card: 0,
      cash: 0,
      reported_total: 0,
      approximate_profit: 0,
    });
  };

  const totals = calculateTotals();

  const handleExportPDF = async () => {
    if (!tableRef.current) {
      alert('Table content not found');
      return;
    }

    setExporting(true);
    try {
      // Create a text-based PDF export for the sales table
      const exportSalesTableToPDF = async () => {
        const jsPDF = (await import('jspdf')).default;
        
        // Create PDF with landscape orientation
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const margin = 15;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Column widths (in mm) - distribute evenly across the page
        const colWidths = {
          date: 25,
          fuelSale: 25,
          storeSale: 25,
          gst: 20,
          cardSale: 25,
          cashSale: 25,
          grandTotal: 30
        };
        
        // Starting position
        let yPos = margin + 15;
        let currentPage = 1;
        
        // Add header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Daily Sales Report', margin, yPos);
        yPos += 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const subtitle = startDate && endDate ? `Period: ${startDate} to ${endDate}` : 'All Sales Data';
        pdf.text(subtitle, margin, yPos);
        yPos += 15;
        
        // Add table headers
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        let xPos = margin;
        
        // Date column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.date, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Date', xPos + 2, yPos);
        xPos += colWidths.date;
        
        // Fuel Sale column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.fuelSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Fuel Sale', xPos + 2, yPos);
        xPos += colWidths.fuelSale;
        
        // Store Sale column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.storeSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Store Sale', xPos + 2, yPos);
        xPos += colWidths.storeSale;
        
        // GST column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.gst, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('GST', xPos + 2, yPos);
        xPos += colWidths.gst;
        
        // Card Sale column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.cardSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Card Sale', xPos + 2, yPos);
        xPos += colWidths.cardSale;
        
        // Cash Sale column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.cashSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Cash Sale', xPos + 2, yPos);
        xPos += colWidths.cashSale;
        
        // Grand Total column header
        pdf.setFillColor(200, 200, 200);
        pdf.rect(xPos, yPos - 5, colWidths.grandTotal, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Grand Total', xPos + 2, yPos);
        
        yPos += 10;
        
        // Add data rows
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        sales.forEach((sale, index) => {
          // Check if we need a new page
          if (yPos > pageHeight - margin - 20) {
            pdf.addPage();
            currentPage++;
            yPos = margin + 15;
            
            // Add header to new page
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            
            xPos = margin;
            
            // Date column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.date, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Date', xPos + 2, yPos);
            xPos += colWidths.date;
            
            // Fuel Sale column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.fuelSale, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Fuel Sale', xPos + 2, yPos);
            xPos += colWidths.fuelSale;
            
            // Store Sale column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.storeSale, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Store Sale', xPos + 2, yPos);
            xPos += colWidths.storeSale;
            
            // GST column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.gst, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('GST', xPos + 2, yPos);
            xPos += colWidths.gst;
            
            // Card Sale column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.cardSale, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Card Sale', xPos + 2, yPos);
            xPos += colWidths.cardSale;
            
            // Cash Sale column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.cashSale, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Cash Sale', xPos + 2, yPos);
            xPos += colWidths.cashSale;
            
            // Grand Total column header
            pdf.setFillColor(200, 200, 200);
            pdf.rect(xPos, yPos - 5, colWidths.grandTotal, 8, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Grand Total', xPos + 2, yPos);
            
            yPos += 10;
          }
          
          // Add row data
          xPos = margin;
          
          // Date
          const dateStr = new Date(sale.date).toLocaleDateString('en-CA');
          pdf.text(dateStr, xPos + 2, yPos);
          xPos += colWidths.date;
          
          // Fuel Sale
          const fuelSaleStr = (sale.fuel_sale || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
          pdf.text(fuelSaleStr, xPos + colWidths.fuelSale - pdf.getTextWidth(fuelSaleStr) - 2, yPos);
          xPos += colWidths.fuelSale;
          
          // Store Sale
          const storeSaleStr = (sale.store_sale || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
          pdf.text(storeSaleStr, xPos + colWidths.storeSale - pdf.getTextWidth(storeSaleStr) - 2, yPos);
          xPos += colWidths.storeSale;
          
          // GST
          const gstStr = (sale.gst || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
          pdf.text(gstStr, xPos + colWidths.gst - pdf.getTextWidth(gstStr) - 2, yPos);
          xPos += colWidths.gst;
          
          // Card Sale
          const cardSaleStr = (sale.card || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
          pdf.text(cardSaleStr, xPos + colWidths.cardSale - pdf.getTextWidth(cardSaleStr) - 2, yPos);
          xPos += colWidths.cardSale;
          
          // Cash Sale
          const cashSaleStr = (sale.cash || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
          pdf.text(cashSaleStr, xPos + colWidths.cashSale - pdf.getTextWidth(cashSaleStr) - 2, yPos);
          xPos += colWidths.cashSale;
          
          // Grand Total
          const grandTotalStr = (sale.reported_total || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
          pdf.text(grandTotalStr, xPos + colWidths.grandTotal - pdf.getTextWidth(grandTotalStr) - 2, yPos);
          
          yPos += 6;
        });
        
        // Add totals row
        if (yPos > pageHeight - margin - 20) {
          pdf.addPage();
          yPos = margin + 15;
        }
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        xPos = margin;
        
        // Total label
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.date, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text('TOTAL', xPos + 2, yPos);
        xPos += colWidths.date;
        
        // Total Fuel Sale
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.fuelSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        const totalFuelStr = totals.fuel_sale.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
        pdf.text(totalFuelStr, xPos + colWidths.fuelSale - pdf.getTextWidth(totalFuelStr) - 2, yPos);
        xPos += colWidths.fuelSale;
        
        // Total Store Sale
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.storeSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        const totalStoreStr = totals.store_sale.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
        pdf.text(totalStoreStr, xPos + colWidths.storeSale - pdf.getTextWidth(totalStoreStr) - 2, yPos);
        xPos += colWidths.storeSale;
        
        // Total GST
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.gst, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        const totalGstStr = totals.gst.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
        pdf.text(totalGstStr, xPos + colWidths.gst - pdf.getTextWidth(totalGstStr) - 2, yPos);
        xPos += colWidths.gst;
        
        // Total Card Sale
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.cardSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        const totalCardStr = totals.card.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
        pdf.text(totalCardStr, xPos + colWidths.cardSale - pdf.getTextWidth(totalCardStr) - 2, yPos);
        xPos += colWidths.cardSale;
        
        // Total Cash Sale
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.cashSale, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        const totalCashStr = totals.cash.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
        pdf.text(totalCashStr, xPos + colWidths.cashSale - pdf.getTextWidth(totalCashStr) - 2, yPos);
        xPos += colWidths.cashSale;
        
        // Total Grand Total
        pdf.setFillColor(240, 240, 240);
        pdf.rect(xPos, yPos - 5, colWidths.grandTotal, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        const totalGrandStr = totals.reported_total.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
        pdf.text(totalGrandStr, xPos + colWidths.grandTotal - pdf.getTextWidth(totalGrandStr) - 2, yPos);
        
        // Add footer with page numbers
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        
        for (let i = 1; i <= currentPage; i++) {
          pdf.setPage(i);
          pdf.text(`Page ${i} of ${currentPage}`, pageWidth - margin - 25, pageHeight - 10);
        }
        
        // Save the PDF
        const filename = `sales-${startDate || 'all'}-${endDate || 'all'}.pdf`;
        pdf.save(filename);
      };
      
      await exportSalesTableToPDF();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleExportPDF}
                disabled={exporting || loading || sales.length === 0}
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
              <button
                onClick={() => navigate('/reports/settlement')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Generate Settlement Report
              </button>
              {canCreate(currentUser) && (
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Sale
                </button>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleDateFilterChange();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleDateFilterChange();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-1">
                  Rows per page
                </label>
                <select
                  id="perPage"
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div ref={tableRef}>
            <DailySalesList
              sales={sales}
              currentUser={currentUser}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
              sortField={sortField as SortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              totals={totals}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages} ({totalItems} total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default DailySalesPage; 