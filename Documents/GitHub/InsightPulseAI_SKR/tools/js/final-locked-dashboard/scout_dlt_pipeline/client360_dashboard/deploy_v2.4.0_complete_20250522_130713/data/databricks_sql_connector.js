/**
 * Databricks SQL Connector for Client360 Dashboard
 * 
 * This module provides a connection to the Databricks SQL endpoint
 * containing Gold tables for the Client360 Dashboard
 */

const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Default configuration
const DEFAULT_CONFIG = {
    // Databricks SQL connection
    databricks: {
        host: process.env.DATABRICKS_SQL_HOST || 'adb-123456789012345.6.azuredatabricks.net',
        path: process.env.DATABRICKS_SQL_PATH || '/sql/1.0/warehouses/abcdefg1234567890',
        token: process.env.DATABRICKS_SQL_TOKEN || '',
        port: process.env.DATABRICKS_SQL_PORT || 443,
        catalog: process.env.DATABRICKS_CATALOG || 'client360_catalog',
        schema: process.env.DATABRICKS_SCHEMA || 'client360'
    },
    
    // Azure Key Vault
    keyVault: {
        name: process.env.KEY_VAULT_NAME || 'kv-client360',
        useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true' || true,
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

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
        enableTelemetry: process.env.ENABLE_TELEMETRY === 'true' || true
    }
};

/**
 * DatabricksSQL Connector class for Client360 Dashboard
 */
class DatabricksSQLConnector {
    /**
     * Constructor
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = { ...DEFAULT_CONFIG, ...options };
        this.cache = {};
        this.lastUpdated = null;
        this.credentials = null;
        this.secretClient = null;
        this.isInitialized = false;
        this.stats = {
            queriesExecuted: 0,
            queriesCached: 0,
            errors: 0,
            lastConnectAttempt: null
        };
        
        // Initialize connection
        this.initialize();
    }
    
    /**
     * Initialize the connector
     * @returns {Promise<boolean>} Initialization status
     */
    async initialize() {
        try {
            this.log('info', 'Initializing Databricks SQL connector');
            
            // Set up Azure credentials if using managed identity
            if (this.options.keyVault.useManagedIdentity) {
                this.credentials = new DefaultAzureCredential();
                await this.initializeKeyVault();
                
                // Get SQL token from Key Vault
                const token = await this.getSecretFromKeyVault('SQL-ENDPOINT-TOKEN');
                if (token) {
                    this.options.databricks.token = token;
                    this.log('info', 'Retrieved SQL token from Key Vault');
                } else {
                    this.log('warn', 'Failed to retrieve SQL token from Key Vault');
                }
            }
            
            // Initialize database connection if not in simulation mode
            if (!this.options.simulation.enabled) {
                await this.initializeConnection();
            }
            
            this.isInitialized = true;
            this.log('info', 'Databricks SQL connector initialized successfully');
            return true;
        } catch (error) {
            this.log('error', `Failed to initialize Databricks SQL connector: ${error.message}`, error);
            this.stats.errors++;
            
            // Fall back to simulation mode
            this.log('info', 'Falling back to simulation mode');
            this.options.simulation.enabled = true;
            return false;
        }
    }
    
    /**
     * Initialize Key Vault connection
     * @returns {Promise<void>}
     */
    async initializeKeyVault() {
        try {
            const keyVaultUrl = `https://${this.options.keyVault.name}.vault.azure.net`;
            this.secretClient = new SecretClient(keyVaultUrl, this.credentials);
            this.log('info', `Key Vault client initialized for ${keyVaultUrl}`);
        } catch (error) {
            this.log('error', `Failed to initialize Key Vault client: ${error.message}`, error);
            throw error;
        }
    }
    
    /**
     * Get a secret from Key Vault
     * @param {string} secretName - Name of the secret
     * @returns {Promise<string>} Secret value
     */
    async getSecretFromKeyVault(secretName) {
        try {
            if (!this.secretClient) {
                await this.initializeKeyVault();
            }
            const secret = await this.secretClient.getSecret(secretName);
            return secret.value;
        } catch (error) {
            this.log('error', `Failed to get secret ${secretName}: ${error.message}`, error);
            return null;
        }
    }
    
