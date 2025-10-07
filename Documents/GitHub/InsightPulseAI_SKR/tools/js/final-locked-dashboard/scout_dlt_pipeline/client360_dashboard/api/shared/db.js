// Shared database helper for Azure Functions
const path = require('path');

// Import the existing Databricks SQL connector
const DatabricksSQLConnector = require('../../data/databricks_sql_connector');

/**
 * Database helper class for Azure Functions
 */
class DatabaseHelper {
    constructor() {
        this.connector = null;
        this.isInitialized = false;
    }

    /**
     * Initialize database connection
     * @returns {Promise<DatabricksSQLConnector>}
     */
    async initialize() {
        if (this.isInitialized && this.connector) {
            return this.connector;
        }

        try {
            // Create new DatabricksSQLConnector instance
            this.connector = new DatabricksSQLConnector({
                // Azure Function specific configuration
                databricks: {
                    host: process.env.DATABRICKS_SQL_HOST,
                    path: process.env.DATABRICKS_SQL_PATH,
                    token: process.env.DATABRICKS_SQL_TOKEN,
                    catalog: process.env.DATABRICKS_CATALOG || 'client360_catalog',
                    schema: process.env.DATABRICKS_SCHEMA || 'client360'
                },
                keyVault: {
                    name: process.env.KEY_VAULT_NAME,
                    useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true'
                },
                simulation: {
                    enabled: process.env.SIMULATION_MODE === 'true' || false,
                    dataPath: path.join(__dirname, '../../data/sample_data.json')
                },
                logging: {
                    level: process.env.LOG_LEVEL || 'info',
                    enableTelemetry: process.env.ENABLE_TELEMETRY === 'true'
                }
            });

            await this.connector.initialize();
            this.isInitialized = true;
            
            return this.connector;
        } catch (error) {
            console.error('Failed to initialize database helper:', error);
            throw error;
        }
    }

    /**
     * Execute a database query
     * @param {string} query - SQL query to execute
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async executeQuery(query, params = []) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.connector.executeQuery(query, params);
    }

    /**
     * Get connector instance
     * @returns {Promise<DatabricksSQLConnector>}
     */
    async getConnector() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.connector;
    }

    /**
     * Close database connection
     */
    close() {
        if (this.connector) {
            this.connector.close();
            this.isInitialized = false;
            this.connector = null;
        }
    }

    /**
     * Get connection health status
     * @returns {Promise<Object>} Health status
     */
    async getHealthStatus() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const stats = this.connector.getStats();
            return {
                status: 'healthy',
                connector: 'DatabricksSQLConnector',
                simulationMode: stats.simulationMode,
                lastUpdated: stats.lastUpdated,
                queriesExecuted: stats.queriesExecuted,
                queriesCached: stats.queriesCached,
                errors: stats.errors,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export both the class and a singleton instance
const dbHelper = new DatabaseHelper();

module.exports = {
    DatabaseHelper,
    DatabricksSQLConnector,
    // Legacy compatibility
    queryDatabase: async (queryText, params = []) => {
        return await dbHelper.executeQuery(queryText, params);
    },
    // Singleton instance for convenience
    getInstance: () => dbHelper
};