/**
 * Real-Time Crisis Metrics Dashboard
 * RED2025 Emergency Protocol - Phase 2
 * 
 * Live monitoring dashboard for UX crisis metrics.
 */

// Dashboard configuration
const DASHBOARD_CONFIG = {
  refreshInterval: 15000, // ms
  criticalRefreshInterval: 5000, // ms
  historyLength: 100, // data points
  alertThresholds: {
    cognitiveLoad: 3.0,
    rageClicks: 5, // per minute
    taskSuccess: 75, // percent
    recoveryTime: 5000 // ms
  },
  targetMetrics: {
    cognitiveLoad: 2.1,
    rageClicks: 2, // per minute
    taskSuccess: 95, // percent
    recoveryTime: 2000 // ms
  }
};

// Simulation of metric data for demonstration
let simulatedMetrics = {
  cognitiveLoad: { current: 3.1, history: [] },
  rageClicks: { current: 18, history: [] },
  taskSuccess: { current: 64, history: [] },
  recoveryTime: { current: 9200, history: [] }
};

/**
 * Crisis Metrics Dashboard
 * Real-time monitoring dashboard for UX crisis metrics
 */
class CrisisMetricsDashboard {
  constructor(options = {}) {
    this.options = {
      elementId: 'crisis-metrics-dashboard',
      apiEndpoint: '/api/crisis-metrics',
      ...options
    };
    
    this.metrics = {};
    this.alerts = [];
    this.dashboardElement = null;
    this.refreshInterval = null;
    this.alertsEnabled = true;
    
    this.warRoomConnection = null;
    
    console.log('Crisis Metrics Dashboard initialized');
  }
  
  // Initialize the dashboard
  async initialize() {
    console.log('Initializing crisis metrics dashboard...');
    
    // Find the dashboard element
    this.dashboardElement = document.getElementById(this.options.elementId);
    
    if (!this.dashboardElement) {
      console.warn(`Dashboard element with ID ${this.options.elementId} not found, creating it...`);
      this.createDashboardElement();
    }
    
    // Set up the dashboard structure
    this.setupDashboardStructure();
    
    // Connect to the war room
    await this.connectToWarRoom();
    
    // Fetch initial data
    await this.refreshData();
    
    // Set up auto-refresh
    this.startAutoRefresh();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Crisis metrics dashboard initialized successfully');
    
    return true;
  }
  
  // Create the dashboard element if it doesn't exist
  createDashboardElement() {
    const dashboard = document.createElement('div');
    dashboard.id = this.options.elementId;
    dashboard.className = 'crisis-metrics-dashboard';
    document.body.appendChild(dashboard);
    
    this.dashboardElement = dashboard;
  }
  
