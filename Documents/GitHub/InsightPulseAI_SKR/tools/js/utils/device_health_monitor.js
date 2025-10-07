/**
 * Device Health Monitoring Module
 * 
 * This module provides device health monitoring functionality that integrates with 
 * the main Juicer Insights Dashboard. It provides real-time monitoring of device status,
 * data quality, and alerting for device connectivity issues.
 */

const logger = require('../logger');
const deviceAudit = require('./device_audit');
const fs = require('fs');
const path = require('path');

// Load SQL queries from file
const sqlQueriesPath = path.join(__dirname, '../device_audit_queries.sql');
let sqlQueries = {};

/**
 * Load SQL queries from the device_audit_queries.sql file
 * @returns {Object} Object containing SQL queries by name
 */
function loadSqlQueries() {
  try {
    if (!fs.existsSync(sqlQueriesPath)) {
      logger.warn(`SQL queries file not found at ${sqlQueriesPath}`);
      return {};
    }

    const sqlContent = fs.readFileSync(sqlQueriesPath, 'utf8');
    const queryBlocks = sqlContent.split('-- =========================================================');
    
    const queries = {};
    
    // Extract each query and its name
    for (let i = 1; i < queryBlocks.length; i++) {
      const block = queryBlocks[i];
      const nameMatch = block.match(/-- ([\w\s]+):/);
      
      if (nameMatch && nameMatch[1]) {
        const queryName = nameMatch[1].trim().replace(/\s+/g, '_').toLowerCase();
        const queryContent = block.split(';')[0].trim();
        
        if (queryContent) {
          queries[queryName] = queryContent;
        }
      }
    }
    
    logger.info(`Loaded ${Object.keys(queries).length} SQL queries from ${sqlQueriesPath}`);
    return queries;
  } catch (error) {
    logger.error(`Error loading SQL queries: ${error.message}`);
    return {};
  }
}

// Make sure queries are loaded
sqlQueries = loadSqlQueries();

/**
 * Get problematic devices from the most recent audit
 * @returns {Promise<Array>} List of problematic devices
 */
async function getProblematicDevices() {
  try {
    const auditResult = await deviceAudit.runAudit();
    if (!auditResult.success) {
      throw new Error('Device audit failed');
    }
    
    // Extract and format problematic devices
    const silentDevices = auditResult.results.silentDevices || [];
    
    // Create a mapping of device IDs to problem details
    const problematicDevices = silentDevices.map(device => ({
      deviceId: device.deviceId,
      model: device.model,
      location: device.location,
      firmwareVersion: device.firmwareVersion,
      issueType: 'Silent Device',
      lastTransmission: device.lastDataTransmission,
      hoursSinceLastTransmission: Math.floor(
        (new Date() - new Date(device.lastDataTransmission)) / (1000 * 60 * 60)
      ),
      status: device.status || 'unknown'
    }));
    
    // Sort devices with most severe issues first
    return problematicDevices.sort((a, b) => b.hoursSinceLastTransmission - a.hoursSinceLastTransmission);
  } catch (error) {
    logger.error(`Error getting problematic devices: ${error.message}`);
    return [];
  }
}

/**
 * Get transcription data quality issues
 * @returns {Promise<Array>} List of devices with transcription issues
 */
