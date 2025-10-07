#!/bin/bash
# Azure Resource Optimization Implementation Executor
# Master script to execute all optimization implementations

echo "==== Azure Resource Optimization Implementation Executor ===="
echo "This script will execute all optimization implementations for TBWA-ProjectScout-Prod"
echo ""

# Create output directory
IMPLEMENTATION_DIR="azure_implementation_$(date +%Y%m%d)"
mkdir -p "$IMPLEMENTATION_DIR"

# Execution log
EXECUTION_LOG="$IMPLEMENTATION_DIR/execution_log.txt"
{
  echo "Azure Resource Optimization Implementation Log"
  echo "Date: $(date)"
  echo "==============================================="
  echo ""
} > "$EXECUTION_LOG"

# Function to log execution
log_execution() {
  local script_name="$1"
  local status="$2"
  local details="$3"
  
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $script_name - $status" >> "$EXECUTION_LOG"
  if [ -n "$details" ]; then
    echo "  Details: $details" >> "$EXECUTION_LOG"
  fi
  echo "" >> "$EXECUTION_LOG"
}

# Check if scripts exist
check_script() {
  local script_path="$1"
  if [ ! -f "$script_path" ]; then
    echo "❌ Script not found: $script_path"
    return 1
  fi
  if [ ! -x "$script_path" ]; then
    echo "❌ Script not executable: $script_path"
    chmod +x "$script_path"
    echo "✅ Made script executable: $script_path"
  fi
  return 0
}

# Script paths
STORAGE_CONSOLIDATION_SCRIPT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/storage_consolidation_plan.sh"
STORAGE_LIFECYCLE_SCRIPT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/storage_lifecycle_management.sh"
KEYVAULT_SECURITY_SCRIPT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/keyvault_security_enhancement.sh"
NSG_SECURITY_SCRIPT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/nsg_security_review.sh"

# Check all scripts
echo "Checking implementation scripts..."
ALL_SCRIPTS_FOUND=true

check_script "$STORAGE_CONSOLIDATION_SCRIPT" || ALL_SCRIPTS_FOUND=false
check_script "$STORAGE_LIFECYCLE_SCRIPT" || ALL_SCRIPTS_FOUND=false
check_script "$KEYVAULT_SECURITY_SCRIPT" || ALL_SCRIPTS_FOUND=false
check_script "$NSG_SECURITY_SCRIPT" || ALL_SCRIPTS_FOUND=false

if [ "$ALL_SCRIPTS_FOUND" = false ]; then
  echo "❌ One or more scripts are missing. Please check the paths and try again."
  exit 1
fi

echo "All scripts found and executable."
echo ""

# Ask for confirmation to proceed
read -p "This will execute all optimization scripts. Do you want to proceed? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Execution cancelled by user."
  exit 0
fi

echo ""
echo "Starting implementation execution..."
echo ""

# 1. Run Storage Consolidation Plan
echo "Step 1/4: Generating Storage Consolidation Plan..."
if $STORAGE_CONSOLIDATION_SCRIPT > "$IMPLEMENTATION_DIR/storage_consolidation_output.txt" 2>&1; then
  echo "✅ Storage consolidation plan generated successfully"
  log_execution "Storage Consolidation Plan" "SUCCESS" "Output saved to $IMPLEMENTATION_DIR/storage_consolidation_output.txt"
else
  echo "❌ Storage consolidation plan generation failed. Check the output for details."
  log_execution "Storage Consolidation Plan" "FAILED" "Check $IMPLEMENTATION_DIR/storage_consolidation_output.txt for error details"
fi
echo ""

# 2. Run Storage Lifecycle Management
echo "Step 2/4: Implementing Storage Lifecycle Management..."
if $STORAGE_LIFECYCLE_SCRIPT > "$IMPLEMENTATION_DIR/storage_lifecycle_output.txt" 2>&1; then
  echo "✅ Storage lifecycle management implemented successfully"
  log_execution "Storage Lifecycle Management" "SUCCESS" "Output saved to $IMPLEMENTATION_DIR/storage_lifecycle_output.txt"
else
  echo "❌ Storage lifecycle management implementation failed. Check the output for details."
  log_execution "Storage Lifecycle Management" "FAILED" "Check $IMPLEMENTATION_DIR/storage_lifecycle_output.txt for error details"
fi
echo ""

# 3. Run Key Vault Security Enhancement
echo "Step 3/4: Enhancing Key Vault Security..."
if $KEYVAULT_SECURITY_SCRIPT > "$IMPLEMENTATION_DIR/keyvault_security_output.txt" 2>&1; then
  echo "✅ Key Vault security enhancement completed successfully"
  log_execution "Key Vault Security Enhancement" "SUCCESS" "Output saved to $IMPLEMENTATION_DIR/keyvault_security_output.txt"
else
  echo "❌ Key Vault security enhancement failed. Check the output for details."
  log_execution "Key Vault Security Enhancement" "FAILED" "Check $IMPLEMENTATION_DIR/keyvault_security_output.txt for error details"
fi
echo ""

# 4. Run NSG Security Review
echo "Step 4/4: Reviewing Network Security Groups..."
if $NSG_SECURITY_SCRIPT > "$IMPLEMENTATION_DIR/nsg_security_output.txt" 2>&1; then
  echo "✅ Network Security Group review completed successfully"
  log_execution "Network Security Group Review" "SUCCESS" "Output saved to $IMPLEMENTATION_DIR/nsg_security_output.txt"
else
  echo "❌ Network Security Group review failed. Check the output for details."
  log_execution "Network Security Group Review" "FAILED" "Check $IMPLEMENTATION_DIR/nsg_security_output.txt for error details"
fi
echo ""

# Copy implementation report to output directory
IMPLEMENTATION_REPORT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/azure_optimization_implementation.md"
if [ -f "$IMPLEMENTATION_REPORT" ]; then
  cp "$IMPLEMENTATION_REPORT" "$IMPLEMENTATION_DIR/"
  echo "✅ Implementation report copied to $IMPLEMENTATION_DIR/"
  log_execution "Implementation Report" "COPIED" "Report copied to output directory"
else
  echo "❌ Implementation report not found: $IMPLEMENTATION_REPORT"
  log_execution "Implementation Report" "FAILED" "Report not found at $IMPLEMENTATION_REPORT"
fi

echo ""
echo "Implementation execution completed. All outputs saved to $IMPLEMENTATION_DIR/"
echo "Please review the output files and take any manual actions as recommended."
echo ""
echo "Summary of execution:"
echo "1. Storage Consolidation Plan: Generated recommendations for consolidating storage accounts"
echo "2. Storage Lifecycle Management: Implemented tiered storage lifecycle policies"
echo "3. Key Vault Security Enhancement: Applied security best practices to Key Vaults"
echo "4. Network Security Group Review: Analyzed and recommended NSG security improvements"
echo ""
echo "Next steps:"
echo "1. Review all output files in $IMPLEMENTATION_DIR/"
echo "2. Implement manual recommendations as appropriate"
echo "3. Monitor the environment for any issues after changes"
echo "4. Conduct a follow-up assessment in 30-60 days to verify benefits"