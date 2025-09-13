/**
 * update_insights_metrics.js
 * 
 * Utility script for programmatically updating the insights metrics file.
 * Can be called from other scripts to update monitoring metrics.
 * 
 * Usage:
 *   node update_insights_metrics.js [--key=value ...]
 * 
 * Examples:
 *   node update_insights_metrics.js --add-insight=claude,marketing,completed
 *   node update_insights_metrics.js --reset-counters
 *   node update_insights_metrics.js --update-system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  metricsFile: path.join(__dirname, '../data/insights/metrics.json'),
  reportsDir: path.join(__dirname, '../data/insights/reports'),
  addInsight: null,
  resetCounters: false,
  updateSystem: false,
  forceRecount: false,
  verbose: false
};

// Process command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--add-insight=')) {
    CONFIG.addInsight = arg.split('=')[1].split(',');
  } else if (arg === '--reset-counters') {
    CONFIG.resetCounters = true;
  } else if (arg === '--update-system') {
    CONFIG.updateSystem = true;
  } else if (arg === '--force-recount') {
    CONFIG.forceRecount = true;
  } else if (arg === '--verbose') {
    CONFIG.verbose = true;
  } else if (arg.startsWith('--metrics-file=')) {
    CONFIG.metricsFile = arg.split('=')[1];
  } else if (arg.startsWith('--reports-dir=')) {
    CONFIG.reportsDir = arg.split('=')[1];
  }
});

/**
 * Log with colors if verbose mode is enabled
 */
