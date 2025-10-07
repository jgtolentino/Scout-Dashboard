#!/bin/bash
#
# patch_insights_tools.sh
#
# Add monitoring capability to other GenAI insights tools
#

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BOLD}${CYAN}GenAI Insights Tools Monitoring Patch${RESET}"
echo -e "This script will update existing GenAI insights tools to include monitoring capabilities."
echo ""

# Check if the monitoring tools exist
if [ ! -f "${SCRIPT_DIR}/insights_monitor.js" ] || [ ! -f "${SCRIPT_DIR}/update_insights_metrics.js" ]; then
  echo -e "${RED}Error: Required monitoring files not found.${RESET}"
  echo "Please ensure insights_monitor.js and update_insights_metrics.js exist in the tools directory."
  exit 1
fi

# Patch run_insights_generator.sh to include monitoring updates
if [ -f "${SCRIPT_DIR}/run_insights_generator.sh" ]; then
  echo -e "${YELLOW}Patching run_insights_generator.sh...${RESET}"
  
  # Check if already patched
  if grep -q "update_insights_metrics.js" "${SCRIPT_DIR}/run_insights_generator.sh"; then
    echo "  Already patched, skipping."
  else
    # Add monitoring updates
    cat >> "${SCRIPT_DIR}/run_insights_generator.sh" << 'EOF'

# Update monitoring metrics after generating insights
update_monitoring_metrics() {
  echo "Updating monitoring metrics..."
  
  # Get model from arguments or default
  MODEL=${MODEL:-"claude"}
  
  # Update metrics based on outcome
  if [ $INSIGHT_GEN_SUCCESS -eq 1 ]; then
    node "${SCRIPT_DIR}/update_insights_metrics.js" --add-insight=${MODEL},${TYPE:-general},completed --update-system
  else
    node "${SCRIPT_DIR}/update_insights_metrics.js" --add-insight=${MODEL},${TYPE:-general},failed --update-system
  fi
}

# Add monitoring update to post-generation process
if [ "$INSIGHT_GEN_SUCCESS" -eq 1 ] || [ "$INSIGHT_GEN_SUCCESS" -eq 0 ]; then
  update_monitoring_metrics
fi
EOF
    
    echo -e "  ${GREEN}✓ Successfully patched${RESET}"
  fi
else
  echo -e "${YELLOW}run_insights_generator.sh not found, skipping.${RESET}"
fi

# Patch insights_generator.js to include monitoring updates
if [ -f "${SCRIPT_DIR}/insights_generator.js" ]; then
  echo -e "${YELLOW}Patching insights_generator.js...${RESET}"
  
  # Check if already patched
  if grep -q "updateMonitoringMetrics" "${SCRIPT_DIR}/insights_generator.js"; then
    echo "  Already patched, skipping."
  else
    # Create temporary file
    TEMP_FILE=$(mktemp)
    
    # Add require statement near the top of the file
    awk '
      /const fs = require/ {
        print $0
        print "const updateMetrics = require(\"./update_insights_metrics\");  // For monitoring integration"
        next
      }
      {print}
    ' "${SCRIPT_DIR}/insights_generator.js" > "$TEMP_FILE"
    
    # Add monitoring function before the main exports
    cat >> "$TEMP_FILE" << 'EOF'

/**
 * Update monitoring metrics after generating insights
 */
function updateMonitoringMetrics(model, type, status) {
  try {
    // Call update_insights_metrics module
    updateMetrics.addInsight(model.toLowerCase(), type.toLowerCase(), status.toLowerCase());
    updateMetrics.updateSystemMetrics();
    console.log(`[Monitoring] Updated metrics: model=${model}, type=${type}, status=${status}`);
    return true;
  } catch (error) {
    console.error(`[Monitoring] Failed to update metrics: ${error.message}`);
    return false;
  }
}

// Add monitoring calls to the appropriate places in the code
const originalGenerateInsight = exports.generateInsight;
exports.generateInsight = async function(options) {
  try {
    // Update metrics to processing status
    updateMonitoringMetrics(options.model || "claude", options.type || "general", "processing");
    
    // Call original function
    const result = await originalGenerateInsight(options);
    
    // Update metrics with completion status
    updateMonitoringMetrics(options.model || "claude", options.type || "general", "completed");
    
    return result;
  } catch (error) {
    // Update metrics with failure status
    updateMonitoringMetrics(options.model || "claude", options.type || "general", "failed");
    throw error;
  }
};
EOF
    
    # Replace original file
    mv "$TEMP_FILE" "${SCRIPT_DIR}/insights_generator.js"
    
    echo -e "  ${GREEN}✓ Successfully patched${RESET}"
  fi
else
  echo -e "${YELLOW}insights_generator.js not found, skipping.${RESET}"
fi

# Patch pulser_insights_cli.js to add monitoring command
if [ -f "${SCRIPT_DIR}/pulser_insights_cli.js" ]; then
  echo -e "${YELLOW}Patching pulser_insights_cli.js...${RESET}"
  
  # Check if already patched
  if grep -q "monitor" "${SCRIPT_DIR}/pulser_insights_cli.js"; then
    echo "  Already patched, skipping."
  else
    # Create temporary file
    TEMP_FILE=$(mktemp)
    
    # Add monitor command to help/usage output
    awk '
      /show commands/ {
        print $0
        print "    monitor          Start the insights monitoring dashboard"
        next
      }
      {print}
    ' "${SCRIPT_DIR}/pulser_insights_cli.js" > "$TEMP_FILE"
    
    # Add monitor command implementation
    cat >> "$TEMP_FILE" << 'EOF'

/**
 * Launch the monitoring dashboard
 */
function launchMonitor() {
  const { spawn } = require('child_process');
  const path = require('path');
  
  console.log("Starting GenAI Insights Monitor dashboard...");
  
  const scriptPath = path.join(__dirname, 'run_insights_monitor.sh');
  
  // Build command line arguments based on provided options
  const args = [];
  
  if (options.port) {
    args.push(`--port=${options.port}`);
  }
  
  if (options.logLevel) {
    args.push(`--log-level=${options.logLevel}`);
  }
  
  if (options.days) {
    args.push(`--history=${options.days}`);
  }
  
  if (options.noDashboard) {
    args.push('--no-dashboard');
  }
  
  if (options.noWatch) {
    args.push('--no-watch');
  }
  
  // Launch the script
  const process = spawn('bash', [scriptPath, ...args], {
    stdio: 'inherit'
  });
  
  process.on('error', (error) => {
    console.error(`Failed to start monitoring dashboard: ${error.message}`);
  });
}

// Add monitor command to command handlers
if (command === 'monitor') {
  launchMonitor();
}
EOF
    
    # Replace original file
    mv "$TEMP_FILE" "${SCRIPT_DIR}/pulser_insights_cli.js"
    
    echo -e "  ${GREEN}✓ Successfully patched${RESET}"
  fi
else
  echo -e "${YELLOW}pulser_insights_cli.js not found, skipping.${RESET}"
fi

echo ""
echo -e "${GREEN}Patching complete!${RESET}"
echo "You can now use the monitoring features with the existing GenAI insights tools."
echo ""
echo "Try these commands:"
echo "  ./run_insights_monitor.sh                     # Start the monitoring dashboard"
echo "  ./pulser_insights_cli.js monitor              # Start monitoring from the CLI"
echo "  node update_insights_metrics.js --update-system  # Update system metrics manually"
echo ""