async function getTranscriptionQualityIssues() {
  try {
    // In a real implementation, this would execute a database query
    // For demo purposes, we'll generate mock data
    
    const transcriptionIssues = [];
    const deviceTypes = ['camera', 'kiosk', 'display'];
    const locations = ['store-north', 'store-south', 'store-east', 'store-west', 'warehouse'];
    const issues = [
      'Empty Transcripts', 
      'Missing Facial IDs', 
      'Low Confidence Scores',
      'Truncated Audio'
    ];
    
    // Generate 10-15 mock devices with issues
    const deviceCount = Math.floor(Math.random() * 6) + 10;
    
    for (let i = 1; i <= deviceCount; i++) {
      const deviceId = `DEV-${i.toString().padStart(4, '0')}`;
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const issue = issues[Math.floor(Math.random() * issues.length)];
      const totalTranscripts = Math.floor(Math.random() * 100) + 50;
      const affectedCount = Math.floor(Math.random() * (totalTranscripts / 3)) + 1;
      
      transcriptionIssues.push({
        deviceId,
        deviceType,
        location,
        issueType: issue,
        totalTranscripts,
        affectedCount,
        affectedPercentage: (affectedCount / totalTranscripts * 100).toFixed(2),
        lastOccurrence: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString()
      });
    }
    
    // Sort by affected percentage (highest first)
    return transcriptionIssues.sort((a, b) => 
      parseFloat(b.affectedPercentage) - parseFloat(a.affectedPercentage)
    );
  } catch (error) {
    logger.error(`Error getting transcription quality issues: ${error.message}`);
    return [];
  }
}

/**
 * Get customer ID capture failures
 * @returns {Promise<Array>} List of devices with customer ID capture issues
 */
async function getCustomerIdIssues() {
  try {
    // In a real implementation, this would execute a database query
    // For demo purposes, we'll generate mock data
    
    const customerIdIssues = [];
    const deviceTypes = ['kiosk', 'display', 'sensor'];
    const locations = ['store-north', 'store-south', 'store-east', 'store-west', 'warehouse'];
    
    // Generate 8-12 mock devices with issues
    const deviceCount = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 1; i <= deviceCount; i++) {
      const deviceId = `DEV-${i.toString().padStart(4, '0')}`;
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const totalInteractions = Math.floor(Math.random() * 200) + 100;
      const missingCustomerIds = Math.floor(Math.random() * (totalInteractions / 2)) + 1;
      
      customerIdIssues.push({
        deviceId,
        deviceType,
        location,
        totalInteractions,
        missingCustomerIds,
        missingPercentage: (missingCustomerIds / totalInteractions * 100).toFixed(2),
        lastOccurrence: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString()
      });
    }
    
    // Sort by missing percentage (highest first)
    return customerIdIssues.sort((a, b) => 
      parseFloat(b.missingPercentage) - parseFloat(a.missingPercentage)
    );
  } catch (error) {
    logger.error(`Error getting customer ID issues: ${error.message}`);
    return [];
  }
}

/**
 * Get firmware performance analysis
 * @returns {Promise<Array>} Firmware performance data
 */
async function getFirmwareAnalysis() {
  try {
    // In a real implementation, this would execute a database query
    // For demo purposes, we'll generate mock data
    
    const firmwareVersions = ['1.2.0', '1.3.2', '2.0.1', '2.1.0'];
    const firmwareAnalysis = firmwareVersions.map(version => {
      // Generate metrics with realistic data (make 2.0.1 problematic)
      const errorRate = version === '2.0.1' ? 15 + Math.random() * 10 : 
                       version === '1.2.0' ? 8 + Math.random() * 5 :
                       3 + Math.random() * 6;
      
      const deviceCount = Math.floor(Math.random() * 15) + 10;
      const silentDevices = version === '2.0.1' ? Math.floor(deviceCount * 0.25) :
                           Math.floor(deviceCount * 0.05);
      
      return {
        firmwareVersion: version,
        deviceCount,
        silentDevices,
        silentPercentage: (silentDevices / deviceCount * 100).toFixed(2),
        avgErrorRate: errorRate.toFixed(2),
        avgTranscriptQuality: (100 - errorRate / 2).toFixed(2),
        avgCustomerIdCapture: (100 - errorRate).toFixed(2)
      };
    });
    
    // Sort by error rate (highest first)
    return firmwareAnalysis.sort((a, b) => 
      parseFloat(b.avgErrorRate) - parseFloat(a.avgErrorRate)
    );
  } catch (error) {
    logger.error(`Error getting firmware analysis: ${error.message}`);
    return [];
  }
}

