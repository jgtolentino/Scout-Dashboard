/**
 * Column Completeness Validator
 * 
 * Validates that devices are sending data to the correct tables and columns
 * with special focus on transcription data quality
 */

const deviceAudit = require('./utils/device_audit');
const logger = require('./logger');
const fs = require('fs');

// Tables and expected columns to validate
const tableSchema = {
  'bronze_device_logs': [
    'DeviceID', 'StoreID', 'EventTimestamp', 'Payload', 'LogType', 'SessionID'
  ],
  'bronze_transcriptions': [
    'DeviceID', 'StoreID', 'Timestamp', 'TranscriptText', 'FacialID', 
    'SessionID', 'Confidence', 'WordCount', 'LanguageCode'
  ],
  'bronze_vision_detections': [
    'DeviceID', 'StoreID', 'Timestamp', 'DetectedObject', 'Confidence',
    'BoundingBox', 'ImageURL', 'SessionID', 'ModelVersion'
  ],
  'SalesInteractions': [
    'DeviceID', 'StoreID', 'Timestamp', 'CustomerID', 'ProductID',
    'InteractionType', 'Duration', 'Outcome', 'SessionID'
  ]
};

// Mock data generator for each table
function generateMockTableData(tableName, devices) {
  const data = [];
  const deviceIds = devices.map(d => d.deviceId);
  const storeIds = ['STORE001', 'STORE002', 'STORE003', 'STORE004', 'STORE005'];
  const now = Date.now();

  // Random error injection config - introduce different types of data quality issues
  const errorConfig = {
    missingValue: 0.05, // 5% chance of missing value 
    nullValue: 0.03,    // 3% chance of null
    emptyString: 0.02,  // 2% chance of empty string
    invalidFormat: 0.01 // 1% chance of invalid format
  };

  // Generate 10-20 records per device
  deviceIds.forEach(deviceId => {
    const recordCount = Math.floor(Math.random() * 10) + 10;
    const storeId = storeIds[Math.floor(Math.random() * storeIds.length)];
    
    for (let i = 0; i < recordCount; i++) {
      const record = {};
      
      // Generate specific data based on table type
      tableSchema[tableName].forEach(column => {
        // Random error injection
        const errorRoll = Math.random();
        if (errorRoll < errorConfig.missingValue) {
          // Skip adding this column (will be undefined)
          return;
        } else if (errorRoll < errorConfig.missingValue + errorConfig.nullValue) {
          record[column] = null;
          return;
        } else if (errorRoll < errorConfig.missingValue + errorConfig.nullValue + errorConfig.emptyString) {
          record[column] = '';
          return;
        }
        
        // Generate value based on column name
        switch(column) {
          case 'DeviceID':
            record.DeviceID = deviceId;
            break;
          case 'StoreID':
            record.StoreID = storeId;
            break;
          case 'Timestamp':
          case 'EventTimestamp':
            record[column] = new Date(now - Math.floor(Math.random() * 86400000)).toISOString();
            break;
          case 'SessionID':
            record.SessionID = `SESSION-${Math.floor(Math.random() * 1000000)}`;
            break;
          case 'TranscriptText':
            if (Math.random() < errorConfig.invalidFormat) {
              record.TranscriptText = ''; // Empty transcript
            } else {
              const words = ['hello', 'product', 'discount', 'price', 'available', 'thanks', 'help', 'looking', 'today', 'store'];
              const length = Math.floor(Math.random() * 20) + 5;
              let text = '';
              for (let w = 0; w < length; w++) {
                text += words[Math.floor(Math.random() * words.length)] + ' ';
              }
              record.TranscriptText = text.trim();
            }
            break;
          case 'Confidence':
            record.Confidence = Math.random().toFixed(2);
            break;
          case 'WordCount':
            if (record.TranscriptText) {
              record.WordCount = record.TranscriptText.split(' ').length;
            } else {
              record.WordCount = 0;
            }
            break;
          case 'LanguageCode':
            record.LanguageCode = Math.random() < 0.9 ? 'en-US' : 'es-US';
            break;
          case 'FacialID':
            record.FacialID = Math.random() < 0.7 ? `FACE-${Math.floor(Math.random() * 1000)}` : null;
            break;
          case 'Payload':
            record.Payload = JSON.stringify({
              status: Math.random() < 0.9 ? 'success' : 'error',
              message: 'Data transmission complete',
              size: Math.floor(Math.random() * 1000)
            });
            break;
          case 'LogType':
            record.LogType = ['INFO', 'WARNING', 'ERROR', 'DEBUG'][Math.floor(Math.random() * 4)];
            break;
          case 'DetectedObject':
            record.DetectedObject = ['person', 'product', 'shopping_cart', 'shelf', 'display'][Math.floor(Math.random() * 5)];
            break;
          case 'BoundingBox':
            record.BoundingBox = JSON.stringify({
              x: Math.floor(Math.random() * 1000),
              y: Math.floor(Math.random() * 1000),
              width: Math.floor(Math.random() * 200) + 50,
              height: Math.floor(Math.random() * 200) + 50
            });
            break;
          case 'ImageURL':
            record.ImageURL = `https://storage.example.com/images/${Math.floor(Math.random() * 10000)}.jpg`;
            break;
          case 'ModelVersion':
            record.ModelVersion = `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`;
            break;
          case 'CustomerID':
            record.CustomerID = Math.random() < 0.6 ? `CUST-${Math.floor(Math.random() * 10000)}` : null;
            break;
          case 'ProductID':
            record.ProductID = `PROD-${Math.floor(Math.random() * 1000)}`;
            break;
          case 'InteractionType':
            record.InteractionType = ['VIEW', 'PICK', 'RETURN', 'PURCHASE', 'INQUIRY'][Math.floor(Math.random() * 5)];
            break;
          case 'Duration':
            record.Duration = Math.floor(Math.random() * 300);
            break;
          case 'Outcome':
            record.Outcome = ['PURCHASE', 'ABANDONED', 'INQUIRY_RESOLVED', 'REFERRED'][Math.floor(Math.random() * 4)];
            break;
          default:
            record[column] = `Value for ${column}`;
        }
      });
      
      data.push(record);
    }
  });
  
  return data;
}

