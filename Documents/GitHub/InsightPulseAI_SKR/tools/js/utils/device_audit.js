/**
 * Device Audit Utility
 * 
 * Provides functionality to monitor and audit IoT/edge devices connected to the system
 * Checks device connection status, data transmission, and generates summary reports
 * 
 * Usage:
 *   const deviceAudit = require('./utils/device_audit');
 *   deviceAudit.runAudit().then(report => console.log(report));
 */

const supersetConfig = require('../config/superset_connection');
const logger = require('../logger');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration settings for device audit
const config = {
  // How long (in milliseconds) a device can be silent before considered inactive
  silentThreshold: process.env.DEVICE_SILENT_THRESHOLD || 3600000, // Default: 1 hour
  
  // Number of days of device history to keep
  historyDays: process.env.DEVICE_HISTORY_DAYS || 30,
  
  // Directory to store device audit logs
  logsDirectory: path.join(__dirname, '../logs/device_audit'),
  
  // API endpoints (would be set from environment variables in production)
  deviceApiEndpoint: process.env.DEVICE_API_ENDPOINT || 'https://adb-123456789.0.azuredatabricks.net/api/2.0/devices',
  
  // Mock mode for development/testing
  useMockData: process.env.NODE_ENV !== 'production'
};

// Ensure logs directory exists
if (!fs.existsSync(config.logsDirectory)) {
  fs.mkdirSync(config.logsDirectory, { recursive: true });
}

/**
 * Generate mock device data for testing
 * @param {number} count - Number of devices to generate
 * @returns {Array<Object>} Array of mock device objects
 */
