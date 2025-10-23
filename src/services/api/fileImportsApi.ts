import api from '../api';

export interface FileImport {
  id: number;
  import_date: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  processed: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  uploaded_files: Array<{
    id: number;
    original_name: string;
    file_size: number;
    uploaded_at: string;
  }>;
  errors: Array<{
    file: string;
    error: string;
  }>;
  folder_path: string;
}

export interface FileImportStats {
  total_files: number;
  processed_files: number;
  pending_files: number;
  recent_import_dates: string[];
}

export interface SaleDataProcessResult {
  success: boolean;
  message: string;
  date: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  files: Array<{
    id: number;
    original_name: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    status: string;
    processed_at: string;
  }>;
  errors: Array<{
    file_id: number;
    file_name: string;
    error: string;
  }>;
  processed_at: string;
}

export interface SftProcessResult {
  success: boolean;
  message: string;
  data?: {
    total_sales: number;
    fuel_sales: number;
    item_sales: number;
    gst: number;
    penny_rounding: number;
    total_pos: number;
    canadian_cash: number;
    safedrops_count: number;
    safedrops_amount: number;
    cash_on_hand: number;
    fuel_tax_gst: number;
    payouts: number;
    loyalty_discounts: number;
    // POS Transaction Details
    pos_visa: number;
    pos_mastercard: number;
    pos_amex: number;
    pos_commercial: number;
    pos_up_credit: number;
    pos_discover: number;
    pos_interac_debit: number;
    pos_debit_transaction_count: number;
    // AFD Transaction Details
    afd_visa: number;
    afd_mastercard: number;
    afd_amex: number;
    afd_commercial: number;
    afd_up_credit: number;
    afd_discover: number;
    afd_interac_debit: number;
    afd_debit_transaction_count: number;
    // Department Totals
    tobacco_25: number;
    tobacco_20: number;
    lottery_total: number;
    prepay_total: number;
    // Loyalty Discounts
    journey_discount: number;
    aeroplan_discount: number;
    // Fuel Volume Data
    diesel_volume: number;
    diesel_total: number;
    regular_volume: number;
    regular_total: number;
    plus_volume: number;
    plus_total: number;
    sup_plus_volume: number;
    sup_plus_total: number;
    files_processed: number;
    files_with_errors: number;
    processed_files: Array<{
      file_name: string;
      total_sales: number;
      fuel_sales: number;
      item_sales: number;
      gst: number;
      penny_rounding: number;
      total_pos: number;
      canadian_cash: number;
      safedrops_count: number;
      safedrops_amount: number;
      cash_on_hand: number;
      fuel_tax_gst: number;
      payouts: number;
      loyalty_discounts: number;
      // POS Transaction Details
      pos_visa: number;
      pos_mastercard: number;
      pos_amex: number;
      pos_commercial: number;
      pos_up_credit: number;
      pos_discover: number;
      pos_interac_debit: number;
      pos_debit_transaction_count: number;
      // AFD Transaction Details
      afd_visa: number;
      afd_mastercard: number;
      afd_amex: number;
      afd_commercial: number;
      afd_up_credit: number;
      afd_discover: number;
      afd_interac_debit: number;
      afd_debit_transaction_count: number;
      // Department Totals
      tobacco_25: number;
      tobacco_20: number;
      lottery_total: number;
      prepay_total: number;
      // Loyalty Discounts
      journey_discount: number;
      aeroplan_discount: number;
      // Fuel Volume Data
      diesel_volume: number;
      diesel_total: number;
      regular_volume: number;
      regular_total: number;
      plus_volume: number;
      plus_total: number;
      sup_plus_volume: number;
      sup_plus_total: number;
    }>;
    errors: Array<{
      file_name: string;
      error: string;
    }>;
  };
}

class FileImportsApi {
  /**
   * Upload multiple files for import
   */
  async uploadFiles(importDate: string, files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('import_date', importDate);
    
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    const response = await api.post('/file-imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get all file imports with optional filters
   */
  async getAll(params?: {
    import_date?: string;
    processed?: number;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: FileImport[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> {
    const response = await api.get('/file-imports', { params });
    return response.data;
  }

  /**
   * Get file import by ID
   */
  async getById(id: number): Promise<FileImport> {
    const response = await api.get(`/file-imports/${id}`);
    return response.data;
  }

  /**
   * Update file import
   */
  async update(id: number, data: Partial<FileImport>): Promise<FileImport> {
    const response = await api.put(`/file-imports/${id}`, data);
    return response.data.file_import;
  }

  /**
   * Delete file import
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/file-imports/${id}`);
  }

  /**
   * Get file import statistics
   */
  async getStats(): Promise<FileImportStats> {
    const response = await api.get('/file-imports/stats');
    return response.data;
  }

  /**
   * Process sale data for a specific date
   */
  async processSaleData(date: string): Promise<SaleDataProcessResult> {
    const response = await api.post('/file-imports/sale-data', { date });
    return response.data;
  }

  /**
   * Process SFT files and return aggregated sales data
   */
  async processSftSalesData(date: string): Promise<SftProcessResult> {
    const response = await api.post('/sft-processor/process-sales-data', { import_date: date });
    return response.data;
  }

  /**
   * Get available import dates with SFT files
   */
  async getAvailableSftDates(): Promise<string[]> {
    const response = await api.get('/sft-processor/available-dates');
    return response.data.data;
  }

  /**
   * Get SFT files for a specific date
   */
  async getSftFilesForDate(date: string): Promise<any[]> {
    const response = await api.get('/sft-processor/files-for-date', { params: { import_date: date } });
    return response.data.data;
  }
}

export const fileImportsApi = new FileImportsApi();