/**
 * Get store location device health overview
 * @returns {Promise<Array>} Store location health data
 */
async function getStoreLocationHealth() {
  try {
    // In a real implementation, this would execute a database query
    // For demo purposes, we'll generate mock data
    
    const locations = ['store-north', 'store-south', 'store-east', 'store-west', 'warehouse', 'distribution-center'];
    const storeHealth = locations.map(location => {
      // Make store-north problematic for demo purposes
      const isBadLocation = location === 'store-north';
      
      const deviceCount = Math.floor(Math.random() * 20) + 10;
      const silentDevices = isBadLocation ? Math.floor(deviceCount * 0.3) : Math.floor(deviceCount * 0.05);
      
      const transcriptionErrorRate = isBadLocation ? 15 + Math.random() * 10 : 3 + Math.random() * 6;
      const customerIdErrorRate = isBadLocation ? 20 + Math.random() * 15 : 5 + Math.random() * 10;
      
      return {
        location,
        deviceCount,
        silentDevices,
        silentPercentage: (silentDevices / deviceCount * 100).toFixed(2),
        transcriptionErrorRate: transcriptionErrorRate.toFixed(2),
        customerIdErrorRate: customerIdErrorRate.toFixed(2),
        overallHealth: (100 - (transcriptionErrorRate + customerIdErrorRate) / 2).toFixed(2),
        status: isBadLocation ? 'Warning' : 'Healthy'
      };
    });
    
    // Sort by overall health (lowest first)
    return storeHealth.sort((a, b) => 
      parseFloat(a.overallHealth) - parseFloat(b.overallHealth)
    );
  } catch (error) {
    logger.error(`Error getting store location health: ${error.message}`);
    return [];
  }
}

/**
 * Get device alerts for the dashboard
 * @returns {Promise<Object>} Alert summary and details
 */
