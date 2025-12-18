import api from '../api';
import { 
  CreateTransactionData, 
  UpdateTransactionData, 
  TransactionFilters,
  CreateBankTransferData,
  BankTransferFilters
} from '../../types';

// Transaction API
export const transactionsApi = {
  getAll: (filters?: TransactionFilters) => {
    const params = new URLSearchParams();
    
    if (filters?.type && filters.type !== 'all') {
      params.append('type', filters.type);
    }
    if (filters?.bank_account_id && filters.bank_account_id !== 'all') {
      params.append('bank_account_id', filters.bank_account_id.toString());
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters?.amount_min) {
      params.append('amount_min', filters.amount_min.toString());
    }
    if (filters?.amount_max) {
      params.append('amount_max', filters.amount_max.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters?.sort_order) {
      params.append('sort_order', filters.sort_order);
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }
    
    return api.get(`/transactions?${params.toString()}`);
  },

  getById: (id: number) => api.get(`/transactions/${id}`),

  create: (data: CreateTransactionData) => api.post('/transactions', data),

  update: (id: number, data: UpdateTransactionData) => api.put(`/transactions/${id}`, data),

  delete: (id: number) => api.delete(`/transactions/${id}`),

  getSummary: (filters?: { date_from?: string; date_to?: string }) => {
    const params = new URLSearchParams();
    
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    
    return api.get(`/transactions/summary?${params.toString()}`);
  },
};

// Bank Transfer API
export const bankTransfersApi = {
  getBankAccounts: () => api.get('/bank-transfers/accounts'),

  transfer: (data: CreateBankTransferData) => api.post('/bank-transfers/transfer', data),

  getHistory: (filters?: BankTransferFilters) => {
    const params = new URLSearchParams();
    
    if (filters?.bank_account_id && filters.bank_account_id !== 'all') {
      params.append('bank_account_id', filters.bank_account_id.toString());
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters?.amount_min) {
      params.append('amount_min', filters.amount_min.toString());
    }
    if (filters?.amount_max) {
      params.append('amount_max', filters.amount_max.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters?.sort_order) {
      params.append('sort_order', filters.sort_order);
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }
    
    return api.get(`/bank-transfers/history?${params.toString()}`);
  },

  getById: (id: number) => api.get(`/bank-transfers/${id}`),

  cancel: (id: number) => api.delete(`/bank-transfers/${id}/cancel`),

  getSummary: (filters?: { date_from?: string; date_to?: string }) => {
    const params = new URLSearchParams();
    
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    
    return api.get(`/bank-transfers/summary?${params.toString()}`);
  },
};
