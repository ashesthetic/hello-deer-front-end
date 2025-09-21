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
  total_cash_sale_amount: number;
  total_lotto_payout_amount: number;
  files: Array<{
    id: number;
    original_name: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    status: string;
    cash_amount: number;
    lotto_payout_amount: number;
    processed_at: string;
  }>;
  errors: Array<{
    file_id: number;
    file_name: string;
    error: string;
  }>;
  processed_at: string;
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
}

export const fileImportsApi = new FileImportsApi();