    /**
     * Initialize database connection
     * @returns {Promise<void>}
     */
    async initializeConnection() {
        try {
            this.stats.lastConnectAttempt = new Date();
            
            // Configure Databricks SQL connection through JDBC/ODBC compatible connection
            this.pool = new Pool({
                user: 'token',
                password: this.options.databricks.token,
                host: this.options.databricks.host,
                port: this.options.databricks.port,
                database: this.options.databricks.catalog,
                ssl: {
                    rejectUnauthorized: true
                },
                connectionTimeoutMillis: 15000,
                query_timeout: 60000,
                // Custom connection string for Databricks SQL
                connectionString: `Driver=Simba Spark ODBC Driver;Host=${this.options.databricks.host};Port=${this.options.databricks.port};SSL=1;AuthMech=3;UID=token;PWD=${this.options.databricks.token};HTTPPath=${this.options.databricks.path};Schema=${this.options.databricks.schema}`
            });
            
            // Test connection
            await this.checkConnection();
        } catch (error) {
            this.log('error', `Failed to initialize database connection: ${error.message}`, error);
            throw error;
        }
    }
    
    /**
     * Check database connection
     * @returns {Promise<boolean>} Connection status
     */
    async checkConnection() {
        try {
            const client = await this.pool.connect();
            this.log('info', 'Connected to Databricks SQL endpoint');
            client.release();
            return true;
        } catch (error) {
            this.log('error', `Failed to connect to Databricks SQL endpoint: ${error.message}`, error);
            this.log('info', 'Falling back to simulation mode');
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
                this.stats.queriesCached++;
                this.log('debug', `Using cached results for query: ${query.substring(0, 100)}...`);
                return data;
            }
        }
        
        // Use simulated data if in simulation mode
        if (this.options.simulation.enabled) {
            return this.getSimulatedData(query, params);
        }
        
        // Execute database query
        try {
            this.log('debug', `Executing query: ${query.substring(0, 100)}...`);
            
            // Ensure we're initialized
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            const result = await this.pool.query(query, params);
            this.stats.queriesExecuted++;
            
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
            this.log('error', `Error executing query: ${error.message}`, error);
            this.stats.errors++;
            
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
                this.log('warn', `Couldn't read simulation data from ${dataPath}: ${error.message}`);
                // Try a fallback to minimal sample data
                const fallbackPath = path.join(__dirname, 'sample_data', 'minimal_sample.json');
                try {
                    data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
                } catch (fallbackError) {
                    this.log('error', `Couldn't read fallback data: ${fallbackError.message}`);
                    return [];
                }
            }
            
            // Extract query type from the SQL
            const queryType = this.extractQueryType(query);
            
