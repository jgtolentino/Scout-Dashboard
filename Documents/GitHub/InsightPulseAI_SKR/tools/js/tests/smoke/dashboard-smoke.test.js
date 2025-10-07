const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read config based on environment
const environment = process.env.TEST_ENV || 'staging';
const configPath = path.join(__dirname, '..', 'config', `${environment}.config.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

describe('Dashboard Smoke Tests', () => {
  // Base URL from config
  const baseUrl = config.baseUrl;
  const apiBaseUrl = process.env.API_BASE_URL || config.apiBaseUrl;
  
  // Test credentials
  const username = process.env.TEST_USERNAME || config.testCredentials.username;
  const password = process.env.TEST_PASSWORD || config.testCredentials.password;
  
  // Store auth token
  let authToken;
  
  // Authentication
  beforeAll(async () => {
    try {
      // Get auth token (if API authentication is required)
      if (apiBaseUrl) {
        const response = await axios.post(`${apiBaseUrl}/auth/login`, {
          username,
          password
        });
        authToken = response.data.token;
      }
    } catch (error) {
      console.error('Auth setup failed:', error.message);
      throw error;
    }
  });
  
  // Test homepage availability
  test('Dashboard homepage is accessible', async () => {
    const response = await axios.get(`${baseUrl}/index.html`);
    expect(response.status).toBe(200);
    expect(response.data).toContain('<!DOCTYPE html>');
  });
  
  // Test all main dashboard pages
  const dashboardRoutes = [
    { name: 'Index', path: '/' },
    { name: 'Advisor', path: '/advisor' },
    { name: 'Edge', path: '/edge' },
    { name: 'Ops', path: '/ops' }
  ];
  
  test.each(dashboardRoutes)('$name dashboard page loads successfully', async ({ path }) => {
    const response = await axios.get(`${baseUrl}${path}`);
    expect(response.status).toBe(200);
    expect(response.data).toContain('<!DOCTYPE html>');
  });
  
  // Test static assets
  test('CSS assets are accessible', async () => {
    const response = await axios.get(`${baseUrl}/css/shared-theme.css`);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/css');
  });
  
  test('JS assets are accessible', async () => {
    const response = await axios.get(`${baseUrl}/js/insights_visualizer.js`);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('javascript');
  });
  
  // Test API endpoints
  test('Dashboard API endpoints are accessible', async () => {
    // Only run if API base URL is available
    if (!apiBaseUrl) {
      console.log('Skipping API tests - no API_BASE_URL provided');
      return;
    }
    
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    // Test basic data endpoint
    const response = await axios.get(`${apiBaseUrl}/dashboard/metadata`, { headers });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('version');
    expect(response.data).toHaveProperty('lastUpdated');
  });
  
  // Test ETL quality dashboard
  test('ETL quality dashboard is accessible', async () => {
    const response = await axios.get(`${baseUrl}/dashboards/etl_quality/index.html`);
    expect(response.status).toBe(200);
    expect(response.data).toContain('ETL Quality Dashboard');
  });
  
  // Test ETL dashboard data endpoints
  test('ETL dashboard data is available and valid', async () => {
    const response = await axios.get(`${baseUrl}/dashboards/etl_quality/data/dashboard_data.json`);
    expect(response.status).toBe(200);
    
    // Validate schema
    const data = response.data;
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('pipelineMetrics');
    expect(data.pipelineMetrics).toHaveProperty('status');
    expect(data).toHaveProperty('layerHealth');
    expect(data).toHaveProperty('schemaStability');
    expect(data).toHaveProperty('rowCountTrends');
    expect(data).toHaveProperty('recentIssues');
    expect(data).toHaveProperty('qualityScores');
    
    // Validate data types
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.pipelineMetrics.status).toBe('string');
    expect(Array.isArray(data.layerHealth.labels)).toBe(true);
    expect(Array.isArray(data.schemaStability.changes)).toBe(true);
    expect(Array.isArray(data.rowCountTrends.datasets)).toBe(true);
    expect(Array.isArray(data.recentIssues)).toBe(true);
    expect(Array.isArray(data.qualityScores)).toBe(true);
  });
});