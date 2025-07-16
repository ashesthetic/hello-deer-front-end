import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
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

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
  logout: () => api.post('/logout'),
  
  getProfile: () => api.get('/user/profile'),
};

export const dailySalesApi = {
  getAll: (page = 1, perPage = 10) => api.get(`/daily-sales?page=${page}&per_page=${perPage}`),
  getById: (id: number) => api.get(`/daily-sales/${id}`),
  create: (data: any) => api.post('/daily-sales', data),
  update: (id: number, data: any) => api.put(`/daily-sales/${id}`, data),
  delete: (id: number) => api.delete(`/daily-sales/${id}`),
};

export default api; 