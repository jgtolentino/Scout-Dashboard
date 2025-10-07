/**
 * Export Static Metrics Script
 * 
 * This script exports metrics from Databricks SQL into static JSON files
 * that can be deployed with a static dashboard application.
 * 
 * It pulls data from Databricks SQL endpoints using the DatabricksSQLConnector
 * and writes static JSON/CSV files to the specified output directory.
 */

const fs = require('fs');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Import the Databricks SQL connector
const DatabricksSQLConnector = require('../final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/data/databricks_sql_connector');

// Output directory for static files
const OUTPUT_DIR = path.resolve(__dirname, '../deploy/data');

// Make sure the output directory exists
function ensureOutputDir() {
  // Create parent directories if they don't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

// Write data to a JSON file
function writeJsonFile(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Exported data to ${filePath}`);
}

// Main export function
async function exportStaticMetrics() {
  try {
    console.log('Starting export of static metrics...');
    ensureOutputDir();

    // Initialize Databricks SQL connector
    const connector = new DatabricksSQLConnector({
      simulation: { 
        enabled: process.env.SIMULATION_MODE === 'true' || false
      },
      keyVault: { 
        name: process.env.KEY_VAULT_NAME || 'kv-client360',
        useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true' || true
      },
      databricks: {
        host: process.env.DATABRICKS_SQL_HOST || 'adb-123456789012345.6.azuredatabricks.net',
        path: process.env.DATABRICKS_SQL_PATH || '/sql/1.0/warehouses/abcdefg1234567890',
        token: process.env.DATABRICKS_SQL_TOKEN || '',
        catalog: process.env.DATABRICKS_CATALOG || 'client360_catalog',
        schema: process.env.DATABRICKS_SCHEMA || 'client360'
      }
    });

    // Ensure connector is initialized
    await connector.initialize();
    console.log('Databricks SQL connector initialized successfully');

    // 1. Dashboard KPIs (Summary metrics)
    console.log('Exporting dashboard KPIs...');
    const kpis = await connector.getDashboardKPIs();
    writeJsonFile('kpis.json', kpis);

    // 2. Top Stores by Sales (Last 30 days)
    console.log('Exporting top stores by sales...');
    const topStores = await connector.getStoreMetrics();
    const topStoresSorted = topStores.sort((a, b) => b.sales_30d - a.sales_30d).slice(0, 10);
    writeJsonFile('top_stores.json', topStoresSorted);

    // 3. Regional Performance
    console.log('Exporting regional performance data...');
    const regionalPerformance = await connector.getRegionalPerformance();
    writeJsonFile('regional_performance.json', regionalPerformance);

    // 4. Brand Data (with sentiment scores)
    console.log('Exporting brand data...');
    const brandData = await connector.getBrands({ tbwaOnly: true });
    writeJsonFile('brands.json', brandData);

    // 5. Store Brand Distribution (get for top stores)
    console.log('Exporting brand distribution for top stores...');
    if (topStoresSorted && topStoresSorted.length > 0) {
      const firstStoreId = topStoresSorted[0].store_id;
      const brandDistribution = await connector.getBrandDistribution({ storeId: firstStoreId });
      writeJsonFile('brand_distribution.json', brandDistribution);
    }

    // 6. GenAI Insights
    console.log('Exporting AI-generated insights...');
    const insights = await connector.getInsights();
    writeJsonFile('insights.json', insights);

    // 7. Data Freshness (for display on dashboard)
    console.log('Exporting data freshness metrics...');
    const dataFreshness = await connector.getDataFreshness();
    writeJsonFile('data_freshness.json', dataFreshness);

    // 8. Export metadata about this export process
    const metadata = {
      exported_at: new Date().toISOString(),
      connector_stats: connector.getStats(),
      files_generated: [
        'kpis.json',
        'top_stores.json',
        'regional_performance.json',
        'brands.json',
        'brand_distribution.json',
        'insights.json',
        'data_freshness.json'
      ]
    };
    writeJsonFile('metadata.json', metadata);

    console.log('✅ Static metrics export completed successfully');
    
    // Close the connector
    connector.close();
    
    return true;
  } catch (error) {
    console.error('❌ Error exporting static metrics:', error);
    throw error;
  }
}

// Run the export function if this script is executed directly
if (require.main === module) {
  exportStaticMetrics()
    .then(() => {
      console.log('Static metrics export completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during static metrics export:', error);
      process.exit(1);
    });
}

// Export for use in other modules
module.exports = { exportStaticMetrics };