async function getDeviceAlerts() {
  try {
    // Get data for alerts
    const problematicDevices = await getProblematicDevices();
    const transcriptionIssues = await getTranscriptionQualityIssues();
    const customerIdIssues = await getCustomerIdIssues();
    
    // Calculate summary counts
    const criticalCount = problematicDevices.filter(d => d.hoursSinceLastTransmission > 24).length;
    const warningCount = problematicDevices.filter(d => d.hoursSinceLastTransmission <= 24 && d.hoursSinceLastTransmission > 6).length;
    const transcriptionAlertCount = transcriptionIssues.filter(t => parseFloat(t.affectedPercentage) > 15).length;
    const customerIdAlertCount = customerIdIssues.filter(c => parseFloat(c.missingPercentage) > 25).length;
    
    // Combine all alerts into one list
    const deviceAlerts = problematicDevices.map(device => ({
      deviceId: device.deviceId,
      location: device.location,
      alertType: 'Connectivity',
      severity: device.hoursSinceLastTransmission > 24 ? 'Critical' : 
                device.hoursSinceLastTransmission > 6 ? 'Warning' : 'Info',
      message: `No data received for ${device.hoursSinceLastTransmission} hours`,
      timestamp: new Date().toISOString()
    }));
    
    // Add transcription alerts
    transcriptionIssues
      .filter(issue => parseFloat(issue.affectedPercentage) > 15)
      .forEach(issue => {
        deviceAlerts.push({
          deviceId: issue.deviceId,
          location: issue.location,
          alertType: 'Transcription',
          severity: parseFloat(issue.affectedPercentage) > 30 ? 'Critical' : 'Warning',
          message: `${issue.issueType}: ${issue.affectedPercentage}% of transcripts affected`,
          timestamp: issue.lastOccurrence
        });
      });
    
    // Add customer ID alerts
    customerIdIssues
      .filter(issue => parseFloat(issue.missingPercentage) > 25)
      .forEach(issue => {
        deviceAlerts.push({
          deviceId: issue.deviceId,
          location: issue.location,
          alertType: 'CustomerID',
          severity: parseFloat(issue.missingPercentage) > 50 ? 'Critical' : 'Warning',
          message: `Missing Customer IDs: ${issue.missingPercentage}% of interactions affected`,
          timestamp: issue.lastOccurrence
        });
      });
    
    // Sort by severity (Critical first) then by timestamp (newest first)
    deviceAlerts.sort((a, b) => {
      const severityOrder = { 'Critical': 0, 'Warning': 1, 'Info': 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    return {
      summary: {
        total: criticalCount + warningCount + transcriptionAlertCount + customerIdAlertCount,
        critical: criticalCount + transcriptionIssues.filter(t => parseFloat(t.affectedPercentage) > 30).length +
                  customerIdIssues.filter(c => parseFloat(c.missingPercentage) > 50).length,
        warning: warningCount + transcriptionIssues.filter(t => parseFloat(t.affectedPercentage) <= 30 && parseFloat(t.affectedPercentage) > 15).length +
                 customerIdIssues.filter(c => parseFloat(c.missingPercentage) <= 50 && parseFloat(c.missingPercentage) > 25).length,
        byType: {
          connectivity: criticalCount + warningCount,
          transcription: transcriptionAlertCount,
          customerId: customerIdAlertCount
        }
      },
      alerts: deviceAlerts
    };
  } catch (error) {
    logger.error(`Error getting device alerts: ${error.message}`);
    return {
      summary: { total: 0, critical: 0, warning: 0, byType: {} },
      alerts: []
    };
  }
}

/**
 * Get a complete device health summary
 * @returns {Promise<Object>} Complete device health dashboard data
 */
async function getDeviceHealthDashboard() {
  try {
    // Gather all data in parallel
    const [
      problematicDevices,
      transcriptionIssues,
      customerIdIssues,
      firmwareAnalysis,
      storeLocationHealth,
      alertData
    ] = await Promise.all([
      getProblematicDevices(),
      getTranscriptionQualityIssues(),
      getCustomerIdIssues(),
      getFirmwareAnalysis(),
      getStoreLocationHealth(),
      getDeviceAlerts()
    ]);
    
    // Combine into a single dashboard object
    return {
      timestamp: new Date().toISOString(),
      problematicDevices,
      transcriptionIssues,
      customerIdIssues,
      firmwareAnalysis,
      storeLocationHealth,
      alerts: alertData,
      summary: {
        deviceCount: storeLocationHealth.reduce((sum, location) => sum + location.deviceCount, 0),
        silentDeviceCount: storeLocationHealth.reduce((sum, location) => sum + location.silentDevices, 0),
        transcriptionIssueCount: transcriptionIssues.length,
        customerIdIssueCount: customerIdIssues.length,
        criticalAlertCount: alertData.summary.critical,
        warningAlertCount: alertData.summary.warning,
        worstPerformingFirmware: firmwareAnalysis[0].firmwareVersion,
        worstPerformingLocation: storeLocationHealth[0].location
      }
    };
  } catch (error) {
    logger.error(`Error generating device health dashboard: ${error.message}`);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Run a device audit manually and return results
 * @returns {Promise<Object>} Audit results
 */
async function runDeviceAudit() {
  try {
    const auditResult = await deviceAudit.runAudit();
    
    if (!auditResult.success) {
      throw new Error(`Audit failed: ${auditResult.error}`);
    }
    
    logger.info(`Device audit completed: ${auditResult.results.activeDevices} active, ${auditResult.results.silentDevices} silent`);
    
    return {
      success: true,
      timestamp: auditResult.timestamp,
      summary: `${auditResult.results.activeDevices} active, ${auditResult.results.silentDevices} silent devices`,
      details: auditResult.results
    };
  } catch (error) {
    logger.error(`Error running device audit: ${error.message}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  getProblematicDevices,
  getTranscriptionQualityIssues,
  getCustomerIdIssues,
  getFirmwareAnalysis,
  getStoreLocationHealth,
  getDeviceAlerts,
  getDeviceHealthDashboard,
  runDeviceAudit
};