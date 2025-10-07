/**
 * Device Audit Command
 * 
 * Command interface for running device audits, checking maintenance needs,
 * and generating reports for IoT/edge device health monitoring.
 */

const deviceAudit = require('../../utils/device_audit');
const fs = require('fs');
const path = require('path');

/**
 * Handle the device-audit command
 * @param {string[]} args - Command arguments
 * @param {object} options - Command options
 * @returns {Promise<object>} Command result
 */
async function handler(args, options) {
  const subCommand = args[0] || 'status';
  
  switch (subCommand) {
    case 'run':
    case 'audit':
      return await runFullAudit(options);
    
    case 'maintenance':
    case 'check':
      return await checkMaintenance(options);
      
    case 'query':
      return showQuery();
      
    case 'history':
      return showHistory(options);
    
    case 'status':
    default:
      return await showStatus(options);
  }
}

/**
 * Run a full device audit
 * @param {object} options - Command options
 * @returns {Promise<object>} Audit results
 */
async function runFullAudit(options) {
  console.log('Running full device audit...');
  
  const results = await deviceAudit.runAudit();
  
  if (results.success) {
    console.log(results.summaryReport);
    
    // Save report to file if requested
    if (options.output) {
      const outputFile = path.resolve(options.output);
      fs.writeFileSync(outputFile, results.summaryReport);
      console.log(`Report saved to ${outputFile}`);
    }
    
    return {
      message: 'Device audit completed successfully',
      data: results.results
    };
  } else {
    return {
      message: `Device audit failed: ${results.error}`,
      error: true
    };
  }
}

/**
 * Check for devices needing maintenance
 * @param {object} options - Command options
 * @returns {Promise<object>} Maintenance check results
 */
async function checkMaintenance(options) {
  const hours = options.hours || 24;
  console.log(`Checking for devices silent for more than ${hours} hours...`);
  
  const devices = await deviceAudit.checkMaintenanceNeeded(hours);
  
  if (devices.length === 0) {
    return {
      message: `All devices have reported within the last ${hours} hours.`,
      data: { devicesNeedingMaintenance: 0 }
    };
  }
  
  console.log(`Found ${devices.length} devices needing maintenance:`);
  console.log('\nDEVICES NEEDING MAINTENANCE:');
  console.log('===========================');
  
  devices.forEach(device => {
    console.log(`${device.deviceId} (${device.type})`);
    console.log(`  Location: ${device.location}`);
    console.log(`  Last transmission: ${device.lastTransmission}`);
    console.log(`  Hours since last: ${device.hoursSinceLast}`);
    console.log('---------------------------');
  });
  
  return {
    message: `Found ${devices.length} devices needing maintenance`,
    data: { 
      devicesNeedingMaintenance: devices.length,
      devices
    }
  };
}

/**
 * Show the SQL query that would be used for the audit
 * @returns {object} Query information
 */
function showQuery() {
  const query = deviceAudit.buildDeviceAuditQuery();
  
  console.log('SQL QUERY FOR DEVICE AUDIT:');
  console.log('==========================');
  console.log(query);
  
  return {
    message: 'SQL query for device audit',
    data: { query }
  };
}

/**
 * Show history of previous device audits
 * @param {object} options - Command options
 * @returns {object} Audit history
 */
function showHistory(options) {
  const logsDir = path.join(__dirname, '../../logs/device_audit');
  
  if (!fs.existsSync(logsDir)) {
    return {
      message: 'No audit history found',
      data: { history: [] }
    };
  }
  
  // Get log files sorted by date (newest first)
  const logFiles = fs.readdirSync(logsDir)
    .filter(file => file.startsWith('device_audit_') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (logFiles.length === 0) {
    return {
      message: 'No audit history found',
      data: { history: [] }
    };
  }
  
  // Limit to the most recent files
  const limit = options.limit || 5;
  const recentLogs = logFiles.slice(0, limit);
  
  console.log(`RECENT DEVICE AUDITS (Last ${recentLogs.length}):`);
  console.log('====================================');
  
  const history = recentLogs.map(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
      console.log(`Audit from ${data.timestamp}:`);
      console.log(`  Total devices: ${data.totalDevices}`);
      console.log(`  Active devices: ${data.activeDevices} (${data.activePercentage}%)`);
      console.log(`  Silent devices: ${data.silentDevices}`);
      console.log('------------------------------------');
      
      return {
        timestamp: data.timestamp,
        totalDevices: data.totalDevices,
        activeDevices: data.activeDevices,
        activePercentage: data.activePercentage,
        silentDevices: data.silentDevices
      };
    } catch (error) {
      console.error(`Error reading log file ${file}: ${error.message}`);
      return null;
    }
  }).filter(Boolean);
  
  return {
    message: `Showing ${history.length} recent device audits`,
    data: { history }
  };
}

/**
 * Show current device status (quick check)
 * @param {object} options - Command options
 * @returns {Promise<object>} Current status
 */
async function showStatus(options) {
  console.log('Checking current device status...');
  
  try {
    // Get device data
    const devices = await deviceAudit.fetchDeviceData();
    
    // Run a quick analysis (subset of the full audit)
    const now = Date.now();
    const silentThreshold = options.threshold || 3600000; // 1 hour default
    
    let activeCount = 0;
    let silentCount = 0;
    
    devices.forEach(device => {
      const lastTransmission = new Date(device.lastDataTransmission).getTime();
      if ((now - lastTransmission) < silentThreshold) {
        activeCount++;
      } else {
        silentCount++;
      }
    });
    
    const activePercentage = (activeCount / devices.length * 100).toFixed(2);
    
    console.log('\nCURRENT DEVICE STATUS:');
    console.log('=====================');
    console.log(`Total Devices: ${devices.length}`);
    console.log(`Active Devices: ${activeCount} (${activePercentage}%)`);
    console.log(`Silent Devices: ${silentCount} (${(100 - parseFloat(activePercentage)).toFixed(2)}%)`);
    console.log(`\nThreshold for silence: ${silentThreshold / 60000} minutes`);
    console.log('\nRun "device-audit run" for full audit details');
    
    return {
      message: 'Current device status',
      data: {
        totalDevices: devices.length,
        activeDevices: activeCount,
        activePercentage,
        silentDevices: silentCount,
        silentThreshold
      }
    };
  } catch (error) {
    return {
      message: `Error getting device status: ${error.message}`,
      error: true
    };
  }
}

// Export command information
module.exports = {
  command: 'device-audit',
  handler,
  help: {
    name: 'device-audit',
    description: 'Audit IoT/edge devices for connection status and data transmission',
    usage: `
device-audit [subcommand] [options]

Subcommands:
  status       Show current device status (default)
  run, audit   Run a full device audit
  maintenance  Check for devices needing maintenance
  query        Show the SQL query used for auditing
  history      Show history of previous audits

Options:
  --output=<file>    Save report to file (for 'run' subcommand)
  --hours=<hours>    Hours threshold for maintenance checks (default: 24)
  --limit=<count>    Limit history results (default: 5)
  --threshold=<ms>   Milliseconds threshold for silence (default: 3600000)

Examples:
  device-audit status
  device-audit run --output=./device_report.txt
  device-audit maintenance --hours=48
  device-audit history --limit=10
`
  }
};