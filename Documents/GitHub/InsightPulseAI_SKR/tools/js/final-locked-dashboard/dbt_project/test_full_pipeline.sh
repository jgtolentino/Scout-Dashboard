#!/bin/bash
#
# Full end-to-end data pipeline test for Scout Edge Dashboard
# This script tests the entire data pipeline from dbt model execution to dashboard data availability
#

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set default parameters
USE_SAMPLE_DATA=false
EXPORT_DIR="../assets/data"
OUTPUT_DIR="./pipeline_test_results"
RUN_AUDIT=true
UPDATE_TIMESTAMPS=true
TIMESTAMP_SCENARIO="mixed"
MONITOR_FRESHNESS=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --sample)
      USE_SAMPLE_DATA=true
      shift
      ;;
    --export-dir)
      EXPORT_DIR="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --no-audit)
      RUN_AUDIT=false
      shift
      ;;
    --no-timestamps)
      UPDATE_TIMESTAMPS=false
      shift
      ;;
    --ts-scenario)
      TIMESTAMP_SCENARIO="$2"
      shift 2
      ;;
    --no-freshness)
      MONITOR_FRESHNESS=false
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --sample          Use sample data instead of real database"
      echo "  --export-dir DIR  Directory to export data files to (default: ../assets/data)"
      echo "  --output-dir DIR  Directory for test results (default: ./pipeline_test_results)"
      echo "  --no-audit        Skip Databricks data audit"
      echo "  --no-timestamps   Skip timestamp updates"
      echo "  --ts-scenario S   Timestamp scenario (all_fresh, all_stale, mixed, critical, degrading)"
      echo "  --no-freshness    Skip freshness monitoring"
      echo ""
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Start test
echo -e "${GREEN}Starting Scout Edge Dashboard full pipeline test${NC}"
echo -e "Configuration:"
echo -e "  Use sample data: $USE_SAMPLE_DATA"
echo -e "  Export directory: $EXPORT_DIR"
echo -e "  Output directory: $OUTPUT_DIR"
echo -e "  Run audit: $RUN_AUDIT"
echo -e "  Update timestamps: $UPDATE_TIMESTAMPS"
echo -e "  Timestamp scenario: $TIMESTAMP_SCENARIO"
echo -e "  Monitor freshness: $MONITOR_FRESHNESS"
echo ""

# Record start time
START_TIME=$(date +%s)
echo -e "Test started at $(date)"

# Step 1: Run Databricks data audit if enabled
if [ "$RUN_AUDIT" = true ]; then
  echo -e "\n${YELLOW}Step 1: Running Databricks data audit${NC}"
  if [ "$USE_SAMPLE_DATA" = true ]; then
    python scripts/audit_databricks_data.py --sample --output-dir "$OUTPUT_DIR"
  else
    python scripts/audit_databricks_data.py --output-dir "$OUTPUT_DIR"
  fi
  
  # Check if audit was successful
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data audit completed successfully${NC}"
  else
    echo -e "${RED}✗ Data audit failed${NC}"
    # Continue anyway, as we might want to test with sample data
  fi
else
  echo -e "\n${YELLOW}Step 1: Skipping Databricks data audit${NC}"
fi

# Step 2: Export data
echo -e "\n${YELLOW}Step 2: Exporting data from models${NC}"
if [ "$USE_SAMPLE_DATA" = true ]; then
  python scripts/export_to_json.py --sample --output-dir "$EXPORT_DIR"
else
  python scripts/export_to_json.py --output-dir "$EXPORT_DIR"
fi

