/**
 * insights_monitor.js
 * 
 * Monitoring tool for GenAI insights integration that provides real-time
 * visualization of insights generation, processing status, and system health.
 * 
 * Usage:
 *   node insights_monitor.js [options]
 * 
 * Options:
 *   --port=<port>       Port for the monitoring server (default: 3400)
 *   --dashboard         Launch the monitoring dashboard in browser
 *   --log-level=<level> Set logging level (debug, info, warn, error)
 *   --history=<days>    Number of days of history to display (default: 7)
 *   --watch             Watch mode - poll for changes every 30 seconds
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Configuration
const CONFIG = {
  port: 3400,
  logLevel: 'info',
  historyDays: 7,
  pollInterval: 30000, // 30 seconds
  dataPath: path.join(__dirname, '../data/insights'),
  metricsFile: path.join(__dirname, '../data/insights/metrics.json'),
  modelsToTrack: ['claude', 'gpt4', 'deepseek']
};

// Process command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--port=')) {
    CONFIG.port = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--log-level=')) {
    CONFIG.logLevel = arg.split('=')[1];
  } else if (arg.startsWith('--history=')) {
    CONFIG.historyDays = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dashboard') {
    CONFIG.openDashboard = true;
  } else if (arg === '--watch') {
    CONFIG.watchMode = true;
  }
});

// Ensure data directory exists
if (!fs.existsSync(CONFIG.dataPath)) {
  fs.mkdirSync(CONFIG.dataPath, { recursive: true });
}

// Initialize metrics file if it doesn't exist
if (!fs.existsSync(CONFIG.metricsFile)) {
  fs.writeFileSync(CONFIG.metricsFile, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    insights: {
      total: 0,
      byModel: {},
      byType: {},
      byStatus: { pending: 0, processing: 0, completed: 0, failed: 0 }
    },
    system: {
      cpuUsage: [],
      memoryUsage: [],
      diskUsage: []
    },
    history: []
  }, null, 2));
}

// Logger with color support
const logger = {
  debug: (msg) => {
    if (['debug'].includes(CONFIG.logLevel)) 
      console.log(`\x1b[90m[DEBUG] ${msg}\x1b[0m`);
  },
  info: (msg) => {
    if (['debug', 'info'].includes(CONFIG.logLevel)) 
      console.log(`\x1b[32m[INFO] ${msg}\x1b[0m`);
  },
  warn: (msg) => {
    if (['debug', 'info', 'warn'].includes(CONFIG.logLevel)) 
      console.log(`\x1b[33m[WARN] ${msg}\x1b[0m`);
  },
  error: (msg) => {
    if (['debug', 'info', 'warn', 'error'].includes(CONFIG.logLevel)) 
      console.log(`\x1b[31m[ERROR] ${msg}\x1b[0m`);
  },
  title: (msg) => console.log(`\x1b[1m\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[1m\x1b[32m✓ ${msg}\x1b[0m`),
  failure: (msg) => console.log(`\x1b[1m\x1b[31m✗ ${msg}\x1b[0m`)
};

/**
 * Collect system metrics
 */
function collectSystemMetrics() {
  logger.debug('Collecting system metrics');
  
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
    logger.error(`Failed to get CPU usage: ${error.message}`);
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
    logger.error(`Failed to get disk usage: ${error.message}`);
  }
  
  return metrics;
}

/**
 * Collect insights metrics by scanning the data directory
 */
function collectInsightsMetrics() {
  logger.debug('Collecting insights metrics');
  
  const metrics = {
    total: 0,
    byModel: {},
    byType: {},
    byStatus: { pending: 0, processing: 0, completed: 0, failed: 0 }
  };
  
  CONFIG.modelsToTrack.forEach(model => {
    metrics.byModel[model] = 0;
  });
  
  // Initialize types
  ['sales', 'marketing', 'customer', 'product', 'general'].forEach(type => {
    metrics.byType[type] = 0;
  });
  
  // Scan insights directory for files
  const insightsPath = path.join(CONFIG.dataPath, 'reports');
  if (fs.existsSync(insightsPath)) {
    const files = fs.readdirSync(insightsPath).filter(file => file.endsWith('.json'));
    
    metrics.total = files.length;
    
    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(insightsPath, file), 'utf8'));
        
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
        logger.error(`Failed to parse insights file ${file}: ${error.message}`);
      }
    });
  }
  
  return metrics;
}

