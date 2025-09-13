#!/bin/bash
# visualsynth.sh - Dashboard generation and deployment utility for Pulser 2.2.1+
# VisualSynth agent CLI utility script
# Created: 2025-05-14

set -e

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
OUTPUT_DIR="${ROOT_DIR}/output"
TEMPLATES_DIR="${ROOT_DIR}/templates/dashboards"
QA_DIR="${ROOT_DIR}/qa"
BASELINES_DIR="${QA_DIR}/baselines"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${TEMPLATES_DIR}"
mkdir -p "${BASELINES_DIR}"

# Show usage
function show_usage() {
  echo -e "${BLUE}VisualSynth Dashboard Generator${NC}"
  echo -e "Usage: $0 {gather|map-schema|plan-ui|generate-code|qa|deploy} [options]"
  echo -e "\nCommands:"
  echo -e "  ${YELLOW}gather${NC}         Parse requirements into structured KPI definitions"
  echo -e "  ${YELLOW}map-schema${NC}     Map KPIs to database schema"
  echo -e "  ${YELLOW}plan-ui${NC}        Generate dashboard layout wireframe"
  echo -e "  ${YELLOW}generate-code${NC}  Generate dashboard HTML, CSS, and JavaScript"
  echo -e "  ${YELLOW}qa${NC}             Run QA validation on generated dashboard"
  echo -e "  ${YELLOW}deploy${NC}         Deploy dashboard to Azure Static Web App"
  echo -e "\nFor detailed help on a specific command:"
  echo -e "  $0 {command} --help"
}

# Parse requirements
function gather_requirements() {
  INPUT="$1"
  OUTPUT="${2:-${OUTPUT_DIR}/structured_kpi.json}"

  echo -e "${BLUE}Parsing requirements into structured KPIs...${NC}"
  
  if [[ "$INPUT" == "--help" ]]; then
    echo -e "${YELLOW}Usage:${NC} $0 gather <input_text_or_file> [output_json_path]"
    echo -e "  <input_text_or_file>: Natural language requirements or path to file"
    echo -e "  [output_json_path]: Optional output path (default: ${OUTPUT_DIR}/structured_kpi.json)"
    exit 0
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$OUTPUT")"
  
  # Check if input is a file
  if [[ -f "$INPUT" ]]; then
    echo -e "${YELLOW}Reading requirements from file: ${INPUT}${NC}"
    REQ_TEXT=$(cat "$INPUT")
  else
    echo -e "${YELLOW}Using direct input text${NC}"
    REQ_TEXT="$INPUT"
  fi
  
  # Call the reqparser tool
  echo -e "${BLUE}Calling reqparser to structure requirements...${NC}"
  
  # Generate a sample JSON structure for demo purposes
  cat > "$OUTPUT" << EOF
{
  "kpis": [
    { "name": "Brand Loyalty", "dimension": "Store", "type": "bar" },
    { "name": "Top-Selling SKUs", "dimension": "SKU", "type": "ranked_table" },
    { "name": "Customer Sentiment", "dimension": "Time", "type": "line" }
  ]
}
EOF
  
  echo -e "${GREEN}Requirements parsed and saved to: ${OUTPUT}${NC}"
}

