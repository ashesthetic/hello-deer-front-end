import axios from 'axios';
import { DailySale, DailyFuel, FuelVolume, LoginCredentials, CreateUserData, UpdateUserData, CreateVendorData, UpdateVendorData, CreateOwnerData, UpdateOwnerData, CreateOwnerEquityData, UpdateOwnerEquityData, CreateBankAccountData, UpdateBankAccountData, CreateResolutionData, VendorInvoice } from '../types';

// Re-export types for convenience
export type { VendorInvoice };

// Exchange Rate API
const exchangeRateApiBase = axios.create({
  baseURL: 'https://api.exchangerate-api.com/v4/latest',
});

export interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  };
}

export const exchangeRateApi = {
  getRate: async (from: string, to: string): Promise<number> => {
    try {
      const response = await exchangeRateApiBase.get<ExchangeRateResponse>(`/${from}`);
      return response.data.rates[to] || 0;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return 0;
    }
  },
};

// Employee interfaces
export interface Employee {
  id: number;
  full_legal_name: string;
  preferred_name?: string;
  date_of_birth: string;
  address: string;
  postal_code?: string;
  country: string;
  phone_number: string;
  alternate_number?: string;
  email: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_address_line1?: string;
  emergency_address_line2?: string;
  emergency_city?: string;
  emergency_state?: string;
  emergency_postal_code?: string;
  emergency_country?: string;
  emergency_phone: string;
  emergency_alternate_number?: string;
  status_in_canada: string;
  other_status?: string;
  sin_number: string;
  position: string;
  department: string;
  hire_date: string;
  hourly_rate: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  government_id_file?: string;
  work_permit_file?: string;
  resume_file?: string;
  photo_file?: string;
  void_cheque_file?: string;
  user_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface EmployeeFormData {
  full_legal_name: string;
  preferred_name?: string;
  date_of_birth: string;
  address: string;
  postal_code?: string;
  country: string;
  phone_number: string;
  alternate_number?: string;
  email: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_address_line1?: string;
  emergency_address_line2?: string;
  emergency_city?: string;
  emergency_state?: string;
  emergency_postal_code?: string;
  emergency_country?: string;
  emergency_phone: string;
  emergency_alternate_number?: string;
  status_in_canada: string;
  other_status?: string;
  sin_number: string;
  position: string;
  department: string;
  hire_date: string;
  hourly_rate: string;
  status?: 'active' | 'inactive';
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  government_id_file?: File;
  work_permit_file?: File;
  resume_file?: File;
  photo_file?: File;
  void_cheque_file?: File;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  avg_tenure: string;
}

export interface EmployeeWithHours {
  id: number;
  full_legal_name: string;
  preferred_name?: string;
  position: string;
  department: string;
  hire_date: string;
  status: string;
  hourly_rate: string;
  total_hours: number;
  total_work_days: number;
  avg_hours_per_day: number;
  total_earnings: number;
  total_paid: number;
  total_due: number;
  resolved_hours: number;
  unpaid_hours: number;
}

export interface EmployeeEarning {
  id: number;
  full_legal_name: string;
  preferred_name?: string;
  position: string;
  department: string;
  hourly_rate: string;
  total_hours: number;
  total_earnings: number;
  work_days: number;
  period_start: string;
  period_end: string;
  pay_day: string;
}

export interface PeriodInfo {
  period_start: string;
  period_end: string;
  pay_day: string;
  days_until_pay: number;
}

export interface PeriodData {
  employees: EmployeeEarning[];
  period_info: PeriodInfo;
}

export interface EarningsData {
  current_period: PeriodData;
  next_period: PeriodData;
}

// Work Hours interfaces
export interface WorkHour {
  id: number;
  employee_id: number;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number | string;
  project?: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    full_legal_name: string;
    preferred_name?: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface WorkHourFormData {
  employee_id: number;
  date: string;
  start_time: string;
  end_time: string;
  project?: string | null;
  description?: string | null;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) => api.post('/login', credentials),
  logout: () => api.post('/logout'),
  profile: () => api.get('/user/profile'),
  updateProfile: (data: { name: string; email: string; password?: string }) => api.put('/user/profile', data),
};

// Settlement Report interface
export interface SettlementReportEntry {
  date: string;
  remarks: string;
  debit: number;
  credit: number;
}

export interface SettlementReportResponse {
  data: SettlementReportEntry[];
  from_date: string;
  to_date: string;
  specific_dates: string[];
  total_entries: number;
}

// Daily Sales API
export const dailySalesApi = {
  getAll: (params?: any) => api.get('/daily-sales', { params }),
  getById: (id: number) => api.get(`/daily-sales/${id}`),
  create: (data: Omit<DailySale, 'id'>) => api.post('/daily-sales', data),
  update: (id: number, data: Partial<DailySale>) => api.put(`/daily-sales/${id}`, data),
  delete: (id: number) => api.delete(`/daily-sales/${id}`),
  getByMonth: (year?: number, month?: number) => {
    const url = year && month ? `/daily-sales/month/${year}/${month}` : '/daily-sales/month';
    return api.get(url);
  },
  generateSettlementReport: (fromDate: string, toDate: string, specificDates?: string[], includeDebit?: boolean, includeCredit?: boolean) => 
    api.post('/daily-sales/settlement-report', { 
      from_date: fromDate, 
      to_date: toDate, 
      specific_dates: specificDates || [],
      include_debit: includeDebit,
      include_credit: includeCredit
    }),
};

// Daily Fuels API
export const dailyFuelsApi = {
  getAll: (params?: any) => api.get('/daily-fuels', { params }),
  getById: (id: number) => api.get(`/daily-fuels/${id}`),
  create: (data: Omit<DailyFuel, 'id'>) => api.post('/daily-fuels', data),
  update: (id: number, data: Partial<DailyFuel>) => api.put(`/daily-fuels/${id}`, data),
  delete: (id: number) => api.delete(`/daily-fuels/${id}`),
  getByMonth: (year?: number, month?: number) => {
    const url = year && month ? `/daily-fuels/month/${year}/${month}` : '/daily-fuels/month';
    return api.get(url);
  },
};

// Fuel Volume API
export const fuelVolumeApi = {
  index: (params?: string) => api.get(`/fuel-volumes${params ? `?${params}` : ''}`),
  show: (id: number) => api.get(`/fuel-volumes/${id}`),
  store: (data: Omit<FuelVolume, 'id'>) => api.post('/fuel-volumes', data),
  update: (id: number, data: Partial<FuelVolume>) => api.put(`/fuel-volumes/${id}`, data),
  delete: (id: number) => api.delete(`/fuel-volumes/${id}`),
  getByMonth: (year?: number, month?: number) => {
    const url = year && month ? `/fuel-volumes/month/${year}/${month}` : '/fuel-volumes/month';
    return api.get(url);
  },
  getDailySummary: (date?: string) => {
    const url = date ? `/fuel-volumes/daily-summary/${date}` : '/fuel-volumes/daily-summary';
    return api.get(url);
  },
  // Staff-specific methods
  getAllForStaff: (params?: string) => api.get(`/staff/fuel-volumes${params ? `?${params}` : ''}`),
  getForStaff: (id: number) => api.get(`/staff/fuel-volumes/${id}`),
  createForStaff: (data: Omit<FuelVolume, 'id'>) => api.post('/staff/fuel-volumes', data),
};

// Vendor API
export const vendorsApi = {
  getAll: (params?: any) => api.get('/vendors', { params }),
  getById: (id: number) => api.get(`/vendors/${id}`),
  create: (data: CreateVendorData) => {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('name', data.name);
    formData.append('possible_products', data.possible_products);
    formData.append('payment_method', data.payment_method);
    
    // Add contact person fields
    if (data.contact_person_name) {
      formData.append('contact_person_name', data.contact_person_name);
    }
    if (data.contact_person_email) {
      formData.append('contact_person_email', data.contact_person_email);
    }
    if (data.contact_person_phone) {
      formData.append('contact_person_phone', data.contact_person_phone);
    }
    if (data.contact_person_title) {
      formData.append('contact_person_title', data.contact_person_title);
    }
    
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add payment method specific fields
    if (data.payment_method === 'E-transfer' && data.etransfer_email) {
      formData.append('etransfer_email', data.etransfer_email);
    } else if (data.payment_method === 'Direct Deposit') {
      if (data.bank_name) formData.append('bank_name', data.bank_name);
      if (data.transit_number) formData.append('transit_number', data.transit_number);
      if (data.institute_number) formData.append('institute_number', data.institute_number);
      if (data.account_number) formData.append('account_number', data.account_number);
    }
    
    // Add file if provided
    if (data.void_check) {
      formData.append('void_check', data.void_check);
    }
    
    return api.post('/vendors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id: number, data: UpdateVendorData) => {
    console.log('Sending vendor update data:', data);
    const formData = new FormData();
    
    // Add basic fields
    formData.append('name', data.name);
    formData.append('possible_products', data.possible_products);
    formData.append('payment_method', data.payment_method);
    
    // Add contact person fields
    if (data.contact_person_name) {
      formData.append('contact_person_name', data.contact_person_name);
    }
    if (data.contact_person_email) {
      formData.append('contact_person_email', data.contact_person_email);
    }
    if (data.contact_person_phone) {
      formData.append('contact_person_phone', data.contact_person_phone);
    }
    if (data.contact_person_title) {
      formData.append('contact_person_title', data.contact_person_title);
    }
    
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add payment method specific fields
    if (data.payment_method === 'E-transfer' && data.etransfer_email) {
      formData.append('etransfer_email', data.etransfer_email);
    } else if (data.payment_method === 'Direct Deposit') {
      if (data.bank_name) formData.append('bank_name', data.bank_name);
      if (data.transit_number) formData.append('transit_number', data.transit_number);
      if (data.institute_number) formData.append('institute_number', data.institute_number);
      if (data.account_number) formData.append('account_number', data.account_number);
    }
    
    // Add file if provided
    if (data.void_check) {
      formData.append('void_check', data.void_check);
    }

    // Laravel fix: use POST with _method=PUT
    formData.append('_method', 'PUT');
    
    // Debug: Log FormData contents
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    
    return api.post(`/vendors/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).catch(error => {
      console.error('Vendor update error:', error.response?.data);
      throw error;
    });
  },
  delete: (id: number) => api.delete(`/vendors/${id}`),
};

// Bank Account API
export const bankAccountsApi = {
  getAll: (params?: any) => api.get('/bank-accounts', { params }),
  getById: (id: number) => api.get(`/bank-accounts/${id}`),
  create: (data: CreateBankAccountData) => api.post('/bank-accounts', data),
  update: (id: number, data: UpdateBankAccountData) => api.put(`/bank-accounts/${id}`, data),
  delete: (id: number) => api.delete(`/bank-accounts/${id}`),
  getSummary: () => api.get('/bank-accounts/summary'),
};

// Employee API
export const employeesApi = {
  getAll: (params?: any) => api.get('/employees', { params }),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: EmployeeFormData) => {
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return api.post('/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id: number, data: EmployeeFormData) => {
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Laravel fix: use POST with _method=PUT
    formData.append('_method', 'PUT');

    return api.post(`/employees/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id: number) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats'),
  getWithHours: () => api.get('/employees/with-hours'),
  getEarnings: () => api.get('/employees/earnings'),
  getPayDays: () => api.get('/employees/pay-days'),
  generateWorkHourReport: (data: { pay_day: string; employee_ids: number[] }) => 
    api.post('/employees/work-hour-report', data),
  generatePayStubs: (data: { pay_day: string; employee_ids: number[] }, endpoint?: string) => 
    api.post(endpoint || '/employees/pay-stubs', data),
  resolveHours: (employeeId: number, data: { resolved_hours: number; notes?: string }) =>
    api.post(`/employees/${employeeId}/resolve-hours`, data),
};

// Work Hours API
export const workHoursApi = {
  getAll: () => api.get('/work-hours'),
  getById: (id: number) => api.get(`/work-hours/${id}`),
  create: (data: WorkHourFormData) => api.post('/work-hours', data),
  update: (id: number, data: WorkHourFormData) => api.put(`/work-hours/${id}`, data),
  delete: (id: number) => api.delete(`/work-hours/${id}`),
  getRecent: () => api.get('/work-hours/recent'),
  getSummary: (params?: any) => api.get('/work-hours/summary', { params }),
  getEmployeeHours: (employeeId: number) => api.get(`/employees/${employeeId}/work-hours`),
};

// Provider interfaces
export interface Provider {
  id: number;
  name: string;
  service: string;
  payment_method: 'PAD' | 'Credit Card' | 'E-transfer' | 'Direct Deposit';
  phone?: string;
  email?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ProviderFormData {
  name: string;
  service: string;
  payment_method: 'PAD' | 'Credit Card' | 'E-transfer' | 'Direct Deposit';
  phone?: string;
  email?: string;
}

// Vendor Invoice interfaces - Import VendorInvoice from types
export interface VendorInvoiceFormData {
  vendor_id: number;
  invoice_number?: string;
  invoice_date: string;
  status: 'Paid' | 'Unpaid';
  type: 'Income' | 'Expense';
  reference: 'Vendor' | 'Ash' | 'Nafi';
  payment_date?: string;
  payment_method?: 'Card' | 'Cash' | 'Bank';
  bank_account_id?: number;
  invoice_file?: File;
  gst: string;
  total: string;
  notes?: string;
  description?: string;
}

// Provider API
export const providersApi = {
  getAll: (params?: any) => api.get('/providers', { params }),
  getById: (id: number) => api.get(`/providers/${id}`),
  create: (data: ProviderFormData) => api.post('/providers', data),
  update: (id: number, data: ProviderFormData) => api.put(`/providers/${id}`, data),
  delete: (id: number) => api.delete(`/providers/${id}`),
};

// Provider Bill interfaces
export interface ProviderBill {
  id: number;
  provider_id: number;
  billing_date: string;
  service_date_from: string;
  service_date_to: string;
  due_date: string;
  subtotal: number | string;
  gst: number | string;
  total: number | string;
  notes?: string;
  invoice_file_path?: string;
  status: 'Pending' | 'Paid';
  date_paid?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  provider?: {
    id: number;
    name: string;
    service: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ProviderBillFormData {
  provider_id: number;
  billing_date: string;
  service_date_from: string;
  service_date_to: string;
  due_date: string;
  gst: string;
  total: string;
  notes?: string;
  invoice_file?: File;
  status: 'Pending' | 'Paid';
  date_paid?: string;
}

// Provider Bill API
export const providerBillsApi = {
  getAll: (params?: any) => api.get('/provider-bills', { params }),
  getById: (id: number) => api.get(`/provider-bills/${id}`),
  create: (data: ProviderBillFormData) => {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('provider_id', data.provider_id.toString());
    formData.append('billing_date', data.billing_date);
    formData.append('service_date_from', data.service_date_from);
    formData.append('service_date_to', data.service_date_to);
    formData.append('due_date', data.due_date);
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    formData.append('status', data.status);
    
    // Add optional fields
    if (data.date_paid) {
      formData.append('date_paid', data.date_paid);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add file if provided
    if (data.invoice_file) {
      formData.append('invoice_file', data.invoice_file);
    }
    
    return api.post('/provider-bills', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id: number, data: ProviderBillFormData) => {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('provider_id', data.provider_id.toString());
    formData.append('billing_date', data.billing_date);
    formData.append('service_date_from', data.service_date_from);
    formData.append('service_date_to', data.service_date_to);
    formData.append('due_date', data.due_date);
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    formData.append('status', data.status);
    
    // Add optional fields
    if (data.date_paid) {
      formData.append('date_paid', data.date_paid);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add file if provided
    if (data.invoice_file) {
      formData.append('invoice_file', data.invoice_file);
    }

    // Laravel fix: use POST with _method=PUT
    formData.append('_method', 'PUT');
    
    return api.post(`/provider-bills/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id: number) => api.delete(`/provider-bills/${id}`),
  getProviders: () => api.get('/provider-bills/providers'),
  downloadFile: (id: number) => api.get(`/provider-bills/${id}/download`, { responseType: 'blob' }),
};

// Vendor Invoice API
export const vendorInvoicesApi = {
  getAll: (params?: any) => api.get('/vendor-invoices', { params }),
  getById: (id: number) => api.get(`/vendor-invoices/${id}`),
  create: (data: VendorInvoiceFormData) => {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('vendor_id', data.vendor_id.toString());
    if (data.invoice_number) {
      formData.append('invoice_number', data.invoice_number);
    }
    formData.append('invoice_date', data.invoice_date);
    formData.append('status', data.status);
    formData.append('type', data.type);
    formData.append('reference', data.reference);
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    
    // Add optional fields
    if (data.payment_date) {
      formData.append('payment_date', data.payment_date);
    }
    if (data.payment_method) {
      formData.append('payment_method', data.payment_method);
    }
    if (data.bank_account_id) {
      formData.append('bank_account_id', data.bank_account_id.toString());
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add file if provided
    if (data.invoice_file) {
      formData.append('invoice_file', data.invoice_file);
    }
    
    return api.post('/vendor-invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id: number, data: VendorInvoiceFormData) => {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('vendor_id', data.vendor_id.toString());
    if (data.invoice_number) {
      formData.append('invoice_number', data.invoice_number);
    }
    formData.append('invoice_date', data.invoice_date);
    formData.append('status', data.status);
    formData.append('type', data.type);
    formData.append('reference', data.reference);
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    
    // Add optional fields
    if (data.payment_date) {
      formData.append('payment_date', data.payment_date);
    }
    if (data.payment_method) {
      formData.append('payment_method', data.payment_method);
    }
    if (data.bank_account_id) {
      formData.append('bank_account_id', data.bank_account_id.toString());
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add file if provided
    if (data.invoice_file) {
      formData.append('invoice_file', data.invoice_file);
    }

    // Laravel fix: use POST with _method=PUT
    formData.append('_method', 'PUT');
    
    return api.post(`/vendor-invoices/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id: number) => api.delete(`/vendor-invoices/${id}`),
  getVendors: () => api.get('/vendor-invoices/vendors'),
  getBankAccounts: () => api.get('/vendor-invoices/bank-accounts'),
  downloadFile: (id: number) => api.get(`/vendor-invoices/${id}/download`, { responseType: 'blob' }),
  getFileViewLink: (id: number) => api.get(`/vendor-invoices/${id}/view-link`),
  
  // Staff-specific endpoints
  getAllForStaff: (params?: any) => api.get('/staff/vendor-invoices', { params }),
  getForStaff: (id: number) => api.get(`/staff/vendor-invoices/${id}`),
  getVendorsForStaff: () => api.get('/staff/vendor-invoices/vendors'),
  createForStaff: (data: VendorInvoiceFormData) => {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('vendor_id', data.vendor_id.toString());
    if (data.invoice_number) {
      formData.append('invoice_number', data.invoice_number);
    }
    formData.append('invoice_date', data.invoice_date);
    formData.append('type', data.type);
    formData.append('reference', data.reference);
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add file if provided
    if (data.invoice_file) {
      formData.append('invoice_file', data.invoice_file);
    }
    
    return api.post('/staff/vendor-invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// User Management API (Admin only)
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: CreateUserData) => api.post('/users', data),
  update: (id: number, data: UpdateUserData) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  profile: () => api.get('/user/profile'),
};

// Profit API
export interface ProfitPercentages {
  fuel_percentage: number;
  tobacco_25_percentage: number;
  tobacco_20_percentage: number;
  lottery_percentage: number;
  prepay_percentage: number;
  store_sale_percentage: number;
}

export const profitApi = {
  getPercentages: () => api.get<ProfitPercentages>('/profit/percentages'),
};

// Owner API
export const ownersApi = {
  getAll: (params?: any) => api.get('/owners', { params }),
  getById: (id: number) => api.get(`/owners/${id}`),
  create: (data: CreateOwnerData) => api.post('/owners', data),
  update: (id: number, data: UpdateOwnerData) => api.put(`/owners/${id}`, data),
  delete: (id: number) => api.delete(`/owners/${id}`),
};

// Owner Equity API
export const ownerEquitiesApi = {
  getAll: (params?: any) => api.get('/owner-equities', { params }),
  getById: (id: number) => api.get(`/owner-equities/${id}`),
  create: (data: CreateOwnerEquityData) => api.post('/owner-equities', data),
  update: (id: number, data: UpdateOwnerEquityData) => api.put(`/owner-equities/${id}`, data),
  delete: (id: number) => api.delete(`/owner-equities/${id}`),
  getSummary: () => api.get('/owner-equities/summary'),
  getOwnerSummary: (ownerId: number) => api.get(`/owners/${ownerId}/equity-summary`),
};

// Work Schedule interfaces
export interface WorkScheduleDay {
  id: number;
  day_of_week: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  hours_worked: number;
  is_working_day: boolean;
  notes: string | null;
}

export interface WorkSchedule {
  id: number;
  employee_id: number;
  week_start_date: string;
  week_end_date: string;
  title: string | null;
  notes: string | null;
  status: string;
  employee: {
    id: number;
    full_legal_name: string;
    preferred_name: string | null;
    position: string;
  };
  user: {
    id: number;
    name: string;
  };
  schedule_days: WorkScheduleDay[];
  created_at: string;
  updated_at: string;
}

export interface WorkScheduleFormData {
  employee_id: number;
  week_start_date: string;
  title?: string;
  notes?: string;
  status?: string;
  schedule_days: {
    day_of_week: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }[];
}

// Work Schedule API
export const workScheduleApi = {
  index: () => api.get('/work-schedules'),
  show: (id: number) => api.get(`/work-schedules/${id}`),
  create: (data: WorkScheduleFormData) => api.post('/work-schedules', data),
  update: (id: number, data: WorkScheduleFormData) => api.put(`/work-schedules/${id}`, data),
  destroy: (id: number) => api.delete(`/work-schedules/${id}`),
  currentWeek: () => api.get('/work-schedules/current-week'),
  stats: () => api.get('/work-schedules/stats'),
  employeesWithoutCurrentWeek: () => api.get('/work-schedules/employees-without-current-week'),
  weekOptions: () => api.get('/work-schedules/week-options'),
  employeeSchedules: (employeeId: number) => api.get(`/employees/${employeeId}/work-schedules`),
};

// Safedrop Resolution API
export const safedropResolutionApi = {
  getPendingItems: () => api.get('/safedrop-resolutions'),
  resolve: (data: CreateResolutionData) => api.post('/safedrop-resolutions', data),
  getHistory: (params?: any) => api.get('/safedrop-resolutions/history', { params }),
  delete: (id: number) => api.delete(`/safedrop-resolutions/${id}`),
};

// Loan interfaces
export interface Loan {
  id: number;
  name: string;
  amount: string;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LoanFormData {
  name: string;
  amount: number | string;
  currency?: string;
  notes?: string;
}

// Loan API
export const loanApi = {
  getAll: (params?: any) => api.get('/loans', { params }),
  getById: (id: number) => api.get(`/loans/${id}`),
  create: (data: LoanFormData) => api.post('/loans', data),
  update: (id: number, data: LoanFormData) => api.put(`/loans/${id}`, data),
  delete: (id: number) => api.delete(`/loans/${id}`),
  withTrashed: (params?: any) => api.get('/loans/with-trashed', { params }),
  restore: (id: number) => api.post(`/loans/${id}/restore`),
  forceDelete: (id: number) => api.delete(`/loans/${id}/force-delete`),
  processPayment: (id: number, data: { date: string; amount: number; type: 'deposit' | 'withdrawal'; bank_account_id: number; notes?: string }) => 
    api.post(`/loans/${id}/payment`, data),
  getPaymentHistory: (id: number) => api.get(`/loans/${id}/payment-history`),
};

// Daily ATM API
export const dailyAtmApi = {
  index: (params?: string) => api.get(`/daily-atm${params ? `?${params}` : ''}`),
  show: (id: number) => api.get(`/daily-atm/${id}`),
  create: (data: { date: string; no_of_transactions: number; withdraw: number; notes?: string }) => api.post('/daily-atm', data),
  update: (id: number, data: { date: string; no_of_transactions: number; withdraw: number; notes?: string }) => api.put(`/daily-atm/${id}`, data),
  delete: (id: number) => api.delete(`/daily-atm/${id}`),
  resolve: (id: number, data: { bank_account_id: number; notes?: string }) => api.post(`/daily-atm/${id}/resolve`, data),
};

// Smokes Category Interfaces
export interface SmokesCategory {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SmokesCategoryFormData {
  name: string;
}

// Smokes Category API
export const smokesCategoryApi = {
  getAll: (params?: any) => api.get('/smokes-categories', { params }),
  getById: (id: number) => api.get(`/smokes-categories/${id}`),
  create: (data: SmokesCategoryFormData) => api.post('/smokes-categories', data),
  update: (id: number, data: SmokesCategoryFormData) => api.put(`/smokes-categories/${id}`, data),
  delete: (id: number) => api.delete(`/smokes-categories/${id}`),
  withTrashed: (params?: any) => api.get('/smokes-categories/with-trashed', { params }),
  restore: (id: number) => api.post(`/smokes-categories/${id}/restore`),
  forceDelete: (id: number) => api.delete(`/smokes-categories/${id}/force-delete`),
};

// Smokes Interfaces
export interface Smokes {
  id: number;
  date: string;
  item: string;
  start: number;
  end: number;
  added: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SmokesFormData {
  date: string;
  item: string;
  start: number | string;
  end: number | string;
  added?: number | string;
}

// Smokes API
export const smokesApi = {
  getAll: (params?: any) => api.get('/smokes', { params }),
  getById: (id: number) => api.get(`/smokes/${id}`),
  create: (data: SmokesFormData) => api.post('/smokes', data),
  update: (id: number, data: SmokesFormData) => api.put(`/smokes/${id}`, data),
  delete: (id: number) => api.delete(`/smokes/${id}`),
  withTrashed: (params?: any) => api.get('/smokes/with-trashed', { params }),
  restore: (id: number) => api.post(`/smokes/${id}/restore`),
  forceDelete: (id: number) => api.delete(`/smokes/${id}/force-delete`),
};

// Lottery interfaces
export interface Lottery {
  id: number;
  date: string;
  item: string;
  shift: 'Morning' | 'Evening';
  start: number;
  end: number;
  added: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LotteryFormData {
  date: string;
  item: string;
  shift: 'Morning' | 'Evening';
  start: number | string;
  end: number | string;
  added?: number | string;
}

// Lottery API
export const lotteryApi = {
  getAll: (params?: any) => api.get('/lottery', { params }),
  getById: (id: number) => api.get(`/lottery/${id}`),
  create: (data: LotteryFormData) => api.post('/lottery', data),
  update: (id: number, data: LotteryFormData) => api.put(`/lottery/${id}`, data),
  delete: (id: number) => api.delete(`/lottery/${id}`),
  withTrashed: (params?: any) => api.get('/lottery/with-trashed', { params }),
  restore: (id: number) => api.post(`/lottery/${id}/restore`),
  forceDelete: (id: number) => api.delete(`/lottery/${id}/force-delete`),
};

export default api;