/**
 * Update metrics file with latest data
 */
function updateMetrics() {
  logger.info('Updating metrics file');
  
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.metricsFile, 'utf8'));
    
    // Update system metrics
    const systemMetrics = collectSystemMetrics();
    
    // Keep only the last 24 hours of data points (assuming 5-minute intervals = 288 points)
    if (data.system.cpuUsage.length >= 288) {
      data.system.cpuUsage.shift();
      data.system.memoryUsage.shift();
      data.system.diskUsage.shift();
    }
    
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
    
    // Update insights metrics
    data.insights = collectInsightsMetrics();
    
    // Add daily history record at midnight
    const now = new Date();
    const lastUpdate = new Date(data.lastUpdated);
    
    if (now.getDate() !== lastUpdate.getDate()) {
      // Create a daily snapshot for historical tracking
      if (data.history.length >= CONFIG.historyDays) {
        data.history.shift();
      }
      
      data.history.push({
        date: now.toISOString().split('T')[0],
        insights: {
          total: data.insights.total,
          byModel: { ...data.insights.byModel },
          byType: { ...data.insights.byType },
          completed: data.insights.byStatus.completed
        }
      });
    }
    
    data.lastUpdated = now.toISOString();
    
    // Write updated metrics
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(data, null, 2));
    logger.success('Metrics updated successfully');
    
    return data;
  } catch (error) {
    logger.error(`Failed to update metrics: ${error.message}`);
    return null;
  }
}

/**
 * Generate dashboard HTML
 */
