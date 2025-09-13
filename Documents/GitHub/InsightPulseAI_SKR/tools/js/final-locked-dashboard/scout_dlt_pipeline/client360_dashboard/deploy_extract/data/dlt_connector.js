/**
 * Scout DLT Pipeline Connector
 * 
 * This module connects the TBWA Client 360 Dashboard to the Scout DLT Pipeline
 * It handles data retrieval, transformation, and formatting for display in the dashboard
 */

const sql = require('./sql_queries');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    // Database connection
    database: {
        user: process.env.DB_USER || 'dbuser',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'scout_dlt',
        password: process.env.DB_PASSWORD || 'dbpassword',
        port: process.env.DB_PORT || 5432,
    },
    
    // Simulation mode (for testing without a database connection)
    simulation: {
        enabled: process.env.SIMULATION_MODE === 'true' || false,
        dataPath: path.join(__dirname, 'sample_data.json'),
    },
    
    // Cache settings
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
    },
    
    // Default data lookback period
    defaultLookback: 7, // days
};

class ScoutDLTConnector {
    constructor(options = {}) {
        this.options = { ...config, ...options };
        this.cache = {};
        this.lastUpdated = null;
        
        // Initialize database connection pool if not in simulation mode
        if (!this.options.simulation.enabled) {
            this.pool = new Pool(this.options.database);
            this.checkConnection();
        }
    }
    
    /**
     * Check database connection
     */
    async checkConnection() {
        try {
            const client = await this.pool.connect();
            console.log('Connected to Scout DLT database');
            client.release();
            return true;
        } catch (error) {
            console.error('Failed to connect to database:', error);
            console.log('Falling back to simulation mode');
            this.options.simulation.enabled = true;
            return false;
        }
    }
    
    /**
     * Fetch data from the Scout DLT pipeline
     * 
     * @param {string} queryName - Name of the query to execute
     * @param {object} params - Parameters for the query
     * @returns {Promise<object>} - Query results
     */
    async fetchData(queryName, params = {}) {
        // Use cache if available and not expired
        const cacheKey = `${queryName}:${JSON.stringify(params)}`;
        if (this.options.cache.enabled && this.cache[cacheKey]) {
            const { timestamp, data } = this.cache[cacheKey];
            if (Date.now() - timestamp < this.options.cache.ttl) {
                return data;
            }
        }
        
        // Use simulated data if in simulation mode
        if (this.options.simulation.enabled) {
            return this.getSimulatedData(queryName, params);
        }
        
        // Execute database query
        try {
            // Get the SQL query from the sql_queries module
            const query = sql[queryName];
            if (!query) {
                throw new Error(`Query '${queryName}' not found`);
            }
            
            // Execute the query with parameters
            const { rows } = await this.pool.query(query, Object.values(params));
            
            // Format the data based on query type
            const result = this.formatQueryResults(queryName, rows);
            
            // Cache the results
            if (this.options.cache.enabled) {
                this.cache[cacheKey] = {
                    timestamp: Date.now(),
                    data: result,
                };
            }
            
            this.lastUpdated = new Date();
            return result;
        } catch (error) {
            console.error(`Error executing query '${queryName}':`, error);
            return this.getSimulatedData(queryName, params);
        }
    }
    
    /**
     * Format query results based on query type
     * 
     * @param {string} queryName - Name of the query
     * @param {Array} rows - Query result rows
     * @returns {object} - Formatted data
     */
    formatQueryResults(queryName, rows) {
        // Format the data based on the query type
        switch (queryName) {
            case 'getKPIs':
                return this.formatKPIData(rows);
            case 'getBrandPerformance':
                return this.formatBrandData(rows);
            case 'getCompetitorAnalysis':
                return this.formatCompetitorData(rows);
            case 'getRetailPerformance':
                return this.formatRetailData(rows);
            case 'getMarketingROI':
                return this.formatROIData(rows);
            case 'getInsights':
                return this.formatInsightData(rows);
            case 'getSalesDrillDown':
                return this.formatSalesDrillDownData(rows);
            case 'getConversionDrillDown':
                return this.formatConversionDrillDownData(rows);
            case 'getROIDrillDown':
                return this.formatROIDrillDownData(rows);
            case 'getSentimentDrillDown':
                return this.formatSentimentDrillDownData(rows);
            default:
                return rows;
        }
    }
    
