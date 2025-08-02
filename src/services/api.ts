import axios from 'axios';
import { DailySale, DailyFuel, FuelVolume, LoginCredentials, CreateUserData, UpdateUserData, Vendor, CreateVendorData, UpdateVendorData } from '../types';

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
  generateSettlementReport: (fromDate: string, toDate: string, specificDates?: string[]) => 
    api.post('/daily-sales/settlement-report', { 
      from_date: fromDate, 
      to_date: toDate, 
      specific_dates: specificDates || [] 
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
    
    // Add arrays as individual items
    data.order_before_days.forEach(day => {
      formData.append('order_before_days[]', day);
    });
    data.possible_delivery_days.forEach(day => {
      formData.append('possible_delivery_days[]', day);
    });
    
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
    
    // Add arrays as individual items
    data.order_before_days.forEach(day => {
      formData.append('order_before_days[]', day);
    });
    data.possible_delivery_days.forEach(day => {
      formData.append('possible_delivery_days[]', day);
    });
    
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
  getEarnings: () => api.get('/employees/earnings'),
  getPayDays: () => api.get('/employees/pay-days'),
  generateWorkHourReport: (data: { pay_day: string; employee_ids: number[] }) => 
    api.post('/employees/work-hour-report', data),
  generatePayStubs: (data: { pay_day: string; employee_ids: number[] }, endpoint?: string) => 
    api.post(endpoint || '/employees/pay-stubs', data),
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

// Vendor Invoice interfaces
export interface VendorInvoice {
  id: number;
  vendor_id: number;
  invoice_number?: string;
  invoice_date: string;
  status: 'Paid' | 'Unpaid';
  type: 'Income' | 'Expense';
  payment_date?: string;
  payment_method?: 'Card' | 'Cash' | 'Bank';
  invoice_file_path?: string;
  subtotal: number | string;
  gst: number | string;
  total: number | string;
  notes?: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface VendorInvoiceFormData {
  vendor_id: number;
  invoice_number?: string;
  invoice_date: string;
  status: 'Paid' | 'Unpaid';
  type: 'Income' | 'Expense';
  payment_date?: string;
  payment_method?: 'Card' | 'Cash' | 'Bank';
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
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    
    // Add optional fields
    if (data.payment_date) {
      formData.append('payment_date', data.payment_date);
    }
    if (data.payment_method) {
      formData.append('payment_method', data.payment_method);
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
    formData.append('gst', data.gst);
    formData.append('total', data.total);
    
    // Add optional fields
    if (data.payment_date) {
      formData.append('payment_date', data.payment_date);
    }
    if (data.payment_method) {
      formData.append('payment_method', data.payment_method);
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
  downloadFile: (id: number) => api.get(`/vendor-invoices/${id}/download`, { responseType: 'blob' }),
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

export default api; 