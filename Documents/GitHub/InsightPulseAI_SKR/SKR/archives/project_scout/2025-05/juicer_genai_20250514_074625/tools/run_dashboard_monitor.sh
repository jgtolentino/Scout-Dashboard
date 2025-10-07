#!/bin/bash
# Run the dashboard uptime monitor as a background service
# Usage: ./run_dashboard_monitor.sh [url] [interval-minutes]

# Default values
DASHBOARD_URL=${1:-"https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html"}
CHECK_INTERVAL=${2:-60}
MONITOR_LOG="../logs/monitor_service.log"
PID_FILE="../logs/dashboard_monitor.pid"
LOG_DIR="../logs"

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install it first."
  exit 1
fi

# Check if puppeteer is installed
if ! npm list puppeteer &> /dev/null; then
  echo "Installing puppeteer..."
  npm install --no-save puppeteer
fi

# Check if the monitor is already running
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p $PID > /dev/null; then
    echo "Dashboard monitor is already running with PID $PID"
    echo "To stop it, run: kill $PID"
    exit 0
  else
    echo "Stale PID file found. Previous monitor instance is not running."
    rm "$PID_FILE"
  fi
fi

# Start the monitor in the background
echo "Starting dashboard uptime monitor..."
echo "Dashboard URL: $DASHBOARD_URL"
echo "Check interval: $CHECK_INTERVAL minutes"
echo "Log file: $MONITOR_LOG"

nohup node monitor_dashboard_uptime.js "$DASHBOARD_URL" "$CHECK_INTERVAL" > "$MONITOR_LOG" 2>&1 &
MONITOR_PID=$!

echo "Monitor started with PID $MONITOR_PID"
echo $MONITOR_PID > "$PID_FILE"

echo "✅ Dashboard monitor is now running in the background"
echo "To stop it, run: kill $(cat "$PID_FILE")"
echo "To view logs, run: tail -f $MONITOR_LOG"

# Add helper command to check uptime status
echo "To check recent uptime status, run:"
echo "  grep -i 'error\|warning' $LOG_DIR/dashboard_uptime.log | tail -20"