    /**
     * Format KPI data
     * 
     * @param {Array} rows - Query result rows
     * @returns {object} - Formatted KPI data
     */
    formatKPIData(rows) {
        if (!rows || rows.length === 0) {
            return {
                totalSales: { value: 0, change: 0, trend: 'neutral' },
                conversionRate: { value: 0, change: 0, trend: 'neutral' },
                marketingROI: { value: 0, change: 0, trend: 'neutral' },
                brandSentiment: { value: 0, change: 0, trend: 'neutral' },
            };
        }
        
        const row = rows[0];
        return {
            totalSales: {
                value: row.total_sales || 0,
                change: row.sales_change || 0,
                trend: row.sales_change > 0 ? 'up' : row.sales_change < 0 ? 'down' : 'neutral',
            },
            conversionRate: {
                value: row.conversion_rate || 0,
                change: row.conversion_change || 0,
                trend: row.conversion_change > 0 ? 'up' : row.conversion_change < 0 ? 'down' : 'neutral',
            },
            marketingROI: {
                value: row.marketing_roi || 0,
                change: row.roi_change || 0,
                trend: row.roi_change > 0 ? 'up' : row.roi_change < 0 ? 'down' : 'neutral',
            },
            brandSentiment: {
                value: row.brand_sentiment || 0,
                change: row.sentiment_change || 0,
                trend: row.sentiment_change > 0 ? 'up' : row.sentiment_change < 0 ? 'down' : 'neutral',
            },
        };
    }
    
    /**
     * Format brand performance data
     * 
     * @param {Array} rows - Query result rows
     * @returns {Array} - Formatted brand data
     */
    formatBrandData(rows) {
        if (!rows || rows.length === 0) {
            return [];
        }
        
        return rows.map(row => ({
            name: row.brand_name,
            value: row.performance_score,
            status: row.performance_score >= 70 ? 'good' : row.performance_score >= 50 ? 'warning' : 'poor',
        }));
    }
    
    /**
     * Format competitor analysis data
     * 
     * @param {Array} rows - Query result rows
     * @returns {object} - Formatted competitor data
     */
    formatCompetitorData(rows) {
        if (!rows || rows.length === 0) {
            return {
                marketShare: { value: 0, target: 0, status: 'neutral' },
                brandRecognition: { value: 0, target: 0, status: 'neutral' },
                customerSatisfaction: { value: 0, target: 0, status: 'neutral' },
            };
        }
        
        const row = rows[0];
        return {
            marketShare: {
                value: row.market_share || 0,
                target: row.market_share_target || 0,
                status: row.market_share_attention ? 'attention' : 'normal',
            },
            brandRecognition: {
                value: row.brand_recognition || 0,
                target: row.brand_recognition_target || 0,
                status: row.brand_recognition_attention ? 'attention' : 'normal',
            },
            customerSatisfaction: {
                value: row.customer_satisfaction || 0,
                target: row.customer_satisfaction_target || 0,
                status: row.customer_satisfaction_attention ? 'attention' : 'normal',
            },
        };
    }
    
    /**
     * Format retail performance data
     * 
     * @param {Array} rows - Query result rows
     * @returns {object} - Formatted retail data
     */
    formatRetailData(rows) {
        if (!rows || rows.length === 0) {
            return {
                total: 0,
                regions: [],
                trend: [],
            };
        }
        
        // Extract the total and trend from the first row
        const totalRow = rows.find(row => row.region_name === 'Total') || rows[0];
        const total = totalRow.sales_value || 0;
        const trend = totalRow.trend ? JSON.parse(totalRow.trend) : [];
        
        // Extract region data (excluding the total row)
        const regions = rows
            .filter(row => row.region_name !== 'Total')
            .map(row => ({
                name: row.region_name,
                value: row.sales_value || 0,
                change: row.sales_change || 0,
                trend: row.sales_change > 0 ? 'up' : row.sales_change < 0 ? 'down' : 'neutral',
            }));
        
        return {
            total,
            regions,
            trend,
        };
    }
    
    /**
     * Format marketing ROI data
     * 
     * @param {Array} rows - Query result rows
     * @returns {object} - Formatted ROI data
     */
    formatROIData(rows) {
        if (!rows || rows.length === 0) {
            return {
                overall: 0,
                channels: [],
            };
        }
        
        // Extract the overall ROI from the first row
        const overallRow = rows.find(row => row.channel_name === 'Overall') || rows[0];
        const overall = overallRow.roi_value || 0;
        
        // Extract channel data (excluding the overall row)
        const channels = rows
            .filter(row => row.channel_name !== 'Overall')
            .map(row => ({
                name: row.channel_name,
                value: row.roi_value || 0,
                change: row.roi_change || 0,
                trend: row.roi_change > 0 ? 'up' : row.roi_change < 0 ? 'down' : 'neutral',
            }));
        
        return {
            overall,
            channels,
        };
    }
    
