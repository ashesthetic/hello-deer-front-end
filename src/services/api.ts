import axios from 'axios';
import { DailySale, DailyFuel, LoginCredentials, CreateUserData, UpdateUserData, Vendor, CreateVendorData, UpdateVendorData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

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

// User Management API (Admin only)
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: CreateUserData) => api.post('/users', data),
  update: (id: number, data: UpdateUserData) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  profile: () => api.get('/user/profile'),
};

export default api; 