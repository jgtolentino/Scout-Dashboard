/**
 * SQL Connector for FMCG Sari-Sari Store Data
 * 
 * This module provides a connection to the SQL database containing
 * FMCG Sari-Sari Store data for the Client360 Dashboard
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Default configuration
const DEFAULT_CONFIG = {
    // Database connection
    database: {
        user: process.env.DB_USER || 'tbwa',
        host: process.env.DB_HOST || '127.0.0.1',
        database: process.env.DB_NAME || 'client360_full',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 5432,
    },
    
    // Simulation mode (for testing without a database connection)
    simulation: {
        enabled: process.env.SIMULATION_MODE === 'true' || false,
        dataPath: path.join(__dirname, 'sample_data', 'fmcg_sample_data.json'),
    },
    
    // Cache settings
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
    },
};

class FMCGSQLConnector {
    constructor(options = {}) {
        this.options = { ...DEFAULT_CONFIG, ...options };
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
     * @returns {Promise<boolean>} Connection status
     */
    async checkConnection() {
        try {
            const client = await this.pool.connect();
            console.log('Connected to SQL database');
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
     * Execute a SQL query
     * @param {string} query - SQL query string
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async executeQuery(query, params = []) {
        // Use cache if available and not expired
        const cacheKey = `${query}:${JSON.stringify(params)}`;
        if (this.options.cache.enabled && this.cache[cacheKey]) {
            const { timestamp, data } = this.cache[cacheKey];
            if (Date.now() - timestamp < this.options.cache.ttl) {
                return data;
            }
        }
        
        // Use simulated data if in simulation mode
        if (this.options.simulation.enabled) {
            return this.getSimulatedData(query, params);
        }
        
        // Execute database query
        try {
            const result = await this.pool.query(query, params);
            
            // Cache the results
            if (this.options.cache.enabled) {
                this.cache[cacheKey] = {
                    timestamp: Date.now(),
                    data: result.rows,
                };
            }
            
            this.lastUpdated = new Date();
            return result.rows;
        } catch (error) {
            console.error('Error executing query:', error);
            // Fall back to simulation mode for this query
            return this.getSimulatedData(query, params);
        }
    }
    
    /**
     * Get simulated data for a query
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Array} Simulated data
     */
    getSimulatedData(query, params = []) {
        try {
            // Read the sample data file
            const dataPath = this.options.simulation.dataPath;
            let data;
            
            try {
                data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            } catch (error) {
                console.warn(`Couldn't read simulation data from ${dataPath}:`, error);
                // Try a fallback to minimal sample data
                const fallbackPath = path.join(__dirname, 'sample_data', 'minimal_sample.json');
                data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            }
            
            // Extract query type from the SQL
            const queryType = this.extractQueryType(query);
            
            // Return appropriate simulated data based on query type
            switch (queryType) {
                case 'brands':
                    return data.brands || [];
                case 'products':
                    return data.products || [];
                case 'stores':
                    return data.stores || [];
                case 'sales':
                    return data.sales || [];
                case 'transactions':
                    return data.transactions || [];
                case 'kpis':
                    return data.kpis || [];
                case 'categories':
                    return data.categories || [];
                case 'regions':
                    return data.regions || [];
                case 'sentiment':
                    return data.sentiment || [];
                default:
                    return [];
            }
        } catch (error) {
            console.error('Error generating simulated data:', error);
            return [];
        }
    }
    
    /**
     * Extract query type from SQL query
     * @param {string} query - SQL query
     * @returns {string} Query type
     */
    extractQueryType(query) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('brands') || lowerQuery.includes('brand_name')) {
            return 'brands';
        } else if (lowerQuery.includes('products') || lowerQuery.includes('product_name')) {
            return 'products';
        } else if (lowerQuery.includes('stores') || lowerQuery.includes('store_id')) {
            return 'stores';
        } else if (lowerQuery.includes('sales') || lowerQuery.includes('total_sales')) {
            return 'sales';
        } else if (lowerQuery.includes('transactions') || lowerQuery.includes('transaction_')) {
            return 'transactions';
        } else if (lowerQuery.includes('kpi') || lowerQuery.includes('metric')) {
            return 'kpis';
        } else if (lowerQuery.includes('categories') || lowerQuery.includes('category_')) {
            return 'categories';
        } else if (lowerQuery.includes('regions') || lowerQuery.includes('region_')) {
            return 'regions';
        } else if (lowerQuery.includes('sentiment') || lowerQuery.includes('expression')) {
            return 'sentiment';
        } else {
            return 'unknown';
        }
    }
    
    /**
     * Get brands data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Brands data
     */
    async getBrands(filters = {}) {
        const query = `
            SELECT 
                b.brand_id, 
                b.brand_name, 
                b.company_name, 
                b.is_tbwa_client,
                COUNT(sib.brandid) AS mention_count,
                AVG(CASE WHEN sib.sentiment = 'positive' THEN 1
                     WHEN sib.sentiment = 'neutral' THEN 0.5
                     ELSE 0 END) AS sentiment_score
            FROM 
                brands b
            LEFT JOIN 
                salesinteractionbrands sib ON b.brand_id = sib.brandid
            ${filters.tbwaOnly ? 'WHERE b.is_tbwa_client = TRUE' : ''}
            GROUP BY 
                b.brand_id, b.brand_name, b.company_name, b.is_tbwa_client
            ORDER BY 
                mention_count DESC, brand_name ASC
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Get products data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Products data
     */
    async getProducts(filters = {}) {
        const whereConditions = [];
        const params = [];
        
        if (filters.brandId) {
            whereConditions.push('p.brandid = $1');
            params.push(filters.brandId);
        }
        
        if (filters.categoryId) {
            whereConditions.push(`p.categoryid = $${params.length + 1}`);
            params.push(filters.categoryId);
        }
        
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        
        const query = `
            SELECT 
                p.productid, 
                p.productname, 
                p.brandid, 
                b.brand_name,
                p.categoryid, 
                pc.category_name,
                p.upc, 
                p.defaultprice,
                p.isactive
            FROM 
                products p
            JOIN 
                brands b ON p.brandid = b.brand_id
            JOIN 
                product_categories pc ON p.categoryid = pc.category_id
            ${whereClause}
            ORDER BY 
                b.brand_name, p.productname
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get stores data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Stores data
     */
    async getStores(filters = {}) {
        const query = `
            SELECT 
                s.store_id, 
                s.name AS store_name, 
                s.store_type_id,
                st.store_type_name,
                s.owner, 
                s.contact_number, 
                s.street_address, 
                s.barangay_id,
                b.barangay_name,
                c.city_municipality,
                p.province_name,
                r.region_name,
                s.postal_code, 
                s.latitude, 
                s.longitude,
                s.is_active
            FROM 
                stores s
            JOIN 
                store_types st ON s.store_type_id = st.store_type_id
            JOIN 
                barangays b ON s.barangay_id = b.barangay_id
            JOIN 
                cities c ON b.city_id = c.city_id
            JOIN 
                provinces p ON c.province_id = p.province_id
            JOIN 
                regions r ON p.region_id = r.region_id
            WHERE 
                s.store_type_id = 1  -- Sari-Sari stores only
            ORDER BY 
                s.name
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Get store metrics data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Store metrics data
     */
    async getStoreMetrics(filters = {}) {
        const params = [];
        let whereClause = 's.store_type_id = 1'; // Sari-Sari stores only
        
        if (filters.storeId) {
            whereClause += ` AND s.store_id = $${params.length + 1}`;
            params.push(filters.storeId);
        }
        
        if (filters.regionId) {
            whereClause += ` AND r.region_id = $${params.length + 1}`;
            params.push(filters.regionId);
        }
        
        const query = `
            SELECT 
                s.store_id, 
                s.name AS store_name, 
                sm.sales_30d, 
                sm.sales_7d, 
                sm.customer_count_30d, 
                sm.average_basket_size, 
                sm.growth_rate_pct, 
                sm.repurchase_rate_pct,
                sm.conversion_rate_pct,
                sm.digital_payment_pct,
                sm.metric_date,
                r.region_name,
                p.province_name,
                c.city_municipality
            FROM 
                stores s
            JOIN 
                store_metrics sm ON s.store_id = sm.store_id
            JOIN 
                barangays b ON s.barangay_id = b.barangay_id
            JOIN 
                cities c ON b.city_id = c.city_id
            JOIN 
                provinces p ON c.province_id = p.province_id
            JOIN 
                regions r ON p.region_id = r.region_id
            WHERE 
                ${whereClause}
            ORDER BY 
                sm.sales_30d DESC
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get transactions data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Transactions data
     */
    async getTransactions(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE si.storeid = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                si.interactionid, 
                si.storeid, 
                si.sessionid, 
                si.interactiontimestamp, 
                si.transactionduration, 
                si.productcount, 
                si.basketvalue, 
                si.transactioncompleted, 
                si.dwelltimeseconds,
                si.customerexpressions
            FROM 
                salesinteractions si
            ${whereClause}
            ORDER BY 
                si.interactiontimestamp DESC
            LIMIT 100
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get brand distribution data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Brand distribution data
     */
    async getBrandDistribution(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE sbd.store_id = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                sbd.store_id, 
                s.name AS store_name, 
                sbd.brand_id, 
                b.brand_name, 
                b.company_name,
                b.is_tbwa_client,
                sbd.sales_contribution_pct, 
                sbd.shelf_space_pct, 
                sbd.rank_in_store,
                sbd.as_of_date
            FROM 
                store_brand_distribution sbd
            JOIN 
                stores s ON sbd.store_id = s.store_id
            JOIN 
                brands b ON sbd.brand_id = b.brand_id
            ${whereClause}
            ORDER BY 
                sbd.store_id, sbd.rank_in_store
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get product category distribution data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Product category distribution data
     */
    async getCategoryDistribution(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE spcd.store_id = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                spcd.store_id, 
                s.name AS store_name, 
                spcd.category_id, 
                pc.category_name,
                spcd.sales_contribution_pct, 
                spcd.shelf_space_pct, 
                spcd.rank_in_store,
                spcd.as_of_date
            FROM 
                store_product_category_distribution spcd
            JOIN 
                stores s ON spcd.store_id = s.store_id
            JOIN 
                product_categories pc ON spcd.category_id = pc.category_id
            ${whereClause}
            ORDER BY 
                spcd.store_id, spcd.rank_in_store
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get regional performance data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Regional performance data
     */
    async getRegionalPerformance(filters = {}) {
        const query = `
            SELECT 
                r.region_id, 
                r.region_name,
                SUM(sm.sales_30d) AS total_sales,
                COUNT(DISTINCT s.store_id) AS store_count,
                AVG(sm.growth_rate_pct) AS avg_growth_rate,
                AVG(sm.conversion_rate_pct) AS avg_conversion_rate
            FROM 
                regions r
            JOIN 
                provinces p ON r.region_id = p.region_id
            JOIN 
                cities c ON p.province_id = c.province_id
            JOIN 
                barangays b ON c.city_id = b.city_id
            JOIN 
                stores s ON b.barangay_id = s.barangay_id
            JOIN 
                store_metrics sm ON s.store_id = sm.store_id
            WHERE 
                s.store_type_id = 1  -- Sari-Sari stores only
            GROUP BY 
                r.region_id, r.region_name
            ORDER BY 
                total_sales DESC
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Get transaction metrics data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Transaction metrics data
     */
    async getTransactionMetrics(filters = {}) {
        const query = `
            SELECT 
                AVG(transactionduration) AS avg_transaction_duration,
                AVG(productcount) AS avg_product_count,
                AVG(basketvalue) AS avg_basket_value,
                COUNT(*) AS total_transactions,
                (SUM(CASE WHEN transactioncompleted = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS completion_rate,
                AVG(dwelltimeseconds) AS avg_dwell_time,
                COUNT(DISTINCT sessionid) AS unique_sessions
            FROM 
                salesinteractions
            WHERE 
                interactiontimestamp >= NOW() - INTERVAL '30 days'
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Get transcript data
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Transcript data
     */
    async getTranscripts(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.interactionId) {
            whereClause = 'WHERE sit.interactionid = $1';
            params.push(filters.interactionId);
        } else if (filters.sessionId) {
            whereClause = 'WHERE si.sessionid = $1';
            params.push(filters.sessionId);
        }
        
        const query = `
            SELECT 
                sit.transcriptid,
                sit.interactionid,
                si.sessionid,
                sit.transcripttext,
                sit.language,
                sit.processedat,
                sit.confidencescore,
                si.customerexpressions
            FROM 
                salesinteractiontranscripts sit
            JOIN 
                salesinteractions si ON sit.interactionid = si.interactionid
            ${whereClause}
            ORDER BY 
                sit.processedat DESC
            LIMIT 100
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get dashboard KPIs
     * @returns {Promise<Object>} Dashboard KPIs
     */
    async getDashboardKPIs() {
        const query = `
            SELECT 
                SUM(sm.sales_30d) AS total_sales,
                AVG(sm.conversion_rate_pct) AS avg_conversion_rate,
                AVG(sm.growth_rate_pct) AS avg_growth_rate,
                COUNT(DISTINCT s.store_id) AS total_stores,
                (
                    SELECT AVG(
                        CASE 
                            WHEN sib.sentiment = 'positive' THEN 100
                            WHEN sib.sentiment = 'neutral' THEN 50
                            ELSE 0 
                        END
                    )
                    FROM salesinteractionbrands sib
                    JOIN brands b ON sib.brandid = b.brand_id
                    WHERE b.is_tbwa_client = TRUE
                ) AS brand_sentiment
            FROM 
                store_metrics sm
            JOIN 
                stores s ON sm.store_id = s.store_id
            WHERE 
                s.store_type_id = 1  -- Sari-Sari stores only
        `;
        
        const results = await this.executeQuery(query);
        return results[0] || {};
    }
    
    /**
     * Close database connection
     */
    close() {
        if (this.pool) {
            this.pool.end();
        }
    }
}

module.exports = FMCGSQLConnector;