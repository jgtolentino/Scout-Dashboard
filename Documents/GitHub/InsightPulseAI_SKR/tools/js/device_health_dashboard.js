/**
 * Device Health Monitoring Dashboard
 * 
 * A simple web-based dashboard to monitor device health and data quality issues.
 * Uses the SQL queries from device_audit_queries.sql to visualize device status.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const supersetConfig = require('../config/superset_connection');
const deviceAudit = require('./utils/device_audit');

const app = express();
const PORT = process.env.PORT || 3030;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load SQL queries from file
const sqlQueriesPath = path.join(__dirname, 'device_audit_queries.sql');
let sqlQueries = {};

function loadSqlQueries() {
  try {
    const sqlContent = fs.readFileSync(sqlQueriesPath, 'utf8');
    const queryBlocks = sqlContent.split('-- =========================================================');
    
    // Extract each query and its name
    for (let i = 1; i < queryBlocks.length; i++) {
      const block = queryBlocks[i];
      const nameMatch = block.match(/-- ([\w\s]+):/);
      
      if (nameMatch && nameMatch[1]) {
        const queryName = nameMatch[1].trim().replace(/\s+/g, '_').toLowerCase();
        const queryContent = block.split(';')[0].trim();
        
        if (queryContent) {
          sqlQueries[queryName] = queryContent;
        }
      }
    }
    
    logger.info(`Loaded ${Object.keys(sqlQueries).length} SQL queries from ${sqlQueriesPath}`);
  } catch (error) {
    logger.error(`Error loading SQL queries: ${error.message}`);
  }
}

// Mock database connection for demonstration
function executeQuery(queryName) {
  return new Promise((resolve, reject) => {
    if (!sqlQueries[queryName]) {
      reject(new Error(`Query '${queryName}' not found`));
      return;
    }
    
    // In a real implementation, this would use a database connection
    // For demo purposes, generate mock data based on device audit results
    const mockDataGenerators = {
      problematic_devices: async () => {
        const auditResult = await deviceAudit.runAudit();
        const devices = auditResult.results.silentDevices.map(d => ({
          DeviceID: d.deviceId,
          StoreID: d.location,
          DeviceModel: d.model,
          firmwareVersion: d.firmwareVersion,
          IssueType: 'Silent > 24 hours',
          TotalIssueCount: Math.floor(Math.random() * 3) + 1
        }));
        
        // Add some devices with empty transcripts
        const emptyTranscriptDevices = ['DEV-0008', 'DEV-0042', 'DEV-0029', 'DEV-0033'];
        emptyTranscriptDevices.forEach(deviceId => {
          if (!devices.find(d => d.DeviceID === deviceId)) {
            devices.push({
              DeviceID: deviceId,
              StoreID: `store-${Math.floor(Math.random() * 5) + 1}`,
              DeviceModel: 'RPI-4B',
              firmwareVersion: '2.0.1',
              IssueType: 'Empty Transcripts',
              TotalIssueCount: Math.floor(Math.random() * 2) + 1
            });
          }
        });
        
        // Add some devices with missing CustomerIDs
        const missingCustomerDevices = ['DEV-0006', 'DEV-0046', 'DEV-0001', 'DEV-0047'];
        missingCustomerDevices.forEach(deviceId => {
          if (!devices.find(d => d.DeviceID === deviceId)) {
            devices.push({
              DeviceID: deviceId,
              StoreID: `store-${Math.floor(Math.random() * 5) + 1}`,
              DeviceModel: 'Azure-Edge',
              firmwareVersion: '1.3.2',
              IssueType: 'Missing CustomerIDs',
              TotalIssueCount: Math.floor(Math.random() * 2) + 1
            });
          }
        });
        
        return devices;
      },
      
      empty_transcriptions: async () => {
        // Generate mock data for empty transcriptions
        const devices = [];
        for (let i = 1; i <= 24; i++) {
          const deviceId = `DEV-${i.toString().padStart(4, '0')}`;
          const totalTranscripts = Math.floor(Math.random() * 50) + 10;
          const emptyPercent = Math.random() * 20; // 0-20% empty
          const emptyTranscripts = Math.floor(totalTranscripts * (emptyPercent / 100));
          
          if (emptyTranscripts > 0) {
            devices.push({
              DeviceID: deviceId,
              StoreID: `store-${Math.floor(Math.random() * 5) + 1}`,
              DeviceModel: ['RPI-4B', 'NVIDIA-Jetson', 'Azure-Edge'][Math.floor(Math.random() * 3)],
              firmwareVersion: ['1.2.0', '1.3.2', '2.0.1', '2.1.0'][Math.floor(Math.random() * 4)],
              TotalTranscripts: totalTranscripts,
              EmptyTranscripts: emptyTranscripts,
              EmptyTranscriptPercent: emptyPercent.toFixed(2),
              MissingFacialIDs: Math.floor(Math.random() * emptyTranscripts) + Math.floor(Math.random() * 5),
              MissingFacialIDPercent: (Math.random() * 30).toFixed(2),
              MissingConfidence: Math.floor(Math.random() * emptyTranscripts),
              MissingConfidencePercent: (Math.random() * 15).toFixed(2),
              AvgConfidence: (0.7 + Math.random() * 0.25).toFixed(2)
            });
          }
        }
        
        return devices.sort((a, b) => b.EmptyTranscriptPercent - a.EmptyTranscriptPercent);
      },
      
      missing_customer_ids: async () => {
        // Generate mock data for missing customer IDs
        const devices = [];
        for (let i = 1; i <= 20; i++) {
          const deviceId = `DEV-${i.toString().padStart(4, '0')}`;
          const totalInteractions = Math.floor(Math.random() * 100) + 20;
          const missingPercent = Math.random() * 60; // 0-60% missing
          const missingCustomerIDs = Math.floor(totalInteractions * (missingPercent / 100));
          
          if (missingCustomerIDs > 0) {
            devices.push({
              DeviceID: deviceId,
              StoreID: `store-${Math.floor(Math.random() * 5) + 1}`,
              DeviceModel: ['RPI-4B', 'NVIDIA-Jetson', 'Azure-Edge'][Math.floor(Math.random() * 3)],
              firmwareVersion: ['1.2.0', '1.3.2', '2.0.1', '2.1.0'][Math.floor(Math.random() * 4)],
              InteractionType: ['VIEW', 'PICK', 'INQUIRY', 'PURCHASE'][Math.floor(Math.random() * 4)],
              TotalInteractions: totalInteractions,
              MissingCustomerIDs: missingCustomerIDs,
              MissingCustomerIDPercent: missingPercent.toFixed(2)
            });
          }
        }
        
        return devices.sort((a, b) => b.MissingCustomerIDPercent - a.MissingCustomerIDPercent);
      },
      
      device_health_dashboard: async () => {
        const auditResult = await deviceAudit.runAudit();
        const now = new Date();
        
        // Transform device data into health dashboard format
        return auditResult.results.byType.sensor.concat(
          auditResult.results.byType.camera,
          auditResult.results.byType.gateway,
          auditResult.results.byType.display,
          auditResult.results.byType.kiosk
        ).map(device => {
          const lastLogTime = new Date(device.lastDataTransmission);
          const hoursSinceLast = Math.floor((now - lastLogTime) / 3600000);
          
          return {
            DeviceID: device.deviceId,
            StoreID: device.location,
            DeviceModel: device.model,
            firmwareVersion: device.firmwareVersion,
            status: device.status,
            LastDeviceLog: device.lastDataTransmission,
            LastTranscription: new Date(lastLogTime.getTime() - Math.random() * 3600000 * 2).toISOString(),
            LastVisionDetection: new Date(lastLogTime.getTime() - Math.random() * 3600000 * 3).toISOString(),
            LastSalesInteraction: new Date(lastLogTime.getTime() - Math.random() * 3600000 * 1.5).toISOString(),
            HoursSinceLastDeviceLog: hoursSinceLast,
            HoursSinceLastTranscription: hoursSinceLast + Math.floor(Math.random() * 3),
            HoursSinceLastVisionDetection: hoursSinceLast + Math.floor(Math.random() * 5),
            HoursSinceLastSalesInteraction: hoursSinceLast + Math.floor(Math.random() * 2),
            EmptyTranscripts: Math.floor(Math.random() * 10),
            MissingCustomerIDs: Math.floor(Math.random() * 15),
            MissingBoundingBoxes: Math.floor(Math.random() * 8),
            HealthStatus: hoursSinceLast > 24 ? 'Critical' : 
                          hoursSinceLast > 6 ? 'Warning' : 
                          Math.random() < 0.2 ? 'Warning' : 'Healthy'
          };
        }).sort((a, b) => {
          // Sort by health status, then by hours since last log
          const statusOrder = { 'Critical': 0, 'Warning': 1, 'Healthy': 2 };
          if (statusOrder[a.HealthStatus] !== statusOrder[b.HealthStatus]) {
            return statusOrder[a.HealthStatus] - statusOrder[b.HealthStatus];
          }
          return b.HoursSinceLastDeviceLog - a.HoursSinceLastDeviceLog;
        });
      },
      
      firmware_analysis: async () => {
        // Generate firmware analysis data
        const firmwareVersions = ['1.2.0', '1.3.2', '2.0.1', '2.1.0'];
        return firmwareVersions.map(version => {
          const incompleteLogPercent = version === '2.0.1' ? 15.75 : 
                                      version === '1.2.0' ? 8.45 : 
                                      5 + Math.random() * 10;
          
          const emptyTranscriptPercent = version === '2.0.1' ? 18.32 : 
                                        version === '1.2.0' ? 7.21 : 
                                        4 + Math.random() * 8;
          
          const incompleteDetectionPercent = version === '2.0.1' ? 12.64 : 
                                            version === '1.3.2' ? 9.87 : 
                                            3 + Math.random() * 7;
          
          const missingCustomerIDPercent = version === '2.0.1' ? 42.16 : 
                                          version === '1.3.2' ? 38.45 : 
                                          25 + Math.random() * 15;
          
          const overallErrorRate = (incompleteLogPercent + emptyTranscriptPercent + 
                                  incompleteDetectionPercent + missingCustomerIDPercent) / 4;
          
          return {
            firmwareVersion: version,
            TotalDevices: Math.floor(Math.random() * 15) + 5,
            IncompleteLogPercent: incompleteLogPercent.toFixed(2),
            EmptyTranscriptPercent: emptyTranscriptPercent.toFixed(2),
            IncompleteDetectionPercent: incompleteDetectionPercent.toFixed(2),
            MissingCustomerIDPercent: missingCustomerIDPercent.toFixed(2),
            OverallErrorRate: overallErrorRate.toFixed(2)
          };
        }).sort((a, b) => a.OverallErrorRate - b.OverallErrorRate);
      },
      
      store_location_analysis: async () => {
        // Generate store location analysis
        const storeLocations = ['store-north', 'store-south', 'store-east', 'store-west', 'warehouse', 'distribution-center'];
        return storeLocations.map(store => {
          const totalDevices = Math.floor(Math.random() * 15) + 5;
          const silentDevices = Math.floor(totalDevices * (Math.random() * 0.3));
          const silentDevicePercent = (silentDevices / totalDevices * 100).toFixed(2);
          
          const totalTranscriptions = Math.floor(Math.random() * 500) + 100;
          const emptyTranscriptions = Math.floor(totalTranscriptions * (Math.random() * 0.15));
          const emptyTranscriptPercent = (emptyTranscriptions / totalTranscriptions * 100).toFixed(2);
          
          const totalInteractions = Math.floor(Math.random() * 800) + 200;
          const missingCustomerIDs = Math.floor(totalInteractions * (Math.random() * 0.4));
          const missingCustomerIDPercent = (missingCustomerIDs / totalInteractions * 100).toFixed(2);
          
          const overallErrorRate = ((parseFloat(silentDevicePercent) + 
                                  parseFloat(emptyTranscriptPercent) + 
                                  parseFloat(missingCustomerIDPercent)) / 3).toFixed(2);
          
          return {
            StoreID: store,
            TotalDevices: totalDevices,
            SilentDevices: silentDevices,
            SilentDevicePercent: silentDevicePercent,
            TotalTranscriptions: totalTranscriptions,
            EmptyTranscriptions: emptyTranscriptions,
            EmptyTranscriptPercent: emptyTranscriptPercent,
            TotalInteractions: totalInteractions,
            MissingCustomerIDs: missingCustomerIDs,
            MissingCustomerIDPercent: missingCustomerIDPercent,
            OverallErrorRate: overallErrorRate
          };
        }).sort((a, b) => b.OverallErrorRate - a.OverallErrorRate);
      },
      
      device_alerting_query: async () => {
        // Generate alert data
        const alerts = [];
        for (let i = 1; i <= 50; i++) {
          const deviceId = `DEV-${i.toString().padStart(4, '0')}`;
          
          // Only generate alerts for some devices
          if (Math.random() < 0.3) {
            const hoursSinceLastTransmission = Math.floor(Math.random() * 48);
            const emptyTranscriptsLast24h = Math.floor(Math.random() * 15);
            const missingCustomerIDsLast24h = Math.floor(Math.random() * 20);
            
            let alertStatus = 'OK';
            if (hoursSinceLastTransmission > 24) {
              alertStatus = 'CRITICAL';
            } else if (hoursSinceLastTransmission > 6 || emptyTranscriptsLast24h > 5 || missingCustomerIDsLast24h > 10) {
              alertStatus = 'WARNING';
            }
            
            if (alertStatus !== 'OK') {
              alerts.push({
                DeviceID: deviceId,
                StoreID: `store-${Math.floor(Math.random() * 5) + 1}`,
                DeviceModel: ['RPI-4B', 'NVIDIA-Jetson', 'Azure-Edge'][Math.floor(Math.random() * 3)],
                firmwareVersion: ['1.2.0', '1.3.2', '2.0.1', '2.1.0'][Math.floor(Math.random() * 4)],
                HoursSinceLastTransmission: hoursSinceLastTransmission,
                EmptyTranscriptsLast24h: emptyTranscriptsLast24h,
                MissingCustomerIDsLast24h: missingCustomerIDsLast24h,
                AlertStatus: alertStatus
              });
            }
          }
        }
        
        return alerts.sort((a, b) => {
          const statusOrder = { 'CRITICAL': 0, 'WARNING': 1, 'OK': 2 };
          if (statusOrder[a.AlertStatus] !== statusOrder[b.AlertStatus]) {
            return statusOrder[a.AlertStatus] - statusOrder[b.AlertStatus];
          }
          return b.HoursSinceLastTransmission - a.HoursSinceLastTransmission;
        });
      }
    };
    
    // Check if we have a mock data generator for this query
    if (mockDataGenerators[queryName]) {
      mockDataGenerators[queryName]()
        .then(data => resolve(data))
        .catch(err => reject(err));
    } else {
      // Default mock data generator
      resolve([{ message: `No mock data generator for query: ${queryName}` }]);
    }
  });
}

// Routes
app.get('/', (req, res) => {
  res.render('device_dashboard', { 
    title: 'Device Health Dashboard',
    deviceTypes: ['sensor', 'camera', 'gateway', 'display', 'kiosk'],
    locations: ['store-north', 'store-south', 'store-east', 'store-west', 'warehouse', 'distribution-center'],
    firmwareVersions: ['1.2.0', '1.3.2', '2.0.1', '2.1.0']
  });
});

// API routes to get data for dashboard
app.get('/api/devices/problematic', async (req, res) => {
  try {
    const data = await executeQuery('problematic_devices');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching problematic devices: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/transcriptions', async (req, res) => {
  try {
    const data = await executeQuery('empty_transcriptions');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching transcription data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/customers', async (req, res) => {
  try {
    const data = await executeQuery('missing_customer_ids');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching customer ID data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/health', async (req, res) => {
  try {
    const data = await executeQuery('device_health_dashboard');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching device health data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/firmware/analysis', async (req, res) => {
  try {
    const data = await executeQuery('firmware_analysis');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching firmware analysis: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stores/analysis', async (req, res) => {
  try {
    const data = await executeQuery('store_location_analysis');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching store analysis: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/alerts', async (req, res) => {
  try {
    const data = await executeQuery('device_alerting_query');
    res.json(data);
  } catch (error) {
    logger.error(`Error fetching device alerts: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Run audit manually
app.post('/api/devices/audit', async (req, res) => {
  try {
    const result = await deviceAudit.runAudit();
    res.json(result);
  } catch (error) {
    logger.error(`Error running device audit: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  // Load SQL queries
  loadSqlQueries();
  
  logger.info(`Device Health Dashboard running on http://localhost:${PORT}`);
  console.log(`Device Health Dashboard running on http://localhost:${PORT}`);
});

module.exports = app;