# Check if export was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Data export completed successfully${NC}"
  
  # Count exported files
  FILE_COUNT=$(ls -1 "$EXPORT_DIR"/*.json 2>/dev/null | wc -l)
  echo -e "  Exported $FILE_COUNT JSON files to $EXPORT_DIR"
else
  echo -e "${RED}✗ Data export failed${NC}"
  exit 1
fi

# Step 3: Update timestamps if enabled
if [ "$UPDATE_TIMESTAMPS" = true ]; then
  echo -e "\n${YELLOW}Step 3: Updating timestamps to simulate data freshness${NC}"
  python scripts/update_timestamps.py --data-dir "$EXPORT_DIR" --scenario "$TIMESTAMP_SCENARIO"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Timestamp updates completed successfully${NC}"
  else
    echo -e "${RED}✗ Timestamp updates failed${NC}"
    # Continue anyway
  fi
else
  echo -e "\n${YELLOW}Step 3: Skipping timestamp updates${NC}"
fi

# Step 4: Monitor data freshness if enabled
if [ "$MONITOR_FRESHNESS" = true ]; then
  echo -e "\n${YELLOW}Step 4: Monitoring data freshness${NC}"
  python scripts/monitor_freshness.py --data-dir "$EXPORT_DIR" --output "$EXPORT_DIR/metadata.json"
  
  # Copy metadata.json to output directory for analysis
  cp "$EXPORT_DIR/metadata.json" "$OUTPUT_DIR/"
  
  # Check freshness result
  FRESH_EXIT_CODE=$?
  if [ $FRESH_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All datasets are fresh${NC}"
  else
    echo -e "${YELLOW}! Some datasets are stale (this may be expected based on timestamp scenario)${NC}"
  fi
else
  echo -e "\n${YELLOW}Step 4: Skipping data freshness monitoring${NC}"
fi

# Step 5: Validate exported data structure
echo -e "\n${YELLOW}Step 5: Validating data structure${NC}"

# Define expected files
EXPECTED_FILES=(
  "geo_brand_distribution.json"
  "geo_brand_mentions.json"
  "geo_sales_volume.json"
  "store_metrics.json"
  "top_brands.json"
  "top_combos.json"
  "metadata.json"
)

# Check for presence of each expected file
MISSING_FILES=0
for file in "${EXPECTED_FILES[@]}"; do
  if [ -f "$EXPORT_DIR/$file" ]; then
    echo -e "  ${GREEN}✓ $file exists${NC}"
    
    # Validate JSON syntax
    if jq empty "$EXPORT_DIR/$file" 2>/dev/null; then
      echo -e "    ${GREEN}✓ Valid JSON format${NC}"
      
      # Get record count
      RECORD_COUNT=$(jq 'if type=="array" then length else 1 end' "$EXPORT_DIR/$file")
      echo -e "    Records: $RECORD_COUNT"
      
      # Check file size
      FILE_SIZE=$(du -h "$EXPORT_DIR/$file" | cut -f1)
      echo -e "    Size: $FILE_SIZE"
    else
      echo -e "    ${RED}✗ Invalid JSON format${NC}"
    fi
  else
    echo -e "  ${RED}✗ $file is missing${NC}"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -eq 0 ]; then
  echo -e "${GREEN}✓ All expected data files are present${NC}"
else
  echo -e "${RED}✗ Missing $MISSING_FILES data files${NC}"
fi

# Step 6: Run dashboard integration test
echo -e "\n${YELLOW}Step 6: Testing dashboard integration${NC}"

# Create test script
TEST_SCRIPT="$OUTPUT_DIR/dashboard_test.js"
cat > "$TEST_SCRIPT" << 'EOL'
/**
 * Scout Edge Dashboard Integration Test
 */
const fs = require('fs');
const path = require('path');

// Configuration
const dataDir = process.argv[2] || '../assets/data';
const outputDir = process.argv[3] || './';

// Test results
const results = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: []
};

/**
 * Run a test and record the result
 */
function runTest(name, testFn) {
  results.totalTests++;
  try {
    const result = testFn();
    if (result === true) {
      results.passedTests++;
      results.tests.push({
        name,
        status: 'passed'
      });
      console.log(`✓ ${name}`);
      return true;
    } else {
      results.failedTests++;
      results.tests.push({
        name,
        status: 'failed',
        message: result || 'Test returned false'
      });
      console.log(`✗ ${name}: ${result || 'Test returned false'}`);
      return false;
    }
  } catch (error) {
    results.failedTests++;
    results.tests.push({
      name,
      status: 'failed',
      message: error.message,
      stack: error.stack
    });
    console.log(`✗ ${name}: ${error.message}`);
    return false;
  }
}

/**
 * Load a JSON file
 */
