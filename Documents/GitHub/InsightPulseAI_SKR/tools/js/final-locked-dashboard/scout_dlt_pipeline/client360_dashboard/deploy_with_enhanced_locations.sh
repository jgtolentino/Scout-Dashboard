#!/bin/bash
# Deploy Client360 Dashboard with enhanced location data

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/location_deploy_${TIMESTAMP}.log"

# Create logs directory
mkdir -p logs
mkdir -p output

echo -e "${GREEN}Deploying Client360 Dashboard with Enhanced Location Data${NC}" | tee -a "$LOG_FILE"

# 1. First check if enhanced location data exists
if [ ! -f "data/sample_data/enhanced_stores.geojson" ] || [ ! -f "data/sample_data/enhanced_store_locations.json" ] || [ ! -f "data/sample_data/barangay_performance.json" ]; then
  echo -e "${RED}Error: Enhanced location data files not found.${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}Please ensure the following files exist:${NC}" | tee -a "$LOG_FILE"
  echo -e "  - data/sample_data/enhanced_stores.geojson" | tee -a "$LOG_FILE"
  echo -e "  - data/sample_data/enhanced_store_locations.json" | tee -a "$LOG_FILE"
  echo -e "  - data/sample_data/barangay_performance.json" | tee -a "$LOG_FILE"
  exit 1
fi

# 2. Build the dashboard with TBWA theme
echo -e "${YELLOW}Building dashboard with TBWA theme...${NC}" | tee -a "$LOG_FILE"
./scripts/deploy_tbwa_theme.sh 2>&1 | tee -a "$LOG_FILE"

# 3. Set up directories for the deployment
echo -e "${YELLOW}Setting up deployment directories...${NC}" | tee -a "$LOG_FILE"
mkdir -p client360/public/data/sample_data
mkdir -p client360/public/js

# 4. Copy enhanced location data files
echo -e "${YELLOW}Copying enhanced location data files...${NC}" | tee -a "$LOG_FILE"
cp data/sample_data/enhanced_stores.geojson client360/public/data/sample_data/
cp data/sample_data/enhanced_store_locations.json client360/public/data/sample_data/
cp data/sample_data/barangay_performance.json client360/public/data/sample_data/
cp data/sample_data/fmcg_sample_data.json client360/public/data/sample_data/

# 5. Create a store location loader script
echo -e "${YELLOW}Creating store location loader script...${NC}" | tee -a "$LOG_FILE"

cat > client360/public/js/store_location_loader.js << 'EOF'
/**
 * Store Location Loader for Client360 Dashboard
 * 
 * This module handles loading and processing of store location data
 * with enhanced support for barangay, city/municipality level details.
 */

