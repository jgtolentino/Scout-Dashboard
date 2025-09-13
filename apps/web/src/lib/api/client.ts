import { ApiVersion } from './versioning';

interface ApiClientConfig {
  baseUrl?: string;
  version?: ApiVersion;
  headers?: Record<string, string>;
}

/**
 * Versioned API client for frontend use
 */
export class ApiClient {
  private baseUrl: string;
  private version: ApiVersion;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || import.meta.env.VITE_API_URL || '';
    this.version = config.version || 'v1';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Make a versioned API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Build versioned URL
    const url = `${this.baseUrl}/api/${this.version}${endpoint}`;
    
    // Merge headers
    const headers = {
      ...this.headers,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check for deprecation warnings
    if (response.headers.get('X-API-Deprecated') === 'true') {
      console.warn(
        `API version ${this.version} is deprecated. Sunset date: ${
          response.headers.get('X-API-Deprecation-Date') || 'TBD'
        }`
      );
    }

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.error?.message || 'API request failed', {
        status: response.status,
        code: error.error?.code,
        details: error.error?.details,
      });
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Set API version
   */
  setVersion(version: ApiVersion): void {
    this.version = version;
  }

  /**
   * Get current API version
   */
  getVersion(): ApiVersion {
    return this.version;
  }

  /**
   * Set custom header
   */
  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  /**
   * Remove custom header
   */
  removeHeader(key: string): void {
    delete this.headers[key];
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;

  constructor(message: string, options: { status?: number; code?: string; details?: any } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

/**
 * Create API client instances for different versions
 */
export const apiV1 = new ApiClient({ version: 'v1' });
export const apiV2 = new ApiClient({ version: 'v2' });
export const apiLegacy = new ApiClient({ version: 'legacy' });

/**
 * React hook for API client
 */
import { useState, useCallback } from 'react';

export function useApiClient(initialVersion: ApiVersion = 'v1') {
  const [client] = useState(() => new ApiClient({ version: initialVersion }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const request = useCallback(
    async <T = any>(
      method: 'get' | 'post' | 'put' | 'delete',
      endpoint: string,
      data?: any
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await client[method]<T>(endpoint, data);
        return result;
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('Unknown error');
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return {
    client,
    loading,
    error,
    get: <T = any>(endpoint: string, params?: any) => request<T>('get', endpoint, params),
    post: <T = any>(endpoint: string, data?: any) => request<T>('post', endpoint, data),
    put: <T = any>(endpoint: string, data?: any) => request<T>('put', endpoint, data),
    delete: <T = any>(endpoint: string) => request<T>('delete', endpoint),
  };
}