            // Return appropriate simulated data based on query type
            switch (queryType) {
                case 'brands':
                    return data.data?.brands || [];
                case 'products':
                    return data.data?.products || [];
                case 'stores':
                    return data.data?.stores || [];
                case 'sales':
                    return data.data?.regions || [];
                case 'transactions':
                    return data.data?.transactions || [];
                case 'kpis':
                    return [data.data?.kpis] || [];
                case 'categories':
                    return data.data?.categories || [];
                case 'regions':
                    return data.data?.regions || [];
                case 'sentiment':
                    return data.data?.sentiment || [];
                case 'recommendations':
                    return data.data?.recommendations || [];
                default:
                    return [];
            }
        } catch (error) {
            this.log('error', `Error generating simulated data: ${error.message}`, error);
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
        } else if (lowerQuery.includes('recommendation') || lowerQuery.includes('insight')) {
            return 'recommendations';
        } else {
            return 'unknown';
        }
    }
    
    /**
     * Get brands data from the gold layer
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
                COUNT(m.brand_id) AS mention_count,
                AVG(m.sentiment_score) AS sentiment_score
            FROM 
                ${this.options.databricks.schema}.gold_brands b
            LEFT JOIN 
                ${this.options.databricks.schema}.gold_brand_mentions m ON b.brand_id = m.brand_id
            ${filters.tbwaOnly ? 'WHERE b.is_tbwa_client = TRUE' : ''}
            GROUP BY 
                b.brand_id, b.brand_name, b.company_name, b.is_tbwa_client
            ORDER BY 
                mention_count DESC, brand_name ASC
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Get products data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Products data
     */
    async getProducts(filters = {}) {
        const whereConditions = [];
        const params = [];
        
        if (filters.brandId) {
            whereConditions.push('p.brand_id = $1');
            params.push(filters.brandId);
        }
        
        if (filters.categoryId) {
            whereConditions.push(`p.category_id = $${params.length + 1}`);
            params.push(filters.categoryId);
        }
        
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        
        const query = `
            SELECT 
                p.product_id, 
                p.product_name, 
                p.brand_id, 
                b.brand_name,
                p.category_id, 
                c.category_name,
                p.upc, 
                p.default_price,
                p.is_active
            FROM 
                ${this.options.databricks.schema}.gold_products p
            JOIN 
                ${this.options.databricks.schema}.gold_brands b ON p.brand_id = b.brand_id
            JOIN 
                ${this.options.databricks.schema}.gold_product_categories c ON p.category_id = c.category_id
            ${whereClause}
            ORDER BY 
                b.brand_name, p.product_name
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get stores data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Stores data
     */
    async getStores(filters = {}) {
        const query = `
            SELECT 
                s.store_id, 
                s.store_name, 
                s.store_type_id,
                st.store_type_name,
                s.owner_name, 
                s.contact_number, 
                s.address, 
                s.barangay_id,
                b.barangay_name,
                c.city_name,
                p.province_name,
                r.region_name,
                s.postal_code, 
                s.latitude, 
                s.longitude,
                s.is_active,
                s.last_updated
            FROM 
                ${this.options.databricks.schema}.gold_stores s
            JOIN 
                ${this.options.databricks.schema}.gold_store_types st ON s.store_type_id = st.store_type_id
            JOIN 
                ${this.options.databricks.schema}.gold_barangays b ON s.barangay_id = b.barangay_id
            JOIN 
                ${this.options.databricks.schema}.gold_cities c ON b.city_id = c.city_id
            JOIN 
                ${this.options.databricks.schema}.gold_provinces p ON c.province_id = p.province_id
            JOIN 
                ${this.options.databricks.schema}.gold_regions r ON p.region_id = r.region_id
            WHERE 
                s.store_type_id = 1  -- Sari-Sari stores only
            ORDER BY 
                s.store_name
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Get store metrics data from the gold layer
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
                s.store_name, 
                m.sales_30d, 
                m.sales_7d, 
                m.customer_count_30d, 
                m.average_basket_size, 
                m.growth_rate_pct, 
                m.repurchase_rate_pct,
                m.conversion_rate_pct,
                m.digital_payment_pct,
                m.as_of_date,
                r.region_name,
                p.province_name,
                c.city_name
            FROM 
                ${this.options.databricks.schema}.gold_stores s
            JOIN 
                ${this.options.databricks.schema}.gold_store_metrics m ON s.store_id = m.store_id
            JOIN 
                ${this.options.databricks.schema}.gold_barangays b ON s.barangay_id = b.barangay_id
            JOIN 
                ${this.options.databricks.schema}.gold_cities c ON b.city_id = c.city_id
            JOIN 
                ${this.options.databricks.schema}.gold_provinces p ON c.province_id = p.province_id
            JOIN 
                ${this.options.databricks.schema}.gold_regions r ON p.region_id = r.region_id
            WHERE 
                ${whereClause}
            ORDER BY 
                m.sales_30d DESC
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get interaction data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Interaction data
     */
    async getInteractions(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE i.store_id = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                i.interaction_id, 
                i.store_id, 
                i.session_id, 
                i.timestamp, 
                i.duration_sec, 
                i.product_count, 
                i.basket_value, 
                i.transaction_completed, 
                i.dwell_time_sec,
                i.customer_expressions,
                i.interaction_type,
                i.zone_id
            FROM 
                ${this.options.databricks.schema}.gold_store_interaction_metrics i
            ${whereClause}
            ORDER BY 
                i.timestamp DESC
            LIMIT 100
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get brand distribution data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Brand distribution data
     */
    async getBrandDistribution(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE bd.store_id = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                bd.store_id, 
                s.store_name, 
                bd.brand_id, 
                b.brand_name, 
                b.company_name,
                b.is_tbwa_client,
                bd.sales_contribution_pct, 
                bd.shelf_space_pct, 
                bd.rank_in_store,
                bd.as_of_date
            FROM 
                ${this.options.databricks.schema}.gold_store_brand_distribution bd
            JOIN 
                ${this.options.databricks.schema}.gold_stores s ON bd.store_id = s.store_id
            JOIN 
                ${this.options.databricks.schema}.gold_brands b ON bd.brand_id = b.brand_id
            ${whereClause}
            ORDER BY 
                bd.store_id, bd.rank_in_store
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get regional performance data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Regional performance data
     */
    async getRegionalPerformance(filters = {}) {
        const query = `
            SELECT 
                r.region_id, 
                r.region_name,
                SUM(m.sales_30d) AS total_sales,
                COUNT(DISTINCT s.store_id) AS store_count,
                AVG(m.growth_rate_pct) AS avg_growth_rate,
                AVG(m.conversion_rate_pct) AS avg_conversion_rate
            FROM 
                ${this.options.databricks.schema}.gold_regions r
            JOIN 
                ${this.options.databricks.schema}.gold_provinces p ON r.region_id = p.region_id
            JOIN 
                ${this.options.databricks.schema}.gold_cities c ON p.province_id = c.province_id
            JOIN 
                ${this.options.databricks.schema}.gold_barangays b ON c.city_id = b.city_id
            JOIN 
                ${this.options.databricks.schema}.gold_stores s ON b.barangay_id = s.barangay_id
            JOIN 
                ${this.options.databricks.schema}.gold_store_metrics m ON s.store_id = m.store_id
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
     * Get transcript sentiment data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Transcript sentiment data
     */
    async getTranscriptSentiment(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE ts.store_id = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                ts.store_id,
                s.store_name,
                ts.window_start,
                ts.window_end,
                ts.total_transcripts,
                ts.positive_count,
                ts.negative_count,
                ts.neutral_count,
                ts.avg_sentiment_score,
                ts.positive_rate,
                ts.negative_rate
            FROM 
                ${this.options.databricks.schema}.gold_transcript_sentiment_analysis ts
            JOIN 
                ${this.options.databricks.schema}.gold_stores s ON ts.store_id = s.store_id
            ${whereClause}
            ORDER BY 
                ts.window_start DESC
            LIMIT 30
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get dashboard KPIs from the gold layer
     * @returns {Promise<Object>} Dashboard KPIs
     */
    async getDashboardKPIs() {
        const query = `
            WITH store_metrics AS (
                SELECT 
                    SUM(m.sales_30d) AS total_sales,
                    AVG(m.conversion_rate_pct) AS avg_conversion_rate,
                    AVG(m.growth_rate_pct) AS avg_growth_rate,
                    COUNT(DISTINCT m.store_id) AS total_stores
                FROM 
                    ${this.options.databricks.schema}.gold_store_metrics m
                JOIN 
                    ${this.options.databricks.schema}.gold_stores s ON m.store_id = s.store_id
                WHERE 
                    s.store_type_id = 1  -- Sari-Sari stores only
            ),
            brand_sentiment AS (
                SELECT 
                    AVG(CASE 
                        WHEN m.sentiment_score > 0.5 THEN 100
                        WHEN m.sentiment_score > 0 AND m.sentiment_score <= 0.5 THEN 75
                        WHEN m.sentiment_score = 0 THEN 50
                        WHEN m.sentiment_score < 0 AND m.sentiment_score >= -0.5 THEN 25
                        ELSE 0 
                    END) AS brand_sentiment_score
                FROM 
                    ${this.options.databricks.schema}.gold_brand_mentions m
                JOIN 
                    ${this.options.databricks.schema}.gold_brands b ON m.brand_id = b.brand_id
                WHERE 
                    b.is_tbwa_client = TRUE
            )
            SELECT 
                sm.total_sales,
                sm.avg_conversion_rate,
                sm.avg_growth_rate,
                sm.total_stores,
                bs.brand_sentiment_score AS brand_sentiment
            FROM 
                store_metrics sm
            CROSS JOIN 
                brand_sentiment bs
        `;
        
        const results = await this.executeQuery(query);
        return results[0] || {};
    }
    
    /**
     * Get device health metrics from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Device health metrics
     */
    async getDeviceHealth(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE dh.store_id = $1';
            params.push(filters.storeId);
        }
        
        const query = `
            SELECT 
                dh.store_id,
                s.store_name,
                dh.window_start,
                dh.window_end,
                dh.total_devices,
                dh.online_devices,
                dh.offline_devices,
                dh.warning_devices,
                dh.error_devices,
                dh.devices_with_errors,
                dh.avg_battery_level,
                dh.min_battery_level,
                dh.avg_temperature_c,
                dh.max_temperature_c,
                dh.avg_memory_usage,
                dh.avg_disk_usage,
                dh.avg_network_signal,
                dh.avg_camera_fps,
                dh.device_online_rate
            FROM 
                ${this.options.databricks.schema}.gold_device_health_summary dh
            JOIN 
                ${this.options.databricks.schema}.gold_stores s ON dh.store_id = s.store_id
            ${whereClause}
            ORDER BY 
                dh.window_start DESC
            LIMIT 24
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get AI-generated insights from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} AI insights
     */
    async getInsights(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.storeId) {
            whereClause = 'WHERE i.store_id = $1';
            params.push(filters.storeId);
        } else if (filters.insightType) {
            whereClause = 'WHERE i.insight_type = $1';
            params.push(filters.insightType);
        }
        
        const query = `
            SELECT 
                i.insight_id,
                i.store_id,
                s.store_name,
                i.timestamp,
                i.insight_type,
                i.insight_text,
                i.confidence_score,
                i.data_source,
                i.metadata,
                i.is_actionable,
                i.priority_level
            FROM 
                ${this.options.databricks.schema}.gold_insights i
            JOIN 
                ${this.options.databricks.schema}.gold_stores s ON i.store_id = s.store_id
            ${whereClause}
            ORDER BY 
                i.timestamp DESC, i.priority_level ASC
            LIMIT 20
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get insight feedback data from the gold layer
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Insight feedback data
     */
    async getInsightFeedback(filters = {}) {
        const params = [];
        let whereClause = '';
        
        if (filters.insightId) {
            whereClause = 'WHERE f.insight_id = $1';
            params.push(filters.insightId);
        }
        
        const query = `
            SELECT 
                f.insight_id,
                f.timestamp,
                f.session_id,
                f.store_id,
                s.store_name,
                f.advisor_id,
                f.feedback_type,
                f.insight_category,
                f.confidence_score,
                f.action_taken,
                f.customer_outcome,
                f.notes,
                f.metadata,
                f.ingestion_time,
                f.processing_time
            FROM 
                ${this.options.databricks.schema}.gold_insight_feedback f
            JOIN 
                ${this.options.databricks.schema}.gold_stores s ON f.store_id = s.store_id
            ${whereClause}
            ORDER BY 
                f.timestamp DESC
            LIMIT 50
        `;
        
        return this.executeQuery(query, params);
    }
    
    /**
     * Get data freshness metrics
     * @returns {Promise<Object>} Data freshness metrics
     */
    async getDataFreshness() {
        const query = `
            SELECT
                'store_metrics' AS data_type,
                MAX(as_of_date) AS last_updated,
                DATEDIFF(NOW(), MAX(as_of_date)) AS days_since_update
            FROM
                ${this.options.databricks.schema}.gold_store_metrics
                
            UNION ALL
            
            SELECT
                'interaction_metrics' AS data_type,
                MAX(window_end) AS last_updated,
                DATEDIFF(NOW(), MAX(window_end)) AS days_since_update
            FROM
                ${this.options.databricks.schema}.gold_store_interaction_metrics
                
            UNION ALL
            
            SELECT
                'transcript_sentiment' AS data_type,
                MAX(window_end) AS last_updated,
                DATEDIFF(NOW(), MAX(window_end)) AS days_since_update
            FROM
                ${this.options.databricks.schema}.gold_transcript_sentiment_analysis
                
            UNION ALL
            
            SELECT
                'device_health' AS data_type,
                MAX(window_end) AS last_updated,
                DATEDIFF(NOW(), MAX(window_end)) AS days_since_update
            FROM
                ${this.options.databricks.schema}.gold_device_health_summary
        `;
        
        return this.executeQuery(query);
    }
    
    /**
     * Log a message
     * @param {string} level - Log level (debug, info, warn, error)
     * @param {string} message - Log message
     * @param {Error} [error] - Error object
     */
    log(level, message, error = null) {
        const logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        const configLevel = this.options.logging.level.toLowerCase();
        
        if (logLevels[level] >= logLevels[configLevel]) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [DatabricksSQLConnector] [${level.toUpperCase()}] ${message}`;
            
            switch (level) {
                case 'debug':
                    console.debug(logMessage);
                    break;
                case 'info':
                    console.info(logMessage);
                    break;
                case 'warn':
                    console.warn(logMessage);
                    break;
                case 'error':
                    console.error(logMessage);
                    if (error) {
                        console.error(error);
                    }
                    break;
            }
        }
    }
    
    /**
     * Get connector statistics
     * @returns {Object} Connector statistics
     */
    getStats() {
        return {
            ...this.stats,
            lastUpdated: this.lastUpdated,
            simulationMode: this.options.simulation.enabled,
            cacheEnabled: this.options.cache.enabled,
            cacheEntries: Object.keys(this.cache).length,
            timestamp: new Date().toISOString()
        };
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

module.exports = DatabricksSQLConnector;