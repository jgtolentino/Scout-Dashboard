#!/usr/bin/env node
/**
 * monitor_dashboard_uptime.js
 * Monitoring script for Scout Analytics dashboard uptime
 * Part of InsightPulseAI Unified Developer Deployment SOP (v1.0)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Text formatting for console output
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

// Get environment variables or use defaults
const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://tbwa-juicer-insights-dashboard.azurestaticapps.net/insights_dashboard_v2.html";
const ALERT_THRESHOLD_MS = parseInt(process.env.ALERT_THRESHOLD_MS || "3000", 10);
const ROOT_DIR = process.env.SCOUT_ROOT_DIR || path.join(process.env.HOME, "Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard");
const LOG_DIR = path.join(ROOT_DIR, "logs");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Get timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const dateFormatted = now.toISOString().split('T')[0];
const timeFormatted = now.toISOString().split('T')[1].split('.')[0];

// Log file
const LOG_FILE = path.join(LOG_DIR, `dashboard_uptime_${dateFormatted}.log`);

// Print header
console.log(`${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${BLUE}║  Scout Analytics Dashboard Uptime Monitor                       ${RESET}`);
console.log(`${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${RESET}`);
console.log();
console.log(`${BOLD}Monitoring:${RESET} ${DASHBOARD_URL}`);
console.log(`${BOLD}Timestamp:${RESET} ${dateFormatted} ${timeFormatted}`);
console.log(`${BOLD}Alert Threshold:${RESET} ${ALERT_THRESHOLD_MS}ms`);
console.log();

// Function to log message to console and file
function log(message, level = "INFO") {
  const logMessage = `[${new Date().toISOString()}] [${level}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + "\n");
}

// Function to check uptime
function checkUptime() {
  const startTime = Date.now();
  log(`Starting uptime check for ${DASHBOARD_URL}`, "INFO");

  const request = https.get(DASHBOARD_URL, {
    timeout: 10000, // 10 second timeout
    headers: {
      'User-Agent': 'InsightPulseAI-Uptime-Monitor/1.0'
    }
  }, (response) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.statusCode >= 200 && response.statusCode < 400) {
      if (responseTime > ALERT_THRESHOLD_MS) {
        log(`Dashboard is UP but slow: HTTP ${response.statusCode} (${responseTime}ms)`, "WARNING");
        console.log(`${YELLOW}⚠️ Dashboard is responding slowly: ${responseTime}ms${RESET}`);
      } else {
        log(`Dashboard is UP: HTTP ${response.statusCode} (${responseTime}ms)`, "INFO");
        console.log(`${GREEN}✅ Dashboard is UP: ${responseTime}ms${RESET}`);
      }
    } else {
      log(`Dashboard returned error: HTTP ${response.statusCode} (${responseTime}ms)`, "ERROR");
      console.log(`${RED}❌ Dashboard returned error: HTTP ${response.statusCode}${RESET}`);
    }
    
    // Record metrics for historical tracking
    recordMetrics({
      timestamp: new Date().toISOString(),
      url: DASHBOARD_URL,
      status: response.statusCode,
      responseTime: responseTime,
      success: response.statusCode >= 200 && response.statusCode < 400
    });
  });
  
  request.on('error', (error) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    log(`Dashboard is DOWN: ${error.message}`, "ERROR");
    console.log(`${RED}❌ Dashboard is DOWN: ${error.message}${RESET}`);
    
    // Record metrics for historical tracking
    recordMetrics({
      timestamp: new Date().toISOString(),
      url: DASHBOARD_URL,
      status: 0,
      responseTime: responseTime,
      success: false,
      error: error.message
    });
  });
}

// Function to record metrics for historical tracking
function recordMetrics(metrics) {
  const METRICS_FILE = path.join(LOG_DIR, `dashboard_metrics_${dateFormatted}.jsonl`);
  fs.appendFileSync(METRICS_FILE, JSON.stringify(metrics) + "\n");
  
  // Create or update the latest metrics summary
  const SUMMARY_FILE = path.join(LOG_DIR, "dashboard_metrics_latest.json");
  
  let summary = {
    lastUpdated: new Date().toISOString(),
    checks: []
  };
  
  if (fs.existsSync(SUMMARY_FILE)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
      summary = existingData;
    } catch (e) {
      log(`Error reading metrics summary: ${e.message}`, "ERROR");
    }
  }
  
  // Add this check and keep only the last 10
  summary.checks.unshift(metrics);
  summary.checks = summary.checks.slice(0, 10);
  
  // Calculate summary statistics
  const successfulChecks = summary.checks.filter(check => check.success).length;
  summary.uptime = (successfulChecks / summary.checks.length) * 100;
  
  const responseTimes = summary.checks.map(check => check.responseTime);
  summary.avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  
  // Save the updated summary
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
  
  // Print summary
  console.log(`\n${BOLD}Dashboard Health Summary${RESET}`);
  console.log(`${BLUE}-------------------------${RESET}`);
  console.log(`Uptime: ${summary.uptime.toFixed(1)}%`);
  console.log(`Avg Response: ${summary.avgResponseTime.toFixed(0)}ms`);
  
  if (summary.uptime < 90) {
    console.log(`\n${RED}${BOLD}⚠️ ALERT: Dashboard uptime below 90%${RESET}`);
  } else if (summary.avgResponseTime > ALERT_THRESHOLD_MS) {
    console.log(`\n${YELLOW}${BOLD}⚠️ WARNING: Dashboard average response time exceeds threshold${RESET}`);
  }
}

// Run the uptime check
checkUptime();