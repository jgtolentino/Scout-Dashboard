/**
 * Device Connectivity Forecast Generator
 * 
 * This script generates monthly forecasts for connected devices
 * based on historical data patterns and input parameters.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NUM_DEVICES = 20;
const FORECAST_MONTHS = 12;
const OUTPUT_DIR = path.join(__dirname, '../output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Device types with their connectivity patterns
const DEVICE_TYPES = [
  { 
    type: 'RetailPOS', 
    baseUptime: 0.95, 
    seasonalVariation: 0.03,
    failureRate: 0.02
  },
  { 
    type: 'DigitalSignage', 
    baseUptime: 0.98, 
    seasonalVariation: 0.01,
    failureRate: 0.01
  },
  { 
    type: 'InventoryScanner', 
    baseUptime: 0.92, 
    seasonalVariation: 0.04,
    failureRate: 0.03
  },
  { 
    type: 'SecurityCamera', 
    baseUptime: 0.99, 
    seasonalVariation: 0.005,
    failureRate: 0.005
  }
];

// Generate random devices
function generateDevices(count) {
  const devices = [];
  for (let i = 0; i < count; i++) {
    const typeIndex = Math.floor(Math.random() * DEVICE_TYPES.length);
    const deviceType = DEVICE_TYPES[typeIndex];
    
    devices.push({
      id: `DEV-${(10000 + i).toString()}`,
      name: `${deviceType.type}-${i+1}`,
      type: deviceType.type,
      location: getRandomLocation(),
      installDate: getRandomDate(new Date(2023, 0, 1), new Date()),
      baseUptime: deviceType.baseUptime + (Math.random() * 0.04 - 0.02), // Slight variation per device
      seasonalVariation: deviceType.seasonalVariation,
      failureRate: deviceType.failureRate
    });
  }
  return devices;
}

// Helper functions
function getRandomLocation() {
  const locations = [
    'Seoul Store #1', 'Seoul Store #2', 'Busan Shop', 'Incheon Center', 
    'Daegu Branch', 'Daejeon Location', 'Gwangju Store', 'Suwon Shop',
    'Ulsan Center', 'Jeju Branch'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate monthly forecast for each device
function generateMonthlyForecast(devices, months) {
  const startDate = new Date();
  const forecast = [];
  
  for (let month = 0; month < months; month++) {
    const forecastDate = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1);
    const monthName = forecastDate.toLocaleString('default', { month: 'long' });
    const year = forecastDate.getFullYear();
    
    // Calculate seasonal factor (higher in Q4, lower in Q1)
    const seasonalFactor = Math.sin((month + 9) * Math.PI / 6) * 0.5 + 0.5;
    
    const monthlyDevices = devices.map(device => {
      // Time factor: devices get less reliable with age
      const ageInMonths = (forecastDate - device.installDate) / (1000 * 60 * 60 * 24 * 30);
      const ageFactor = Math.max(0.85, 1 - (ageInMonths * 0.005));
      
      // Calculate expected uptime
      let expectedUptime = device.baseUptime * ageFactor;
      
      // Apply seasonal variation
      expectedUptime += (seasonalFactor - 0.5) * device.seasonalVariation;
      
      // Calculate failure probability
      const failureProbability = device.failureRate * (1 + ageInMonths / 24);
      
      // Random factor to simulate real-world variations
      const randomVariation = Math.random() * 0.03 - 0.015;
      
      // Final uptime with clamping
      const finalUptime = Math.min(0.9999, Math.max(0.7, expectedUptime + randomVariation));
      
      // Calculate expected downtime in hours per month
      const daysInMonth = new Date(year, forecastDate.getMonth() + 1, 0).getDate();
      const hoursInMonth = daysInMonth * 24;
      const downtimeHours = Math.round((1 - finalUptime) * hoursInMonth * 10) / 10;
      
      // Calculate connectivity events
      const connectivityEvents = Math.floor(Math.random() * 3) + (finalUptime < 0.9 ? 3 : 0);
      
      return {
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.type,
        location: device.location,
        uptime: finalUptime,
        uptimePercentage: (finalUptime * 100).toFixed(2) + '%',
        downtimeHours: downtimeHours,
        connectivityEvents: connectivityEvents,
        failureProbability: (failureProbability * 100).toFixed(2) + '%',
        ageInMonths: Math.round(ageInMonths),
        maintenanceRecommended: failureProbability > 0.05 || finalUptime < 0.85
      };
    });
    
    forecast.push({
      month: monthName,
      year: year,
      devices: monthlyDevices,
      overallStats: calculateOverallStats(monthlyDevices)
    });
  }
  
  return forecast;
}

// Calculate overall stats for a month
function calculateOverallStats(deviceData) {
  const totalDevices = deviceData.length;
  const avgUptime = deviceData.reduce((sum, dev) => sum + dev.uptime, 0) / totalDevices;
  const totalDowntimeHours = deviceData.reduce((sum, dev) => sum + dev.downtimeHours, 0);
  const devicesNeedingMaintenance = deviceData.filter(dev => dev.maintenanceRecommended).length;
  const avgConnectivityEvents = deviceData.reduce((sum, dev) => sum + dev.connectivityEvents, 0) / totalDevices;
  
  return {
    avgUptimePercentage: (avgUptime * 100).toFixed(2) + '%',
    totalDowntimeHours: totalDowntimeHours.toFixed(1),
    avgDowntimeHoursPerDevice: (totalDowntimeHours / totalDevices).toFixed(1),
    devicesNeedingMaintenance: devicesNeedingMaintenance,
    maintenancePercentage: ((devicesNeedingMaintenance / totalDevices) * 100).toFixed(1) + '%',
    avgConnectivityEvents: avgConnectivityEvents.toFixed(1)
  };
}

// Generate device-first view of the data
function generateDevicePerspective(devices, forecast) {
  return devices.map(device => {
    const monthlyData = forecast.map(month => {
      const deviceData = month.devices.find(d => d.deviceId === device.id);
      return {
        month: month.month,
        year: month.year,
        uptime: deviceData.uptime,
        uptimePercentage: deviceData.uptimePercentage,
        downtimeHours: deviceData.downtimeHours,
        connectivityEvents: deviceData.connectivityEvents,
        maintenanceRecommended: deviceData.maintenanceRecommended
      };
    });
    
    return {
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type,
      location: device.location,
      installDate: device.installDate,
      forecast: monthlyData
    };
  });
}

// Main execution
try {
  console.log(`Generating ${FORECAST_MONTHS} month forecast for ${NUM_DEVICES} devices...`);
  
  // Generate devices
  const devices = generateDevices(NUM_DEVICES);
  
  // Generate monthly forecast
  const forecast = generateMonthlyForecast(devices, FORECAST_MONTHS);
  
  // Generate device perspective
  const devicePerspective = generateDevicePerspective(devices, forecast);
  
  // Create output data
  const outputData = {
    generatedAt: new Date().toISOString(),
    parameters: {
      deviceCount: NUM_DEVICES,
      forecastMonths: FORECAST_MONTHS
    },
    monthlyForecast: forecast,
    deviceForecast: devicePerspective
  };
  
  // Write forecast to file
  const outputFile = path.join(OUTPUT_DIR, `device-forecast-${NUM_DEVICES}-devices.json`);
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
  
  console.log(`Forecast generated successfully: ${outputFile}`);
  
  // Generate a summary text file
  const summaryFile = path.join(OUTPUT_DIR, `device-forecast-summary.md`);
  
  let summaryContent = `# Device Connectivity Forecast Summary\n\n`;
  summaryContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  summaryContent += `## Overview\n\n`;
  summaryContent += `- **Devices:** ${NUM_DEVICES}\n`;
  summaryContent += `- **Forecast Period:** ${FORECAST_MONTHS} months\n\n`;
  
  summaryContent += `## Monthly Projections\n\n`;
  summaryContent += `| Month | Year | Avg Uptime | Total Downtime (hrs) | Devices Needing Maintenance |\n`;
  summaryContent += `|-------|------|------------|----------------------|-----------------------------|\n`;
  
  forecast.forEach(month => {
    summaryContent += `| ${month.month} | ${month.year} | ${month.overallStats.avgUptimePercentage} | ${month.overallStats.totalDowntimeHours} | ${month.overallStats.devicesNeedingMaintenance} (${month.overallStats.maintenancePercentage}) |\n`;
  });
  
  summaryContent += `\n## Device Types Distribution\n\n`;
  
  const deviceTypes = {};
  devices.forEach(device => {
    deviceTypes[device.type] = (deviceTypes[device.type] || 0) + 1;
  });
  
  summaryContent += `| Device Type | Count | Percentage |\n`;
  summaryContent += `|-------------|-------|------------|\n`;
  
  Object.entries(deviceTypes).forEach(([type, count]) => {
    const percentage = ((count / NUM_DEVICES) * 100).toFixed(1);
    summaryContent += `| ${type} | ${count} | ${percentage}% |\n`;
  });
  
  summaryContent += `\n## Maintenance Forecast\n\n`;
  
  const maintenanceByMonth = forecast.map(month => ({
    month: `${month.month} ${month.year}`,
    count: month.overallStats.devicesNeedingMaintenance,
    percentage: month.overallStats.maintenancePercentage
  }));
  
  summaryContent += `| Month | Devices Needing Maintenance | Percentage |\n`;
  summaryContent += `|-------|------------------------------|------------|\n`;
  
  maintenanceByMonth.forEach(item => {
    summaryContent += `| ${item.month} | ${item.count} | ${item.percentage} |\n`;
  });
  
  fs.writeFileSync(summaryFile, summaryContent);
  console.log(`Summary report generated: ${summaryFile}`);
  
} catch (error) {
  console.error('Error generating forecast:', error);
}