// Analyze table data for column completeness
function analyzeTableCompleteness(tableName, tableData) {
  const expectedColumns = tableSchema[tableName];
  const totalRecords = tableData.length;
  
  // Initialize results
  const results = {
    tableName,
    totalRecords,
    columnStats: {},
    deviceCompleteness: {},
    overall: {
      completeRecords: 0,
      incompleteRecords: 0,
      missingValuesByColumn: {}
    }
  };
  
  // Initialize column stats
  expectedColumns.forEach(column => {
    results.columnStats[column] = {
      present: 0,
      null: 0,
      empty: 0,
      missing: 0,
      completeness: 0
    };
    results.overall.missingValuesByColumn[column] = 0;
  });
  
  // Group records by device
  const deviceRecords = {};
  tableData.forEach(record => {
    const deviceId = record.DeviceID;
    if (!deviceId) return;
    
    if (!deviceRecords[deviceId]) {
      deviceRecords[deviceId] = [];
    }
    deviceRecords[deviceId].push(record);
  });
  
  // Analyze each record
  tableData.forEach(record => {
    let recordComplete = true;
    
    expectedColumns.forEach(column => {
      // Check column presence
      if (column in record) {
        results.columnStats[column].present++;
        
        if (record[column] === null) {
          results.columnStats[column].null++;
          results.overall.missingValuesByColumn[column]++;
          recordComplete = false;
        } else if (record[column] === '') {
          results.columnStats[column].empty++;
          results.overall.missingValuesByColumn[column]++;
          recordComplete = false;
        }
      } else {
        results.columnStats[column].missing++;
        results.overall.missingValuesByColumn[column]++;
        recordComplete = false;
      }
    });
    
    // Update complete/incomplete record count
    if (recordComplete) {
      results.overall.completeRecords++;
    } else {
      results.overall.incompleteRecords++;
    }
  });
  
  // Calculate column completeness percentages
  expectedColumns.forEach(column => {
    const validValues = results.columnStats[column].present - 
                        results.columnStats[column].null - 
                        results.columnStats[column].empty;
    results.columnStats[column].completeness = (validValues / totalRecords * 100).toFixed(2);
  });
  
  // Calculate per-device completeness
  Object.keys(deviceRecords).forEach(deviceId => {
    const deviceData = deviceRecords[deviceId];
    const deviceResults = {
      recordCount: deviceData.length,
      completeRecords: 0,
      incompleteRecords: 0,
      columnCompleteness: {}
    };
    
    // Initialize column stats for this device
    expectedColumns.forEach(column => {
      deviceResults.columnCompleteness[column] = {
        present: 0,
        null: 0,
        empty: 0,
        missing: 0,
        completeness: 0
      };
    });
    
    // Analyze each record for this device
    deviceData.forEach(record => {
      let recordComplete = true;
      
      expectedColumns.forEach(column => {
        if (column in record) {
          deviceResults.columnCompleteness[column].present++;
          
          if (record[column] === null) {
            deviceResults.columnCompleteness[column].null++;
            recordComplete = false;
          } else if (record[column] === '') {
            deviceResults.columnCompleteness[column].empty++;
            recordComplete = false;
          }
        } else {
          deviceResults.columnCompleteness[column].missing++;
          recordComplete = false;
        }
      });
      
      if (recordComplete) {
        deviceResults.completeRecords++;
      } else {
        deviceResults.incompleteRecords++;
      }
    });
    
    // Calculate column completeness percentages for this device
    expectedColumns.forEach(column => {
      const validValues = deviceResults.columnCompleteness[column].present - 
                          deviceResults.columnCompleteness[column].null - 
                          deviceResults.columnCompleteness[column].empty;
      deviceResults.columnCompleteness[column].completeness = 
        (validValues / deviceResults.recordCount * 100).toFixed(2);
    });
    
    // Calculate overall completeness for this device
    deviceResults.overallCompleteness = 
      (deviceResults.completeRecords / deviceResults.recordCount * 100).toFixed(2);
    
    results.deviceCompleteness[deviceId] = deviceResults;
  });
  
  // Calculate overall data quality score
  results.overall.completenessScore = 
    (results.overall.completeRecords / totalRecords * 100).toFixed(2);
  
  return results;
}

