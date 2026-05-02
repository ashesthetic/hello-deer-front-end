import api from '../api';
import { SftProcessResult } from './fileImportsApi';

export interface SftFileInfo {
  name: string;
  size: number;
  date: string | null;
}

export const shiftReportApi = {
  listFiles: async (): Promise<{ success: boolean; data: SftFileInfo[] }> => {
    const response = await api.get('/shift-report/list-files');
    return response.data;
  },

  scanFiles: async (date: string): Promise<{ success: boolean; data: SftFileInfo[] }> => {
    const response = await api.get('/shift-report/scan-files', { params: { date } });
    return response.data;
  },

  processFiles: async (files: string[]): Promise<SftProcessResult> => {
    const response = await api.post('/shift-report/process', { files });
    return response.data;
  },

  saveItemSales: async (date: string, files: string[]): Promise<{ success: boolean; message: string; data?: { departments_saved: number; items_saved: number; items_without_product: number; errors: string[] } }> => {
    const response = await api.post('/shift-report/save-item-sales', { date, files });
    return response.data;
  },
};