    /**
     * Format insight data
     * 
     * @param {Array} rows - Query result rows
     * @returns {object} - Formatted insight data
     */
    formatInsightData(rows) {
        if (!rows || rows.length === 0) {
            return {
                recommendations: [],
                brandDictionary: {
                    topBrands: [],
                    topAssociations: [],
                },
                emotionalAnalysis: {
                    peakTime: '',
                    contextualInsights: [],
                },
                bundlingOpportunities: [],
            };
        }
        
        // Recommendations come as separate rows with insight_type = 'recommendation'
        const recommendations = rows
            .filter(row => row.insight_type === 'recommendation')
            .map(row => row.insight_text)
            .slice(0, 3); // Limit to top 3
        
        // Brand dictionary data
        const brandDictionaryRow = rows.find(row => row.insight_type === 'brand_dictionary') || {};
        const brandDictionary = {
            topBrands: brandDictionaryRow.top_brands ? JSON.parse(brandDictionaryRow.top_brands) : [],
            topAssociations: brandDictionaryRow.brand_associations ? JSON.parse(brandDictionaryRow.brand_associations) : [],
        };
        
        // Emotional analysis data
        const emotionalRow = rows.find(row => row.insight_type === 'emotional_analysis') || {};
        const emotionalAnalysis = {
            peakTime: emotionalRow.peak_time || '',
            contextualInsights: emotionalRow.contextual_insights ? JSON.parse(emotionalRow.contextual_insights) : [],
        };
        
        // Bundling opportunities
        const bundlingRows = rows.filter(row => row.insight_type === 'bundling');
        const bundlingOpportunities = bundlingRows.map(row => ({
            products: row.products ? JSON.parse(row.products) : [],
            correlation: row.correlation || 0,
            potentialIncrease: row.potential_increase || 0,
        }));
        
        return {
            recommendations,
            brandDictionary,
            emotionalAnalysis,
            bundlingOpportunities,
        };
    }
    
    /**
     * Get simulated data from sample data file
     * 
     * @param {string} queryName - Name of the query
     * @param {object} params - Query parameters
     * @returns {object} - Simulated data
     */
    getSimulatedData(queryName, params = {}) {
        try {
            // Read the sample data file
            const dataPath = this.options.simulation.dataPath;
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            
            // Return the appropriate section of the sample data based on the query name
            switch (queryName) {
                case 'getKPIs':
                    return {
                        totalSales: data.totalSales,
                        conversionRate: data.conversionRate,
                        marketingROI: data.marketingROI,
                        brandSentiment: data.brandSentiment,
                    };
                case 'getBrandPerformance':
                    return data.brandPerformance;
                case 'getCompetitorAnalysis':
                    return data.competitorAnalysis;
                case 'getRetailPerformance':
                    return data.retailPerformance;
                case 'getMarketingROI':
                    return data.marketingROI;
                case 'getInsights':
                    return data.insights;
                case 'getSalesDrillDown':
                    return data.salesDrillDown;
                case 'getConversionDrillDown':
                    return data.conversionDrillDown;
                case 'getROIDrillDown':
                    return data.roiDrillDown;
                case 'getSentimentDrillDown':
                    return data.sentimentDrillDown;
                default:
                    return {};
            }
        } catch (error) {
            console.error('Error reading sample data:', error);
            return {};
        }
    }
    
    /**
     * Get KPI data for the dashboard
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - KPI data
     */
    async getKPIs(params = {}) {
        return this.fetchData('getKPIs', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get brand performance data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<Array>} - Brand performance data
     */
    async getBrandPerformance(params = {}) {
        return this.fetchData('getBrandPerformance', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get competitor analysis data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Competitor analysis data
     */
    async getCompetitorAnalysis(params = {}) {
        return this.fetchData('getCompetitorAnalysis', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get retail performance data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Retail performance data
     */
    async getRetailPerformance(params = {}) {
        return this.fetchData('getRetailPerformance', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get marketing ROI data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Marketing ROI data
     */
    async getMarketingROI(params = {}) {
        return this.fetchData('getMarketingROI', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get AI-powered insights
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Insight data
     */
    async getInsights(params = {}) {
        return this.fetchData('getInsights', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get sales drill-down data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Sales drill-down data
     */
    async getSalesDrillDown(params = {}) {
        return this.fetchData('getSalesDrillDown', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get conversion funnel drill-down data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Conversion drill-down data
     */
    async getConversionDrillDown(params = {}) {
        return this.fetchData('getConversionDrillDown', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get ROI drill-down data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - ROI drill-down data
     */
    async getROIDrillDown(params = {}) {
        return this.fetchData('getROIDrillDown', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
        });
    }
    
    /**
     * Get sentiment drill-down data
     * 
     * @param {object} params - Filter parameters
     * @returns {Promise<object>} - Sentiment drill-down data
     */
    async getSentimentDrillDown(params = {}) {
        return this.fetchData('getSentimentDrillDown', {
            lookback: params.dateRange || this.options.defaultLookback,
            region: params.region || 'all',
            category: params.category || 'all',
            brand: params.brand || 'all',
            channel: params.channel || 'all',
        });
    }
    
    /**
     * Get the last update timestamp
     * 
     * @returns {Date|null} - Last update timestamp
     */
    getLastUpdated() {
        return this.lastUpdated;
    }
    
    /**
     * Clear the data cache
     */
    clearCache() {
        this.cache = {};
    }
    
    /**
     * Close the database connection pool
     */
    close() {
        if (this.pool) {
            this.pool.end();
        }
    }
}

module.exports = ScoutDLTConnector;