// Generate summary report for all tables
function generateSummaryReport(results) {
  let report = `
==============================================
COLUMN COMPLETENESS AUDIT REPORT
==============================================

`;

  // Add summary for each table
  Object.keys(results).forEach(tableName => {
    const tableResult = results[tableName];
    
    report += `
TABLE: ${tableName}
-----------------------------------------
Total Records: ${tableResult.totalRecords}
Complete Records: ${tableResult.overall.completeRecords} (${tableResult.overall.completenessScore}%)
Incomplete Records: ${tableResult.overall.incompleteRecords}

COLUMN COMPLETENESS:
`;

    // Add column stats
    Object.keys(tableResult.columnStats).forEach(column => {
      const columnStat = tableResult.columnStats[column];
      report += `  ${column.padEnd(20)}: ${columnStat.completeness}% complete (${columnStat.null} null, ${columnStat.empty} empty, ${columnStat.missing} missing)\n`;
    });
    
    // Add problem devices (below 90% completeness)
    const problemDevices = Object.entries(tableResult.deviceCompleteness)
      .filter(([_, stats]) => parseFloat(stats.overallCompleteness) < 90)
      .sort((a, b) => parseFloat(a[1].overallCompleteness) - parseFloat(b[1].overallCompleteness));
    
    if (problemDevices.length > 0) {
      report += `\nPROBLEM DEVICES (below 90% completeness):\n`;
      problemDevices.forEach(([deviceId, stats]) => {
        report += `  ${deviceId}: ${stats.overallCompleteness}% complete (${stats.completeRecords}/${stats.recordCount} records)\n`;
        
        // Find worst columns for this device
        const worstColumns = Object.entries(stats.columnCompleteness)
          .map(([col, colStats]) => ({ 
            column: col, 
            completeness: parseFloat(colStats.completeness) 
          }))
          .filter(col => col.completeness < 90)
          .sort((a, b) => a.completeness - b.completeness)
          .slice(0, 3);
        
        if (worstColumns.length > 0) {
          report += `    Worst columns: ${worstColumns.map(c => `${c.column} (${c.completeness}%)`).join(', ')}\n`;
        }
      });
    }
    
    report += `\n`;
  });

  // Add transcription quality section if available
  if (results.bronze_transcriptions) {
    report += `
TRANSCRIPTION QUALITY ANALYSIS
-----------------------------------------
`;

    const transcriptionStats = results.bronze_transcriptions;
    const emptyTranscripts = transcriptionStats.columnStats.TranscriptText.empty + 
                             transcriptionStats.columnStats.TranscriptText.null;
    const emptyPercentage = (emptyTranscripts / transcriptionStats.totalRecords * 100).toFixed(2);
    
    report += `Empty Transcripts: ${emptyTranscripts} (${emptyPercentage}% of total)\n`;
    
    // Find devices with empty transcripts
    const devicesWithEmptyTranscripts = Object.entries(transcriptionStats.deviceCompleteness)
      .filter(([_, stats]) => {
        const textStats = stats.columnCompleteness.TranscriptText;
        return (textStats.null + textStats.empty) > 0;
      })
      .map(([deviceId, stats]) => {
        const textStats = stats.columnCompleteness.TranscriptText;
        const emptyCount = textStats.null + textStats.empty;
        const emptyPercent = (emptyCount / stats.recordCount * 100).toFixed(2);
        return { deviceId, emptyCount, emptyPercent, recordCount: stats.recordCount };
      })
      .sort((a, b) => parseFloat(b.emptyPercent) - parseFloat(a.emptyPercent));
    
    if (devicesWithEmptyTranscripts.length > 0) {
      report += `\nDevices with Empty Transcripts:\n`;
      devicesWithEmptyTranscripts.forEach(device => {
        report += `  ${device.deviceId}: ${device.emptyCount}/${device.recordCount} (${device.emptyPercent}%) empty transcripts\n`;
      });
    }
    
    // Check confidence scores
    const confidenceStats = transcriptionStats.columnStats.Confidence;
    report += `\nConfidence Score Presence: ${confidenceStats.completeness}% complete\n`;
  }
  
  report += `
==============================================
Report Generated: ${new Date().toISOString()}
==============================================
`;

  return report;
}

async function main() {
  try {
    console.log('Running column completeness check...');
    
    // Fetch device data first
    const devices = await deviceAudit.fetchDeviceData();
    console.log(`Fetched data for ${devices.length} devices`);
    
    // Get data for each table
    const tableData = {};
    const allResults = {};
    
    for (const tableName of Object.keys(tableSchema)) {
      console.log(`Analyzing ${tableName}...`);
      
      // In a real implementation, this would query the actual database
      // For demo purposes, we generate mock data
      tableData[tableName] = generateMockTableData(tableName, devices);
      
      // Analyze completeness
      allResults[tableName] = analyzeTableCompleteness(tableName, tableData[tableName]);
    }
    
    // Generate and output report
    const report = generateSummaryReport(allResults);
    console.log(report);
    
    // Save report to file
    const outputPath = './column_completeness_report.txt';
    fs.writeFileSync(outputPath, report);
    console.log(`Report saved to ${outputPath}`);
    
    return {
      success: true,
      results: allResults,
      report,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error checking column completeness: ${error.message}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Run the main function if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeTableCompleteness,
  generateSummaryReport,
  main
};