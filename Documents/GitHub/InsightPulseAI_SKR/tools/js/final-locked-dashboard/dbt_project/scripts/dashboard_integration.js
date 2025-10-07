/**
 * Script to integrate dbt model exports with the Scout Edge dashboard
 * 
 * This script updates the necessary dashboard files to integrate with the exported dbt data.
 * It modifies the MedallionDataConnector to load data from the static JSON files.
 */
const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.resolve(__dirname, '../..');
const assetsDataDir = path.join(rootDir, 'assets/data');
const medallionConnectorPath = path.join(rootDir, 'js/medallion_data_connector.js');
const dashboardIntegratorPath = path.join(rootDir, 'js/dashboard_integrator.js');

// Ensure directories exist
if (!fs.existsSync(assetsDataDir)) {
  fs.mkdirSync(assetsDataDir, { recursive: true });
}

// Check if required JSON files exist
const requiredFiles = [
  'top_brands.json',
  'top_combos.json',
  'store_metrics.json',
  'geo_brand_mentions.json',
  'geo_sales_volume.json'
];

console.log('Checking for required JSON files...');
let missingFiles = [];
for (const file of requiredFiles) {
  const filePath = path.join(assetsDataDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error(`Error: The following required JSON files are missing: ${missingFiles.join(', ')}`);
  console.error('Please run ./run_and_export.sh to generate these files');
  process.exit(1);
}

// Update MedallionDataConnector.js
console.log('Updating MedallionDataConnector.js...');

let medallionConnectorCode = '';
if (fs.existsSync(medallionConnectorPath)) {
  medallionConnectorCode = fs.readFileSync(medallionConnectorPath, 'utf8');
} else {
  // Create a new connector if it doesn't exist
  medallionConnectorCode = `class MedallionDataConnector {
  constructor(config = {}) {
    this.config = {
      useSimulatedData: config.useSimulatedData || false,
      dataPath: config.dataPath || './assets/data/',
      ...config
    };
    
    this.cache = {};
  }
  
  // Main method to load data
  async loadData(datasetName, params = {}) {
    try {
      return await this._loadJSONData(datasetName, params);
    } catch (error) {
      console.error(\`Error loading \${datasetName} dataset:\`, error);
      return null;
    }
  }
  
  // Private method to load JSON data
  async _loadJSONData(datasetName, params = {}) {
    const url = \`\${this.config.dataPath}\${datasetName}.json\`;
    
    // Check cache
    const cacheKey = \`\${datasetName}_\${JSON.stringify(params)}\`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    // Fetch data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    
    // Cache the result
    this.cache[cacheKey] = data;
    
    return data;
  }
}

// Export for browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MedallionDataConnector;
} else {
  window.MedallionDataConnector = MedallionDataConnector;
}`;
}

// Add new methods for brand metrics if they don't exist
if (!medallionConnectorCode.includes('async loadTopBrands(')) {
  const insertPoint = medallionConnectorCode.lastIndexOf('}');
  
  const newMethods = `
  // Load top brands data
  async loadTopBrands(params = {}) {
    return this.loadData('top_brands', params);
  }
  
  // Load top brand combinations data
  async loadTopCombos(params = {}) {
    return this.loadData('top_combos', params);
  }
  
  // Load store metrics data
  async loadStoreMetrics(params = {}) {
    return this.loadData('store_metrics', params);
  }
  
  // Load geographical brand mentions data
  async loadGeoBrandMentions(params = {}) {
    return this.loadData('geo_brand_mentions', params);
  }
  
  // Load geographical sales volume data
  async loadGeoSalesVolume(params = {}) {
    return this.loadData('geo_sales_volume', params);
  }
`;

  medallionConnectorCode = 
    medallionConnectorCode.substring(0, insertPoint) + 
    newMethods + 
    medallionConnectorCode.substring(insertPoint);
}

fs.writeFileSync(medallionConnectorPath, medallionConnectorCode);
console.log('MedallionDataConnector.js updated');

// Create a toggle component for data source selection
const toggleComponentPath = path.join(rootDir, 'js/data_source_toggle.js');
if (!fs.existsSync(toggleComponentPath)) {
  console.log('Creating data_source_toggle.js component...');
  
  const toggleComponentCode = `/**
 * Data Source Toggle Component
 * 
 * This component provides a UI toggle for switching between different data sources
 * (static files, dbt exports, API, or simulated data) in the Scout Edge dashboard.
 */
class DataSourceToggle {
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'data-source-toggle',
      defaultSource: config.defaultSource || 'static', // 'static', 'dbt', 'api', or 'simulated'
      onChange: config.onChange || null,
      sources: config.sources || ['static', 'dbt', 'simulated'],
      labels: config.labels || {
        static: 'Static Files',
        dbt: 'dbt Models',
        api: 'API',
        simulated: 'Simulated'
      },
      ...config
    };
    
    this.currentSource = localStorage.getItem('scout_edge_data_source') || this.config.defaultSource;
    this.init();
  }
  
  init() {
    // Create container if it doesn't exist
    let container = document.getElementById(this.config.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.config.containerId;
      container.className = 'data-source-toggle';
      document.body.appendChild(container);
    }
    
    // Create the toggle control
    container.innerHTML = \`
      <div class="data-source-control">
        <label>Data Source:</label>
        <select id="data-source-select">
          \${this.config.sources.map(source => 
            \`<option value="\${source}" \${this.currentSource === source ? 'selected' : ''}>\${this.config.labels[source]}</option>\`
          ).join('')}
        </select>
        <div class="data-source-indicator \${this.currentSource}"></div>
      </div>
    \`;
    
    // Add styles
    if (!document.getElementById('data-source-toggle-styles')) {
      const style = document.createElement('style');
      style.id = 'data-source-toggle-styles';
      style.textContent = \`
        .data-source-toggle {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          padding: 5px 10px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          font-family: Arial, sans-serif;
          font-size: 12px;
        }
        .data-source-control {
          display: flex;
          align-items: center;
        }
        .data-source-control label {
          margin-right: 5px;
          font-weight: bold;
        }
        .data-source-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: 5px;
        }
        .data-source-indicator.static { background-color: #4CAF50; }
        .data-source-indicator.dbt { background-color: #2196F3; }
        .data-source-indicator.api { background-color: #FF9800; }
        .data-source-indicator.simulated { background-color: #F44336; }
      \`;
      document.head.appendChild(style);
    }
    
    // Add event listener
    const select = document.getElementById('data-source-select');
    select.addEventListener('change', e => {
      this.currentSource = e.target.value;
      localStorage.setItem('scout_edge_data_source', this.currentSource);
      
      // Update indicator
      const indicator = document.querySelector('.data-source-indicator');
      indicator.className = \`data-source-indicator \${this.currentSource}\`;
      
      // Call onChange callback if provided
      if (typeof this.config.onChange === 'function') {
        this.config.onChange(this.currentSource);
      }
      
      // Reload the page to apply the changes
      window.location.reload();
    });
    
    // Initialize the data source configuration
    this.applyDataSourceConfig();
  }
  
  applyDataSourceConfig() {
    // Set global configuration based on selected data source
    window.scoutEdgeConfig = window.scoutEdgeConfig || {};
    window.scoutEdgeConfig.dataSource = this.currentSource;
    window.scoutEdgeConfig.useSimulatedData = this.currentSource === 'simulated';
    
    // Configure paths based on data source
    let dataPath = './assets/data/';
    if (this.currentSource === 'dbt') {
      dataPath = './assets/data/'; // Using same path as static for dbt exports
    } else if (this.currentSource === 'api') {
      dataPath = './api/data/'; // API endpoint path
    }
    
    window.scoutEdgeConfig.dataPath = dataPath;
    
    // Return the current configuration
    return {
      dataSource: this.currentSource,
      useSimulatedData: window.scoutEdgeConfig.useSimulatedData,
      dataPath: window.scoutEdgeConfig.dataPath
    };
  }
  
  getCurrentSource() {
    return this.currentSource;
  }
  
  getConfig() {
    return {
      dataSource: this.currentSource,
      useSimulatedData: window.scoutEdgeConfig.useSimulatedData,
      dataPath: window.scoutEdgeConfig.dataPath
    };
  }
}

// Export for browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSourceToggle;
} else {
  window.DataSourceToggle = DataSourceToggle;
}`;

  fs.writeFileSync(toggleComponentPath, toggleComponentCode);
  console.log('data_source_toggle.js created');
}

// Create a GitHub Actions workflow for data sync
const workflowsDir = path.join(rootDir, '.github/workflows');
if (!fs.existsSync(workflowsDir)) {
  fs.mkdirSync(workflowsDir, { recursive: true });
}

const workflowPath = path.join(workflowsDir, 'dbt-data-sync.yml');
if (!fs.existsSync(workflowPath)) {
  console.log('Creating GitHub Actions workflow for data sync...');
  
  const workflowCode = `name: Scout Edge dbt Data Sync

on:
  # Run on schedule (daily at 3:00 AM UTC)
  schedule:
    - cron: '0 3 * * *'
  
  # Allow manual trigger from GitHub UI
  workflow_dispatch:
    inputs:
      use_sample_data:
        description: 'Use sample data instead of real database'
        required: false
        default: 'false'
        type: boolean
      days:
        description: 'Number of days of data to include'
        required: false
        default: '30'
        type: string

jobs:
  dbt-export:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r tools/js/final-locked-dashboard/dbt_project/requirements.txt
      
      - name: Set up environment variables
        if: \${{ github.event.inputs.use_sample_data != 'true' }}
        env:
          DBT_DATABRICKS_HOST: \${{ secrets.DBT_DATABRICKS_HOST }}
          DBT_DATABRICKS_HTTP_PATH: \${{ secrets.DBT_DATABRICKS_HTTP_PATH }}
          DBT_DATABRICKS_TOKEN: \${{ secrets.DBT_DATABRICKS_TOKEN }}
        run: |
          echo "DBT_DATABRICKS_HOST=\$DBT_DATABRICKS_HOST" >> $GITHUB_ENV
          echo "DBT_DATABRICKS_HTTP_PATH=\$DBT_DATABRICKS_HTTP_PATH" >> $GITHUB_ENV
          echo "DBT_DATABRICKS_TOKEN=\$DBT_DATABRICKS_TOKEN" >> $GITHUB_ENV
      
      - name: Generate dbt data
        working-directory: tools/js/final-locked-dashboard/dbt_project
        run: |
          if [[ "${{ github.event.inputs.use_sample_data }}" == "true" ]]; then
            echo "Using sample data"
            ./run_and_export.sh --sample --days=${{ github.event.inputs.days || '30' }}
          else
            echo "Connecting to real database"
            ./run_and_export.sh --days=${{ github.event.inputs.days || '30' }}
          fi
      
      - name: Upload data to Azure Blob Storage
        if: \${{ github.event.inputs.use_sample_data != 'true' }}
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az storage blob upload-batch \\
              --account-name \${{ secrets.AZURE_STORAGE_ACCOUNT }} \\
              --account-key \${{ secrets.AZURE_STORAGE_KEY }} \\
              --destination \${{ secrets.AZURE_BLOB_CONTAINER }}/data \\
              --source tools/js/final-locked-dashboard/assets/data \\
              --content-cache-control "max-age=3600" \\
              --overwrite true
      
      - name: Create a PR with updated data
        if: \${{ github.event_name == 'schedule' }}
        uses: peter-evans/create-pull-request@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          commit-message: "Update dbt data exports"
          title: "Daily dbt data update"
          body: "Automated data update from dbt models on \$(date '+%Y-%m-%d')"
          branch: "data-update/\$(date '+%Y-%m-%d')"
          add-paths: |
            tools/js/final-locked-dashboard/assets/data/*.json`;
  
  fs.writeFileSync(workflowPath, workflowCode);
  console.log('GitHub Actions workflow created at .github/workflows/dbt-data-sync.yml');
}

console.log('Dashboard integration setup complete!');
console.log('');
console.log('Next steps:');
console.log('1. Generate sample data: ./run_and_export.sh --sample');
console.log('2. Add the DataSourceToggle to your dashboard HTML');
console.log('3. Initialize the MedallionDataConnector with the toggle\'s configuration');
console.log('');
console.log('Example usage in your dashboard:');
console.log(`
<script src="./js/data_source_toggle.js"></script>
<script src="./js/medallion_data_connector.js"></script>
<script>
  // Initialize the data source toggle
  const dataSourceToggle = new DataSourceToggle({
    containerId: 'data-toggle-container',
    defaultSource: 'dbt',
    onChange: (source) => console.log('Data source changed to:', source)
  });
  
  // Get configuration from the toggle
  const config = dataSourceToggle.getConfig();
  
  // Initialize the data connector with the config
  const dataConnector = new MedallionDataConnector({
    useSimulatedData: config.useSimulatedData,
    dataPath: config.dataPath
  });
  
  // Use the data connector to load data
  async function loadDashboardData() {
    const topBrands = await dataConnector.loadTopBrands();
    const geoData = await dataConnector.loadGeoBrandMentions();
    
    // Initialize your dashboard with the data
    initializeBrandMap(geoData);
    populateBrandTable(topBrands);
  }
  
  // Load data when the page loads
  document.addEventListener('DOMContentLoaded', loadDashboardData);
</script>
`);