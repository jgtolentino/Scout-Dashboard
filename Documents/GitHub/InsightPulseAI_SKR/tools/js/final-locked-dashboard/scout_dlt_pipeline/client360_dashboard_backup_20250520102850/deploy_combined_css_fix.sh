#!/bin/bash

# Combined CSS Fix for Client360 Dashboard
# This script creates a deployment package with a single combined CSS file

set -e  # Exit immediately if a command exits with a non-zero status

# Setup logging
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_DIR="logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/deploy_combined_${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "==== TBWA Client360 Dashboard - Combined CSS Fix ===="
echo "Starting deployment process..."
echo "Timestamp: $(date)"

# Directories and files
DEPLOY_DIR="deploy"
OUTPUT_DIR="output"
BACKUP_DIR="deploy_combined_css_backup_${TIMESTAMP}"
ZIP_FILE="${OUTPUT_DIR}/client360_dashboard_combined_css_fix.zip"

# Create backup directory
echo "Creating backup in ${BACKUP_DIR}..."
mkdir -p "${BACKUP_DIR}"
cp -r "${DEPLOY_DIR}"/* "${BACKUP_DIR}"
echo "Backup created successfully."

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Create combined CSS file
echo "Creating combined CSS file..."
mkdir -p "${DEPLOY_DIR}/css/original"

# Backup original CSS files
cp "${DEPLOY_DIR}/css/variables.css" "${DEPLOY_DIR}/css/original/variables.css" || echo "variables.css not found"
cp "${DEPLOY_DIR}/css/tbwa-theme.css" "${DEPLOY_DIR}/css/original/tbwa-theme.css" || echo "tbwa-theme.css not found"
cp "${DEPLOY_DIR}/css/dashboard.css" "${DEPLOY_DIR}/css/original/dashboard.css" || echo "dashboard.css not found"

# Combine CSS files into one
cat > "${DEPLOY_DIR}/css/tbwa-combined.css" << 'EOL'
/* TBWA Combined CSS File */
/* Created: $(date) */

/* Variables */
:root {
  /* TBWA Brand Palette */
  --color-primary: #ffc300; /* TBWA yellow */
  --color-secondary: #005bbb; /* TBWA blue */
  --color-accent: #ff6f61; /* highlight for alerts */
  --color-bg: #f8f9fa; /* light gray background */
  --color-card: #ffffff; /* white card background */
  --color-text: #333333; /* dark text */
  
  /* Typography */
  --font-base: 'Inter', Arial, sans-serif;
  --font-size-base: 14px;
  --line-height-base: 1.5;
  
  /* Derived Colors */
  --color-primary-dark: #e6b000; /* darker yellow for hover */
  --color-secondary-dark: #004a99; /* darker blue for hover */
  --color-success: #28a745; /* green for positive metrics */
  --color-warning: #ffa500; /* orange for warnings */
  --color-danger: #dc3545; /* red for alerts/negative metrics */
  --color-info: #17a2b8; /* teal for informational elements */
  --color-muted: #6c757d; /* gray for less important text */
  
  /* Borders and Shadows */
  --border-radius: 4px;
  --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --box-shadow-hover: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* TBWA Theme */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Reset + base */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  background-color: var(--color-bg);
  color: var(--color-text);
}

/* TBWA Logo Styling */
.tbwa-logo {
  height: 40px;
  width: auto;
}

/* Cards & panels */
.card, .dashboard-panel, .bg-white {
  background: var(--color-card) !important;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: box-shadow 0.3s ease;
}

.card:hover, .dashboard-panel:hover {
  box-shadow: var(--box-shadow-hover);
}

/* Buttons */
.btn-primary, .bg-blue-500, button.bg-blue-500 {
  background-color: var(--color-secondary) !important;
  color: white !important;
  border: none;
}

.btn-primary:hover, .bg-blue-500:hover, button.bg-blue-500:hover {
  background-color: var(--color-secondary-dark) !important;
}

.btn-secondary {
  background-color: var(--color-primary) !important;
  color: var(--color-text) !important;
  border: none;
}

.btn-secondary:hover {
  background-color: var(--color-primary-dark) !important;
}

/* Headings */
h1, .header-title, .text-xl {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-secondary);
  font-weight: bold;
}

h2, .subheader-title, .text-lg {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-secondary);
  font-weight: 600;
}

h3, .text-md {
  font-size: 1.1rem;
  color: var(--color-text);
  font-weight: 600;
}

/* Links */
a {
  color: var(--color-secondary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* KPI Tiles */
.kpi-tile, [onclick*="DrillDown"] {
  border-top: 4px solid var(--color-primary) !important;
  transition: transform 0.2s ease;
}

.kpi-tile:hover, [onclick*="DrillDown"]:hover {
  transform: translateY(-2px);
}

.kpi-tile h3, [onclick*="DrillDown"] p.text-gray-500 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-muted) !important;
}

.kpi-tile .value, [onclick*="DrillDown"] h2 {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-text) !important;
}

/* Map container */
.map-container, #storeMap {
  background: #e5e5e5;
  border: 1px solid #ccc;
  border-radius: var(--border-radius);
  overflow: hidden;
}

