/**
 * Device Forecast Dashboard Generator
 * 
 * This script takes the device forecast data and generates
 * an HTML dashboard with charts and visualizations.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../output/device-forecast-20-devices.json');
const OUTPUT_DIR = path.join(__dirname, '../output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'device-forecast-dashboard.html');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load forecast data
const forecastData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

// Generate the dashboard HTML
function generateDashboard(data) {
  // Extract monthly data for charts
  const months = data.monthlyForecast.map(m => `${m.month} ${m.year}`);
  const avgUptimes = data.monthlyForecast.map(m => parseFloat(m.overallStats.avgUptimePercentage));
  const downtimeHours = data.monthlyForecast.map(m => parseFloat(m.overallStats.totalDowntimeHours));
  const maintenanceDevices = data.monthlyForecast.map(m => m.overallStats.devicesNeedingMaintenance);
  
  // Get device types for pie chart
  const deviceTypes = {};
  data.deviceForecast.forEach(device => {
    deviceTypes[device.deviceType] = (deviceTypes[device.deviceType] || 0) + 1;
  });
  
  const deviceTypeLabels = Object.keys(deviceTypes);
  const deviceTypeCounts = deviceTypeLabels.map(label => deviceTypes[label]);
  
  // Create tables for detailed device data in the last forecast month
  const lastMonth = data.monthlyForecast[data.monthlyForecast.length - 1];
  const deviceTableRows = lastMonth.devices.sort((a, b) => a.uptime - b.uptime).map(device => `
    <tr class="${device.maintenanceRecommended ? 'table-warning' : ''}">
      <td>${device.deviceName}</td>
      <td>${device.deviceType}</td>
      <td>${device.location}</td>
      <td class="${device.uptime < 0.85 ? 'text-danger' : device.uptime < 0.9 ? 'text-warning' : 'text-success'}">${device.uptimePercentage}</td>
      <td>${device.downtimeHours.toFixed(1)}</td>
      <td>${device.connectivityEvents}</td>
      <td>${device.maintenanceRecommended ? '<span class="badge bg-warning">Yes</span>' : '<span class="badge bg-success">No</span>'}</td>
    </tr>
  `).join('');
  
  // Calculate maintenance forecast trend
  const maintenanceTrend = [];
  for (let i = 1; i < maintenanceDevices.length; i++) {
    const diff = maintenanceDevices[i] - maintenanceDevices[i-1];
    maintenanceTrend.push(diff);
  }
  
  // Generate the HTML
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Device Connectivity Forecast Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      padding-top: 2rem;
      padding-bottom: 2rem;
    }
    .card {
      margin-bottom: 1.5rem;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border-radius: 0.5rem;
    }
    .card-header {
      background-color: #002B80;
      color: white;
      font-weight: 500;
      border-top-left-radius: 0.5rem !important;
      border-top-right-radius: 0.5rem !important;
    }
    .dashboard-header {
      background-color: #002B80;
      color: white;
      padding: 1.5rem 0;
      margin-bottom: 2rem;
      border-radius: 0.5rem;
    }
    .kpi-card {
      background-color: white;
      border-left: 4px solid #00C3EC;
      padding: 1rem;
      height: 100%;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: #002B80;
    }
    .kpi-title {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
    }
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
    .table-responsive {
      max-height: 400px;
      overflow-y: auto;
    }
    .badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
    }
    .trend-up {
      color: #dc3545;
    }
    .trend-down {
      color: #198754;
    }
    .trend-neutral {
      color: #6c757d;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
    }
    .key-insight {
      background-color: #f8f9fa;
      border-left: 4px solid #00C3EC;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .device-trend-cell {
      width: 80px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Dashboard Header -->
    <div class="dashboard-header text-center">
      <h1>Device Connectivity Forecast</h1>
      <p class="lead">Monthly forecast for ${data.parameters.deviceCount} devices over ${data.parameters.forecastMonths} months</p>
      <small>Generated: ${new Date(data.generatedAt).toLocaleString()}</small>
    </div>
    
    <!-- KPI Overview -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="kpi-card">
          <div class="kpi-title">Total Devices</div>
          <div class="kpi-value">${data.parameters.deviceCount}</div>
          <small>Across ${Object.keys(deviceTypes).length} device types</small>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi-card">
          <div class="kpi-title">Current Avg Uptime</div>
          <div class="kpi-value">${data.monthlyForecast[0].overallStats.avgUptimePercentage}</div>
          <small>Expected in ${data.monthlyForecast[0].month} ${data.monthlyForecast[0].year}</small>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi-card">
          <div class="kpi-title">Forecast End Uptime</div>
          <div class="kpi-value">${data.monthlyForecast[data.monthlyForecast.length-1].overallStats.avgUptimePercentage}</div>
          <small>Expected by ${data.monthlyForecast[data.monthlyForecast.length-1].month} ${data.monthlyForecast[data.monthlyForecast.length-1].year}</small>
        </div>
      </div>
      <div class="col-md-3">
        <div class="kpi-card">
          <div class="kpi-title">Maintenance Needed</div>
          <div class="kpi-value">${data.monthlyForecast[0].overallStats.maintenancePercentage}</div>
          <small>${data.monthlyForecast[0].overallStats.devicesNeedingMaintenance} devices currently need attention</small>
        </div>
      </div>
    </div>
    
    <!-- Key Insights -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            Key Insights
          </div>
          <div class="card-body">
            <div class="key-insight">
              <h5>Maintenance Trend</h5>
              <p>The percentage of devices needing maintenance is expected to ${maintenanceDevices[0] < maintenanceDevices[maintenanceDevices.length-1] ? 'increase' : 'decrease'} from ${data.monthlyForecast[0].overallStats.maintenancePercentage} to ${data.monthlyForecast[data.monthlyForecast.length-1].overallStats.maintenancePercentage} over the forecast period.</p>
            </div>
            
            <div class="key-insight">
              <h5>Uptime Degradation</h5>
              <p>Average device uptime is projected to ${avgUptimes[0] > avgUptimes[avgUptimes.length-1] ? 'decrease' : 'increase'} by ${Math.abs((parseFloat(avgUptimes[0]) - parseFloat(avgUptimes[avgUptimes.length-1]))).toFixed(2)}% over the next ${data.parameters.forecastMonths} months.</p>
            </div>
            
            <div class="key-insight">
              <h5>Device Type Performance</h5>
              <p>${getDeviceTypeInsight(data)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Charts -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Uptime Forecast
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="uptimeChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Maintenance Forecast
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="maintenanceChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Device Type Distribution
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="deviceTypeChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Downtime Hours Forecast
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="downtimeChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Device Details -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            Device Details (Forecast for ${lastMonth.month} ${lastMonth.year})
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Device Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Uptime</th>
                    <th>Downtime Hours</th>
                    <th>Connectivity Events</th>
                    <th>Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  ${deviceTableRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer text-center">
      <p>InsightPulseAI - Device Connectivity Forecast Dashboard</p>
      <p><small>Powered by TBWA Pulser AI</small></p>
    </div>
  </div>
  
  <script>
    // Uptime Chart
    const uptimeCtx = document.getElementById('uptimeChart').getContext('2d');
    new Chart(uptimeCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(months)},
        datasets: [{
          label: 'Average Uptime (%)',
          data: ${JSON.stringify(avgUptimes)},
          backgroundColor: 'rgba(0, 195, 236, 0.2)',
          borderColor: 'rgba(0, 195, 236, 1)',
          borderWidth: 2,
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: ${Math.floor(Math.min(...avgUptimes) - 5)},
            max: 100,
            title: {
              display: true,
              text: 'Uptime (%)'
            }
          }
        }
      }
    });
    
    // Maintenance Chart
    const maintenanceCtx = document.getElementById('maintenanceChart').getContext('2d');
    new Chart(maintenanceCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(months)},
        datasets: [{
          label: 'Devices Needing Maintenance',
          data: ${JSON.stringify(maintenanceDevices)},
          backgroundColor: 'rgba(230, 0, 40, 0.7)',
          borderColor: 'rgba(230, 0, 40, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: ${data.parameters.deviceCount},
            title: {
              display: true,
              text: 'Device Count'
            }
          }
        }
      }
    });
    
    // Device Type Chart
    const deviceTypeCtx = document.getElementById('deviceTypeChart').getContext('2d');
    new Chart(deviceTypeCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(deviceTypeLabels)},
        datasets: [{
          data: ${JSON.stringify(deviceTypeCounts)},
          backgroundColor: [
            'rgba(0, 43, 128, 0.7)',
            'rgba(0, 195, 236, 0.7)',
            'rgba(230, 0, 40, 0.7)',
            'rgba(60, 179, 113, 0.7)'
          ],
          borderColor: [
            'rgba(0, 43, 128, 1)',
            'rgba(0, 195, 236, 1)',
            'rgba(230, 0, 40, 1)',
            'rgba(60, 179, 113, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    // Downtime Chart
    const downtimeCtx = document.getElementById('downtimeChart').getContext('2d');
    new Chart(downtimeCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(months)},
        datasets: [{
          label: 'Total Downtime Hours',
          data: ${JSON.stringify(downtimeHours)},
          backgroundColor: 'rgba(230, 0, 40, 0.2)',
          borderColor: 'rgba(230, 0, 40, 1)',
          borderWidth: 2,
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

// Helper function to generate insights about device types
function getDeviceTypeInsight(data) {
  const devicePerformance = {};
  
  // Calculate average uptime per device type in the last month
  const lastMonth = data.monthlyForecast[data.monthlyForecast.length - 1];
  lastMonth.devices.forEach(device => {
    if (!devicePerformance[device.deviceType]) {
      devicePerformance[device.deviceType] = {
        devices: 0,
        totalUptime: 0,
        needingMaintenance: 0
      };
    }
    
    devicePerformance[device.deviceType].devices += 1;
    devicePerformance[device.deviceType].totalUptime += device.uptime;
    if (device.maintenanceRecommended) {
      devicePerformance[device.deviceType].needingMaintenance += 1;
    }
  });
  
  // Calculate averages
  Object.keys(devicePerformance).forEach(type => {
    devicePerformance[type].avgUptime = devicePerformance[type].totalUptime / devicePerformance[type].devices;
    devicePerformance[type].maintenancePercentage = 
      (devicePerformance[type].needingMaintenance / devicePerformance[type].devices) * 100;
  });
  
  // Find best and worst performing device types
  let bestType = null;
  let worstType = null;
  
  Object.keys(devicePerformance).forEach(type => {
    if (!bestType || devicePerformance[type].avgUptime > devicePerformance[bestType].avgUptime) {
      bestType = type;
    }
    
    if (!worstType || devicePerformance[type].avgUptime < devicePerformance[worstType].avgUptime) {
      worstType = type;
    }
  });
  
  return `${bestType} devices show the highest reliability with an average uptime of ${(devicePerformance[bestType].avgUptime * 100).toFixed(2)}%. 
  ${worstType} devices have the lowest projected uptime at ${(devicePerformance[worstType].avgUptime * 100).toFixed(2)}%. 
  By the end of the forecast period, ${devicePerformance[worstType].maintenancePercentage.toFixed(0)}% of ${worstType} devices will need maintenance.`;
}

// Main execution
try {
  console.log('Generating device forecast dashboard...');
  
  // Generate dashboard
  const dashboardHtml = generateDashboard(forecastData);
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, dashboardHtml);
  
  console.log(`Dashboard generated successfully: ${OUTPUT_FILE}`);
  
} catch (error) {
  console.error('Error generating dashboard:', error);
}