function loadJson(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// Test 1: Check metadata.json structure
runTest('Metadata file has correct structure', () => {
  const metadata = loadJson('metadata.json');
  
  if (!metadata.generated_at) return 'Missing generated_at';
  if (!metadata.freshness_threshold_hours) return 'Missing freshness_threshold_hours';
  if (!metadata.datasets) return 'Missing datasets';
  
  return true;
});

// Test 2: Check top_brands.json structure
runTest('Top brands file has correct structure', () => {
  const topBrands = loadJson('top_brands.json');
  
  if (!Array.isArray(topBrands)) return 'Not an array';
  if (topBrands.length === 0) return 'Empty array';
  
  const firstItem = topBrands[0];
  const requiredFields = ['brand', 'state', 'city', 'transaction_count', 'sales_rank'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem)) return `Missing field: ${field}`;
  }
  
  return true;
});

// Test 3: Check store_metrics.json structure
runTest('Store metrics file has correct structure', () => {
  const storeMetrics = loadJson('store_metrics.json');
  
  if (!storeMetrics.type) return 'Missing type';
  if (storeMetrics.type !== 'FeatureCollection') return 'Not a GeoJSON FeatureCollection';
  if (!Array.isArray(storeMetrics.features)) return 'Missing features array';
  
  if (storeMetrics.features.length === 0) return 'Empty features array';
  
  const firstFeature = storeMetrics.features[0];
  if (!firstFeature.geometry) return 'Missing geometry';
  if (!firstFeature.properties) return 'Missing properties';
  
  return true;
});

// Test 4: Check geo_brand_distribution.json structure
runTest('Geo brand distribution file has correct structure', () => {
  const geoBrandDist = loadJson('geo_brand_distribution.json');
  
  if (!Array.isArray(geoBrandDist)) return 'Not an array';
  if (geoBrandDist.length === 0) return 'Empty array';
  
  const firstItem = geoBrandDist[0];
  const requiredFields = ['state', 'city', 'brand', 'mention_count', 'total_sales'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem)) return `Missing field: ${field}`;
  }
  
  return true;
});

// Test 5: Check geo_sales_volume.json structure
runTest('Geo sales volume file has correct structure', () => {
  const geoSalesVolume = loadJson('geo_sales_volume.json');
  
  if (!Array.isArray(geoSalesVolume)) return 'Not an array';
  if (geoSalesVolume.length === 0) return 'Empty array';
  
  const firstItem = geoSalesVolume[0];
  const requiredFields = ['state', 'city', 'transaction_count', 'total_sales'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem)) return `Missing field: ${field}`;
  }
  
  return true;
});

// Test 6: Check top_combos.json structure
runTest('Top combos file has correct structure', () => {
  const topCombos = loadJson('top_combos.json');
  
  if (!Array.isArray(topCombos)) return 'Not an array';
  if (topCombos.length === 0) return 'Empty array';
  
  const firstItem = topCombos[0];
  const requiredFields = ['brand_a', 'brand_b', 'state', 'city', 'transaction_count', 'lift'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem)) return `Missing field: ${field}`;
  }
  
  return true;
});

// Test 7: Check for data consistency across files
runTest('Data consistency across files', () => {
  const topBrands = loadJson('top_brands.json');
  const geoBrandDist = loadJson('geo_brand_distribution.json');
  
  // Get all states from top_brands
  const brandStates = new Set(topBrands.map(item => item.state));
  
  // Check if all states exist in geo_brand_distribution
  const geoStates = new Set(geoBrandDist.map(item => item.state));
  
  for (const state of brandStates) {
    if (!geoStates.has(state)) {
      return `State ${state} from top_brands not found in geo_brand_distribution`;
    }
  }
  
  return true;
});

// Test 8: Check metadata freshness fields
runTest('Metadata freshness information', () => {
  const metadata = loadJson('metadata.json');
  
  for (const [dataset, info] of Object.entries(metadata.datasets)) {
    if (!info.freshness) return `Missing freshness info for ${dataset}`;
    if (typeof info.freshness.is_fresh !== 'boolean') return `Invalid is_fresh value for ${dataset}`;
    if (typeof info.freshness.age_hours !== 'number') return `Invalid age_hours value for ${dataset}`;
  }
  
  return true;
});

