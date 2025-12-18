import axios from 'axios';
import { DailySale, DailyFuel, LoginCredentials, CreateUserData, UpdateUserData } from '../types';

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