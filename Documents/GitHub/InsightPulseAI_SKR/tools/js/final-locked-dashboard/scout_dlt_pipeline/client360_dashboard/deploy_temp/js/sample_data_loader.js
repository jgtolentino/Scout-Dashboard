/**
 * Sample Data Loader for Client360 Dashboard
 * 
 * This module provides a client-side implementation of SQL query functionality
 * using sample data stored in JSON files. It simulates the behavior of a real
 * SQL database by parsing query-like strings and returning appropriate results.
 */

// Cache for loaded sample data
const dataCache = {
  kpis: null,
  brandPerformance: null,
  retailPerformance: null,
  insights: null
};

/**
 * Loads sample data from a JSON file
 * @param {string} dataType - The type of data to load
 * @returns {Promise<Object>} - The loaded data
 */
async function loadSampleData(dataType) {
  // Check cache first
  if (dataCache[dataType]) {
    return dataCache[dataType];
  }
  
  try {
    // First try loading the FMCG-focused sample data
    let response = await fetch('/data/sample_data/fmcg_sample_data.json');
    
    // If that fails, try to load from specific data type file
    if (!response.ok) {
      response = await fetch(`/data/sample_data/${dataType}.json`);
    }
    
    // If that fails too, try the minimal sample data
    if (!response.ok) {
      response = await fetch('/data/sample_data/minimal_sample.json');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load sample data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract the specific data type if it exists in the FMCG data
    // This supports both dedicated data type files and the comprehensive FMCG file
    if (data.data && data.data[dataType]) {
      const specificData = {
        metadata: data.metadata,
        data: { [dataType]: data.data[dataType] }
      };
      
      // Store in cache
      dataCache[dataType] = specificData;
      return specificData;
    }
    
    // Store in cache
    dataCache[dataType] = data;
    return data;
  } catch (error) {
    console.warn(`Error loading sample data: ${error.message}`);
    
    // Return fallback data
    const fallbackData = createFallbackData(dataType);
    dataCache[dataType] = fallbackData;
    return fallbackData;
  }
}

/**
 * Creates fallback data when sample data cannot be loaded
 * @param {string} dataType - The type of data to create
 * @returns {Object} - Fallback data
 */
function createFallbackData(dataType) {
  const timestamp = new Date().toISOString();
  
  switch (dataType) {
    case 'kpis':
      return {
        metadata: {
          simulated: true,
          version: '1.0.0',
          created: timestamp,
          source: 'fallback_generator'
        },
        data: {
          kpis: {
            total_sales: 5824350,
            sales_change: 12.3,
            conversion_rate: 4.8,
            conversion_change: 0.7,
            marketing_roi: 3.2,
            roi_change: 0.2,
            brand_sentiment: 78.5,
            sentiment_change: 2.1
          }
        }
      };
    
    case 'brandPerformance':
      return {
        metadata: {
          simulated: true,
          version: '1.0.0',
          created: timestamp,
          source: 'fallback_generator'
        },
        data: {
          brands: [
            { brand_name: 'Brand A', performance_score: 87.5 },
            { brand_name: 'Brand B', performance_score: 82.3 },
            { brand_name: 'Brand C', performance_score: 76.8 },
            { brand_name: 'Brand D', performance_score: 75.1 },
            { brand_name: 'Brand E', performance_score: 72.4 }
          ]
        }
      };
    
    case 'retailPerformance':
      return {
        metadata: {
          simulated: true,
          version: '1.0.0',
          created: timestamp,
          source: 'fallback_generator'
        },
        data: {
          regions: [
            { region_name: 'Total', sales_value: 12345678, trend: [1020345, 1120500, 1240300, 1320600, 1500700, 1650400] },
            { region_name: 'NCR', sales_value: 3456789, sales_change: 4.5 },
            { region_name: 'Luzon', sales_value: 2567890, sales_change: 3.2 },
            { region_name: 'Visayas', sales_value: 2123456, sales_change: 5.1 },
            { region_name: 'Mindanao', sales_value: 1987654, sales_change: -0.8 }
          ]
        }
      };
    
    case 'insights':
      return {
        metadata: {
          simulated: true,
          version: '1.0.0',
          created: timestamp,
          source: 'fallback_generator'
        },
        data: {
          recommendations: [
            { insight_type: 'recommendation', insight_text: 'Increase inventory of high-demand items in NCR region to capture additional sales' },
            { insight_type: 'recommendation', insight_text: 'Consider promotions for Brand C products to boost market share against competitors' },
            { insight_type: 'recommendation', insight_text: 'Optimize store layouts based on recent traffic patterns and customer behavior' }
          ],
          brandDictionary: {
            insight_type: 'brand_dictionary',
            top_brands: ['Brand A', 'Brand B', 'Brand C'],
            brand_associations: [
              { brand: 'Brand A', association: 'quality' },
              { brand: 'Brand B', association: 'value' }
            ]
          },
          emotionalAnalysis: {
            insight_type: 'emotional_analysis',
            peak_time: '5:30 PM',
            contextual_insights: [
              'Customers respond positively to product demonstrations',
              'Evening shoppers show higher engagement with promotional materials'
            ]
          },
          bundling: {
            insight_type: 'bundling',
            products: ['Product X', 'Product Y'],
            correlation: 85.3,
            potential_increase: 12.5
          }
        }
      };
    
    default:
      return {
        metadata: {
          simulated: true,
          version: '1.0.0',
          created: timestamp,
          source: 'fallback_generator'
        },
        data: {}
      };
  }
}

/**
 * Executes a SQL-like query against sample data
 * @param {string} query - The SQL-like query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query results in a format similar to SQL results
 */
async function executeQuery(query, params = []) {
  console.log('Executing query with sample data:', query, params);
  
  try {
    // Get the comprehensive FMCG data for all queries
    const fmcgData = await fetch('/data/sample_data/fmcg_sample_data.json')
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);
    
    // FMCG-specific query handling when available
    if (fmcgData) {
      // KPI metrics
      if (query.includes('gold_store_interaction_metrics') && query.includes('total_sales')) {
        return {
          rows: [{
            total_sales: fmcgData.data.kpis.total_sales,
            sales_change: fmcgData.data.kpis.sales_change,
            conversion_rate: fmcgData.data.kpis.conversion_rate,
            conversion_change: fmcgData.data.kpis.conversion_change,
            marketing_roi: fmcgData.data.kpis.marketing_roi,
            roi_change: fmcgData.data.kpis.roi_change,
            brand_sentiment: fmcgData.data.kpis.brand_sentiment,
            sentiment_change: fmcgData.data.kpis.sentiment_change
          }]
        };
      }
      
      // Brand performance
      if (query.includes('brand_name') && query.includes('performance_score')) {
        return {
          rows: fmcgData.data.brands || []
        };
      }
      
      // Products query
      if (query.includes('product_id') || query.includes('product_name')) {
        // Apply any filters from the query parameters
        let filteredProducts = fmcgData.data.products || [];
        
        // Apply brand filter if specified in params
        if (params.length > 0 && params[3] && params[3] !== 'all') {
          const brandFilter = params[3];
          filteredProducts = filteredProducts.filter(p => 
            p.brand.toLowerCase() === brandFilter.toLowerCase());
        }
        
        // Apply category filter if specified in params
        if (params.length > 0 && params[2] && params[2] !== 'all') {
          const categoryFilter = params[2];
          filteredProducts = filteredProducts.filter(p => 
            p.category.toLowerCase() === categoryFilter.toLowerCase());
        }
        
        return {
          rows: filteredProducts
        };
      }
      
      // Category metrics
      if (query.includes('category_name') && query.includes('sales_value')) {
        return {
          rows: fmcgData.data.categories || []
        };
      }
      
      // Regional performance
      if (query.includes('region_name') && query.includes('sales_value')) {
        return {
          rows: fmcgData.data.regions || []
        };
      }
      
      // Store type analysis
      if (query.includes('store_type') || query.includes('Sari-Sari Store')) {
        return {
          rows: fmcgData.data.storeTypes || []
        };
      }
      
      // Time of day analysis
      if (query.includes('hour') || query.includes('time')) {
        return {
          rows: fmcgData.data.timeOfDay || []
        };
      }
      
      // Recommendations and insights
      if (query.includes('insight_type') || query.includes('recommendation')) {
        // Combine all insights into a single result set
        return {
          rows: [
            ...(fmcgData.data.recommendations || []),
            fmcgData.data.brandDictionary || {},
            fmcgData.data.emotionalAnalysis || {},
            ...(fmcgData.data.bundling || [])
          ]
        };
      }
      
      // Bundling opportunities
      if (query.includes('bundling') || query.includes('correlation')) {
        return {
          rows: fmcgData.data.bundling || []
        };
      }
    }
    
    // Fallback to original query handling if FMCG data isn't available or match isn't found
    
    // Determine the type of query and load appropriate data
    if (query.includes('gold_store_interaction_metrics') && query.includes('total_sales')) {
      const data = await loadSampleData('kpis');
      return {
        rows: [{
          total_sales: data.data.kpis.total_sales,
          sales_change: data.data.kpis.sales_change,
          conversion_rate: data.data.kpis.conversion_rate,
          conversion_change: data.data.kpis.conversion_change,
          marketing_roi: data.data.kpis.marketing_roi,
          roi_change: data.data.kpis.roi_change,
          brand_sentiment: data.data.kpis.brand_sentiment,
          sentiment_change: data.data.kpis.sentiment_change
        }]
      };
    }
    
    if (query.includes('brand_name') && query.includes('performance_score')) {
      const data = await loadSampleData('brands');
      return {
        rows: data.data.brands || []
      };
    }
    
    if (query.includes('region_name') && query.includes('sales_value')) {
      const data = await loadSampleData('regions');
      return {
        rows: data.data.regions || []
      };
    }
    
    if (query.includes('insight_type')) {
      const data = await loadSampleData('insights');
      // Combine all insights into a single result set
      return {
        rows: [
          ...data.data.recommendations || [],
          data.data.brandDictionary || {},
          data.data.emotionalAnalysis || {},
          data.data.bundling || {}
        ]
      };
    }
    
    // Return empty result set for unrecognized queries
    return { rows: [] };
  } catch (error) {
    console.error('Error executing sample query:', error);
    return { 
      rows: [], 
      error: error.message,
      query: query,
      params: params 
    };
  }
}