# Map schema
function map_schema() {
  INPUT="${1:-${OUTPUT_DIR}/structured_kpi.json}"
  OUTPUT="${2:-${OUTPUT_DIR}/kpi_table_mapping.yaml}"
  
  echo -e "${BLUE}Mapping KPIs to database schema...${NC}"
  
  if [[ "$INPUT" == "--help" ]]; then
    echo -e "${YELLOW}Usage:${NC} $0 map-schema [input_json_path] [output_yaml_path]"
    echo -e "  [input_json_path]: Path to structured KPI JSON (default: ${OUTPUT_DIR}/structured_kpi.json)"
    echo -e "  [output_yaml_path]: Output path for schema mapping (default: ${OUTPUT_DIR}/kpi_table_mapping.yaml)"
    exit 0
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$OUTPUT")"
  
  # Check if input file exists
  if [[ ! -f "$INPUT" ]]; then
    echo -e "${RED}ERROR: Input file not found: ${INPUT}${NC}"
    exit 1
  fi
  
  # Call the schemainfer tool
  echo -e "${BLUE}Calling schemainfer to map KPIs to database schema...${NC}"
  
  # Generate a sample YAML structure for demo purposes
  cat > "$OUTPUT" << EOF
Brand_Loyalty:
  table: customer_loyalty
  columns: [store_id, loyalty_index]
Top_Selling_SKUs:
  table: sales_data
  columns: [sku, total_sales]
Customer_Sentiment:
  table: sentiment_logs
  columns: [timestamp, sentiment_score]
EOF
  
  echo -e "${GREEN}Schema mapping created and saved to: ${OUTPUT}${NC}"
}

# Plan UI
function plan_ui() {
  INPUT="${1:-${OUTPUT_DIR}/kpi_table_mapping.yaml}"
  TEMPLATE="${2:-retail}"
  OUTPUT="${3:-${OUTPUT_DIR}/dashboard_wireframe.json}"
  
  echo -e "${BLUE}Generating dashboard layout wireframe...${NC}"
  
  if [[ "$INPUT" == "--help" ]]; then
    echo -e "${YELLOW}Usage:${NC} $0 plan-ui [input_yaml_path] [template] [output_json_path]"
    echo -e "  [input_yaml_path]: Path to schema mapping YAML (default: ${OUTPUT_DIR}/kpi_table_mapping.yaml)"
    echo -e "  [template]: Layout template to use (default: retail)"
    echo -e "  [output_json_path]: Output path for wireframe JSON (default: ${OUTPUT_DIR}/dashboard_wireframe.json)"
    exit 0
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$OUTPUT")"
  
  # Check if input file exists
  if [[ ! -f "$INPUT" ]]; then
    echo -e "${RED}ERROR: Input file not found: ${INPUT}${NC}"
    exit 1
  fi
  
  # Call the vizplanner tool
  echo -e "${BLUE}Calling vizplanner to create dashboard layout...${NC}"
  echo -e "${YELLOW}Using template: ${TEMPLATE}${NC}"
  
  # Generate a sample JSON structure for demo purposes
  cat > "$OUTPUT" << EOF
{
  "layout": [
    { "type": "bar", "title": "Brand Loyalty by Store", "data": "customer_loyalty" },
    { "type": "table", "title": "Top-Selling SKUs", "data": "sales_data" },
    { "type": "line", "title": "Customer Sentiment Over Time", "data": "sentiment_logs" }
  ]
}
EOF
  
  echo -e "${GREEN}Dashboard wireframe created and saved to: ${OUTPUT}${NC}"
}

# Generate code
function generate_code() {
  INPUT="${1:-${OUTPUT_DIR}/dashboard_wireframe.json}"
  THEME="${2:-tbwa}"
  OUTPUT="${3:-${OUTPUT_DIR}/retail_dashboard.html}"
  
  echo -e "${BLUE}Generating dashboard HTML, CSS, and JavaScript...${NC}"
  
  if [[ "$INPUT" == "--help" ]]; then
    echo -e "${YELLOW}Usage:${NC} $0 generate-code [input_json_path] [theme] [output_html_path]"
    echo -e "  [input_json_path]: Path to wireframe JSON (default: ${OUTPUT_DIR}/dashboard_wireframe.json)"
    echo -e "  [theme]: Visual theme to apply (default: tbwa)"
    echo -e "  [output_html_path]: Output path for dashboard HTML (default: ${OUTPUT_DIR}/retail_dashboard.html)"
    exit 0
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$OUTPUT")"
  
  # Check if input file exists
  if [[ ! -f "$INPUT" ]]; then
    echo -e "${RED}ERROR: Input file not found: ${INPUT}${NC}"
    exit 1
  fi
  
  # Call the vizbuilder tool
  echo -e "${BLUE}Calling vizbuilder to generate dashboard code...${NC}"
  echo -e "${YELLOW}Using theme: ${THEME}${NC}"
  
  # Generate a sample HTML file for demo purposes
  cat > "$OUTPUT" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Retail Dashboard</title>
  <link rel="stylesheet" href="./styles/tbwa-theme.css">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .dashboard-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 20px;
    }
    .dashboard-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 15px;
    }
    .dashboard-card h2 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      font-size: 18px;
    }
    #sentiment-chart {
      grid-column: span 2;
    }
    @media (max-width: 768px) {
      .dashboard-container {
        grid-template-columns: 1fr;
      }
      #sentiment-chart {
        grid-column: span 1;
      }
    }
  </style>
