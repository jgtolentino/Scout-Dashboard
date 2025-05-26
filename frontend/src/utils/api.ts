import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { authService } from './auth'

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const API_TIMEOUT = 30000 // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const authHeader = authService.getAuthHeader()
    config.headers = {
      ...config.headers,
      ...authHeader,
    }
    
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data)
    }
    
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token
      const refreshed = await authService.refreshTokenIfNeeded()
      if (refreshed) {
        // Retry original request with new token
        const authHeader = authService.getAuthHeader()
        originalRequest.headers = {
          ...originalRequest.headers,
          ...authHeader,
        }
        return apiClient(originalRequest)
      }
      
      // Redirect to login if refresh failed
      authService.clearToken()
      window.location.href = '/login'
    }
    
    // Handle other errors
    if (error.response) {
      // Server responded with error
      const errorMessage = (error.response.data as any)?.error?.message || 
                          (error.response.data as any)?.message || 
                          'An error occurred'
      
      console.error(`[API Error] ${error.response.status}:`, errorMessage)
      
      // Show user-friendly error messages
      switch (error.response.status) {
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`)
        case 403:
          throw new Error('You do not have permission to perform this action')
        case 404:
          throw new Error('The requested resource was not found')
        case 429:
          throw new Error('Too many requests. Please try again later')
        case 500:
          throw new Error('Server error. Please try again later')
        default:
          throw new Error(errorMessage)
      }
    } else if (error.request) {
      // Request made but no response
      console.error('[API Error] No response:', error.request)
      throw new Error('Network error. Please check your connection')
    } else {
      // Error in request setup
      console.error('[API Error] Request setup:', error.message)
      throw new Error('An unexpected error occurred')
    }
  }
)

// API methods with type safety
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    logout: () =>
      apiClient.post('/auth/logout'),
    refresh: (refreshToken: string) =>
      apiClient.post('/auth/refresh', { refreshToken }),
    me: () =>
      apiClient.get('/auth/me'),
  },
  
  // Brands endpoints
  brands: {
    list: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
      apiClient.get('/brands', { params }),
    get: (id: string) =>
      apiClient.get(`/brands/${id}`),
  },
  
  // Metrics endpoints
  metrics: {
    overview: (params?: { startDate?: string; endDate?: string }) =>
      apiClient.get('/metrics/overview', { params }),
    sales: (params?: { startDate?: string; endDate?: string; groupBy?: string }) =>
      apiClient.get('/metrics/sales', { params }),
    performance: (params?: { startDate?: string; endDate?: string; brandId?: string }) =>
      apiClient.get('/metrics/performance', { params }),
  },
  
  // Stores endpoints
  stores: {
    list: (params?: { page?: number; limit?: number }) =>
      apiClient.get('/stores', { params }),
    get: (id: string) =>
      apiClient.get(`/stores/${id}`),
    metrics: (id: string, params?: { startDate?: string; endDate?: string }) =>
      apiClient.get(`/stores/${id}/metrics`, { params }),
  },
  
  // Products endpoints
  products: {
    list: (params?: { brandId?: string; page?: number; limit?: number }) =>
      apiClient.get('/products', { params }),
    get: (id: string) =>
      apiClient.get(`/products/${id}`),
    recommendations: (id: string) =>
      apiClient.get(`/products/${id}/recommendations`),
  },
  
  // AI insights endpoints
  ai: {
    insights: (params?: { type?: string; startDate?: string; endDate?: string }) =>
      apiClient.get('/ai/insights', { params }),
    predictions: (params?: { metric?: string; horizon?: number }) =>
      apiClient.get('/ai/predictions', { params }),
    recommendations: () =>
      apiClient.get('/ai/recommendations'),
  },
}

export default apiClient