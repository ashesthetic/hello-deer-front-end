import api from '../api';

export interface SftUpload {
  id: number;
  upload_date: string;
  file_name: string;
  file_path: string;
  uploaded_by: number;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: SftUpload;
}

export interface SftUploadListResponse {
  data: SftUpload[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StatsResponse {
  total_uploads: number;
  recent_upload_dates: string[];
}

export interface SftFile {
  name: string;
  path: string;
  size: number;
  compressed_size: number;
}

export interface ExtractFilesResponse {
  success: boolean;
  data: {
    upload_id: number;
    file_name: string;
    sft_files: SftFile[];
    total_files: number;
  };
}

export interface ImportedFile {
  id: number;
  original_name: string;
  file_size: number;
}

export interface SkippedFile {
  name: string;
  reason: string;
}

export interface FileError {
  file: string;
  error: string;
}

export interface ImportFilesResponse {
  success: boolean;
  message: string;
  data: {
    imported_files: ImportedFile[];
    skipped_files: SkippedFile[];
    errors: FileError[];
    total_imported: number;
    total_skipped: number;
    total_errors: number;
    folder_path: string;
  };
}

class SftUploadsApi {
  /**
   * Upload a new SFT zip file
   */
  async upload(uploadDate: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('upload_date', uploadDate);
    formData.append('file', file);

    const response = await api.post('/sft-uploads/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get all SFT uploads with optional filters
   */
  async getAll(params?: {
    upload_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<SftUploadListResponse> {
    const response = await api.get('/sft-uploads', { params });
    return response.data;
  }

  /**
   * Get a specific SFT upload by ID
   */
  async getById(id: number): Promise<{ success: boolean; data: SftUpload }> {
    const response = await api.get(`/sft-uploads/${id}`);
    return response.data;
  }

  /**
   * Delete an SFT upload
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/sft-uploads/${id}`);
    return response.data;
  }

  /**
   * Get upload statistics
   */
  async getStats(): Promise<StatsResponse> {
    const response = await api.get('/sft-uploads/stats');
    return response.data;
  }

  /**
   * Extract and list SFT files from the zip
   */
  async extractAndListFiles(id: number): Promise<ExtractFilesResponse> {
    const response = await api.get(`/sft-uploads/${id}/extract-files`);
    return response.data;
  }

  /**
   * Import SFT files from ZIP to file_imports table
   */
  async importFiles(id: number): Promise<ImportFilesResponse> {
    const response = await api.post(`/sft-uploads/${id}/import-files`);
    return response.data;
  }
}

export const sftUploadsApi = new SftUploadsApi();