function generateMockDevices(count = 50) {
  const deviceTypes = ['sensor', 'camera', 'gateway', 'display', 'kiosk'];
  const locations = ['store-north', 'store-south', 'store-east', 'store-west', 'warehouse', 'distribution-center'];
  const models = ['RPI-4B', 'NVIDIA-Jetson', 'Azure-Edge', 'Intel-NUC', 'Custom-v2'];
  const statuses = ['active', 'inactive', 'maintenance', 'error'];
  const firmwareVersions = ['1.2.0', '1.3.2', '2.0.1', '2.1.0'];
  
  const devices = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    // Generate a random timestamp within the last 24 hours for last data transmission
    // With ~70% of devices having transmitted data recently and ~30% being silent
    const isActive = Math.random() < 0.7;
    const lastDataTransmission = isActive ? 
      now - Math.floor(Math.random() * 3600000) : // Within last hour
      now - Math.floor(Math.random() * 259200000) - 3600000; // 1-72 hours ago
      
    // Generate a device type based on index to ensure a good distribution
    const typeIndex = i % deviceTypes.length;
    const type = deviceTypes[typeIndex];
    
    // Create the device object
    devices.push({
      deviceId: `DEV-${(i + 1).toString().padStart(4, '0')}`,
      type,
      model: models[Math.floor(Math.random() * models.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      status: isActive ? 'active' : statuses[Math.floor(Math.random() * statuses.length)],
      firmwareVersion: firmwareVersions[Math.floor(Math.random() * firmwareVersions.length)],
      installDate: new Date(now - Math.floor(Math.random() * 31536000000)).toISOString(), // Random date within last year
      lastDataTransmission: new Date(lastDataTransmission).toISOString(),
      dataPoints: Math.floor(Math.random() * 100000),
      batteryLevel: type === 'sensor' ? Math.floor(Math.random() * 100) : null,
      ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      tags: [`region-${Math.floor(Math.random() * 5) + 1}`, `deployment-batch-${Math.floor(Math.random() * 10) + 1}`]
    });
  }
  
  return devices;
}

/**
 * Fetch device data from API or use mock data if configured
 * @returns {Promise<Array<Object>>} Device data
 */
async function fetchDeviceData() {
  try {
    if (config.useMockData) {
      logger.info('Using mock device data');
      return generateMockDevices();
    }
    
    logger.info(`Fetching device data from ${config.deviceApiEndpoint}`);
    
    // In a real implementation, this would make an actual API call
    // to fetch device data from a database or service
    const response = await fetch(config.deviceApiEndpoint, {
      headers: {
        'Authorization': `Bearer ${process.env.DEVICE_API_TOKEN || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.devices || [];
    
  } catch (error) {
    logger.error(`Error fetching device data: ${error.message}`);
    
    // Fallback to mock data if API request fails
    logger.info('Falling back to mock device data');
    return generateMockDevices();
  }
}

/**
 * Build and execute a device audit SQL query against the data source
 * @param {Array<Object>} devices - Device data
 * @returns {Promise<Object>} Audit results
 */
async function executeDeviceAuditQuery(devices) {
  // This would typically be an actual SQL query executed against a database
  // For this implementation, we'll analyze the devices array directly
  
  const now = Date.now();
  const results = {
    totalDevices: devices.length,
    activeDevices: 0,
    silentDevices: 0,
    byType: {},
    byLocation: {},
    byFirmware: {},
    topSilentLocations: []
  };
  
  // Process device data
  devices.forEach(device => {
    // Calculate device activity status
    const lastTransmission = new Date(device.lastDataTransmission).getTime();
    const timeSinceTransmission = now - lastTransmission;
    const isActive = timeSinceTransmission < config.silentThreshold;
    
    // Update counts
    if (isActive) {
      results.activeDevices++;
    } else {
      results.silentDevices++;
    }
    
    // Count by type
    results.byType[device.type] = results.byType[device.type] || { total: 0, active: 0, silent: 0 };
    results.byType[device.type].total++;
    if (isActive) {
      results.byType[device.type].active++;
    } else {
      results.byType[device.type].silent++;
    }
    
    // Count by location
    results.byLocation[device.location] = results.byLocation[device.location] || { total: 0, active: 0, silent: 0 };
    results.byLocation[device.location].total++;
    if (isActive) {
      results.byLocation[device.location].active++;
    } else {
      results.byLocation[device.location].silent++;
    }
    
    // Count by firmware version
    results.byFirmware[device.firmwareVersion] = results.byFirmware[device.firmwareVersion] || { total: 0, active: 0, silent: 0 };
    results.byFirmware[device.firmwareVersion].total++;
    if (isActive) {
      results.byFirmware[device.firmwareVersion].active++;
    } else {
      results.byFirmware[device.firmwareVersion].silent++;
    }
  });
  
  // Calculate percentage of active devices
  results.activePercentage = (results.activeDevices / results.totalDevices * 100).toFixed(2);
  
  // Identify locations with most silent devices
  results.topSilentLocations = Object.entries(results.byLocation)
    .sort((a, b) => b[1].silent - a[1].silent)
    .filter(([_, stats]) => stats.silent > 0)
    .slice(0, 3)
    .map(([location, stats]) => ({ 
      location, 
      silentCount: stats.silent,
      silentPercentage: (stats.silent / stats.total * 100).toFixed(2)
    }));
  
  return results;
}

/**
 * Save audit results to a log file
 * @param {Object} results - Audit results
 */
function saveAuditResults(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filePath = path.join(config.logsDirectory, `device_audit_${timestamp}.json`);
  
  try {
    // Add timestamp to results
    const resultsWithTimestamp = {
      timestamp: new Date().toISOString(),
      ...results
    };
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(resultsWithTimestamp, null, 2));
    logger.info(`Saved audit results to ${filePath}`);
    
    // Maintain logs history - delete old log files if needed
    const logFiles = fs.readdirSync(config.logsDirectory)
      .filter(file => file.startsWith('device_audit_'))
      .sort();
    
    // Calculate max number of log files to keep based on historyDays
    const maxFiles = config.historyDays;
    
    if (logFiles.length > maxFiles) {
      // Delete oldest log files
      const filesToDelete = logFiles.slice(0, logFiles.length - maxFiles);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(config.logsDirectory, file));
        logger.debug(`Deleted old audit log: ${file}`);
      });
    }
    
  } catch (error) {
    logger.error(`Error saving audit results: ${error.message}`);
  }
}

/**
 * Generate readable summary report from audit results
 * @param {Object} results - Audit results
 * @returns {string} Formatted summary report
 */
function generateSummaryReport(results) {
  // Create a formatted text report
  return `
==============================================
DEVICE AUDIT SUMMARY - ${new Date().toISOString()}
==============================================

DEVICE COUNT
-----------
Total Devices: ${results.totalDevices}
Actively Sending Data: ${results.activeDevices} (${results.activePercentage}%)
Silent Devices: ${results.silentDevices} (${(100 - parseFloat(results.activePercentage)).toFixed(2)}%)

DEVICE TYPES
-----------
${Object.entries(results.byType).map(([type, stats]) => {
  const activePercent = (stats.active / stats.total * 100).toFixed(2);
  return `${type}: ${stats.total} total, ${stats.active} active (${activePercent}%), ${stats.silent} silent`;
}).join('\n')}

TOP LOCATIONS WITH SILENT DEVICES
-------------------------------
${results.topSilentLocations.map(location => {
  return `${location.location}: ${location.silentCount} silent devices (${location.silentPercentage}%)`;
}).join('\n')}

FIRMWARE VERSIONS
---------------
${Object.entries(results.byFirmware).map(([version, stats]) => {
  const activePercent = (stats.active / stats.total * 100).toFixed(2);
  return `${version}: ${stats.total} total, ${stats.active} active (${activePercent}%), ${stats.silent} silent`;
}).join('\n')}

==============================================
Report Generated: ${new Date().toISOString()}
==============================================
`;
}

/**
 * Run a complete device audit
 * @returns {Promise<Object>} Audit results and summary
 */
async function runAudit() {
  try {
    logger.info('Starting device audit...');
    
    // Fetch device data
    const devices = await fetchDeviceData();
    logger.info(`Fetched data for ${devices.length} devices`);
    
    // Execute audit query
    const results = await executeDeviceAuditQuery(devices);
    logger.info(`Audit complete: ${results.activeDevices} active devices, ${results.silentDevices} silent devices`);
    
    // Save results to log file
    saveAuditResults(results);
    
    // Generate summary report
    const summaryReport = generateSummaryReport(results);
    
    return {
      success: true,
      results,
      summaryReport,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error(`Device audit failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check for devices that haven't sent data recently and need maintenance
 * @param {number} hoursThreshold - Hours of silence to trigger maintenance alert
 * @returns {Promise<Array<Object>>} Devices needing maintenance
 */
async function checkMaintenanceNeeded(hoursThreshold = 24) {
  try {
    const devices = await fetchDeviceData();
    const now = Date.now();
    const thresholdMillis = hoursThreshold * 60 * 60 * 1000;
    
    // Filter devices that haven't reported in longer than the threshold
    const maintenanceNeeded = devices.filter(device => {
      const lastTransmission = new Date(device.lastDataTransmission).getTime();
      return (now - lastTransmission) > thresholdMillis;
    });
    
    return maintenanceNeeded.map(device => ({
      deviceId: device.deviceId,
      type: device.type,
      location: device.location,
      lastTransmission: device.lastDataTransmission,
      hoursSinceLast: ((now - new Date(device.lastDataTransmission).getTime()) / 3600000).toFixed(1)
    }));
    
  } catch (error) {
    logger.error(`Error checking maintenance needs: ${error.message}`);
    return [];
  }
}

/**
 * Create a SQL query string for device audit
 * This would be used with a real database
 * @returns {string} SQL query
 */
function buildDeviceAuditQuery() {
  const silentThresholdHours = config.silentThreshold / 3600000;
  
  return `
    WITH DeviceStatus AS (
      SELECT
        device_id,
        device_type,
        location,
        firmware_version,
        last_transmission_time,
        CASE 
          WHEN DATEDIFF(hour, last_transmission_time, CURRENT_TIMESTAMP) < ${silentThresholdHours} THEN 'active'
          ELSE 'silent'
        END AS status
      FROM devices
    )
    
    SELECT
      COUNT(*) AS total_devices,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_devices,
      SUM(CASE WHEN status = 'silent' THEN 1 ELSE 0 END) AS silent_devices,
      CAST(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) AS active_percentage
    FROM DeviceStatus;
  `;
}

// Export the module functions
module.exports = {
  runAudit,
  checkMaintenanceNeeded,
  buildDeviceAuditQuery,
  generateSummaryReport,
  
  // Export these for testing purposes
  fetchDeviceData,
  executeDeviceAuditQuery,
  saveAuditResults
};