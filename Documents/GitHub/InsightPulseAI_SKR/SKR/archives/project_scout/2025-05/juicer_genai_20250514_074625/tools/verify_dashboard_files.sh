#!/bin/bash
# Script to verify and fix dashboard files for deployment

# Set source and destination paths
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/dashboards"
PROJECT_SCOUT_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/SKR/archives/project_scout/2025-05/juicer_genai_20250512_165150/dashboards"

# Create HTML file for testing
TEST_HTML="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/test_project_scout_dashboard.html"

# Create logs directory if it doesn't exist
LOGS_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/logs"
mkdir -p "$LOGS_DIR"

# Log file for verification results
LOG_FILE="$LOGS_DIR/dashboard_verification.log"
echo "Dashboard Verification Log ($(date))" > "$LOG_FILE"
echo "-----------------------------------" >> "$LOG_FILE"

# Function to check file existence and permissions
check_file() {
  local file=$1
  local file_name=$(basename "$file")
  
  echo "Checking $file_name..." | tee -a "$LOG_FILE"
  
  if [ -f "$file" ]; then
    echo "✅ File exists: $file_name" | tee -a "$LOG_FILE"
    
    # Check read permissions
    if [ -r "$file" ]; then
      echo "✅ File is readable: $file_name" | tee -a "$LOG_FILE"
    else
      echo "❌ File is not readable: $file_name" | tee -a "$LOG_FILE"
      chmod +r "$file"
      echo "🔧 Fixed permissions for: $file_name" | tee -a "$LOG_FILE"
    fi
    
    # Check file size
    local size=$(wc -c < "$file")
    echo "📊 File size: $size bytes" | tee -a "$LOG_FILE"
    
    if [ "$size" -eq 0 ]; then
      echo "⚠️ Warning: File is empty: $file_name" | tee -a "$LOG_FILE"
    fi
  else
    echo "❌ File does not exist: $file_name" | tee -a "$LOG_FILE"
    return 1
  fi
  
  return 0
}

# Verify dashboard files in each directory
echo "Verifying dashboard files..." | tee -a "$LOG_FILE"

# Check Juicer dashboards
echo "Checking Juicer dashboards directory..." | tee -a "$LOG_FILE"
check_file "$SOURCE_DIR/insights_dashboard.html"
juicer_dashboard_status=$?

# Check Project Scout dashboards
echo "Checking Project Scout dashboards directory..." | tee -a "$LOG_FILE"
check_file "$PROJECT_SCOUT_DIR/project_scout_dashboard.html"
project_scout_dashboard_status=$?

# Create test HTML file with redirect
echo "Creating test HTML file..." | tee -a "$LOG_FILE"
cat > "$TEST_HTML" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Scout Dashboard Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #002b49;
    }
    .accent {
      color: #ff3300;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #002b49;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .timestamp {
      margin-top: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Project <span class="accent">Scout</span> Dashboard</h1>
    <p>This is a test page for the Project Scout Dashboard.</p>
    <p>If you're seeing this page, it means the deployment is working.</p>
    <p>The actual dashboard content should be available soon.</p>
    <a href="project_scout_dashboard.html" class="button">View Dashboard</a>
    <p class="timestamp">Generated: $(date)</p>
  </div>
</body>
</html>
EOF

echo "✅ Created test HTML file: $TEST_HTML" | tee -a "$LOG_FILE"

# Report summary
echo "Verification summary:" | tee -a "$LOG_FILE"
echo "-------------------" | tee -a "$LOG_FILE"

if [ $juicer_dashboard_status -eq 0 ]; then
  echo "✅ Juicer dashboards verified" | tee -a "$LOG_FILE"
else
  echo "❌ Issues found with Juicer dashboards" | tee -a "$LOG_FILE"
fi

if [ $project_scout_dashboard_status -eq 0 ]; then
  echo "✅ Project Scout dashboards verified" | tee -a "$LOG_FILE"
else
  echo "❌ Issues found with Project Scout dashboards" | tee -a "$LOG_FILE"
fi

echo "Verification completed. Log saved to: $LOG_FILE"
echo "Test HTML file created at: $TEST_HTML"