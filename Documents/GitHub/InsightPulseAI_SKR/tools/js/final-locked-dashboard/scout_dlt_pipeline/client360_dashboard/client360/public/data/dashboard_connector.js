/**
 * Dashboard Connector
 * 
 * This module provides a simplified interface for dashboard components
 * to interact with data sources. It abstracts the SQL connector and
 * provides methods for common dashboard data needs.
 */

// Import SQL connector-related modules
import { SQL_QUERIES, executeQuery } from './sql_queries.js';

class DashboardConnector {
  constructor() {
    this.initialized = false;
    this.initialize();
  }
  
  async initialize() {
    // Wait for SQL connector to be available
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!window.sqlConnector && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.sqlConnector) {
      console.error('Dashboard Connector: SQL Connector not available after timeout');
      return;
    }
    
    this.initialized = true;
    console.log('Dashboard Connector: Initialized successfully');
  }
  
  async waitForInit() {
    if (this.initialized) return;
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!this.initialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.initialized) {
      console.warn('Dashboard Connector: Initialization timed out');
    }
  }
  
  /**
   * Get all KPIs for the dashboard
   */
  async getKPIs() {
    await this.waitForInit();
    try {
      const result = await window.sqlConnector.getKPIs();
      return result;
    } catch (error) {
      console.error('Dashboard Connector: Error getting KPIs', error);
      return null;
    }
  }
  
  /**
   * Get sales data grouped by region
   */
  async getSalesByRegion() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_SALES_BY_REGION');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting sales by region', error);
      return [];
    }
  }
  
  /**
   * Get sales data grouped by product
   */
  async getSalesByProduct() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_SALES_BY_PRODUCT');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting sales by product', error);
      return [];
    }
  }
  
  /**
   * Get sales data grouped by date
   */
  async getSalesByDate() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_SALES_BY_DATE');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting sales by date', error);
      return [];
    }
  }
  
  /**
   * Get customers grouped by industry
   */
  async getCustomersByIndustry() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_CUSTOMERS_BY_INDUSTRY');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting customers by industry', error);
      return [];
    }
  }
  
  /**
   * Get top customers by purchase amount
   */
  async getTopCustomers() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_TOP_CUSTOMERS');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting top customers', error);
      return [];
    }
  }
  
  /**
   * Get customer distribution by region
   */
  async getCustomersByRegion() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_CUSTOMER_REGIONAL_DISTRIBUTION');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting customers by region', error);
      return [];
    }
  }
  
  /**
   * Get products grouped by category
   */
  async getProductsByCategory() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_PRODUCTS_BY_CATEGORY');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting products by category', error);
      return [];
    }
  }
  
  /**
   * Get active products grouped by category
   */
  async getActiveProducts() {
    await this.waitForInit();
    try {
      const result = await executeQuery('GET_ACTIVE_PRODUCTS');
      return result.rows || [];
    } catch (error) {
      console.error('Dashboard Connector: Error getting active products', error);
      return [];
    }
  }
  
  /**
   * Execute a custom SQL query
   */
  async executeCustomQuery(query) {
    await this.waitForInit();
    try {
      const result = await window.sqlConnector.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Dashboard Connector: Error executing custom query', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
}

// Create a global instance
window.dashboardConnector = new DashboardConnector();

// Export for module usage
export default window.dashboardConnector;