// Save test results
const resultPath = path.join(outputDir, 'dashboard_integration_test_results.json');
fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));

console.log(`\nTests completed: ${results.passedTests}/${results.totalTests} passed`);
console.log(`Results saved to ${resultPath}`);

// Exit with appropriate code
process.exit(results.failedTests > 0 ? 1 : 0);
EOL

# Run the test script
node "$TEST_SCRIPT" "$EXPORT_DIR" "$OUTPUT_DIR"

# Check test results
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Dashboard integration tests passed${NC}"
else
  echo -e "${RED}✗ Dashboard integration tests failed${NC}"
fi

# Step 7: Generate test summary
echo -e "\n${YELLOW}Step 7: Generating test summary${NC}"

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

# Create summary file
SUMMARY_FILE="$OUTPUT_DIR/pipeline_test_summary.md"
cat > "$SUMMARY_FILE" << EOL
# Scout Edge Dashboard Pipeline Test Summary

**Test Date:** $(date)
**Duration:** ${MINUTES}m ${SECONDS}s

## Configuration

- Use sample data: $USE_SAMPLE_DATA
- Export directory: $EXPORT_DIR
- Timestamp scenario: $TIMESTAMP_SCENARIO

## Test Results

| Step | Status | Notes |
|------|--------|-------|
| Databricks Data Audit | $([ "$RUN_AUDIT" = true ] && echo "✓" || echo "Skipped") | $([ -f "$OUTPUT_DIR/DATABRICKS_DATA_AUDIT.md" ] && echo "[View detailed audit](DATABRICKS_DATA_AUDIT.md)" || echo "No audit file generated") |
| Data Export | $([ $FILE_COUNT -gt 0 ] && echo "✓" || echo "✗") | Exported $FILE_COUNT JSON files |
| Timestamp Updates | $([ "$UPDATE_TIMESTAMPS" = true ] && echo "✓" || echo "Skipped") | Used scenario: $TIMESTAMP_SCENARIO |
| Freshness Monitoring | $([ "$MONITOR_FRESHNESS" = true ] && echo "✓" || echo "Skipped") | $([ $FRESH_EXIT_CODE -eq 0 ] && echo "All datasets fresh" || echo "Some datasets stale") |
| Data Structure Validation | $([ $MISSING_FILES -eq 0 ] && echo "✓" || echo "✗") | $([ $MISSING_FILES -eq 0 ] && echo "All files present" || echo "Missing $MISSING_FILES files") |
| Dashboard Integration | $([ -f "$OUTPUT_DIR/dashboard_integration_test_results.json" ] && grep -q '"failedTests": 0' "$OUTPUT_DIR/dashboard_integration_test_results.json" && echo "✓" || echo "✗") | $([ -f "$OUTPUT_DIR/dashboard_integration_test_results.json" ] && jq -r '"Passed " + (.passedTests|tostring) + "/" + (.totalTests|tostring) + " tests"' "$OUTPUT_DIR/dashboard_integration_test_results.json" || echo "Test results not available") |

## Data Files

$(ls -la "$EXPORT_DIR"/*.json | awk '{print "- " $9 " (" $5 " bytes)"}')

## Next Steps

1. Review any failed tests and fix issues
2. Check data freshness if stale datasets were detected
3. Update the dbt models if needed
4. Validate dashboard visualizations
EOL

echo -e "${GREEN}✓ Test summary generated: $SUMMARY_FILE${NC}"

# Final summary
echo -e "\n${GREEN}Pipeline test completed in ${MINUTES}m ${SECONDS}s${NC}"
echo -e "Results saved to $OUTPUT_DIR"
echo -e "Summary: $SUMMARY_FILE"

# Exit with overall status
if [ $MISSING_FILES -eq 0 ] && [ -f "$OUTPUT_DIR/dashboard_integration_test_results.json" ] && grep -q '"failedTests": 0' "$OUTPUT_DIR/dashboard_integration_test_results.json"; then
  echo -e "\n${GREEN}SUCCESS: All critical tests passed${NC}"
  exit 0
else
  echo -e "\n${RED}FAILURE: Some tests failed${NC}"
  exit 1
fi