#!/bin/bash
# Retail Dashboards CLI Aliases
# Add these aliases to your shell profile or source this file directly

# Main retail dashboard command
alias retail-dashboard='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard'

# Open Edge Dashboard
alias retail-edge='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard edge'
alias retail-edge-dash='retail-edge'
alias retail-edge-local='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard edge --local'

# Open Performance Dashboard
alias retail-performance='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard performance'
alias retail-performance-dash='retail-performance'
alias retail-performance-local='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard performance --local'
alias retail-uplift='retail-performance'

# Server commands
alias serve-retail='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard serve'
alias retail-local='serve-retail'

# Deploy command
alias deploy-retail='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard deploy'

# Get status
alias retail-status='node /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/app.js retail-dashboard status'

# Pulser integration aliases (for Pulser CLI users)
alias :retail-dashboard='retail-dashboard'
alias :retail-edge='retail-edge'
alias :retail-edge-local='retail-edge-local'
alias :retail-performance='retail-performance'
alias :retail-performance-local='retail-performance-local'
alias :serve-retail='serve-retail'
alias :deploy-retail='deploy-retail'
alias :retail-status='retail-status'

echo "✅ Retail dashboard CLI aliases loaded"
echo "Available commands:"
echo "  retail-dashboard    - Main dashboard command with options: deploy, serve, edge, performance, status, help"
echo ""
echo "  # Launch Local Server"
echo "  serve-retail        - Start local development server with both dashboards"
echo "  retail-local        - Alias for serve-retail"
echo ""
echo "  # Open Dashboards"
echo "  retail-edge         - Open Retail Edge Dashboard (cloud)"
echo "  retail-edge-local   - Open Retail Edge Dashboard (local)"
echo "  retail-performance  - Open Retail Performance Dashboard (cloud)"
echo "  retail-performance-local - Open Retail Performance Dashboard (local)"
echo ""
echo "  # Other Commands"
echo "  deploy-retail       - Deploy both dashboards to Azure"
echo "  retail-status       - Show deployment status and URLs"