(function() {
  // Cache for loaded location data
  const dataCache = {
    geojson: null,
    locations: null,
    barangay: null
  };

  /**
   * Loads store location data in GeoJSON format
   * @returns {Promise<Object>} GeoJSON data
   */
  async function loadStoreGeoJSON() {
    if (dataCache.geojson) {
      return dataCache.geojson;
    }

    try {
      const response = await fetch('/data/sample_data/enhanced_stores.geojson');
      if (!response.ok) {
        throw new Error(`Failed to load GeoJSON data: ${response.statusText}`);
      }
      
      const data = await response.json();
      dataCache.geojson = data;
      return data;
    } catch (error) {
      console.error('Error loading GeoJSON data:', error);
      throw error;
    }
  }

  /**
   * Loads detailed store location data
   * @returns {Promise<Object>} Store location data
   */
  async function loadStoreLocations() {
    if (dataCache.locations) {
      return dataCache.locations;
    }

    try {
      const response = await fetch('/data/sample_data/enhanced_store_locations.json');
      if (!response.ok) {
        throw new Error(`Failed to load store locations: ${response.statusText}`);
      }
      
      const data = await response.json();
      dataCache.locations = data;
      return data;
    } catch (error) {
      console.error('Error loading store locations:', error);
      throw error;
    }
  }

  /**
   * Loads barangay performance data
   * @returns {Promise<Object>} Barangay performance data
   */
  async function loadBarangayPerformance() {
    if (dataCache.barangay) {
      return dataCache.barangay;
    }

    try {
      const response = await fetch('/data/sample_data/barangay_performance.json');
      if (!response.ok) {
        throw new Error(`Failed to load barangay data: ${response.statusText}`);
      }
      
      const data = await response.json();
      dataCache.barangay = data;
      return data;
    } catch (error) {
      console.error('Error loading barangay data:', error);
      throw error;
    }
  }

  /**
   * Filters store locations by region, city, barangay, or store type
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Filtered store data
   */
  async function filterStoreLocations(options = {}) {
    const { region, city, barangay, storeType, brandFilter } = options;
    
    try {
      const locations = await loadStoreLocations();
      
      return locations.locations.filter(store => {
        // Apply region filter
        if (region && store.address.region !== region) {
          return false;
        }
        
        // Apply city filter
        if (city && store.address.city_municipality !== city) {
          return false;
        }
        
        // Apply barangay filter
        if (barangay && store.address.barangay !== barangay) {
          return false;
        }
        
        // Apply store type filter
        if (storeType && store.store_type !== storeType) {
          return false;
        }

        // Apply brand filter
        if (brandFilter && !store.top_brands.includes(brandFilter)) {
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error filtering store locations:', error);
      return [];
    }
  }

  /**
   * Gets stats by geographical level
   * @param {string} level - 'region', 'city', 'barangay'
   * @returns {Promise<Array>} Aggregated stats
   */
  async function getLocationStats(level = 'region') {
    try {
      const locations = await loadStoreLocations();
      const stats = {};
      
      // Aggregate by selected level
      locations.locations.forEach(store => {
        let key;
        
        if (level === 'region') {
          key = store.address.region;
        } else if (level === 'city') {
          key = `${store.address.city_municipality}, ${store.address.region}`;
        } else if (level === 'barangay') {
          key = `${store.address.barangay}, ${store.address.city_municipality}`;
        } else {
          key = store.address.region;
        }
        
        if (!stats[key]) {
          stats[key] = {
            name: key,
            count: 0,
            total_sales: 0,
            avg_sales: 0,
            store_types: {}
          };
        }
        
        stats[key].count++;
        stats[key].total_sales += store.metrics.sales_30d;
        
        // Count store types
        if (!stats[key].store_types[store.store_type]) {
          stats[key].store_types[store.store_type] = 0;
        }
        stats[key].store_types[store.store_type]++;
      });
      
      // Calculate averages and convert to array
      return Object.values(stats).map(item => {
        item.avg_sales = item.total_sales / item.count;
        return item;
      });
    } catch (error) {
      console.error(`Error getting ${level} stats:`, error);
      return [];
    }
  }

  /**
   * Gets detailed barangay performance metrics
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Filtered barangay data
   */
  async function getBarangayMetrics(options = {}) {
    const { region, city, barangay } = options;
    
    try {
      const data = await loadBarangayPerformance();
      
      return data.data.filter(item => {
        // Apply region filter
        if (region && item.region !== region) {
          return false;
        }
        
        // Apply city filter
        if (city && item.city_municipality !== city) {
          return false;
        }
        
        // Apply barangay filter
        if (barangay && item.barangay !== barangay) {
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error getting barangay metrics:', error);
      return [];
    }
  }

  // Export the public API
  window.StoreLocationLoader = {
    loadStoreGeoJSON,
    loadStoreLocations,
    loadBarangayPerformance,
    filterStoreLocations,
    getLocationStats,
    getBarangayMetrics
  };
})();
EOF

# 6. Update the index.html file to include the location loader script
echo -e "${YELLOW}Updating index.html with location loader script...${NC}" | tee -a "$LOG_FILE"
if [ -f "client360/public/index.html" ]; then
  # Add the script tag before the closing </body> tag
  sed -i '' 's|</body>|<script src="/js/store_location_loader.js"></script></body>|g' "client360/public/index.html"
  
  # Add FMCG title
  sed -i '' 's|<title>Client360 Dashboard</title>|<title>FMCG Location Intelligence Dashboard</title>|g' "client360/public/index.html"
  
  # Update any dashboard title in the content if it exists
  if grep -q "<h1.*>Client360 Dashboard</h1>" "client360/public/index.html"; then
    sed -i '' 's|<h1.*>Client360 Dashboard</h1>|<h1 class="dashboard-title">FMCG Location Intelligence Dashboard</h1>|g' "client360/public/index.html"
  fi
  
  echo -e "${GREEN}✅ Updated index.html successfully${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${RED}Error: client360/public/index.html not found${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# 7. Build the final client360 dashboard
echo -e "${YELLOW}Building final dashboard...${NC}" | tee -a "$LOG_FILE"
cd client360
mkdir -p build
cp -r public/* build/
cd ..

# 8. Create a deployment package
echo -e "${YELLOW}Creating deployment package...${NC}" | tee -a "$LOG_FILE"
ZIPFILE="output/fmcg_location_dashboard_${TIMESTAMP}.zip"
cd client360/build
zip -r "../../$ZIPFILE" * | tee -a "../../$LOG_FILE"
cd ../..

echo -e "${GREEN}✅ FMCG Location Dashboard deployment package created: $ZIPFILE${NC}" | tee -a "$LOG_FILE"

# 9. Create deployment report
REPORT_FILE="reports/location_deployment_${TIMESTAMP}.md"
mkdir -p reports

cat > "$REPORT_FILE" << EOF
# FMCG Location Intelligence Dashboard Deployment

## Deployment Summary
- **Date**: $(date)
- **Theme**: TBWA
- **Focus**: FMCG Store Location Intelligence
- **Deployment Package**: $ZIPFILE

## Enhanced Location Data
- GeoJSON format with 20 store locations across the Philippines
- Detailed barangay, city/municipality, and province data
- Store metrics by location
- Barangay-level performance metrics for 12 high-priority areas
- Top brand and category data by location

## Key Features
- Interactive store map with barangay-level filters
- Performance metrics by administrative level (region, city, barangay)
- Store type distribution by location
- Brand performance by geography
- Product category penetration by location

## Deployment Instructions
To deploy to Azure Static Web Apps, run:

\`\`\`bash
az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN
\`\`\`

Replace YOUR_API_TOKEN with your Azure Static Web App deployment token.

## Documentation
The store location loader provides APIs for accessing:
- GeoJSON store locations (loadStoreGeoJSON)
- Detailed store data (loadStoreLocations)
- Barangay performance metrics (loadBarangayPerformance)
- Location filtering (filterStoreLocations)
- Geographic aggregation (getLocationStats)
- Barangay-level metrics (getBarangayMetrics)
EOF

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"

echo -e "${GREEN}FMCG Location Dashboard deployment complete!${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}To deploy to Azure, run:${NC}" | tee -a "$LOG_FILE"
echo -e "az staticwebapp deploy --name $APP --resource-group $RG --source $ZIPFILE --token YOUR_API_TOKEN" | tee -a "$LOG_FILE"