function generateDashboard(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GenAI Insights Monitor</title>
  <style>
    :root {
      --primary: #0078D4;
      --secondary: #50E6FF;
      --success: #107C10;
      --warning: #FFB900;
      --danger: #D13438;
      --light: #F3F2F1;
      --dark: #252423;
      --bronze: #CD7F32;
      --silver: #C0C0C0;
      --gold: #FFD700;
      --platinum: #FF9F78;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FAF9F8;
      color: var(--dark);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    header {
      background-color: var(--primary);
      color: white;
      padding: 1rem;
      margin-bottom: 2rem;
    }
    
    h1, h2, h3 {
      margin-top: 0;
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .card {
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1rem;
    }
    
    .metric-large {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 1rem 0;
      color: var(--primary);
    }
    
    .metric-medium {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0.5rem 0;
    }
    
    .system-metric {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .system-metric .label {
      width: 100px;
    }
    
    .system-metric .value {
      font-weight: bold;
      margin-left: 1rem;
    }
    
    .progress-bar {
      height: 8px;
      background-color: #E1DFDD;
      border-radius: 4px;
      overflow: hidden;
      flex-grow: 1;
      margin: 0 0.5rem;
    }
    
    .progress-bar .fill {
      height: 100%;
      background-color: var(--primary);
    }
    
    .fill.warning {
      background-color: var(--warning);
    }
    
    .fill.danger {
      background-color: var(--danger);
    }
    
    .status-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      color: white;
    }
    
    .badge.pending { background-color: var(--warning); }
    .badge.processing { background-color: var(--primary); }
    .badge.completed { background-color: var(--success); }
    .badge.failed { background-color: var(--danger); }
    
    .bronze-badge { background-color: var(--bronze); }
    .silver-badge { background-color: var(--silver); color: var(--dark); }
    .gold-badge { background-color: var(--gold); color: var(--dark); }
    .platinum-badge { background-color: var(--platinum); }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    th, td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid #E1DFDD;
    }
    
    th {
      background-color: #F3F2F1;
    }
    
    .history-chart {
      height: 200px;
      margin-top: 1rem;
      position: relative;
    }
    
    .chart-container {
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }
    
    .chart-bar {
      flex: 1;
      margin: 0 2px;
      background-color: var(--primary);
      position: relative;
    }
    
    .chart-bar-inner {
      position: absolute;
      bottom: 0;
      width: 100%;
    }
    
    .chart-bar-label {
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.7rem;
    }
    
    .chart-axis {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      border-top: 1px solid #ccc;
    }
    
    .refresh-time {
      text-align: right;
      font-size: 0.8rem;
      color: #666;
      margin-top: 2rem;
    }
    
    .auto-refresh-toggle {
      display: inline-block;
      margin-left: 1rem;
    }
    
    @media (max-width: 768px) {
      .dashboard {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>GenAI Insights Monitor</h1>
      <p>Real-time monitoring of the GenAI insights integration</p>
    </div>
  </header>
  
  <div class="container">
    <div class="dashboard">
      <!-- Main Metrics Card -->
      <div class="card">
        <h2>Insights Overview</h2>
        <div class="metric-large">${data.insights.total}</div>
        <p>Total insights generated</p>
        
        <div class="status-badges">
          <div class="badge pending">${data.insights.byStatus.pending} Pending</div>
          <div class="badge processing">${data.insights.byStatus.processing} Processing</div>
          <div class="badge completed">${data.insights.byStatus.completed} Completed</div>
          <div class="badge failed">${data.insights.byStatus.failed} Failed</div>
        </div>
        
        <h3>Data Layers</h3>
        <div class="status-badges">
          <div class="badge bronze-badge">Bronze</div>
          <div class="badge silver-badge">Silver</div>
          <div class="badge gold-badge">Gold</div>
          <div class="badge platinum-badge">Platinum (GenAI)</div>
        </div>
      </div>
      
      <!-- Model Distribution -->
      <div class="card">
        <h2>Model Distribution</h2>
        ${Object.entries(data.insights.byModel).map(([model, count]) => {
          const percentage = data.insights.total > 0 ? (count / data.insights.total * 100).toFixed(1) : 0;
          return `
            <div class="system-metric">
              <div class="label">${model.toUpperCase()}</div>
              <div class="progress-bar">
                <div class="fill" style="width: ${percentage}%"></div>
              </div>
              <div class="value">${count} (${percentage}%)</div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Type Distribution -->
      <div class="card">
        <h2>Insight Types</h2>
        ${Object.entries(data.insights.byType).map(([type, count]) => {
          const percentage = data.insights.total > 0 ? (count / data.insights.total * 100).toFixed(1) : 0;
          return `
            <div class="system-metric">
              <div class="label">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
              <div class="progress-bar">
                <div class="fill" style="width: ${percentage}%"></div>
              </div>
              <div class="value">${count} (${percentage}%)</div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- System Health -->
      <div class="card">
        <h2>System Health</h2>
        
        <div class="system-metric">
          <div class="label">CPU Usage</div>
          <div class="progress-bar">
            <div class="fill ${data.system.cpuUsage[data.system.cpuUsage.length-1].value > 80 ? 'danger' : data.system.cpuUsage[data.system.cpuUsage.length-1].value > 60 ? 'warning' : ''}" 
                 style="width: ${data.system.cpuUsage[data.system.cpuUsage.length-1].value}%"></div>
          </div>
          <div class="value">${data.system.cpuUsage[data.system.cpuUsage.length-1].value}%</div>
        </div>
        
        <div class="system-metric">
          <div class="label">Memory</div>
          <div class="progress-bar">
            <div class="fill ${data.system.memoryUsage[data.system.memoryUsage.length-1].value > 80 ? 'danger' : data.system.memoryUsage[data.system.memoryUsage.length-1].value > 60 ? 'warning' : ''}" 
                 style="width: ${data.system.memoryUsage[data.system.memoryUsage.length-1].value}%"></div>
          </div>
          <div class="value">${data.system.memoryUsage[data.system.memoryUsage.length-1].value}%</div>
        </div>
        
        <div class="system-metric">
          <div class="label">Disk Usage</div>
          <div class="progress-bar">
            <div class="fill ${data.system.diskUsage[data.system.diskUsage.length-1].value > 80 ? 'danger' : data.system.diskUsage[data.system.diskUsage.length-1].value > 60 ? 'warning' : ''}" 
                 style="width: ${data.system.diskUsage[data.system.diskUsage.length-1].value}%"></div>
          </div>
          <div class="value">${data.system.diskUsage[data.system.diskUsage.length-1].value}%</div>
        </div>
      </div>
    </div>
    
    <!-- Historical Data -->
    <div class="card">
      <h2>7-Day History</h2>
      
      <div class="history-chart">
        <div class="chart-container">
          ${data.history.length > 0 ? data.history.map(day => {
            const maxValue = Math.max(...data.history.map(d => d.insights.total));
            const height = maxValue > 0 ? (day.insights.total / maxValue * 100) : 0;
            
            return `
              <div class="chart-bar">
                <div class="chart-bar-inner" style="height: ${height}%"></div>
                <div class="chart-bar-label">${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
            `;
          }).join('') : '<div style="width:100%;text-align:center;padding:2rem;">No historical data available yet</div>'}
        </div>
        <div class="chart-axis"></div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Total</th>
            <th>Completed</th>
            <th>Top Model</th>
          </tr>
        </thead>
        <tbody>
          ${data.history.length > 0 ? data.history.map(day => {
            const topModel = Object.entries(day.insights.byModel)
              .sort((a, b) => b[1] - a[1])
              .map(entry => entry[0])[0] || 'N/A';
            
            return `
              <tr>
                <td>${new Date(day.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>${day.insights.total}</td>
                <td>${day.insights.completed}</td>
                <td>${topModel.toUpperCase()}</td>
              </tr>
            `;
          }).join('') : '<tr><td colspan="4" style="text-align:center;">No historical data available yet</td></tr>'}
        </tbody>
      </table>
    </div>
    
    <div class="refresh-time">
      Last updated: ${new Date(data.lastUpdated).toLocaleString()}
      <div class="auto-refresh-toggle">
        <input type="checkbox" id="auto-refresh" checked>
        <label for="auto-refresh">Auto-refresh (30s)</label>
      </div>
    </div>
  </div>
  
  <script>
    // Auto-refresh the page every 30 seconds if enabled
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    let refreshInterval;
    
    function setupRefresh() {
      if (autoRefreshCheckbox.checked) {
        refreshInterval = setInterval(() => {
          window.location.reload();
        }, 30000);
      } else {
        clearInterval(refreshInterval);
      }
    }
    
    autoRefreshCheckbox.addEventListener('change', setupRefresh);
    setupRefresh();
  </script>
</body>
</html>`;
}

/**
 * Start the HTTP server
 */
function startServer() {
  logger.title('Starting Insights Monitor server');
  
  const server = http.createServer((req, res) => {
    const url = req.url;
    
    if (url === '/' || url === '/dashboard') {
      // Update metrics and serve dashboard
      const data = updateMetrics();
      
      if (data) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generateDashboard(data));
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to generate dashboard');
      }
    } else if (url === '/api/metrics') {
      // Serve JSON metrics
      const data = updateMetrics();
      
      if (data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to generate metrics');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });
  
  server.listen(CONFIG.port, () => {
    logger.success(`Server running at http://localhost:${CONFIG.port}/`);
    
    if (CONFIG.openDashboard) {
      // Open dashboard in default browser
      const command = process.platform === 'win32' ? 'start' : 
                     process.platform === 'darwin' ? 'open' : 'xdg-open';
      
      try {
        spawn(command, [`http://localhost:${CONFIG.port}/`], { 
          detached: true, 
          stdio: 'ignore' 
        }).unref();
      } catch (error) {
        logger.error(`Failed to open browser: ${error.message}`);
      }
    }
  });
  
  return server;
}

/**
 * Main function
 */
function main() {
  logger.title('GenAI Insights Monitor');
  logger.info(`Starting with configuration: port=${CONFIG.port}, logLevel=${CONFIG.logLevel}, historyDays=${CONFIG.historyDays}`);
  
  // Ensure metrics are up to date
  updateMetrics();
  
  // Start HTTP server
  const server = startServer();
  
  if (CONFIG.watchMode) {
    logger.info(`Watch mode enabled, polling every ${CONFIG.pollInterval / 1000} seconds`);
    
    // Setup polling for metrics updates
    setInterval(() => {
      updateMetrics();
    }, CONFIG.pollInterval);
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    logger.info('Shutting down server');
    server.close(() => {
      process.exit(0);
    });
  });
}

// Run the main function
main();