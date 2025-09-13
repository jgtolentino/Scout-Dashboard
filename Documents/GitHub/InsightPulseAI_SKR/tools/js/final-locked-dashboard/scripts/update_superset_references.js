/**
 * Update Superset References
 * 
 * This script updates references to Superset in README files and dashboard code.
 * It adds support for the top_brands.json dataset in dashboard_integrator.js.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  readmeFiles: [
    'README.md',
    'README_DATA_SOURCES.md',
    'README_SCOUT_EDGE.md',
    'README_SCOUT_ADVISOR.md',
    'README_DESKTOP.md',
    'README_SQL_INTEGRATION.md'
  ],
  dashboardIntegratorPath: path.join('retail_edge', 'js', 'dashboard_integrator.js'),
  medallionConnectorPath: path.join('retail_edge', 'js', 'medallion_data_connector.js')
};

/**
 * Updates README files to replace Superset references
 */
function updateReadmeFiles() {
  console.log('Updating README files to remove Superset references...');
  
  const supersetReplacements = [
    {
      pattern: /Superset dashboard/gi,
      replacement: 'Scout Edge dashboard'
    },
    {
      pattern: /Query data from Superset/gi,
      replacement: 'Query data from static JSON APIs'
    },
    {
      pattern: /Superset integration/gi,
      replacement: 'Static Web App integration'
    },
    {
      pattern: /Superset queries/gi,
      replacement: 'SQL queries (pre-generated)'
    },
    {
      pattern: /Connecting to Superset/gi,
      replacement: 'Connecting to data services'
    }
  ];
  
  config.readmeFiles.forEach(readmeFile => {
    const filePath = path.join(config.rootDir, readmeFile);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const replacement of supersetReplacements) {
        const prevContent = content;
        content = content.replace(replacement.pattern, replacement.replacement);
        if (prevContent !== content) {
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${readmeFile}`);
      } else {
        console.log(`No changes needed in ${readmeFile}`);
      }
    } else {
      console.log(`Skipping ${readmeFile} - file not found`);
    }
  });
}

/**
 * Updates dashboard_integrator.js to add top_brands.json loading
 */
function updateDashboardIntegrator() {
  console.log('Updating dashboard_integrator.js to support top_brands.json...');
  
  const filePath = path.join(config.rootDir, config.dashboardIntegratorPath);
  
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${config.dashboardIntegratorPath} not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if top brands loading is already implemented
  if (content.includes('loadTopBrands') || content.includes('getTopBrands')) {
    console.log('Top brands loading already implemented. Skipping modification.');
    return;
  }
  
  // Add loadTopBrands method
  const loadDashboardDataPattern = /async loadDashboardData\(\) \{[^}]*Promise\.all\(\[\s*([^]*?)\s*\]\);/m;
  const loadDashboardDataReplacement = match => {
    // Extract the existing Promise.all contents
    const promiseAllContents = match.match(loadDashboardDataPattern)[1];
    
    // Append loadTopBrands to the Promise.all array
    return match.replace(
      promiseAllContents,
      promiseAllContents + (promiseAllContents.trim().endsWith(',') ? '' : ',') + 
      '\n        this.loadTopBrands(filters)'
    );
  };
  
  content = content.replace(loadDashboardDataPattern, loadDashboardDataReplacement);
  
  // Add loadTopBrands method at the end of the class, before the closing brace
  const loadTopBrandsMethod = `
  /**
   * Load top brands data
   * @param {Object} filters Data filters
   */
  async loadTopBrands(filters) {
    try {
      this.logMessage('Loading top brands data');
      
      // Load top brands data
      const topBrandsData = await this.medallionConnector.getTopBrands(filters);
      
      // Store the data
      this.loadedData.topBrands = topBrandsData;
      
      // Update top brands in the dashboard, if UI elements exist
      this.updateTopBrandsUI(topBrandsData);
      
      return topBrandsData;
    } catch (error) {
      this.logError('Error loading top brands data:', error);
      throw error;
    }
  }
  
  /**
   * Update top brands UI elements
   * @param {Object} data Top brands data
   */
  updateTopBrandsUI(data) {
    // Skip if no data
    if (!data || !data.data || !data.data.length) {
      this.logMessage('No top brands data to update UI');
      return;
    }
    
    // Find the brand filter dropdown
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
      // Clear existing options except the "All Brands" option
      const allOption = brandFilter.querySelector('option[value="all"]');
      brandFilter.innerHTML = '';
      
      if (allOption) {
        brandFilter.appendChild(allOption);
      } else {
        // Create "All Brands" option if it doesn't exist
        const option = document.createElement('option');
        option.value = 'all';
        option.text = 'All Brands';
        option.selected = true;
        brandFilter.appendChild(option);
      }
      
      // Add brand options
      data.data.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.BrandID.toString();
        option.text = brand.BrandName;
        brandFilter.appendChild(option);
      });
      
      this.logMessage('Updated brand filter with top brands');
    }
    
    // Update any other UI elements that display top brands
    // For example, a top brands list or chart
    const topBrandsList = document.getElementById('topBrandsList');
    if (topBrandsList) {
      // Clear the list
      topBrandsList.innerHTML = '';
      
      // Add top brands (limit to top 5)
      const topBrands = data.data.slice(0, 5);
      
      topBrands.forEach(brand => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
          <span>${brand.BrandName}</span>
          <span class="badge bg-primary rounded-pill">${brand.MarketSharePct}%</span>
        `;
        topBrandsList.appendChild(listItem);
      });
      
      this.logMessage('Updated top brands list');
    }
  }`;
  
  // Add the method before the closing brace of the class
  content = content.replace(/}\s*$/, `${loadTopBrandsMethod}\n}`);
  
  // Save the updated file
  fs.writeFileSync(filePath, content);
  console.log('Updated dashboard_integrator.js');
}

/**
 * Updates medallion_data_connector.js to add top brands fetching
 */
function updateMedallionConnector() {
  console.log('Updating medallion_data_connector.js to support top_brands.json...');
  
  const filePath = path.join(config.rootDir, config.medallionConnectorPath);
  
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${config.medallionConnectorPath} not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if top brands method is already implemented
  if (content.includes('getTopBrands')) {
    console.log('Top brands method already implemented. Skipping modification.');
    return;
  }
  
  // Add getTopBrands method at the end of the class before module.exports
  const getTopBrandsMethod = `
  /**
   * Get top brands data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Top brands data
   */
  async getTopBrands(params = {}) {
    // Use the silver layer since brand data comes from that layer
    return this.fetchData('silver', 'top_brands', params);
  }`;
  
  // Add the method before the closing brace and module.exports
  if (content.includes('// Export for different module systems')) {
    content = content.replace(
      /}\s*\n\s*\/\/ Export for different module systems/,
      `${getTopBrandsMethod}\n}\n\n// Export for different module systems`
    );
  } else {
    content = content.replace(/}\s*$/, `${getTopBrandsMethod}\n}`);
  }
  
  // Update mapLayerToFilePath method to support top_brands.json
  const mapLayerToFilePathPattern = /mapLayerToFilePath\(layer, endpoint\) \{[^}]*\}/s;
  if (content.match(mapLayerToFilePathPattern)) {
    const mapLayerToFilePathMethodContent = content.match(mapLayerToFilePathPattern)[0];
    
    // Check if the method already handles top_brands
    if (!mapLayerToFilePathMethodContent.includes('top_brands')) {
      // Add top_brands case to the special case section
      const updatedMethod = mapLayerToFilePathMethodContent.replace(
        /(\/\/ Special case for geospatial data endpoints\s*if \(endpoint === 'brand_mentions'[^)]*\))/,
        '$1 ||\n        endpoint === \'top_brands\''
      );
      
      content = content.replace(mapLayerToFilePathPattern, updatedMethod);
    }
  }
  
  // Save the updated file
  fs.writeFileSync(filePath, content);
  console.log('Updated medallion_data_connector.js');
}