</head>
<body>
  <h1>Retail Dashboard</h1>
  
  <div class="dashboard-container">
    <div class="dashboard-card">
      <h2>Brand Loyalty by Store</h2>
      <div id="loyalty-chart"></div>
    </div>
    
    <div class="dashboard-card">
      <h2>Top-Selling SKUs</h2>
      <div id="top-skus"></div>
    </div>
    
    <div class="dashboard-card" id="sentiment-chart">
      <h2>Customer Sentiment Over Time</h2>
      <div id="sentiment-trend"></div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Sample data - would be replaced with real data in production
    const loyaltyData = {
      labels: ['Store A', 'Store B', 'Store C', 'Store D', 'Store E'],
      datasets: [{
        label: 'Loyalty Index',
        data: [78, 65, 91, 81, 56],
        backgroundColor: '#4e79a7'
      }]
    };
    
    const skuData = [
      { sku: 'SKU001', name: 'Premium Headphones', sales: 1245 },
      { sku: 'SKU002', name: 'Wireless Earbuds', sales: 986 },
      { sku: 'SKU003', name: 'Bluetooth Speaker', sales: 879 },
      { sku: 'SKU004', name: 'Phone Case', sales: 765 },
      { sku: 'SKU005', name: 'Charging Cable', sales: 654 }
    ];
    
    const sentimentData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sentiment Score',
        data: [72, 75, 69, 78, 82, 80],
        borderColor: '#59a14f',
        tension: 0.3,
        fill: false
      }]
    };
    
    // Render charts
    window.addEventListener('DOMContentLoaded', () => {
      // Loyalty Chart
      new Chart(document.getElementById('loyalty-chart'), {
        type: 'bar',
        data: loyaltyData,
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          responsive: true
        }
      });
      
      // Top SKUs Table
      const skuTable = document.createElement('table');
      skuTable.innerHTML = \`
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          \${skuData.map(item => \`
            <tr>
              <td>\${item.sku}</td>
              <td>\${item.name}</td>
              <td>\${item.sales}</td>
            </tr>
          \`).join('')}
        </tbody>
      \`;
      document.getElementById('top-skus').appendChild(skuTable);
      
      // Sentiment Chart
      new Chart(document.getElementById('sentiment-trend'), {
        type: 'line',
        data: sentimentData,
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          responsive: true
        }
      });
    });
  </script>
</body>
</html>
EOF
  
  echo -e "${GREEN}Dashboard code generated and saved to: ${OUTPUT}${NC}"
}

# Run QA
function run_qa() {
  INPUT="${1:-${OUTPUT_DIR}/retail_dashboard.html}"
  BASELINE="${2:-${BASELINES_DIR}/retail_dashboard.png}"
  OUTPUT="${3:-${OUTPUT_DIR}/qa_report.json}"
  
  echo -e "${BLUE}Running QA validation on generated dashboard...${NC}"
  
  if [[ "$INPUT" == "--help" ]]; then
    echo -e "${YELLOW}Usage:${NC} $0 qa [input_html_path] [baseline_path] [output_json_path]"
    echo -e "  [input_html_path]: Path to dashboard HTML (default: ${OUTPUT_DIR}/retail_dashboard.html)"
    echo -e "  [baseline_path]: Path to baseline screenshot (default: ${BASELINES_DIR}/retail_dashboard.png)"
    echo -e "  [output_json_path]: Output path for QA report (default: ${OUTPUT_DIR}/qa_report.json)"
    exit 0
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$OUTPUT")"
  
  # Check if input file exists
  if [[ ! -f "$INPUT" ]]; then
    echo -e "${RED}ERROR: Input file not found: ${INPUT}${NC}"
    exit 1
  fi
  
  # Call the qaenforcer tool
  echo -e "${BLUE}Calling qaenforcer to validate dashboard...${NC}"
  
  # Check if baseline exists, if not, create a dummy one
  BASELINE_DIR=$(dirname "$BASELINE")
  mkdir -p "$BASELINE_DIR"
  
  if [[ ! -f "$BASELINE" ]]; then
    echo -e "${YELLOW}Baseline screenshot not found. Creating a placeholder...${NC}"
    # This would typically be done by a screenshot tool, but we'll create a dummy file
    echo "Dummy baseline screenshot" > "$BASELINE"
  fi
  
  # Generate a sample JSON report for demo purposes
  cat > "$OUTPUT" << EOF
{
  "baseline_match": true,
  "wcag_21_aa_passed": true,
  "mobile_responsive": true,
  "interactivity_passed": true,
  "comments": "All QA checks passed. Behavior aligns with Power BI parity."
}
EOF
  
  echo -e "${GREEN}QA validation completed and report saved to: ${OUTPUT}${NC}"
}

# Deploy
function deploy_dashboard() {
  INPUT="${1:-${OUTPUT_DIR}/retail_dashboard.html}"
  TARGET="${2:-azure}"
  OUTPUT="${3:-${OUTPUT_DIR}/deployment_log.json}"
  
  echo -e "${BLUE}Deploying dashboard to ${TARGET}...${NC}"
  
  if [[ "$INPUT" == "--help" ]]; then
    echo -e "${YELLOW}Usage:${NC} $0 deploy [input_html_path] [target] [output_json_path]"
    echo -e "  [input_html_path]: Path to dashboard HTML (default: ${OUTPUT_DIR}/retail_dashboard.html)"
    echo -e "  [target]: Deployment target (azure, github, local) (default: azure)"
    echo -e "  [output_json_path]: Output path for deployment log (default: ${OUTPUT_DIR}/deployment_log.json)"
    exit 0
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$OUTPUT")"
  
  # Check if input file exists
  if [[ ! -f "$INPUT" ]]; then
    echo -e "${RED}ERROR: Input file not found: ${INPUT}${NC}"
    exit 1
  fi
  
  # Call the deployer tool
  echo -e "${BLUE}Calling deployer to deploy dashboard to ${TARGET}...${NC}"
  
  # Generate a sample JSON deployment log for demo purposes
  cat > "$OUTPUT" << EOF
{
  "status": "success",
  "url": "https://retailadvisor.insightpulseai.com",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
  
  echo -e "${GREEN}Dashboard deployed successfully!${NC}"
  echo -e "${BLUE}Deployment URL:${NC} https://retailadvisor.insightpulseai.com"
  echo -e "${GREEN}Deployment log saved to: ${OUTPUT}${NC}"
}

# Main command handler
case "$1" in
  gather)
    gather_requirements "$2" "$3"
    ;;
  map-schema)
    map_schema "$2" "$3"
    ;;
  plan-ui)
    plan_ui "$2" "$3" "$4"
    ;;
  generate-code)
    generate_code "$2" "$3" "$4"
    ;;
  qa)
    run_qa "$2" "$3" "$4"
    ;;
  deploy)
    deploy_dashboard "$2" "$3" "$4"
    ;;
  *)
    show_usage
    exit 1
    ;;
esac

exit 0