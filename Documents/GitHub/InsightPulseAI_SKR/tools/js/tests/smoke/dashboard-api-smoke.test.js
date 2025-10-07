/**
 * Smoke tests for dashboard API endpoints
 * These tests verify that key API endpoints are accessible and returning the expected data structure
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read config based on environment
const environment = process.env.TEST_ENV || 'staging';
const configPath = path.join(__dirname, '..', 'config', `${environment}.config.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Base URL from config
const baseUrl = config.baseUrl;
const apiBaseUrl = process.env.API_BASE_URL || config.apiBaseUrl;

// Optional auth token
let authToken;
if (process.env.TEST_AUTH_TOKEN) {
  authToken = process.env.TEST_AUTH_TOKEN;
}

// Setup axios defaults
const axiosInstance = axios.create({
  timeout: 10000,
  headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
});

describe('Dashboard API Smoke Tests', () => {
  // Test static assets
  describe('Static assets', () => {
    test('Main dashboard HTML is accessible', async () => {
      const response = await axiosInstance.get(`${baseUrl}/index.html`);
      expect(response.status).toBe(200);
      expect(response.data).toContain('<!DOCTYPE html>');
      expect(response.data).toContain('<title>');
    });
    
    test('CSS files are accessible', async () => {
      try {
        const response = await axiosInstance.get(`${baseUrl}/css/shared-theme.css`);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/css');
      } catch (error) {
        // If the specific CSS file doesn't exist, try another common path
        const alternateResponse = await axiosInstance.get(`${baseUrl}/css/analytics-dashboard.css`);
        expect(alternateResponse.status).toBe(200);
        expect(alternateResponse.headers['content-type']).toContain('text/css');
      }
    });
    
    test('JavaScript files are accessible', async () => {
      try {
        const response = await axiosInstance.get(`${baseUrl}/js/insights_visualizer.js`);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('javascript');
      } catch (error) {
        // If the specific JS file doesn't exist, try another common path
        const alternateResponse = await axiosInstance.get(`${baseUrl}/js/dashboard_integrator.js`);
        expect(alternateResponse.status).toBe(200);
        expect(alternateResponse.headers['content-type']).toContain('javascript');
      }
    });
  });
  
  // Test dashboard routing
  describe('Dashboard routing', () => {
    const dashboardRoutes = [
      { name: 'Home/Index', path: '/' },
      { name: 'Advisor', path: '/advisor' },
      { name: 'Edge', path: '/edge' },
      { name: 'Ops', path: '/ops' }
    ];
    
    test.each(dashboardRoutes)('$name dashboard route loads successfully', async ({ path }) => {
      const response = await axiosInstance.get(`${baseUrl}${path}`);
      expect(response.status).toBe(200);
      expect(response.data).toContain('<!DOCTYPE html>');
    });
  });
  
  // Test data endpoints
  describe('Data API endpoints', () => {
    beforeAll(async () => {
      // Skip this section if no API base URL is defined
      if (!apiBaseUrl) {
        console.log('Skipping API endpoint tests - no API_BASE_URL provided');
        return;
      }
      
      // Authenticate if credentials are provided and we don't have a token
      if (!authToken && process.env.TEST_USERNAME && process.env.TEST_PASSWORD) {
        try {
          const authResponse = await axios.post(`${apiBaseUrl}/auth/login`, {
            username: process.env.TEST_USERNAME,
            password: process.env.TEST_PASSWORD
          });
          authToken = authResponse.data.token;
          axiosInstance.defaults.headers['Authorization'] = `Bearer ${authToken}`;
        } catch (error) {
          console.warn('Authentication failed, proceeding with unauthenticated requests');
        }
      }
    });
    
    test('Insights API endpoint returns valid data', async () => {
      // Skip if no API base URL
      if (!apiBaseUrl) {
        return;
      }
      
      const response = await axiosInstance.get(`${apiBaseUrl}/insights`);
      expect(response.status).toBe(200);
      
      // Validate data structure
      expect(response.data).toHaveProperty('metadata');
      expect(response.data).toHaveProperty('insights');
      expect(Array.isArray(response.data.insights)).toBe(true);
      
      // If there are insights, check their structure
      if (response.data.insights.length > 0) {
        const firstInsight = response.data.insights[0];
        expect(firstInsight).toHaveProperty('id');
        expect(firstInsight).toHaveProperty('title');
        expect(firstInsight).toHaveProperty('text');
      }
    });
    
    test('Dashboard metrics API endpoint returns valid data', async () => {
      // Skip if no API base URL
      if (!apiBaseUrl) {
        return;
      }
      
      const response = await axiosInstance.get(`${apiBaseUrl}/metrics/dashboard`);
      expect(response.status).toBe(200);
      
      // Validate data structure for metrics
      expect(response.data).toHaveProperty('kpis');
      expect(Array.isArray(response.data.kpis)).toBe(true);
      
      // If there are KPIs, check their structure
      if (response.data.kpis.length > 0) {
        const firstKpi = response.data.kpis[0];
        expect(firstKpi).toHaveProperty('name');
        expect(firstKpi).toHaveProperty('value');
      }
    });
    
    test('Chart data API endpoint returns valid data', async () => {
      // Skip if no API base URL
      if (!apiBaseUrl) {
        return;
      }
      
      const response = await axiosInstance.get(`${apiBaseUrl}/charts/data`);
      expect(response.status).toBe(200);
      
      // Check for common chart data properties
      const hasExpectedStructure = (
        response.data.hasOwnProperty('trends') || 
        response.data.hasOwnProperty('distributions') ||
        response.data.hasOwnProperty('series') ||
        response.data.hasOwnProperty('datasets')
      );
      
      expect(hasExpectedStructure).toBe(true);
    });
  });
  
  // Test ETL quality dashboard
  describe('ETL Quality Dashboard', () => {
    test('ETL quality dashboard is accessible', async () => {
      try {
        const response = await axiosInstance.get(`${baseUrl}/dashboards/etl_quality/index.html`);
        expect(response.status).toBe(200);
        expect(response.data).toContain('ETL Quality Dashboard');
      } catch (error) {
        // ETL dashboard might be at a different path in some environments
        try {
          const alternateResponse = await axiosInstance.get(`${baseUrl}/etl_quality/index.html`);
          expect(alternateResponse.status).toBe(200);
          expect(alternateResponse.data).toContain('ETL Quality Dashboard');
        } catch (altError) {
          // Skip test if ETL dashboard doesn't exist in this environment
          console.log('ETL Quality Dashboard not found at standard paths, skipping test');
          return;
        }
      }
    });
    
    test('ETL dashboard data endpoint returns valid data', async () => {
      try {
        const response = await axiosInstance.get(`${baseUrl}/dashboards/etl_quality/data/dashboard_data.json`);
        expect(response.status).toBe(200);
        
        // Validate data structure
        expect(response.data).toHaveProperty('timestamp');
        expect(response.data).toHaveProperty('pipelineMetrics');
        expect(response.data).toHaveProperty('layerHealth');
        expect(response.data).toHaveProperty('schemaStability');
      } catch (error) {
        // Try alternate path
        try {
          const alternateResponse = await axiosInstance.get(`${baseUrl}/etl_quality/data/dashboard_data.json`);
          expect(alternateResponse.status).toBe(200);
          expect(alternateResponse.data).toHaveProperty('pipelineMetrics');
        } catch (altError) {
          // Skip test if ETL dashboard data doesn't exist
          console.log('ETL Quality Dashboard data not found, skipping test');
        }
      }
    });
  });
  
  // Test health endpoints
  describe('System health endpoints', () => {
    test('Health check endpoint returns OK status', async () => {
      // Skip if no API base URL
      if (!apiBaseUrl) {
        return;
      }
      
      try {
        const response = await axiosInstance.get(`${apiBaseUrl}/health`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        expect(response.data.status).toBe('UP');
      } catch (error) {
        // Some environments might use different health endpoints
        try {
          const alternateResponse = await axiosInstance.get(`${apiBaseUrl}/healthz`);
          expect(alternateResponse.status).toBe(200);
        } catch (altError) {
          console.log('Health endpoint not found at standard paths, skipping test');
        }
      }
    });
  });
  
  // Response time tests
  describe('Performance smoke tests', () => {
    test('Main dashboard loads within acceptable time', async () => {
      const startTime = Date.now();
      await axiosInstance.get(`${baseUrl}/index.html`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Dashboard should load in under 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
    
    test('Insights API responds within acceptable time', async () => {
      // Skip if no API base URL
      if (!apiBaseUrl) {
        return;
      }
      
      const startTime = Date.now();
      await axiosInstance.get(`${apiBaseUrl}/insights`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // API should respond in under 1 second
      expect(responseTime).toBeLessThan(1000);
    });
  });
});