import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const salesAPI = {
  getSales: (params?: any) => api.get('/sales', { params }),
  getSummary: () => api.get('/sales/summary'),
  getTrends: (period?: number) => api.get('/sales/trends', { params: { period } }),
};

export const productAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getPerformance: (period?: number) => api.get('/products/performance', { params: { period } }),
  getTopProducts: (limit?: number, metric?: string) => 
    api.get('/products/top', { params: { limit, metric } }),
};

export const storeAPI = {
  getStores: (params?: any) => api.get('/stores', { params }),
  getStoreDetails: (id: string) => api.get(`/stores/${id}`),
  getStorePerformance: (id: string, period?: number) => 
    api.get(`/stores/${id}/performance`, { params: { period } }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getGeographic: (level?: string) => api.get('/analytics/geographic', { params: { level } }),
  getCustomers: () => api.get('/analytics/customers'),
};

export default api;