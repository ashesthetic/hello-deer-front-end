import api from '../api';
import { SftProcessResult } from './fileImportsApi';

export interface SftFileInfo {
  name: string;
  size: number;
}

export const shiftReportApi = {
  scanFiles: async (date: string): Promise<{ success: boolean; data: SftFileInfo[] }> => {
    const response = await api.get('/shift-report/scan-files', { params: { date } });
    return response.data;
  },

  processFiles: async (date: string): Promise<SftProcessResult> => {
    const response = await api.post('/shift-report/process', { date });
    return response.data;
  },
};