/**
 * Loads all SQL queries from the sql_queries.js file
 * @returns {Promise<Object>} - Object containing all SQL queries
 */
async function loadSQLQueries() {
  try {
    // Try to load the SQL queries module
    const moduleUrl = '/data/sql_queries.js';
    
    // Since we can't directly import a URL in vanilla JS, we'll fetch it and evaluate it
    const response = await fetch(moduleUrl);
    if (!response.ok) {
      throw new Error(`Failed to load SQL queries: ${response.statusText}`);
    }
    
    const queryModule = await response.text();
    
    // Extract query strings from the module text
    // This is a simple approach that works for the expected format
    const queries = {};
    const queryMatches = queryModule.match(/const\s+(\w+)\s*=\s*`([^`]+)`/g);
    
    if (queryMatches) {
      queryMatches.forEach(match => {
        const nameMatch = match.match(/const\s+(\w+)\s*=/);
        if (nameMatch && nameMatch[1]) {
          const queryName = nameMatch[1];
          const queryTextMatch = match.match(/`([^`]+)`/);
          if (queryTextMatch && queryTextMatch[1]) {
            queries[queryName] = queryTextMatch[1];
          }
        }
      });
    }
    
    return queries;
  } catch (error) {
    console.warn(`Error loading SQL queries: ${error.message}`);
    
    // Return basic query templates as fallback
    return {
      getKPIs: `
        SELECT
          SUM(sales_amount) AS total_sales,
          AVG(conversion_rate) AS conversion_rate,
          AVG(marketing_roi) AS marketing_roi,
          AVG(sentiment_score) * 100 AS brand_sentiment
        FROM metrics
        WHERE date >= current_date - 30
      `,
      getBrandPerformance: `
        SELECT
          brand_name,
          AVG(score) * 100 AS performance_score
        FROM brand_metrics
        GROUP BY brand_name
        ORDER BY performance_score DESC
        LIMIT 10
      `,
      getRetailPerformance: `
        SELECT
          region_name,
          SUM(sales_amount) AS sales_value,
          NULL AS sales_change
        FROM sales_metrics
        GROUP BY region_name
        ORDER BY sales_value DESC
        LIMIT 5
      `,
      getInsights: `
        SELECT
          insight_type,
          insight_text
        FROM insights
        ORDER BY confidence_score DESC
        LIMIT 10
      `
    };
  }
}

// Export the functions for use in dashboard components
window.SampleDataLoader = {
  executeQuery,
  loadSQLQueries,
  loadSampleData
};