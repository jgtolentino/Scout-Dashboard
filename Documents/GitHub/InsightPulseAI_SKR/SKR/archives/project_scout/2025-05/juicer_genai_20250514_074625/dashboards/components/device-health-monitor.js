/**
 * Device Health Monitoring Component
 * 
 * This component provides device health monitoring functionality that integrates
 * with the main Juicer Insights Dashboard. It provides real-time monitoring of 
 * device status, data quality, and alerting for device connectivity issues.
 */

class DeviceHealthMonitor {
  constructor(options = {}) {
    this.options = {
      refreshInterval: 60000, // 1 minute refresh
      containerId: 'deviceHealthContainer',
      apiEndpoint: '/api/devices/health',
      ...options
    };
    
    this.data = null;
    this.charts = {};
  }
  
  /**
   * Initialize the device health monitor
   */
  async init() {
    // Make sure container exists
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error(`Container element not found: ${this.options.containerId}`);
      return false;
    }
    
    // Render initial UI shell
    this.renderUI();
    
    // Load data
    await this.refreshData();
    
    // Set up auto-refresh
    if (this.options.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => this.refreshData(), this.options.refreshInterval);
    }
    
    // Set up event listeners
    document.getElementById('runDeviceAuditBtn').addEventListener('click', () => this.runDeviceAudit());
    
    return true;
  }
  
  /**
   * Render the initial UI structure
   */
  renderUI() {
    this.container.innerHTML = `
      <div class="device-health-dashboard">
        <!-- Health status summary cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="deviceTotalCount">-</h5>
                <p class="insight-label">Total Devices</p>
                <p class="trend-indicator" id="deviceTotalTrend">
                  <i class="fas fa-circle-notch fa-spin"></i> Loading...
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="silentDeviceCount">-</h5>
                <p class="insight-label">Silent Devices</p>
                <p class="trend-indicator" id="silentDeviceTrend">
                  <i class="fas fa-circle-notch fa-spin"></i> Loading...
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="criticalAlertCount">-</h5>
                <p class="insight-label">Critical Alerts</p>
                <p class="trend-indicator" id="criticalAlertTrend">
                  <i class="fas fa-circle-notch fa-spin"></i> Loading...
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card insight-count-card">
              <div class="card-body">
                <h5 class="insight-count" id="dataQualityScore">-</h5>
                <p class="insight-label">Data Quality</p>
                <p class="trend-indicator" id="dataQualityTrend">
                  <i class="fas fa-circle-notch fa-spin"></i> Loading...
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts Row -->
        <div class="row mb-4">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header bg-white">
                <h5 class="card-title mb-0">Device Status by Location</h5>
              </div>
              <div class="card-body">
                <div class="chart-container" id="deviceLocationChart">
                  <canvas id="deviceLocationCanvas"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header bg-white">
                <h5 class="card-title mb-0">Firmware Performance</h5>
              </div>
              <div class="card-body">
                <div class="chart-container" id="firmwareChart">
                  <canvas id="firmwareCanvas"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Device Alerts -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Device Alerts</h5>
                <button id="runDeviceAuditBtn" class="btn btn-sm btn-outline-primary">
                  <i class="fas fa-sync-alt me-1"></i> Run Device Audit
                </button>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Location</th>
                        <th>Alert Type</th>
                        <th>Severity</th>
                        <th>Message</th>
                        <th>Timestamp</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody id="deviceAlertsTableBody">
                      <tr>
                        <td colspan="7" class="text-center">Loading alerts data...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Problem Details Tabs -->
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-white">
                <ul class="nav nav-tabs card-header-tabs" id="deviceProblemTabs" role="tablist">
                  <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="silent-tab" data-bs-toggle="tab" data-bs-target="#silent-tab-pane" type="button" role="tab" aria-controls="silent-tab-pane" aria-selected="true">
                      Silent Devices
                    </button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button class="nav-link" id="transcription-tab" data-bs-toggle="tab" data-bs-target="#transcription-tab-pane" type="button" role="tab" aria-controls="transcription-tab-pane" aria-selected="false">
                      Transcription Issues
                    </button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button class="nav-link" id="customerid-tab" data-bs-toggle="tab" data-bs-target="#customerid-tab-pane" type="button" role="tab" aria-controls="customerid-tab-pane" aria-selected="false">
                      Customer ID Issues
                    </button>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <div class="tab-content" id="deviceProblemTabContent">
                  <!-- Silent Devices Tab -->
                  <div class="tab-pane fade show active" id="silent-tab-pane" role="tabpanel" aria-labelledby="silent-tab" tabindex="0">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Device ID</th>
                            <th>Model</th>
                            <th>Location</th>
                            <th>Firmware</th>
                            <th>Hours Silent</th>
                            <th>Last Transmission</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody id="silentDevicesTableBody">
                          <tr>
                            <td colspan="7" class="text-center">Loading silent devices data...</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <!-- Transcription Issues Tab -->
                  <div class="tab-pane fade" id="transcription-tab-pane" role="tabpanel" aria-labelledby="transcription-tab" tabindex="0">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Device ID</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Issue</th>
                            <th>Total Transcripts</th>
                            <th>Affected</th>
                            <th>Percentage</th>
                            <th>Last Occurrence</th>
                          </tr>
                        </thead>
                        <tbody id="transcriptionIssuesTableBody">
                          <tr>
                            <td colspan="8" class="text-center">Loading transcription issues data...</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <!-- Customer ID Issues Tab -->
                  <div class="tab-pane fade" id="customerid-tab-pane" role="tabpanel" aria-labelledby="customerid-tab" tabindex="0">
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Device ID</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Total Interactions</th>
                            <th>Missing IDs</th>
                            <th>Percentage</th>
                            <th>Last Occurrence</th>
                          </tr>
                        </thead>
                        <tbody id="customerIdIssuesTableBody">
                          <tr>
                            <td colspan="7" class="text-center">Loading customer ID issues data...</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Refresh data from the API
   */
  async refreshData() {
    try {
      // In a real implementation, this would fetch data from the API
      // For demo purposes, we'll simulate API response
      
      // Show loading state
      this.setLoadingState(true);
      
      // Fetch data (simulated)
      this.data = await this.fetchData();
      
      // Update UI with data
      this.updateUI();
      
      // Show success message
      console.log('Device health data refreshed successfully');
      
    } catch (error) {
      console.error('Error refreshing device health data:', error);
      
      // Show error in UI
      this.showError(error.message);
    } finally {
      // Hide loading state
      this.setLoadingState(false);
    }
  }
  
  /**
   * Fetch data from the API (simulated)
   */
  async fetchData() {
    // In a real implementation, this would fetch from the API
    // For demo purposes, simulate a delay and return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        // This would be replaced with actual fetch to the API endpoint
        // fetch(this.options.apiEndpoint).then(res => res.json())
        
        // Mock data for visualization
        resolve({
          timestamp: new Date().toISOString(),
          summary: {
            deviceCount: 156,
            silentDeviceCount: 12,
            transcriptionIssueCount: 18,
            customerIdIssueCount: 22,
            criticalAlertCount: 5,
            warningAlertCount: 15,
            worstPerformingFirmware: '2.0.1',
            worstPerformingLocation: 'store-north'
          },
          problematicDevices: [
            {
              deviceId: 'DEV-0042',
              model: 'RPI-4B',
              location: 'store-north',
              firmwareVersion: '2.0.1',
              hoursSinceLastTransmission: 48,
              lastTransmission: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
              status: 'offline'
            },
            {
              deviceId: 'DEV-0036',
              model: 'NVIDIA-Jetson',
              location: 'store-north',
              firmwareVersion: '2.0.1',
              hoursSinceLastTransmission: 36,
              lastTransmission: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
              status: 'offline'
            },
            {
              deviceId: 'DEV-0008',
              model: 'Azure-Edge',
              location: 'store-east',
              firmwareVersion: '1.3.2',
              hoursSinceLastTransmission: 24,
              lastTransmission: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              status: 'offline'
            },
            {
              deviceId: 'DEV-0019',
              model: 'RPI-4B',
              location: 'store-south',
              firmwareVersion: '2.0.1',
              hoursSinceLastTransmission: 12,
              lastTransmission: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              status: 'warning'
            },
            {
              deviceId: 'DEV-0023',
              model: 'Custom-v2',
              location: 'warehouse',
              firmwareVersion: '1.2.0',
              hoursSinceLastTransmission: 8,
              lastTransmission: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
              status: 'warning'
            }
          ],
          transcriptionIssues: [
            {
              deviceId: 'DEV-0008',
              deviceType: 'camera',
              location: 'store-east',
              issueType: 'Empty Transcripts',
              totalTranscripts: 87,
              affectedCount: 18,
              affectedPercentage: '20.69',
              lastOccurrence: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
            },
            {
              deviceId: 'DEV-0042',
              deviceType: 'kiosk',
              location: 'store-north',
              issueType: 'Empty Transcripts',
              totalTranscripts: 102,
              affectedCount: 19,
              affectedPercentage: '18.63',
              lastOccurrence: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
            },
            {
              deviceId: 'DEV-0029',
              deviceType: 'display',
              location: 'store-west',
              issueType: 'Missing Facial IDs',
              totalTranscripts: 143,
              affectedCount: 24,
              affectedPercentage: '16.78',
              lastOccurrence: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
            }
          ],
          customerIdIssues: [
            {
              deviceId: 'DEV-0046',
              deviceType: 'kiosk',
              location: 'store-south',
              totalInteractions: 186,
              missingCustomerIds: 93,
              missingPercentage: '50.00',
              lastOccurrence: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            },
            {
              deviceId: 'DEV-0001',
              deviceType: 'display',
              location: 'store-north',
              totalInteractions: 237,
              missingCustomerIds: 95,
              missingPercentage: '40.08',
              lastOccurrence: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
            },
            {
              deviceId: 'DEV-0017',
              deviceType: 'sensor',
              location: 'warehouse',
              totalInteractions: 122,
              missingCustomerIds: 36,
              missingPercentage: '29.51',
              lastOccurrence: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
          ],
          storeLocationHealth: [
            {
              location: 'store-north',
              deviceCount: 35,
              silentDevices: 7,
              silentPercentage: '20.00',
              transcriptionErrorRate: '18.50',
              customerIdErrorRate: '32.40',
              overallHealth: '74.55',
              status: 'Warning'
            },
            {
              location: 'store-south',
              deviceCount: 42,
              silentDevices: 2,
              silentPercentage: '4.76',
              transcriptionErrorRate: '6.20',
              customerIdErrorRate: '25.80',
              overallHealth: '84.00',
              status: 'Healthy'
            },
            {
              location: 'store-east',
              deviceCount: 38,
              silentDevices: 1,
              silentPercentage: '2.63',
              transcriptionErrorRate: '12.40',
              customerIdErrorRate: '15.30',
              overallHealth: '86.15',
              status: 'Healthy'
            },
            {
              location: 'store-west',
              deviceCount: 28,
              silentDevices: 0,
              silentPercentage: '0.00',
              transcriptionErrorRate: '8.90',
              customerIdErrorRate: '12.20',
              overallHealth: '89.45',
              status: 'Healthy'
            },
            {
              location: 'warehouse',
              deviceCount: 13,
              silentDevices: 2,
              silentPercentage: '15.38',
              transcriptionErrorRate: '5.60',
              customerIdErrorRate: '18.70',
              overallHealth: '87.85',
              status: 'Healthy'
            }
          ],
          firmwareAnalysis: [
            {
              firmwareVersion: '2.0.1',
              deviceCount: 42,
              silentDevices: 8,
              silentPercentage: '19.05',
              avgErrorRate: '16.75',
              avgTranscriptQuality: '83.25',
              avgCustomerIdCapture: '68.50'
            },
            {
              firmwareVersion: '1.3.2',
              deviceCount: 38,
              silentDevices: 2,
              silentPercentage: '5.26',
              avgErrorRate: '9.87',
              avgTranscriptQuality: '85.13',
              avgCustomerIdCapture: '75.40'
            },
            {
              firmwareVersion: '1.2.0',
              deviceCount: 36,
              silentDevices: 1,
              silentPercentage: '2.78',
              avgErrorRate: '7.20',
              avgTranscriptQuality: '88.80',
              avgCustomerIdCapture: '81.60'
            },
            {
              firmwareVersion: '2.1.0',
              deviceCount: 40,
              silentDevices: 1,
              silentPercentage: '2.50',
              avgErrorRate: '5.80',
              avgTranscriptQuality: '91.20',
              avgCustomerIdCapture: '86.40'
            }
          ],
          alerts: {
            summary: {
              total: 20,
              critical: 5,
              warning: 15,
              byType: {
                connectivity: 12,
                transcription: 3,
                customerId: 5
              }
            },
            alerts: [
              {
                deviceId: 'DEV-0042',
                location: 'store-north',
                alertType: 'Connectivity',
                severity: 'Critical',
                message: 'No data received for 48 hours',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              {
                deviceId: 'DEV-0036',
                location: 'store-north',
                alertType: 'Connectivity',
                severity: 'Critical',
                message: 'No data received for 36 hours',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
              },
              {
                deviceId: 'DEV-0008',
                location: 'store-east',
                alertType: 'Transcription',
                severity: 'Critical',
                message: 'Empty Transcripts: 20.69% of transcripts affected',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
              },
              {
                deviceId: 'DEV-0046',
                location: 'store-south',
                alertType: 'CustomerID',
                severity: 'Critical',
                message: 'Missing Customer IDs: 50.00% of interactions affected',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
              },
              {
                deviceId: 'DEV-0001',
                location: 'store-north',
                alertType: 'CustomerID',
                severity: 'Critical',
                message: 'Missing Customer IDs: 40.08% of interactions affected',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
              }
            ]
          }
        });
      }, 500);
    });
  }
  
  /**
   * Update UI with data
   */
  updateUI() {
    if (!this.data) return;
    
    // Update summary cards
    document.getElementById('deviceTotalCount').textContent = this.data.summary.deviceCount;
    document.getElementById('deviceTotalTrend').innerHTML = `
      <i class="fas fa-check-circle text-success"></i> All devices registered
    `;
    
    document.getElementById('silentDeviceCount').textContent = this.data.summary.silentDeviceCount;
    const silentPercent = (this.data.summary.silentDeviceCount / this.data.summary.deviceCount * 100).toFixed(1);
    document.getElementById('silentDeviceTrend').innerHTML = `
      <i class="fas fa-exclamation-circle ${silentPercent > 5 ? 'text-danger' : 'text-warning'}"></i>
      ${silentPercent}% of total devices
    `;
    
    document.getElementById('criticalAlertCount').textContent = this.data.summary.criticalAlertCount;
    document.getElementById('criticalAlertTrend').innerHTML = `
      <i class="fas fa-bell ${this.data.summary.criticalAlertCount > 0 ? 'text-danger' : 'text-success'}"></i>
      ${this.data.alerts.summary.warning} warnings
    `;
    
    // Calculate data quality as the average of all devices minus error rates
    const avgQuality = (100 - (
      parseFloat(this.data.storeLocationHealth.reduce((sum, loc) => sum + parseFloat(loc.transcriptionErrorRate), 0)) / 
      this.data.storeLocationHealth.length +
      parseFloat(this.data.storeLocationHealth.reduce((sum, loc) => sum + parseFloat(loc.customerIdErrorRate), 0)) / 
      this.data.storeLocationHealth.length
    ) / 2).toFixed(1);
    
    document.getElementById('dataQualityScore').textContent = `${avgQuality}%`;
    document.getElementById('dataQualityTrend').innerHTML = `
      <i class="fas fa-${avgQuality >= 85 ? 'thumbs-up text-success' : 'thumbs-down text-warning'}"></i>
      ${avgQuality >= 85 ? 'Good' : 'Needs improvement'}
    `;
    
    // Update charts
    this.updateCharts();
    
    // Update tables
    this.updateTables();
  }
  
  /**
   * Update charts with data
   */
  updateCharts() {
    // Create or update device location chart
    this.updateLocationChart();
    
    // Create or update firmware performance chart
    this.updateFirmwareChart();
  }
  
  /**
   * Update device location chart
   */
  updateLocationChart() {
    const ctx = document.getElementById('deviceLocationCanvas').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.charts.locationChart) {
      this.charts.locationChart.destroy();
    }
    
    // Prepare data
    const locations = this.data.storeLocationHealth.map(loc => loc.location);
    const totalDevices = this.data.storeLocationHealth.map(loc => loc.deviceCount);
    const silentDevices = this.data.storeLocationHealth.map(loc => loc.silentDevices);
    const healthScores = this.data.storeLocationHealth.map(loc => parseFloat(loc.overallHealth));
    
    // Create chart
    this.charts.locationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: locations,
        datasets: [
          {
            label: 'Total Devices',
            data: totalDevices,
            backgroundColor: '#00a3e0',
            borderWidth: 0
          },
          {
            label: 'Silent Devices',
            data: silentDevices,
            backgroundColor: '#ff3300',
            borderWidth: 0
          },
          {
            label: 'Health Score (%)',
            data: healthScores,
            backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent
            borderColor: '#28a745',
            borderWidth: 2,
            type: 'line',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Device Count'
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Health Score %'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }
  
  /**
   * Update firmware performance chart
   */
  updateFirmwareChart() {
    const ctx = document.getElementById('firmwareCanvas').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.charts.firmwareChart) {
      this.charts.firmwareChart.destroy();
    }
    
    // Prepare data
    const firmwareVersions = this.data.firmwareAnalysis.map(fw => fw.firmwareVersion);
    const silentPercentages = this.data.firmwareAnalysis.map(fw => parseFloat(fw.silentPercentage));
    const transcriptQualities = this.data.firmwareAnalysis.map(fw => parseFloat(fw.avgTranscriptQuality));
    const customerIdCaptures = this.data.firmwareAnalysis.map(fw => parseFloat(fw.avgCustomerIdCapture));
    
    // Create chart
    this.charts.firmwareChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Silent Devices (%)', 'Transcript Quality', 'Customer ID Capture'],
        datasets: firmwareVersions.map((version, index) => ({
          label: version,
          data: [
            100 - silentPercentages[index], // Invert silence % so higher is better
            transcriptQualities[index],
            customerIdCaptures[index]
          ],
          fill: true,
          backgroundColor: [
            'rgba(255, 51, 0, 0.2)',
            'rgba(0, 163, 224, 0.2)',
            'rgba(40, 167, 69, 0.2)',
            'rgba(255, 193, 7, 0.2)'
          ][index],
          borderColor: [
            'rgb(255, 51, 0)',
            'rgb(0, 163, 224)',
            'rgb(40, 167, 69)',
            'rgb(255, 193, 7)'
          ][index],
          pointBackgroundColor: [
            'rgb(255, 51, 0)',
            'rgb(0, 163, 224)',
            'rgb(40, 167, 69)',
            'rgb(255, 193, 7)'
          ][index],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: [
            'rgb(255, 51, 0)',
            'rgb(0, 163, 224)',
            'rgb(40, 167, 69)',
            'rgb(255, 193, 7)'
          ][index]
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    });
  }
  
  /**
   * Update tables with data
   */
  updateTables() {
    // Update device alerts table
    const alertsBody = document.getElementById('deviceAlertsTableBody');
    if (alertsBody) {
      if (this.data.alerts.alerts.length > 0) {
        alertsBody.innerHTML = this.data.alerts.alerts.map(alert => `
          <tr class="${alert.severity === 'Critical' ? 'table-danger' : 'table-warning'}">
            <td>${alert.deviceId}</td>
            <td>${alert.location}</td>
            <td>${alert.alertType}</td>
            <td>
              <span class="badge ${alert.severity === 'Critical' ? 'bg-danger' : 'bg-warning text-dark'}">
                ${alert.severity}
              </span>
            </td>
            <td>${alert.message}</td>
            <td>${this.formatDate(alert.timestamp)}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" title="View details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-success" title="Mark as resolved">
                <i class="fas fa-check"></i>
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        alertsBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">No device alerts found</td>
          </tr>
        `;
      }
    }
    
    // Update silent devices table
    const silentDevicesBody = document.getElementById('silentDevicesTableBody');
    if (silentDevicesBody) {
      if (this.data.problematicDevices.length > 0) {
        silentDevicesBody.innerHTML = this.data.problematicDevices.map(device => `
          <tr class="${device.hoursSinceLastTransmission > 24 ? 'table-danger' : device.hoursSinceLastTransmission > 6 ? 'table-warning' : ''}">
            <td>${device.deviceId}</td>
            <td>${device.model}</td>
            <td>${device.location}</td>
            <td>${device.firmwareVersion}</td>
            <td>${device.hoursSinceLastTransmission}</td>
            <td>${this.formatDate(device.lastTransmission)}</td>
            <td>
              <span class="badge ${device.status === 'offline' ? 'bg-danger' : 'bg-warning text-dark'}">
                ${device.status}
              </span>
            </td>
          </tr>
        `).join('');
      } else {
        silentDevicesBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">No silent devices found</td>
          </tr>
        `;
      }
    }
    
    // Update transcription issues table
    const transcriptionIssuesBody = document.getElementById('transcriptionIssuesTableBody');
    if (transcriptionIssuesBody) {
      if (this.data.transcriptionIssues.length > 0) {
        transcriptionIssuesBody.innerHTML = this.data.transcriptionIssues.map(issue => `
          <tr class="${parseFloat(issue.affectedPercentage) > 15 ? 'table-warning' : ''}">
            <td>${issue.deviceId}</td>
            <td>${issue.deviceType}</td>
            <td>${issue.location}</td>
            <td>${issue.issueType}</td>
            <td>${issue.totalTranscripts}</td>
            <td>${issue.affectedCount}</td>
            <td>${issue.affectedPercentage}%</td>
            <td>${this.formatDate(issue.lastOccurrence)}</td>
          </tr>
        `).join('');
      } else {
        transcriptionIssuesBody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center">No transcription issues found</td>
          </tr>
        `;
      }
    }
    
    // Update customer ID issues table
    const customerIdIssuesBody = document.getElementById('customerIdIssuesTableBody');
    if (customerIdIssuesBody) {
      if (this.data.customerIdIssues.length > 0) {
        customerIdIssuesBody.innerHTML = this.data.customerIdIssues.map(issue => `
          <tr class="${parseFloat(issue.missingPercentage) > 30 ? 'table-danger' : parseFloat(issue.missingPercentage) > 15 ? 'table-warning' : ''}">
            <td>${issue.deviceId}</td>
            <td>${issue.deviceType}</td>
            <td>${issue.location}</td>
            <td>${issue.totalInteractions}</td>
            <td>${issue.missingCustomerIds}</td>
            <td>${issue.missingPercentage}%</td>
            <td>${this.formatDate(issue.lastOccurrence)}</td>
          </tr>
        `).join('');
      } else {
        customerIdIssuesBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">No customer ID issues found</td>
          </tr>
        `;
      }
    }
  }
  
  /**
   * Format a date string for display
   * @param {string} dateStr ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  /**
   * Set loading state of the dashboard
   * @param {boolean} isLoading Loading state
   */
  setLoadingState(isLoading) {
    // Add/remove loading class to container
    if (isLoading) {
      this.container.classList.add('loading');
    } else {
      this.container.classList.remove('loading');
    }
  }
  
  /**
   * Show an error message
   * @param {string} message Error message
   */
  showError(message) {
    console.error('Device health error:', message);
    
    // Show error in alerts table
    const alertsBody = document.getElementById('deviceAlertsTableBody');
    if (alertsBody) {
      alertsBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading device alerts: ${message}
          </td>
        </tr>
      `;
    }
  }
  
  /**
   * Run a manual device audit
   */
  async runDeviceAudit() {
    try {
      // Update button state
      const button = document.getElementById('runDeviceAuditBtn');
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Running Audit...';
      
      // In a real implementation, this would call the API
      // For demo purposes, simulate a delay and refresh data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data
      await this.refreshData();
      
      // Show success message
      button.innerHTML = '<i class="fas fa-check-circle me-1"></i> Audit Completed';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Run Device Audit';
      }, 3000);
      
    } catch (error) {
      console.error('Error running device audit:', error);
      
      // Show error
      const button = document.getElementById('runDeviceAuditBtn');
      button.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> Audit Failed';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Run Device Audit';
      }, 3000);
      
      this.showError(error.message);
    }
  }
  
  /**
   * Clean up resources before destroying the component
   */
  destroy() {
    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceHealthMonitor;
} else {
  window.DeviceHealthMonitor = DeviceHealthMonitor;
}