  // Set up the dashboard structure
  setupDashboardStructure() {
    // Clear the dashboard
    this.dashboardElement.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
      <h1 class="dashboard-title">🚨 RED2025 Emergency Protocol</h1>
      <div class="dashboard-status">
        <span class="status-indicator status-critical">ACTIVE</span>
        <span class="status-phase">PHASE 2</span>
      </div>
    `;
    this.dashboardElement.appendChild(header);
    
    // Add metrics container
    const metricsContainer = document.createElement('div');
    metricsContainer.className = 'metrics-container';
    
    // Add each metric card
    const metricKeys = ['cognitiveLoad', 'rageClicks', 'taskSuccess', 'recoveryTime'];
    const metricLabels = {
      cognitiveLoad: 'Cognitive Load Score',
      rageClicks: 'Rage Clicks / Minute',
      taskSuccess: 'Task Success Rate (%)',
      recoveryTime: 'Error Recovery Time (ms)'
    };
    
    metricKeys.forEach(key => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.id = `metric-${key}`;
      
      card.innerHTML = `
        <h2 class="metric-title">${metricLabels[key]}</h2>
        <div class="metric-value-container">
          <span class="metric-value">--</span>
          <span class="metric-target">Target: ${DASHBOARD_CONFIG.targetMetrics[key]}</span>
        </div>
        <div class="metric-chart" id="chart-${key}"></div>
        <div class="metric-status">
          <span class="status-indicator">--</span>
        </div>
      `;
      
      metricsContainer.appendChild(card);
    });
    
    this.dashboardElement.appendChild(metricsContainer);
    
    // Add alerts section
    const alertsSection = document.createElement('div');
    alertsSection.className = 'alerts-section';
    alertsSection.innerHTML = `
      <h2 class="section-title">Critical Alerts</h2>
      <div class="alerts-container" id="alerts-container">
        <p class="no-alerts">No critical alerts</p>
      </div>
      <div class="alerts-controls">
        <button id="btn-acknowledge-all" class="btn-acknowledge-all">Acknowledge All</button>
        <button id="btn-toggle-alerts" class="btn-toggle-alerts">Disable Alerts</button>
      </div>
    `;
    this.dashboardElement.appendChild(alertsSection);
    
    // Add recovery actions section
    const actionsSection = document.createElement('div');
    actionsSection.className = 'actions-section';
    actionsSection.innerHTML = `
      <h2 class="section-title">Emergency Actions</h2>
      <div class="actions-container">
        <button id="btn-simplify-ui" class="action-button critical-action">Deploy Minimal UI</button>
        <button id="btn-pause-deployments" class="action-button">Pause Deployments</button>
        <button id="btn-activate-fallback" class="action-button">Activate Fallback</button>
        <button id="btn-notify-team" class="action-button">Notify Team</button>
      </div>
    `;
    this.dashboardElement.appendChild(actionsSection);
    
    // Add status footer
    const footer = document.createElement('div');
    footer.className = 'dashboard-footer';
    footer.innerHTML = `
      <div class="dashboard-info">
        <span class="info-item">Protocol ID: RED2025-UIUX-20250503-001</span>
        <span class="info-item">Last update: <span id="last-update-time">--</span></span>
      </div>
      <div class="dashboard-controls">
        <button id="btn-refresh" class="btn-refresh">Refresh Now</button>
        <select id="select-refresh" class="select-refresh">
          <option value="5000">Refresh: 5s</option>
          <option value="15000" selected>Refresh: 15s</option>
          <option value="30000">Refresh: 30s</option>
          <option value="60000">Refresh: 1m</option>
        </select>
      </div>
    `;
    this.dashboardElement.appendChild(footer);
  }
  
  // Connect to the war room
  async connectToWarRoom() {
    console.log('Connecting to war room...');
    
    // In a real implementation, this would establish a WebSocket connection
    
    // For demonstration, we'll simulate a connection
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Connected to war room');
        this.warRoomConnection = {
          connected: true,
          send: (message) => console.log('Sending to war room:', message),
          close: () => console.log('Closing war room connection')
        };
        resolve(true);
      }, 1000);
    });
  }
  
  // Start auto-refresh
  startAutoRefresh() {
    console.log(`Starting auto-refresh every ${DASHBOARD_CONFIG.refreshInterval}ms`);
    
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set up new interval
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, DASHBOARD_CONFIG.refreshInterval);
  }
  
  // Update refresh interval
  updateRefreshInterval(interval) {
    console.log(`Updating refresh interval to ${interval}ms`);
    
    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set up new interval
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, interval);
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Refresh button
    const refreshButton = document.getElementById('btn-refresh');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refreshData();
      });
    }
    
    // Refresh interval selector
    const refreshSelect = document.getElementById('select-refresh');
    if (refreshSelect) {
      refreshSelect.addEventListener('change', (event) => {
        const interval = parseInt(event.target.value, 10);
        this.updateRefreshInterval(interval);
      });
    }
    
    // Toggle alerts button
    const toggleAlertsButton = document.getElementById('btn-toggle-alerts');
    if (toggleAlertsButton) {
      toggleAlertsButton.addEventListener('click', () => {
        this.alertsEnabled = !this.alertsEnabled;
        toggleAlertsButton.textContent = this.alertsEnabled ? 'Disable Alerts' : 'Enable Alerts';
        
        if (this.alertsEnabled) {
          this.refreshData(); // Refresh to check for new alerts
        }
      });
    }
    
    // Acknowledge all alerts button
    const acknowledgeAllButton = document.getElementById('btn-acknowledge-all');
    if (acknowledgeAllButton) {
      acknowledgeAllButton.addEventListener('click', () => {
        this.acknowledgeAllAlerts();
      });
    }
    
    // Emergency action buttons
    document.getElementById('btn-simplify-ui')?.addEventListener('click', () => {
      this.executeEmergencyAction('deployMinimalUI');
    });
    
    document.getElementById('btn-pause-deployments')?.addEventListener('click', () => {
      this.executeEmergencyAction('pauseDeployments');
    });
    
    document.getElementById('btn-activate-fallback')?.addEventListener('click', () => {
      this.executeEmergencyAction('activateFallback');
    });
    
    document.getElementById('btn-notify-team')?.addEventListener('click', () => {
      this.executeEmergencyAction('notifyTeam');
    });
  }
  
  // Refresh dashboard data
  async refreshData() {
    try {
      console.log('Refreshing dashboard data...');
      
      // Fetch the latest metrics
      const metrics = await this.fetchMetrics();
      
      // Update the dashboard
      this.updateDashboard(metrics);
      
      // Check for alerts
      if (this.alertsEnabled) {
        this.checkAlerts(metrics);
      }
      
      // Update last update time
      document.getElementById('last-update-time').textContent = new Date().toLocaleTimeString();
      
      // If any metrics are in critical state, increase refresh rate
      const hasCriticalMetrics = this.hasCriticalMetrics(metrics);
      if (hasCriticalMetrics && this.refreshInterval) {
        console.log('Critical metrics detected, increasing refresh rate');
        clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
          this.refreshData();
        }, DASHBOARD_CONFIG.criticalRefreshInterval);
      }
      
      return metrics;
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      
      // Show error in dashboard
      this.showError('Failed to refresh dashboard data. Retrying...');
      
      return null;
    }
  }
  
  // Fetch metrics from the API
  async fetchMetrics() {
    try {
      // In a real implementation, this would call an API
      // For demonstration, we'll use simulated data
      
      // Simulate some fluctuation in the metrics
      this.simulateMetricChanges();
      
      // Deep clone the simulated metrics
      const metrics = JSON.parse(JSON.stringify(simulatedMetrics));
      
      return metrics;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }
  
  // Simulate changes in the metrics for demonstration
  simulateMetricChanges() {
    // Cognitive Load: should decrease slowly (improvement)
    simulatedMetrics.cognitiveLoad.history.push(simulatedMetrics.cognitiveLoad.current);
    if (simulatedMetrics.cognitiveLoad.history.length > DASHBOARD_CONFIG.historyLength) {
      simulatedMetrics.cognitiveLoad.history.shift();
    }
    
    // Randomly decrease by 0-0.1, but occasionally spike up
    if (Math.random() < 0.9) {
      simulatedMetrics.cognitiveLoad.current -= Math.random() * 0.1;
    } else {
      simulatedMetrics.cognitiveLoad.current += Math.random() * 0.2;
    }
    // Ensure it stays within reasonable bounds
    simulatedMetrics.cognitiveLoad.current = Math.max(1.5, Math.min(5.0, simulatedMetrics.cognitiveLoad.current));
    
    // Rage Clicks: should decrease over time (improvement)
    simulatedMetrics.rageClicks.history.push(simulatedMetrics.rageClicks.current);
    if (simulatedMetrics.rageClicks.history.length > DASHBOARD_CONFIG.historyLength) {
      simulatedMetrics.rageClicks.history.shift();
    }
    
    // Randomly decrease by 0-1, but occasionally spike up
    if (Math.random() < 0.8) {
      simulatedMetrics.rageClicks.current -= Math.random() * 1;
    } else {
      simulatedMetrics.rageClicks.current += Math.random() * 3;
    }
    // Ensure it stays within reasonable bounds
    simulatedMetrics.rageClicks.current = Math.max(1, Math.min(30, simulatedMetrics.rageClicks.current));
    
    // Task Success: should increase over time (improvement)
    simulatedMetrics.taskSuccess.history.push(simulatedMetrics.taskSuccess.current);
    if (simulatedMetrics.taskSuccess.history.length > DASHBOARD_CONFIG.historyLength) {
      simulatedMetrics.taskSuccess.history.shift();
    }
    
    // Randomly increase by 0-1, but occasionally dip
    if (Math.random() < 0.8) {
      simulatedMetrics.taskSuccess.current += Math.random() * 1;
    } else {
      simulatedMetrics.taskSuccess.current -= Math.random() * 2;
    }
    // Ensure it stays within reasonable bounds
    simulatedMetrics.taskSuccess.current = Math.max(30, Math.min(99, simulatedMetrics.taskSuccess.current));
    
    // Recovery Time: should decrease over time (improvement)
    simulatedMetrics.recoveryTime.history.push(simulatedMetrics.recoveryTime.current);
    if (simulatedMetrics.recoveryTime.history.length > DASHBOARD_CONFIG.historyLength) {
      simulatedMetrics.recoveryTime.history.shift();
    }
    
    // Randomly decrease by 0-500ms, but occasionally spike up
    if (Math.random() < 0.85) {
      simulatedMetrics.recoveryTime.current -= Math.random() * 500;
    } else {
      simulatedMetrics.recoveryTime.current += Math.random() * 1000;
    }
    // Ensure it stays within reasonable bounds
    simulatedMetrics.recoveryTime.current = Math.max(1000, Math.min(15000, simulatedMetrics.recoveryTime.current));
  }
  
  // Update the dashboard with new metrics
  updateDashboard(metrics) {
    // Update each metric in the dashboard
    Object.keys(metrics).forEach(key => {
      this.updateMetricCard(key, metrics[key]);
    });
    
    // Store the metrics
    this.metrics = metrics;
  }
  
  // Update a specific metric card
  updateMetricCard(key, data) {
    const card = document.getElementById(`metric-${key}`);
    if (!card) return;
    
    // Update the value
    const valueElement = card.querySelector('.metric-value');
    if (valueElement) {
      valueElement.textContent = this.formatMetricValue(key, data.current);
    }
    
    // Update the status indicator
    const statusElement = card.querySelector('.status-indicator');
    if (statusElement) {
      const status = this.getMetricStatus(key, data.current);
      statusElement.textContent = status.label;
      statusElement.className = `status-indicator status-${status.level}`;
    }
    
    // Update the chart
    this.updateMetricChart(key, data);
  }
  
  // Format a metric value for display
  formatMetricValue(key, value) {
    switch (key) {
      case 'cognitiveLoad':
        return value.toFixed(1);
      case 'rageClicks':
        return value.toFixed(0);
      case 'taskSuccess':
        return `${value.toFixed(0)}%`;
      case 'recoveryTime':
        return `${value.toFixed(0)}ms`;
      default:
        return value.toString();
    }
  }
  
  // Get the status of a metric
  getMetricStatus(key, value) {
    const threshold = DASHBOARD_CONFIG.alertThresholds[key];
    const target = DASHBOARD_CONFIG.targetMetrics[key];
    
    // Different comparison directions based on metric type
    let distanceToTarget;
    
    switch (key) {
      case 'cognitiveLoad':
      case 'rageClicks':
      case 'recoveryTime':
        // Lower is better
        if (value <= target) {
          return { level: 'success', label: 'TARGET MET' };
        } else if (value <= threshold) {
          distanceToTarget = (value - target) / (threshold - target);
          return { level: 'warning', label: 'IMPROVING' };
        } else {
          return { level: 'critical', label: 'CRITICAL' };
        }
      
      case 'taskSuccess':
        // Higher is better
        if (value >= target) {
          return { level: 'success', label: 'TARGET MET' };
        } else if (value >= threshold) {
          distanceToTarget = (target - value) / (target - threshold);
          return { level: 'warning', label: 'IMPROVING' };
        } else {
          return { level: 'critical', label: 'CRITICAL' };
        }
      
      default:
        return { level: 'unknown', label: 'UNKNOWN' };
    }
  }
  
  // Update the chart for a metric
  updateMetricChart(key, data) {
    const chartElement = document.getElementById(`chart-${key}`);
    if (!chartElement) return;
    
    // In a real implementation, this would use a chart library like Chart.js
    // For demonstration, we'll create a simple bar chart
    
    chartElement.innerHTML = '';
    
    // Create a simple sparkline
    const sparkline = document.createElement('div');
    sparkline.className = 'sparkline';
    
    const values = [...data.history, data.current];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Create bars for the sparkline
    values.forEach(value => {
      const bar = document.createElement('div');
      bar.className = 'sparkline-bar';
      
      // Calculate height based on value
      // For taskSuccess, higher is better, for others lower is better
      let height;
      if (key === 'taskSuccess') {
        height = range > 0 ? ((value - min) / range) * 100 : 50;
      } else {
        height = range > 0 ? ((max - value) / range) * 100 : 50;
      }
      
      bar.style.height = `${height}%`;
      
      // Determine color based on threshold
      const threshold = DASHBOARD_CONFIG.alertThresholds[key];
      const target = DASHBOARD_CONFIG.targetMetrics[key];
      
      if (key === 'taskSuccess') {
        // Higher is better
        if (value >= target) {
          bar.style.backgroundColor = '#4CAF50'; // Green
        } else if (value >= threshold) {
          bar.style.backgroundColor = '#FFC107'; // Amber
        } else {
          bar.style.backgroundColor = '#F44336'; // Red
        }
      } else {
        // Lower is better
        if (value <= target) {
          bar.style.backgroundColor = '#4CAF50'; // Green
        } else if (value <= threshold) {
          bar.style.backgroundColor = '#FFC107'; // Amber
        } else {
          bar.style.backgroundColor = '#F44336'; // Red
        }
      }
      
      sparkline.appendChild(bar);
    });
    
    chartElement.appendChild(sparkline);
  }
  
  // Check for alerts based on metrics
  checkAlerts(metrics) {
    const newAlerts = [];
    
    // Check each metric against its threshold
    Object.keys(metrics).forEach(key => {
      const value = metrics[key].current;
      const threshold = DASHBOARD_CONFIG.alertThresholds[key];
      const target = DASHBOARD_CONFIG.targetMetrics[key];
      
      let isAlert = false;
      
      switch (key) {
        case 'cognitiveLoad':
        case 'rageClicks':
        case 'recoveryTime':
          // Lower is better
          isAlert = value > threshold;
          break;
        
        case 'taskSuccess':
          // Higher is better
          isAlert = value < threshold;
          break;
      }
      
      if (isAlert) {
        newAlerts.push({
          id: `${key}-${Date.now()}`,
          type: key,
          value,
          threshold,
          target,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });
    
    // Add new alerts to the list
    if (newAlerts.length > 0) {
      this.alerts = [...this.alerts, ...newAlerts];
      this.updateAlertsDisplay();
    }
  }
  
  // Update the alerts display
  updateAlertsDisplay() {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    // Clear existing alerts
    alertsContainer.innerHTML = '';
    
    // Filter for unacknowledged alerts
    const unacknowledgedAlerts = this.alerts.filter(alert => !alert.acknowledged);
    
    if (unacknowledgedAlerts.length === 0) {
      alertsContainer.innerHTML = '<p class="no-alerts">No critical alerts</p>';
      return;
    }
    
    // Add each alert
    unacknowledgedAlerts.forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert-item';
      alertElement.dataset.alertId = alert.id;
      
      // Format the alert message
      let message;
      switch (alert.type) {
        case 'cognitiveLoad':
          message = `Cognitive Load (${alert.value.toFixed(1)}) above threshold (${alert.threshold})`;
          break;
        
        case 'rageClicks':
          message = `Rage Clicks (${alert.value.toFixed(0)}/min) above threshold (${alert.threshold})`;
          break;
        
        case 'taskSuccess':
          message = `Task Success (${alert.value.toFixed(0)}%) below threshold (${alert.threshold}%)`;
          break;
        
        case 'recoveryTime':
          message = `Recovery Time (${alert.value.toFixed(0)}ms) above threshold (${alert.threshold}ms)`;
          break;
        
        default:
          message = `Alert for ${alert.type}: ${alert.value}`;
      }
      
      alertElement.innerHTML = `
        <div class="alert-content">
          <span class="alert-icon">⚠️</span>
          <span class="alert-message">${message}</span>
          <span class="alert-time">${alert.timestamp.toLocaleTimeString()}</span>
        </div>
        <button class="btn-acknowledge" data-alert-id="${alert.id}">Ack</button>
      `;
      
      alertsContainer.appendChild(alertElement);
      
      // Add event listener for acknowledge button
      const ackButton = alertElement.querySelector('.btn-acknowledge');
      if (ackButton) {
        ackButton.addEventListener('click', () => {
          this.acknowledgeAlert(alert.id);
        });
      }
    });
    
    // If there are alerts, play a sound (in a real implementation)
    if (unacknowledgedAlerts.length > 0) {
      console.log('Alert sound would play here');
    }
  }
  
  // Acknowledge a specific alert
  acknowledgeAlert(alertId) {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex !== -1) {
      this.alerts[alertIndex].acknowledged = true;
      
      // Log to war room
      if (this.warRoomConnection && this.warRoomConnection.connected) {
        this.warRoomConnection.send(JSON.stringify({
          type: 'alertAcknowledged',
          alertId,
          timestamp: new Date().toISOString()
        }));
      }
      
      // Update the display
      this.updateAlertsDisplay();
    }
  }
  
  // Acknowledge all alerts
  acknowledgeAllAlerts() {
    this.alerts.forEach(alert => {
      alert.acknowledged = true;
    });
    
    // Log to war room
    if (this.warRoomConnection && this.warRoomConnection.connected) {
      this.warRoomConnection.send(JSON.stringify({
        type: 'allAlertsAcknowledged',
        timestamp: new Date().toISOString()
      }));
    }
    
    // Update the display
    this.updateAlertsDisplay();
  }
  
  // Check if any metrics are in a critical state
  hasCriticalMetrics(metrics) {
    for (const key of Object.keys(metrics)) {
      const status = this.getMetricStatus(key, metrics[key].current);
      if (status.level === 'critical') {
        return true;
      }
    }
    
    return false;
  }
  
  // Execute an emergency action
  executeEmergencyAction(action) {
    console.log(`Executing emergency action: ${action}`);
    
    // Confirm the action
    if (!confirm(`Are you sure you want to execute the emergency action: ${action}?`)) {
      return;
    }
    
    // Log to war room
    if (this.warRoomConnection && this.warRoomConnection.connected) {
      this.warRoomConnection.send(JSON.stringify({
        type: 'emergencyAction',
        action,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Execute the action (in a real implementation)
    switch (action) {
      case 'deployMinimalUI':
        this.showNotification('Minimal UI deployed successfully', 'success');
        break;
      
      case 'pauseDeployments':
        this.showNotification('Deployments paused successfully', 'success');
        break;
      
      case 'activateFallback':
        this.showNotification('Fallback UI activated successfully', 'success');
        break;
      
      case 'notifyTeam':
        this.showNotification('Team notification sent successfully', 'success');
        break;
    }
    
    // Refresh the data
    this.refreshData();
  }
  
  // Show a notification in the UI
  showNotification(message, type = 'info') {
    // In a real implementation, this would use a notification library
    console.log(`Notification (${type}): ${message}`);
    
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove the notification after a delay
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 5000);
  }
  
  // Show an error in the dashboard
  showError(message) {
    console.error('Dashboard error:', message);
    
    this.showNotification(message, 'error');
  }
  
  // Cleanup when the dashboard is closed
  cleanup() {
    // Clear interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Close war room connection
    if (this.warRoomConnection && this.warRoomConnection.connected) {
      this.warRoomConnection.close();
    }
    
    console.log('Crisis metrics dashboard cleaned up');
  }
}

// Export the class and config
module.exports = {
  CrisisMetricsDashboard,
  DASHBOARD_CONFIG
};