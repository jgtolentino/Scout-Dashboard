/**
 * DeviceHealthDashboard.js
 * 
 * A responsive dashboard component for monitoring device health, model performance,
 * and Azure architecture health metrics for the Pulser system.
 */
class DeviceHealthDashboard {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      console.error('DeviceHealthDashboard: Container not found:', containerSelector);
      return;
    }

    this.options = Object.assign({
      title: 'Device Health Monitoring',
      charts: {},
      deviceMetrics: {
        totalDevices: 156,
        silentDevices: 3,
        criticalAlerts: 2,
        dataQuality: 98.7
      },
      modelMetrics: {
        transcriptionAccuracy: 94.2,
        brandMentionPrecision: 92.5,
        brandMentionRecall: 88.9,
        visionModelMAP: 90.1,
        averageLatency: 267
      },
      azureMetrics: {
        reliability: 99.8,
        security: 97.2,
        functionPerformance: 93.5,
        costOptimization: 91.4
      },
      functionalityStatus: [
        { name: 'Speech-to-Text Pipeline', status: 'operational', lastChecked: '2025-05-13 08:45' },
        { name: 'Brand Mention Detection', status: 'operational', lastChecked: '2025-05-13 08:45' },
        { name: 'Vision Object Detection', status: 'operational', lastChecked: '2025-05-13 08:45' },
        { name: 'Data Synchronization', status: 'degraded', lastChecked: '2025-05-13 08:30', issue: 'Increased latency' },
        { name: 'Azure Function Triggers', status: 'operational', lastChecked: '2025-05-13 08:45' },
        { name: 'Database Connections', status: 'operational', lastChecked: '2025-05-13 08:45' }
      ]
    }, options);

    this.loadDependencies()
      .then(() => {
        this.render();
        this.initCharts();
      })
      .catch(error => {
        console.error('Failed to load dependencies:', error);
      });
  }

  /**
   * Load required external dependencies
   */
  loadDependencies() {
    return new Promise((resolve, reject) => {
      // Load Chart.js if not already loaded
      if (window.Chart) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
      script.integrity = 'sha256-ErZ09KkZnzjpqcane4SCyyHsKAXMvID9/xwbl/Aq1pc=';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);

      // Also load device health dashboard styles
      const styleId = 'device-health-dashboard-styles';
      if (!document.getElementById(styleId)) {
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = 'components/analysis-overview/device-health-dashboard.css';
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Render the dashboard HTML
   */
  render() {
    const { title, deviceMetrics, modelMetrics, azureMetrics, functionalityStatus } = this.options;
    
    const html = `
      <section class="device-health-dashboard">
        <!-- Status banner -->
        <div class="status-banner">
          <div class="status-icon">✅</div>
          <div class="status-text">
            <h4>Integration Complete</h4>
            <p>All systems operational with enhanced monitoring</p>
          </div>
        </div>
        
        <!-- Main dashboard title -->
        <h2>${title}</h2>
        
        <!-- Dashboard tabs -->
        <div class="dashboard-tabs">
          <button class="tab-button active" data-tab="device-health">Device Health</button>
          <button class="tab-button" data-tab="model-performance">Model Performance</button>
          <button class="tab-button" data-tab="azure-health">Azure Architecture</button>
        </div>
        
        <!-- Device Health Tab Content -->
        <div class="tab-content active" id="device-health-tab">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${deviceMetrics.totalDevices}</div>
              <div class="metric-label">Total Devices</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> All registered
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${deviceMetrics.silentDevices}</div>
              <div class="metric-label">Silent Devices</div>
              <div class="metric-status status-warning">
                <span class="status-icon">⚠️</span> Requires attention
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${deviceMetrics.criticalAlerts}</div>
              <div class="metric-label">Critical Alerts</div>
              <div class="metric-status status-alert">
                <span class="status-icon">🔴</span> Action needed
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${deviceMetrics.dataQuality}%</div>
              <div class="metric-label">Data Quality</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> Above threshold
              </div>
            </div>
          </div>
          
          <div class="chart-container">
            <h4>Device Status Trend (Last 7 Days)</h4>
            <canvas id="deviceStatusChart"></canvas>
          </div>
        </div>
        
        <!-- Model Performance Tab Content -->
        <div class="tab-content" id="model-performance-tab">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${modelMetrics.transcriptionAccuracy}%</div>
              <div class="metric-label">Transcription Accuracy</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> Above target
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${modelMetrics.brandMentionPrecision}%</div>
              <div class="metric-label">Brand Mention Precision</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> Above target
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${modelMetrics.brandMentionRecall}%</div>
              <div class="metric-label">Brand Mention Recall</div>
              <div class="metric-status status-warning">
                <span class="status-icon">⚠️</span> Below target
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${modelMetrics.visionModelMAP}%</div>
              <div class="metric-label">Vision Model mAP</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> Above target
              </div>
            </div>
          </div>
          
          <div class="chart-container">
            <h4>Model Performance Metrics (Last 30 Days)</h4>
            <canvas id="modelPerformanceChart"></canvas>
          </div>
          
          <div class="latency-container">
            <h4>Average Inference Latency</h4>
            <div class="latency-meter">
              <div class="latency-bar" style="width: ${Math.min(100, modelMetrics.averageLatency / 5)}%"></div>
              <div class="latency-value">${modelMetrics.averageLatency} ms</div>
            </div>
          </div>
        </div>
        
        <!-- Azure Architecture Health Tab Content -->
        <div class="tab-content" id="azure-health-tab">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${azureMetrics.reliability}%</div>
              <div class="metric-label">Reliability</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> Highly Available
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${azureMetrics.security}%</div>
              <div class="metric-label">Security</div>
              <div class="metric-status status-good">
                <span class="status-icon">✓</span> Well protected
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${azureMetrics.functionPerformance}%</div>
              <div class="metric-label">Function Performance</div>
              <div class="metric-status status-warning">
                <span class="status-icon">⚠️</span> Monitor closely
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${azureMetrics.costOptimization}%</div>
              <div class="metric-label">Cost Optimization</div>
              <div class="metric-status status-warning">
                <span class="status-icon">⚠️</span> Review needed
              </div>
            </div>
          </div>
          
          <div class="chart-container">
            <h4>Azure Well-Architected Framework Metrics</h4>
            <canvas id="azureWAFChart"></canvas>
          </div>
        </div>
        
        <!-- Functionality Status Table -->
        <h3>System Functionality Status</h3>
        <div class="functionality-table">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Status</th>
                <th>Last Checked</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${functionalityStatus.map(item => `
                <tr class="status-${item.status}">
                  <td>${item.name}</td>
                  <td>
                    <span class="status-badge ${item.status}">
                      ${item.status === 'operational' ? '✓ Operational' : 
                        item.status === 'degraded' ? '⚠️ Degraded' : '✕ Down'}
                    </span>
                  </td>
                  <td>${item.lastChecked}</td>
                  <td>${item.issue || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Next Steps -->
        <div class="next-steps">
          <h3>Next Steps</h3>
          <ul>
            <li>
              <span class="step-badge priority-high">High</span>
              Resolve silent device connection issues (Node IDs: PLS-153, PLS-078, PLS-201)
            </li>
            <li>
              <span class="step-badge priority-medium">Medium</span>
              Improve brand mention recall with model retraining plan
            </li>
            <li>
              <span class="step-badge priority-medium">Medium</span>
              Optimize Azure Function cold start performance
            </li>
            <li>
              <span class="step-badge priority-low">Low</span>
              Implement advanced alert notifications via Teams webhook
            </li>
          </ul>
        </div>
      </section>
    `;

    this.container.innerHTML = html;
    this.addEventListeners();
  }

  /**
   * Initialize Chart.js charts
   */
  initCharts() {
    // Only proceed if Chart.js is loaded
    if (!window.Chart) {
      console.error('Chart.js not loaded');
      return;
    }

    // Device Status Trend Chart
    const deviceStatusCtx = document.getElementById('deviceStatusChart');
    if (deviceStatusCtx) {
      this.options.charts.deviceStatus = new Chart(deviceStatusCtx, {
        type: 'line',
        data: {
          labels: ['May 7', 'May 8', 'May 9', 'May 10', 'May 11', 'May 12', 'May 13'],
          datasets: [
            {
              label: 'Operational Devices',
              data: [150, 152, 153, 153, 154, 153, 153],
              borderColor: '#38a169',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
              tension: 0.4
            },
            {
              label: 'Silent Devices',
              data: [4, 3, 2, 2, 1, 2, 3],
              borderColor: '#dd6b20',
              backgroundColor: 'rgba(221, 107, 32, 0.1)',
              tension: 0.4
            },
            {
              label: 'Critical Alerts',
              data: [1, 1, 0, 1, 2, 2, 2],
              borderColor: '#e53e3e',
              backgroundColor: 'rgba(229, 62, 62, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'top',
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              stacked: false
            }
          }
        }
      });
    }

    // Model Performance Chart
    const modelPerformanceCtx = document.getElementById('modelPerformanceChart');
    if (modelPerformanceCtx) {
      this.options.charts.modelPerformance = new Chart(modelPerformanceCtx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Transcription Accuracy',
              data: [92.1, 93.0, 93.5, 94.2],
              borderColor: '#3182ce',
              backgroundColor: 'rgba(49, 130, 206, 0.1)',
              tension: 0.4
            },
            {
              label: 'Brand Mention Precision',
              data: [91.2, 91.5, 92.0, 92.5],
              borderColor: '#6b46c1',
              backgroundColor: 'rgba(107, 70, 193, 0.1)',
              tension: 0.4
            },
            {
              label: 'Brand Mention Recall',
              data: [86.5, 87.2, 88.0, 88.9],
              borderColor: '#dd6b20',
              backgroundColor: 'rgba(221, 107, 32, 0.1)',
              tension: 0.4
            },
            {
              label: 'Vision Model mAP',
              data: [88.2, 89.0, 89.5, 90.1],
              borderColor: '#38a169',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'top',
            }
          },
          scales: {
            y: {
              min: 85,
              max: 100
            }
          }
        }
      });
    }

    // Azure WAF Radar Chart
    const azureWAFCtx = document.getElementById('azureWAFChart');
    if (azureWAFCtx) {
      this.options.charts.azureWAF = new Chart(azureWAFCtx, {
        type: 'radar',
        data: {
          labels: ['Reliability', 'Security', 'Cost Optimization', 'Operational Excellence', 'Performance Efficiency'],
          datasets: [{
            label: 'Current Score',
            data: [99.8, 97.2, 91.4, 94.5, 93.5],
            backgroundColor: 'rgba(49, 130, 206, 0.2)',
            borderColor: '#3182ce',
            pointBackgroundColor: '#3182ce',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#3182ce'
          }, {
            label: 'Target',
            data: [99.9, 98.0, 95.0, 95.0, 95.0],
            backgroundColor: 'rgba(107, 70, 193, 0.2)',
            borderColor: '#6b46c1',
            pointBackgroundColor: '#6b46c1',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6b46c1'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'top',
            }
          },
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 85,
              suggestedMax: 100
            }
          }
        }
      });
    }
  }

  /**
   * Add event listeners to dashboard components
   */
  addEventListeners() {
    // Tab switching
    const tabButtons = this.container.querySelectorAll('.tab-button');
    const tabContents = this.container.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Deactivate all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activate the selected tab
        button.classList.add('active');
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
          selectedTab.classList.add('active');
        }
      });
    });
  }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceHealthDashboard;
} else {
  window.DeviceHealthDashboard = DeviceHealthDashboard;
}