/* Color overrides */
.text-blue-500, .text-blue-700, .text-blue-600 {
  color: var(--color-secondary) !important;
}

.text-green-500 {
  color: var(--color-success) !important;
}

.text-red-500 {
  color: var(--color-danger) !important;
}

.text-yellow-500 {
  color: var(--color-warning) !important;
}

.bg-blue-500 {
  background-color: var(--color-secondary) !important;
}

.bg-green-500 {
  background-color: var(--color-success) !important;
}

.bg-red-500 {
  background-color: var(--color-danger) !important;
}

.bg-yellow-500 {
  background-color: var(--color-warning) !important;
}

.bg-blue-100 {
  background-color: rgba(0, 91, 187, 0.1) !important;
}

.bg-green-100 {
  background-color: rgba(40, 167, 69, 0.1) !important;
}

.text-blue-800 {
  color: var(--color-secondary-dark) !important;
}

/* Insights cards */
.ai-powered-insights .border-l-4, #brandInsights .border-l-4 {
  border-left: 4px solid var(--color-primary) !important;
}

.ai-powered-insights .insight-card, #brandInsights .insight-section {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

/* Charts */
canvas {
  max-width: 100%;
}

/* Header and footer */
header.bg-white, footer.bg-white {
  background-color: white !important;
}

/* Filter Bar */
.bg-gray-200 {
  background-color: #edf2f7 !important;
}

/* Progress Bars */
.rounded-full {
  border-radius: 9999px;
}

.h-2\.5, .h-2 {
  height: 0.625rem;
}

/* Transaction Metrics */
.transaction-metrics-table th {
  color: var(--color-secondary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.transaction-metrics-table tr:nth-child(even) {
  background-color: rgba(0, 91, 187, 0.05);
}

/* Media Queries */
@media (max-width: 768px) {
  :root {
    --font-size-base: 12px;
  }
  
  .kpi-tile .value, [onclick*="DrillDown"] h2 {
    font-size: 1.5rem;
  }
}

/* TBWA Footer Branding */
.tbwa-footer-brand {
  font-weight: bold;
  color: var(--color-secondary);
}

.tbwa-footer-brand span {
  color: var(--color-primary);
}

/* Dashboard Styles */

/* Custom Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(36px);
  -ms-transform: translateX(36px);
  transform: translateX(36px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Transaction Metrics Component */
.transaction-metrics-component {
  font-family: var(--font-base);
  color: var(--color-text);
}

.transaction-metrics-section {
  margin-bottom: 1.5rem;
}

.transaction-metrics-table {
  width: 100%;
  border-collapse: collapse;
}

.transaction-metrics-table th,
.transaction-metrics-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.transaction-metrics-table tr:hover {
  background-color: #f8fafc;
}

.metric-card {
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1rem;
  margin-bottom: 1rem;
}

.metric-card-title {
  color: #4a5568;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.metric-card-value {
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 700;
}

.metric-card-footer {
  color: #718096;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* Brand Insights Component */
.insights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.insight-card {
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1rem;
  margin-bottom: 1rem;
}

.insight-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.insight-content {
  font-size: 0.875rem;
  color: #4a5568;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.highlight-insight {
  border-left: 4px solid #FFC300;
  padding-left: 1rem;
}

/* QA Diagnostic Elements */
.qa-diagnostic {
  position: fixed;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  font-family: monospace;
  z-index: 9999;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.qa-diagnostic h4 {
  margin-top: 0;
  color: #FFC300;
}

.qa-diagnostic pre {
  white-space: pre-wrap;
  font-size: 0.75rem;
}

.qa-diagnostic-toggle {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background-color: #005BBB;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 9998;
}

.hidden {
  display: none !important;
}
EOL

# Update HTML to use combined CSS
echo "Updating HTML to use combined CSS..."
sed -i.bak 's|<link rel="stylesheet" href="css/dashboard.css">|<link rel="stylesheet" href="css/tbwa-combined.css">|g' "${DEPLOY_DIR}/index.html"
sed -i.bak 's|<link rel="stylesheet" href="css/tbwa-theme.css">||g' "${DEPLOY_DIR}/index.html"

# Create the deployment package
echo "Creating deployment package..."
cd "${DEPLOY_DIR}" && zip -r "../${ZIP_FILE}" * && cd ..
echo "Deployment package created at ${ZIP_FILE}"

echo ""
echo "==== Manual Deployment Steps ===="
echo "Package ready at: $(realpath "${ZIP_FILE}")"
echo ""
echo "Please deploy manually using the following steps:"
echo ""
echo "1. Log in to the Azure Portal: https://portal.azure.com"
echo "2. Navigate to your Static Web App resource: tbwa-client360-dashboard-production"
echo "3. In the left menu, select 'Deployment Center' → 'Manual Deploy'"
echo "4. Select 'Upload' and browse to the following file:"
echo "   $(realpath "${ZIP_FILE}")"
echo "5. Click 'Deploy' and wait for the deployment to complete (look for the green check mark)"
echo ""
echo "After deployment is complete, verify the fix using the verify_css_fix.sh script:"
echo "./verify_css_fix.sh https://blue-coast-0acb6880f.6.azurestaticapps.net"
echo ""
echo "==== Deployment preparation completed ===="