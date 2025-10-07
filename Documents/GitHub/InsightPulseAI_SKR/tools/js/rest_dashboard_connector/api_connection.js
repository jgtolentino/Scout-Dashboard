/**
 * API Connection Configuration
 * Replaces the deprecated superset_connection.js
 */

const apiConfig = {
  // Connection details (from environment variables or defaults)
  host: process.env.API_HOST || 'tbwa-analytics-api.azurewebsites.net',
  protocol: process.env.API_PROTOCOL || 'https',
  enabled: process.env.API_ENABLED !== 'false',
  
  // Authentication (for development - production uses managed identity)
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    tenantId: process.env.AZURE_TENANT_ID,
  },
  
  // Connection options
  options: {
    timeout: 10000, // Request timeout in ms
    retries: 3,     // Number of connection retries
  },
  
  // Data endpoints
  endpoints: {
    kpi: 'data',
    freshness: 'freshness',
    brands: 'brands',
  },
  
  // Helper functions
  getBaseUrl() {
    return `${this.protocol}://${this.host}/api`;
  },
  
  getEndpointUrl(endpoint, params = {}) {
    const url = new URL(`${this.getBaseUrl()}/${this.endpoints[endpoint] || endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  },
  
  // Status check method for health checks
  async checkConnection() {
    if (!this.enabled) {
      return { status: 'disabled', message: 'API connection is disabled' };
    }
    
    try {
      const response = await fetch(`${this.getBaseUrl()}/health`);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      return { 
        status: 'ok', 
        message: 'Connected to API',
        details: data
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Failed to connect to API: ${error.message}`,
        error
      };
    }
  }
};

module.exports = apiConfig;