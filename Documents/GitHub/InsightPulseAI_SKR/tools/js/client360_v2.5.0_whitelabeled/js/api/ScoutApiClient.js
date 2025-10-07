/**
 * Analytics Dashboard API Client
 * Centralized HTTP client for all API interactions
 */

class ScoutApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Request interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Global error handler
    this.errorHandler = null;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Set global error handler
   */
  setErrorHandler(handler) {
    this.errorHandler = handler;
  }

  /**
   * Build query string from params object
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) return '';
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    return queryParams.toString() ? `?${queryParams.toString()}` : '';
  }

  /**
   * Make HTTP request
   */
  async request(method, endpoint, options = {}) {
    let url = `${this.baseUrl}${endpoint}`;
    
    // Add query parameters
    if (options.params) {
      url += this.buildQueryString(options.params);
    }
    
    // Build request config
    let config = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };
    
    // Add body for non-GET requests
    if (options.body && method !== 'GET') {
      config.body = JSON.stringify(options.body);
    }
    
    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }
    
    try {
      // Make request
      const response = await fetch(url, config);
      
      // Parse response
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Build response object
      let result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: data
      };
      
      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        result = await interceptor(result);
      }
      
      // Handle errors
      if (!response.ok) {
        const error = new Error(data?.error || response.statusText);
        error.status = response.status;
        error.response = result;
        
        if (this.errorHandler) {
          this.errorHandler(error);
        }
        
        throw error;
      }
      
      return result.data;
      
    } catch (error) {
      // Network or parsing errors
      if (!error.status) {
        error.status = 0;
        error.message = error.message || 'Network error';
      }
      
      if (this.errorHandler) {
        this.errorHandler(error);
      }
      
      throw error;
    }
  }

  /**
   * Convenience methods
   */
  get(endpoint, params, options = {}) {
    return this.request('GET', endpoint, { ...options, params });
  }

  post(endpoint, body, options = {}) {
    return this.request('POST', endpoint, { ...options, body });
  }

  put(endpoint, body, options = {}) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * API endpoint methods
   */
  
  // Transaction endpoints
  async getTransactionTrends(params = {}) {
    return this.get('/api/transactions/trends', params);
  }

  async getTransactionHeatmap(params = {}) {
    return this.get('/api/transactions/heatmap', params);
  }

  // Product endpoints
  async getProductMix(params = {}) {
    return this.get('/api/products/mix', params);
  }

  async getProductBrands(params = {}) {
    return this.get('/api/products/brands', params);
  }

  // Consumer behavior endpoints
  async getConsumerBehavior(params = {}) {
    return this.get('/api/consumer/behavior', params);
  }

  async getRequestPatterns(params = {}) {
    return this.get('/api/consumer/request-patterns', params);
  }

  async getSentimentTrends(params = {}) {
    return this.get('/api/consumer/sentiment-trend', params);
  }

  // Customer profiling endpoints
  async getCustomerProfiles(params = {}) {
    return this.get('/api/customer/profiles', params);
  }

  async getCustomerSegments(params = {}) {
    return this.get('/api/customer/profiles', { ...params, summary: true });
  }

  // Health check
  async getHealth() {
    return this.get('/api/health');
  }

  // Data source toggle
  async getDataSource() {
    return this.get('/api/config/datasource');
  }

  async setDataSource(source) {
    return this.post('/api/config/datasource', { source });
  }
}

// Create singleton instance
const apiClient = new ScoutApiClient();

// Add request interceptor for loading states
apiClient.addRequestInterceptor(async (config) => {
  // Dispatch loading start event
  window.dispatchEvent(new CustomEvent('api:loading:start', { detail: config }));
  return config;
});

// Add response interceptor for loading states
apiClient.addResponseInterceptor(async (response) => {
  // Dispatch loading end event
  window.dispatchEvent(new CustomEvent('api:loading:end', { detail: response }));
  return response;
});

// Set global error handler
apiClient.setErrorHandler((error) => {
  console.error('API Error:', error);
  
  // Dispatch error event
  window.dispatchEvent(new CustomEvent('api:error', { 
    detail: {
      status: error.status,
      message: error.message,
      response: error.response
    }
  }));
  
  // Show user-friendly error message
  if (window.showNotification) {
    let message = 'An error occurred. Please try again.';
    
    if (error.status === 404) {
      message = 'Requested data not found.';
    } else if (error.status === 500) {
      message = 'Server error. Please contact support.';
    } else if (error.status === 0) {
      message = 'Network error. Please check your connection.';
    }
    
    window.showNotification('error', message);
  }
});

// Export for use
window.ScoutApiClient = ScoutApiClient;
window.apiClient = apiClient;