function log(message, type = 'info') {
  if (!CONFIG.verbose) return;
  
  const colors = {
    info: '\x1b[32m',   // green
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`);
}

/**
 * Collect system metrics
 */
function collectSystemMetrics() {
  log('Collecting system metrics');
  
  const metrics = {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: 0,
      loadAvg: os.loadavg()[0]
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    disk: { usage: '0%' }
  };
  
  // Get CPU usage
  try {
    // Different command based on OS
    const cmd = process.platform === 'win32' 
      ? `wmic cpu get loadpercentage`
      : `top -l 1 | grep "CPU usage" | awk '{print $3}' | cut -d% -f1`;
    
    const result = execSync(cmd).toString().trim();
    metrics.cpu.usage = process.platform === 'win32'
      ? parseInt(result.split('\n')[1], 10)
      : parseInt(result, 10);
  } catch (error) {
    log(`Failed to get CPU usage: ${error.message}`, 'error');
    metrics.cpu.usage = 0;
  }
  
  // Get disk usage
  try {
    // Different command based on OS
    const cmd = process.platform === 'win32'
      ? `wmic logicaldisk where DeviceID="C:" get Size,FreeSpace`
      : `df -h / | tail -1 | awk '{print $5}'`;
    
    const result = execSync(cmd).toString().trim();
    metrics.disk.usage = process.platform === 'win32'
      ? (result.split('\n')[1].split(/\s+/).filter(Boolean)[0] / result.split('\n')[1].split(/\s+/).filter(Boolean)[1] * 100).toFixed(2) + '%'
      : result;
  } catch (error) {
    log(`Failed to get disk usage: ${error.message}`, 'error');
  }
  
  return metrics;
}

/**
 * Count insights from reports directory
 */
function countInsightsFromReports() {
  log('Counting insights from reports');
  
  const metrics = {
    total: 0,
    byModel: {
      claude: 0,
      gpt4: 0,
      deepseek: 0
    },
    byType: {
      sales: 0,
      marketing: 0,
      customer: 0,
      product: 0,
      general: 0
    },
    byStatus: {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    }
  };
  
  // Check if reports directory exists
  if (!fs.existsSync(CONFIG.reportsDir)) {
    log(`Reports directory not found: ${CONFIG.reportsDir}`, 'warn');
    return metrics;
  }
  
  // Get all JSON files in reports directory
  const files = fs.readdirSync(CONFIG.reportsDir).filter(file => file.endsWith('.json'));
  
  metrics.total = files.length;
  
  // Process each file
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(CONFIG.reportsDir, file), 'utf8'));
      
      // Count by model
      if (data.model && metrics.byModel[data.model.toLowerCase()] !== undefined) {
        metrics.byModel[data.model.toLowerCase()]++;
      }
      
      // Count by type
      if (data.type && metrics.byType[data.type.toLowerCase()] !== undefined) {
        metrics.byType[data.type.toLowerCase()]++;
      }
      
      // Count by status
      if (data.status && metrics.byStatus[data.status.toLowerCase()] !== undefined) {
        metrics.byStatus[data.status.toLowerCase()]++;
      }
    } catch (error) {
      log(`Failed to parse insights file ${file}: ${error.message}`, 'error');
    }
  });
  
  return metrics;
}

/**
 * Add a new insight to the metrics
 */
function addInsight(model, type, status) {
  log(`Adding insight: model=${model}, type=${type}, status=${status}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.metricsFile, 'utf8'));
    
    // Increment total
    data.insights.total++;
    
    // Increment by model
    if (data.insights.byModel[model] !== undefined) {
      data.insights.byModel[model]++;
    }
    
    // Increment by type
    if (data.insights.byType[type] !== undefined) {
      data.insights.byType[type]++;
    }
    
    // Increment by status
    if (data.insights.byStatus[status] !== undefined) {
      data.insights.byStatus[status]++;
    }
    
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Also update today's history if it exists
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = data.history.findIndex(day => day.date === today);
    
    if (todayIndex !== -1) {
      data.history[todayIndex].insights.total++;
      
      if (data.history[todayIndex].insights.byModel[model] !== undefined) {
        data.history[todayIndex].insights.byModel[model]++;
      }
      
      if (data.history[todayIndex].insights.byType[type] !== undefined) {
        data.history[todayIndex].insights.byType[type]++;
      }
      
      if (status === 'completed') {
        data.history[todayIndex].insights.completed++;
      }
    }
    
    // Write updated metrics
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(data, null, 2));
    log('Metrics updated successfully');
    
    return true;
  } catch (error) {
    log(`Failed to update metrics: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Reset all counters to zero
 */
function resetCounters() {
  log('Resetting all counters');
  
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.metricsFile, 'utf8'));
    
    // Reset insights counts
    data.insights.total = 0;
    
    Object.keys(data.insights.byModel).forEach(model => {
      data.insights.byModel[model] = 0;
    });
    
    Object.keys(data.insights.byType).forEach(type => {
      data.insights.byType[type] = 0;
    });
    
    Object.keys(data.insights.byStatus).forEach(status => {
      data.insights.byStatus[status] = 0;
    });
    
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Write updated metrics
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(data, null, 2));
    log('Counters reset successfully');
    
    return true;
  } catch (error) {
    log(`Failed to reset counters: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Update system metrics
 */
function updateSystemMetrics() {
  log('Updating system metrics');
  
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.metricsFile, 'utf8'));
    const systemMetrics = collectSystemMetrics();
    
    // Keep only the last 24 hours (288 data points at 5-minute intervals)
    if (data.system.cpuUsage.length >= 288) {
      data.system.cpuUsage.shift();
      data.system.memoryUsage.shift();
      data.system.diskUsage.shift();
    }
    
    // Add new data point
    data.system.cpuUsage.push({
      timestamp: systemMetrics.timestamp,
      value: systemMetrics.cpu.usage
    });
    
    data.system.memoryUsage.push({
      timestamp: systemMetrics.timestamp,
      value: parseFloat(systemMetrics.memory.usagePercent)
    });
    
    data.system.diskUsage.push({
      timestamp: systemMetrics.timestamp,
      value: parseInt(systemMetrics.disk.usage, 10) || 0
    });
    
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Write updated metrics
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(data, null, 2));
    log('System metrics updated successfully');
    
    return true;
  } catch (error) {
    log(`Failed to update system metrics: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Force recount of all insights
 */
function forceRecountInsights() {
  log('Forcing recount of all insights');
  
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.metricsFile, 'utf8'));
    const insightsMetrics = countInsightsFromReports();
    
    // Update insights metrics
    data.insights = insightsMetrics;
    
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Also update today's history if it exists
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = data.history.findIndex(day => day.date === today);
    
    if (todayIndex !== -1) {
      data.history[todayIndex].insights.total = insightsMetrics.total;
      data.history[todayIndex].insights.byModel = { ...insightsMetrics.byModel };
      data.history[todayIndex].insights.byType = { ...insightsMetrics.byType };
      data.history[todayIndex].insights.completed = insightsMetrics.byStatus.completed;
    }
    
    // Write updated metrics
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(data, null, 2));
    log('Insights recounted successfully');
    
    return true;
  } catch (error) {
    log(`Failed to recount insights: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Ensure metrics file exists
 */
function ensureMetricsFile() {
  if (!fs.existsSync(CONFIG.metricsFile)) {
    log(`Metrics file not found, creating: ${CONFIG.metricsFile}`);
    
    const defaultMetrics = {
      lastUpdated: new Date().toISOString(),
      insights: {
        total: 0,
        byModel: {
          claude: 0,
          gpt4: 0,
          deepseek: 0
        },
        byType: {
          sales: 0,
          marketing: 0,
          customer: 0,
          product: 0,
          general: 0
        },
        byStatus: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        }
      },
      system: {
        cpuUsage: [],
        memoryUsage: [],
        diskUsage: []
      },
      history: []
    };
    
    // Create directory if it doesn't exist
    const metricsDir = path.dirname(CONFIG.metricsFile);
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    // Write default metrics
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(defaultMetrics, null, 2));
  }
}

/**
 * Main function
 */
function main() {
  log('Starting metrics update');
  
  // Ensure metrics file exists
  ensureMetricsFile();
  
  // Execute requested operations
  if (CONFIG.resetCounters) {
    resetCounters();
  }
  
  if (CONFIG.forceRecount) {
    forceRecountInsights();
  }
  
  if (CONFIG.updateSystem) {
    updateSystemMetrics();
  }
  
  if (CONFIG.addInsight) {
    const [model, type, status] = CONFIG.addInsight;
    addInsight(model, type, status);
  }
  
  log('Metrics update complete');
}

// Run main function
main();

// For use as a module
module.exports = {
  addInsight,
  resetCounters,
  updateSystemMetrics,
  forceRecountInsights
};