/**
 * Create a web.config file for Azure Static Web App cache settings
 */
function createWebConfig() {
  console.log('Creating web.config file for Azure Static Web App...');
  
  const webConfigPath = path.join(config.rootDir, 'staticwebapp.config.json');
  
  // Check if the file already exists
  if (fs.existsSync(webConfigPath)) {
    let webConfig = JSON.parse(fs.readFileSync(webConfigPath, 'utf8'));
    
    // Check if globalHeaders section exists
    if (!webConfig.globalHeaders) {
      webConfig.globalHeaders = {};
    }
    
    // Add cache headers for JSON files
    webConfig.globalHeaders['/assets/data/simulated/*.json'] = {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    };
    
    // Write the updated config
    fs.writeFileSync(webConfigPath, JSON.stringify(webConfig, null, 2));
    console.log('Updated staticwebapp.config.json with cache headers');
  } else {
    // Create a new web.config file
    const webConfig = {
      "routes": [
        {
          "route": "/assets/data/simulated/*",
          "headers": {
            "Cache-Control": "public, max-age=3600"
          }
        },
        {
          "route": "/*",
          "serve": "/index.html",
          "statusCode": 200
        }
      ],
      "navigationFallback": {
        "rewrite": "/index.html",
        "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*"]
      },
      "globalHeaders": {
        "/assets/data/simulated/*.json": {
          "Cache-Control": "public, max-age=3600",
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff"
        }
      },
      "mimeTypes": {
        ".json": "application/json"
      }
    };
    
    fs.writeFileSync(webConfigPath, JSON.stringify(webConfig, null, 2));
    console.log('Created staticwebapp.config.json with cache headers');
  }
}

/**
 * Main function to run all updates
 */
function main() {
  console.log('Starting updates to replace Superset references...');
  
  try {
    // Update README files
    updateReadmeFiles();
    
    // Update dashboard_integrator.js
    updateDashboardIntegrator();
    
    // Update medallion_data_connector.js
    updateMedallionConnector();
    
    // Create web.config file
    createWebConfig();
    
    console.log('All updates completed successfully!');
    
    // Create a sample command to generate simulated data
    console.log('\nTo generate simulated data, run:');
    console.log('  cd scripts && bash sync_datasets_to_azure.sh --simulate');
    
    console.log('\nTo export data from the database and upload to Azure Blob Storage, run:');
    console.log('  cd scripts && bash sync_datasets_to_azure.sh');
  } catch (error) {
    console.error('Error during update process:', error);
    process.exit(1);
  }
}

// Run the main function
main();