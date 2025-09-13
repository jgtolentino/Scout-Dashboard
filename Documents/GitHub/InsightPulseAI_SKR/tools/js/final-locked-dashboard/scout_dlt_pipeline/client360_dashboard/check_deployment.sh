#!/bin/bash
# check_deployment.sh - Script to check the status of the Client360 Dashboard deployment

# Configuration
LOG_DIR="logs"
DEPLOY_DIR="deploy"
OUTPUT_DIR="output"

# Find the latest log file
LATEST_LOG=$(find "$LOG_DIR" -name "deployment_*.log" -type f -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-)

# Find the latest verification report
LATEST_REPORT=$(find "$OUTPUT_DIR" -name "deployment_verification_*.md" -type f -printf "%T@ %p\n" | sort -nr | head -1 | cut -d' ' -f2-)

echo "===== Client360 Dashboard Deployment Status ====="
echo

if [ -n "$LATEST_LOG" ]; then
    echo "Latest deployment log: $LATEST_LOG"
    echo "Deployment started at: $(head -n 1 "$LATEST_LOG" | cut -d']' -f1 | cut -d'[' -f2)"
    
    # Check if deployment is still running
    if ps aux | grep -v grep | grep -q "deploy_with_ai.sh"; then
        echo "Status: RUNNING"
        echo "Current step: $(tail -n 1 "$LATEST_LOG" | sed 's/^\[[0-9-]\{10\} [0-9:]\{8\}\] //')"
    else
        if grep -q "Deployment completed successfully" "$LATEST_LOG"; then
            echo "Status: COMPLETED"
            COMPLETION_TIME=$(grep "Deployment completed successfully" "$LATEST_LOG" | cut -d']' -f1 | cut -d'[' -f2)
            echo "Completed at: $COMPLETION_TIME"
        else
            echo "Status: UNKNOWN (possibly failed or still running in background)"
            echo "Last log entry: $(tail -n 1 "$LATEST_LOG" | sed 's/^\[[0-9-]\{10\} [0-9:]\{8\}\] //')"
        fi
    fi
    
    echo
    echo "Last 5 log entries:"
    tail -n 5 "$LATEST_LOG" | sed 's/^\[[0-9-]\{10\} [0-9:]\{8\}\] /  /'
else
    echo "No deployment logs found."
fi

echo

if [ -n "$LATEST_REPORT" ]; then
    echo "Latest verification report: $LATEST_REPORT"
    echo
    echo "Deployment summary:"
    grep -A 5 "## Deployment Summary" "$LATEST_REPORT"
    
    echo
    echo "Component status:"
    grep -A 10 "## Components Deployed" "$LATEST_REPORT" | grep -E '^\- [✅❌⚠️]'
else
    echo "No verification report found."
fi

echo
echo "Current deployment files:"
if [ -d "$DEPLOY_DIR" ]; then
    echo "- Dashboard: $(ls -la "$DEPLOY_DIR/index.html" 2>/dev/null | wc -l) files"
    echo "- JavaScript: $(find "$DEPLOY_DIR/js" -type f 2>/dev/null | wc -l) files"
    echo "- CSS: $(find "$DEPLOY_DIR/css" -type f 2>/dev/null | wc -l) files"
    echo "- AI components: $(find "$DEPLOY_DIR/data/ai" -type f 2>/dev/null | wc -l) files"
    
    if [ -f "$DEPLOY_DIR/js/ai_insights_component.js" ]; then
        echo "- AI Insights Component: DEPLOYED"
    else
        echo "- AI Insights Component: MISSING"
    fi
    
    if [ -f "$DEPLOY_DIR/data/ai/insights/all_insights_latest.json" ]; then
        echo "- Sample Insights Data: DEPLOYED"
    else
        echo "- Sample Insights Data: MISSING"
    fi
else
    echo "Deployment directory not found."
fi