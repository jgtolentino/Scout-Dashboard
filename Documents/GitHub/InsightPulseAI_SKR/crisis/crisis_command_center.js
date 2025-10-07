/**
 * Crisis Command Center - Phase 2.5 Emergency Optimization
 * 
 * Real-time monitoring dashboard for emergency UI/UX crisis response
 * Part of RED2025 Emergency Protocol
 * 
 * Features:
 * - Central monitoring of all crisis response metrics
 * - Real-time status updates and alerts
 * - Automated intervention triggering
 * - Predictive trend analysis for success criteria
 * - Remote stakeholder access with adjustable detail levels
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const os = require('os');
const { MetricsCollector } = require('./crisis_metrics_dashboard');
const { AutoRemediationEngine } = require('./auto_remediation_workflow');
const { NeuralAttentionOptimizer } = require('./neural_attention_optimizer');

class CrisisCommandCenter {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketio(this.server);
    this.metricsCollector = new MetricsCollector();
    this.remediationEngine = new AutoRemediationEngine();
    this.neuralOptimizer = new NeuralAttentionOptimizer();
    this.statusFilePath = path.join(__dirname, 'execution_status.json');
    this.lastStatus = null;
    this.alertThresholds = {
      cognitive_load: { critical: 4.0, warning: 3.0 },
      silent_failures: { critical: 15, warning: 5 },
      wcag_issues: { critical: 15, warning: 5 },
      '3g_success_rate': { critical: 50, warning: 70 }
    };
    this.interventions = [];
    this.statusHistory = [];
    this.isSimulationMode = process.env.SIMULATION_MODE === 'true';
    this.logPaths = {
      system: path.join(__dirname, 'RED2025_protocol.log'),
      user: path.join(__dirname, 'user_interactions.log'),
      network: path.join(__dirname, 'network_events.log'),
      intervention: path.join(__dirname, 'auto_interventions.log')
    };

    // Initialize prediction models
    this.predictionModels = {
      cognitiveLoad: {
        model: this._initPredictionModel('cognitive_load'),
        history: []
      },
      silentFailures: {
        model: this._initPredictionModel('silent_failures'),
        history: []
      },
      wcagIssues: {
        model: this._initPredictionModel('wcag_issues'),
        history: []
      },
      '3gSuccessRate': {
        model: this._initPredictionModel('3g_success_rate'),
        history: []
      }
    };
    
    this.setupRoutes();
    this.setupWebsockets();
    this.setupEventListeners();
  }

  _initPredictionModel(metricName) {
    // Simple linear regression model for predicting metric trends
    return {
      predict: (dataPoints) => {
        if (dataPoints.length < 3) return null;
        
        const x = dataPoints.map((_, i) => i);
        const y = dataPoints.map(d => d.value);
        
        // Calculate linear regression
        const n = x.length;
        const sum_x = x.reduce((a, b) => a + b, 0);
        const sum_y = y.reduce((a, b) => a + b, 0);
        const sum_xy = x.map((x, i) => x * y[i]).reduce((a, b) => a + b, 0);
        const sum_xx = x.map(x => x * x).reduce((a, b) => a + b, 0);
        
        const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
        const intercept = (sum_y - slope * sum_x) / n;
        
        // Predict next 6 hours (in 1-hour increments)
        const predictions = [];
        for (let i = 1; i <= 6; i++) {
          const nextX = x.length + i;
          const predictedValue = slope * nextX + intercept;
          predictions.push({
            timeOffset: `+${i}hr`,
            predictedValue: parseFloat(predictedValue.toFixed(2))
          });
        }
        
        // Calculate when we'll reach target (if trend continues)
        const status = this.getCurrentStatus();
        const target = status.metrics[metricName].target;
        const current = status.metrics[metricName].current;
        
        let hoursToTarget = null;
        if (Math.abs(slope) > 0.001) { // Ensure we're not dividing by a very small number
          // For metrics we want to decrease (cognitive_load, silent_failures, wcag_issues)
          if (['cognitive_load', 'silent_failures', 'wcag_issues'].includes(metricName)) {
            if (slope < 0) { // We're improving
              hoursToTarget = (target - current) / slope;
            }
          } 
          // For metrics we want to increase (3g_success_rate)
          else if (metricName === '3g_success_rate') {
            if (slope > 0) { // We're improving
              hoursToTarget = (target - current) / slope;
            }
          }
        }
        
        return {
          predictions,
          hoursToTarget: hoursToTarget !== null ? Math.ceil(hoursToTarget) : null,
          slope: parseFloat(slope.toFixed(4)),
          improving: (metricName === '3g_success_rate' && slope > 0) || 
                    (['cognitive_load', 'silent_failures', 'wcag_issues'].includes(metricName) && slope < 0)
        };
      }
    };
  }
  
  setupRoutes() {
    // Serve the dashboard UI
    this.app.use(express.static(path.join(__dirname, 'dashboard')));
    this.app.use(express.json());
    
    // API routes
    this.app.get('/api/status', (req, res) => {
      res.json(this.getCurrentStatus());
    });
    
    this.app.get('/api/interventions', (req, res) => {
      res.json(this.interventions);
    });
    
    this.app.get('/api/predictions', (req, res) => {
      const predictions = {};
      for (const metric in this.predictionModels) {
        const model = this.predictionModels[metric];
        if (model.history.length >= 3) {
          predictions[metric] = model.model.predict(model.history);
        }
      }
      res.json(predictions);
    });
    
    this.app.post('/api/intervention', (req, res) => {
      const { type, target, params } = req.body;
      this.triggerIntervention(type, target, params);
      res.json({ success: true });
    });

    // View logs
    this.app.get('/api/logs/:type', (req, res) => {
      const logType = req.params.type;
      if (this.logPaths[logType]) {
        fs.readFile(this.logPaths[logType], 'utf8', (err, data) => {
          if (err) {
            res.status(500).json({ error: 'Failed to read log file' });
          } else {
            // Parse log and send latest entries
            const lines = data.split('\n').filter(Boolean).slice(-100);
            res.json(lines.map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return { raw: line };
              }
            }));
          }
        });
      } else {
        res.status(404).json({ error: 'Log type not found' });
      }
    });
  }
  
  setupWebsockets() {
    this.io.on('connection', (socket) => {
      console.log('Client connected to crisis command center');
      
      // Send initial data
      socket.emit('status', this.getCurrentStatus());
      socket.emit('interventions', this.interventions);
      
      // Handle commands
      socket.on('trigger-intervention', (data) => {
        const { type, target, params } = data;
        this.triggerIntervention(type, target, params);
      });
      
      socket.on('update-thresholds', (data) => {
        this.updateAlertThresholds(data);
        socket.emit('thresholds-updated', this.alertThresholds);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from crisis command center');
      });
    });
  }
  
  setupEventListeners() {
    // Set up file system watcher for status changes
    fs.watch(this.statusFilePath, (eventType) => {
      if (eventType === 'change') {
        const newStatus = this.getCurrentStatus(true);
        this.processStatusChange(newStatus);
      }
    });
    
    // Set up real-time metric collection
    setInterval(() => {
      this.collectRealTimeMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Run predictions
    setInterval(() => {
      this.updatePredictions();
    }, 15 * 60 * 1000); // Every 15 minutes
  }
  
  updatePredictions() {
    for (const metricName in this.predictionModels) {
      const model = this.predictionModels[metricName];
      if (model.history.length >= 3) {
        const prediction = model.model.predict(model.history);
        this.io.emit(`prediction-${metricName}`, prediction);
        
        // Check if we need to intervene based on predictions
        if (prediction && !prediction.improving) {
          const metricKey = metricName === '3gSuccessRate' ? '3g_success_rate' : 
            metricName === 'cognitiveLoad' ? 'cognitive_load' : 
            metricName === 'silentFailures' ? 'silent_failures' : 'wcag_issues';
          
          this.checkForPredictiveIntervention(metricKey, prediction);
        }
      }
    }
  }
  
  checkForPredictiveIntervention(metricKey, prediction) {
    const status = this.getCurrentStatus();
    const deadline = new Date(status.target_completion);
    const now = new Date();
    const hoursToDeadline = (deadline - now) / (1000 * 60 * 60);
    
    // If we're predicted to miss the target by deadline
    if (prediction.hoursToTarget === null || prediction.hoursToTarget > hoursToDeadline) {
      // Determine intervention needed based on metric
      let interventionType;
      let interventionParams = {};
      
      switch(metricKey) {
        case 'cognitive_load':
          interventionType = 'simplify-interface';
          interventionParams.level = 'emergency';
          break;
        case '3g_success_rate':
          interventionType = 'optimize-network';
          interventionParams.aggressiveness = 'high';
          break;
        case 'silent_failures':
          interventionType = 'fortify-error-handling';
          interventionParams.mode = 'preventative';
          break;
        case 'wcag_issues':
          interventionType = 'accessibility-boost';
          interventionParams.priority = 'critical';
          break;
      }
      
      if (interventionType) {
        this.triggerIntervention(interventionType, metricKey, interventionParams, true);
      }
    }
  }
  
  collectRealTimeMetrics() {
    try {
      if (this.isSimulationMode) {
        this.simulateMetricChange();
        return;
      }
      
      // Collect real metrics from the system
      Promise.all([
        this.metricsCollector.getCognitiveLoad(),
        this.metricsCollector.getNetworkSuccessRate('3g'),
        this.metricsCollector.getSilentFailures(),
        this.metricsCollector.getAccessibilityIssues()
      ]).then(([cognitiveLoad, threegSuccessRate, silentFailures, wcagIssues]) => {
        // Update status file with new metrics
        const status = this.getCurrentStatus();
        status.metrics.cognitive_load.current = cognitiveLoad;
        status.metrics['3g_success_rate'].current = threegSuccessRate;
        status.metrics.silent_failures.current = silentFailures;
        status.metrics.wcag_issues.current = wcagIssues;
        
        this.saveStatus(status);
        
        // Update prediction models
        const timestamp = new Date();
        this.predictionModels.cognitiveLoad.history.push({ timestamp, value: cognitiveLoad });
        this.predictionModels['3gSuccessRate'].history.push({ timestamp, value: threegSuccessRate });
        this.predictionModels.silentFailures.history.push({ timestamp, value: silentFailures });
        this.predictionModels.wcagIssues.history.push({ timestamp, value: wcagIssues });
        
        // Keep history to a reasonable size
        const MAX_HISTORY = 24; // 24 entries = 2 hours of history at 5-minute intervals
        for (const model in this.predictionModels) {
          if (this.predictionModels[model].history.length > MAX_HISTORY) {
            this.predictionModels[model].history = this.predictionModels[model].history.slice(-MAX_HISTORY);
          }
        }
      });
    } catch (error) {
      this.logError('Metric collection failed', error);
    }
  }
  
  simulateMetricChange() {
    // This is only for testing without real metrics
    const status = this.getCurrentStatus();
    const changeRate = 0.1; // 10% improvement per interval
    
    // Simulate improvements
    status.metrics.cognitive_load.current = Math.max(
      status.metrics.cognitive_load.target,
      status.metrics.cognitive_load.current - changeRate * (status.metrics.cognitive_load.current - status.metrics.cognitive_load.target)
    );
    
    status.metrics['3g_success_rate'].current = Math.min(
      status.metrics['3g_success_rate'].target,
      status.metrics['3g_success_rate'].current + changeRate * (status.metrics['3g_success_rate'].target - status.metrics['3g_success_rate'].current)
    );
    
    status.metrics.silent_failures.current = Math.max(
      status.metrics.silent_failures.target,
      status.metrics.silent_failures.current - changeRate * (status.metrics.silent_failures.current - status.metrics.silent_failures.target)
    );
    
    status.metrics.wcag_issues.current = Math.max(
      status.metrics.wcag_issues.target,
      Math.floor(status.metrics.wcag_issues.current - changeRate * (status.metrics.wcag_issues.current - status.metrics.wcag_issues.target))
    );
    
    // Add some randomness
    status.metrics.cognitive_load.current += (Math.random() - 0.5) * 0.2;
    status.metrics['3g_success_rate'].current += (Math.random() - 0.5) * 2;
    status.metrics.silent_failures.current += (Math.random() - 0.5) * 0.5;
    
    // Round for display
    status.metrics.cognitive_load.current = parseFloat(status.metrics.cognitive_load.current.toFixed(1));
    status.metrics['3g_success_rate'].current = parseFloat(status.metrics['3g_success_rate'].current.toFixed(1));
    status.metrics.silent_failures.current = parseFloat(status.metrics.silent_failures.current.toFixed(1));
    
    this.saveStatus(status);
    
    // Update prediction models
    const timestamp = new Date();
    this.predictionModels.cognitiveLoad.history.push({ timestamp, value: status.metrics.cognitive_load.current });
    this.predictionModels['3gSuccessRate'].history.push({ timestamp, value: status.metrics['3g_success_rate'].current });
    this.predictionModels.silentFailures.history.push({ timestamp, value: status.metrics.silent_failures.current });
    this.predictionModels.wcagIssues.history.push({ timestamp, value: status.metrics.wcag_issues.current });
  }
  
  processStatusChange(newStatus) {
    if (!this.lastStatus) {
      this.lastStatus = newStatus;
      return;
    }
    
    // Check for metric changes
    const metricChanges = {};
    let significantChange = false;
    
    for (const metric in newStatus.metrics) {
      const oldValue = this.lastStatus.metrics[metric].current;
      const newValue = newStatus.metrics[metric].current;
      
      if (oldValue !== newValue) {
        metricChanges[metric] = {
          from: oldValue,
          to: newValue,
          delta: newValue - oldValue
        };
        
        // Determine if this is a significant change
        // For different metrics, significant change thresholds vary
        let significantThreshold;
        switch(metric) {
          case 'cognitive_load':
            significantThreshold = 0.3;
            break;
          case '3g_success_rate':
            significantThreshold = 5;
            break;
          case 'silent_failures':
            significantThreshold = 2;
            break;
          case 'wcag_issues':
            significantThreshold = 1;
            break;
          default:
            significantThreshold = 0.1;
        }
        
        if (Math.abs(newValue - oldValue) >= significantThreshold) {
          significantChange = true;
          
          // Check if we crossed a threshold
          const improving = (metric === '3g_success_rate' && newValue > oldValue) || 
                           (['cognitive_load', 'silent_failures', 'wcag_issues'].includes(metric) && newValue < oldValue);
                           
          const severity = this.checkAlertThreshold(metric, newValue);
          
          if (severity) {
            this.sendAlert(metric, newValue, severity, improving);
          }
        }
      }
    }
    
    // Check for component status changes
    const componentChanges = {};
    for (const component in newStatus.components) {
      const oldStatus = this.lastStatus.components[component]?.status;
      const newStatusVal = newStatus.components[component].status;
      
      if (oldStatus !== newStatusVal) {
        componentChanges[component] = {
          from: oldStatus,
          to: newStatusVal
        };
        
        this.io.emit('component-change', {
          component,
          from: oldStatus,
          to: newStatusVal,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Broadcast changes if significant
    if (significantChange) {
      this.io.emit('metrics-changed', {
        changes: metricChanges,
        timestamp: new Date().toISOString()
      });
      
      // Log changes
      this.logStatusChange(metricChanges, componentChanges);
    }
    
    // Update status history
    this.statusHistory.push({
      timestamp: new Date().toISOString(),
      metrics: { ...newStatus.metrics }
    });
    
    // Keep history to a reasonable size
    const MAX_HISTORY = 100;
    if (this.statusHistory.length > MAX_HISTORY) {
      this.statusHistory = this.statusHistory.slice(-MAX_HISTORY);
    }
    
    // Update last status
    this.lastStatus = newStatus;
    
    // Broadcast full status update
    this.io.emit('status', newStatus);
  }
  
  checkAlertThreshold(metric, value) {
    const thresholds = this.alertThresholds[metric];
    if (!thresholds) return null;
    
    // For metrics we want to decrease (cognitive_load, silent_failures, wcag_issues)
    if (['cognitive_load', 'silent_failures', 'wcag_issues'].includes(metric)) {
      if (value >= thresholds.critical) return 'critical';
      if (value >= thresholds.warning) return 'warning';
    } 
    // For metrics we want to increase (3g_success_rate)
    else if (metric === '3g_success_rate') {
      if (value <= thresholds.critical) return 'critical';
      if (value <= thresholds.warning) return 'warning';
    }
    
    return null;
  }
  
  sendAlert(metric, value, severity, improving) {
    const alert = {
      metric,
      value,
      severity,
      improving,
      timestamp: new Date().toISOString()
    };
    
    this.io.emit('alert', alert);
    
    // Log the alert
    this.log('RED2025', 'ALERT', {
      metric,
      value,
      severity,
      improving
    });
    
    // If critical and not improving, consider auto-intervention
    if (severity === 'critical' && !improving) {
      this.considerAutoIntervention(metric);
    }
  }
  
  considerAutoIntervention(metric) {
    // Define intervention strategies for different metrics
    const interventionStrategies = {
      'cognitive_load': {
        type: 'simplify-interface',
        params: { level: 'emergency' }
      },
      '3g_success_rate': {
        type: 'optimize-network',
        params: { strategy: 'aggressive-caching' }
      },
      'silent_failures': {
        type: 'fortify-error-handling',
        params: { level: 'maximum' }
      },
      'wcag_issues': {
        type: 'accessibility-boost',
        params: { applyAll: true }
      }
    };
    
    const strategy = interventionStrategies[metric];
    if (strategy) {
      this.triggerIntervention(strategy.type, metric, strategy.params, true);
    }
  }
  
  triggerIntervention(type, target, params, isAutomatic = false) {
    const intervention = {
      type,
      target,
      params,
      isAutomatic,
      timestamp: new Date().toISOString(),
      status: 'initiated'
    };
    
    // Add to interventions list
    this.interventions.push(intervention);
    
    // Broadcast intervention event
    this.io.emit('intervention', intervention);
    
    // Log intervention
    this.log('intervention', isAutomatic ? 'AUTO' : 'MANUAL', {
      type,
      target,
      params
    });
    
    // Execute intervention logic based on type
    this.executeIntervention(intervention);
    
    return intervention;
  }
  
  executeIntervention(intervention) {
    // Execute the appropriate intervention based on type
    switch(intervention.type) {
      case 'simplify-interface':
        this.executeSimplifyInterface(intervention);
        break;
      case 'optimize-network':
        this.executeOptimizeNetwork(intervention);
        break;
      case 'fortify-error-handling':
        this.executeFortifyErrorHandling(intervention);
        break;
      case 'accessibility-boost':
        this.executeAccessibilityBoost(intervention);
        break;
      default:
        intervention.status = 'failed';
        intervention.message = `Unknown intervention type: ${intervention.type}`;
    }
    
    // Broadcast intervention update
    this.io.emit('intervention-update', intervention);
  }
  
  executeSimplifyInterface(intervention) {
    try {
      // Logic to simplify the interface according to params
      const level = intervention.params.level || 'normal';
      
      // Update intervention
      intervention.status = 'executing';
      this.io.emit('intervention-update', intervention);
      
      // Apply changes through the UI modulator
      const simplification = require('./crisis-ui-modulator');
      simplification.applySimplificationLevel(level)
        .then(() => {
          intervention.status = 'completed';
          intervention.message = `Interface simplified to ${level} level`;
          this.io.emit('intervention-update', intervention);
        })
        .catch(error => {
          intervention.status = 'failed';
          intervention.message = `Failed to simplify interface: ${error.message}`;
          this.io.emit('intervention-update', intervention);
        });
    } catch (error) {
      intervention.status = 'failed';
      intervention.message = `Error executing interface simplification: ${error.message}`;
      this.io.emit('intervention-update', intervention);
    }
  }
  
  executeOptimizeNetwork(intervention) {
    try {
      // Logic to optimize network performance
      const strategy = intervention.params.strategy || 'default';
      
      // Update intervention
      intervention.status = 'executing';
      this.io.emit('intervention-update', intervention);
      
      // Apply network optimizations
      const networkOptimizer = require('./auto-degradation-protocol');
      networkOptimizer.applyOptimizationStrategy(strategy)
        .then(() => {
          intervention.status = 'completed';
          intervention.message = `Network optimized with strategy: ${strategy}`;
          this.io.emit('intervention-update', intervention);
        })
        .catch(error => {
          intervention.status = 'failed';
          intervention.message = `Failed to optimize network: ${error.message}`;
          this.io.emit('intervention-update', intervention);
        });
    } catch (error) {
      intervention.status = 'failed';
      intervention.message = `Error executing network optimization: ${error.message}`;
      this.io.emit('intervention-update', intervention);
    }
  }
  
  executeFortifyErrorHandling(intervention) {
    try {
      // Logic to fortify error handling
      const level = intervention.params.level || 'standard';
      
      // Update intervention
      intervention.status = 'executing';
      this.io.emit('intervention-update', intervention);
      
      // Apply error handling improvements
      const autoHealer = require('./crisis_autoheal');
      autoHealer.fortifyErrorHandling(level)
        .then(() => {
          intervention.status = 'completed';
          intervention.message = `Error handling fortified to ${level} level`;
          this.io.emit('intervention-update', intervention);
        })
        .catch(error => {
          intervention.status = 'failed';
          intervention.message = `Failed to fortify error handling: ${error.message}`;
          this.io.emit('intervention-update', intervention);
        });
    } catch (error) {
      intervention.status = 'failed';
      intervention.message = `Error executing error handling fortification: ${error.message}`;
      this.io.emit('intervention-update', intervention);
    }
  }
  
  executeAccessibilityBoost(intervention) {
    try {
      // Logic to boost accessibility
      const applyAll = intervention.params.applyAll || false;
      
      // Update intervention
      intervention.status = 'executing';
      this.io.emit('intervention-update', intervention);
      
      // Apply accessibility improvements
      const accessibilityBooster = require('./crisis-ui-modulator');
      accessibilityBooster.boostAccessibility(applyAll)
        .then(() => {
          intervention.status = 'completed';
          intervention.message = `Accessibility boosted${applyAll ? ' across all interfaces' : ''}`;
          this.io.emit('intervention-update', intervention);
        })
        .catch(error => {
          intervention.status = 'failed';
          intervention.message = `Failed to boost accessibility: ${error.message}`;
          this.io.emit('intervention-update', intervention);
        });
    } catch (error) {
      intervention.status = 'failed';
      intervention.message = `Error executing accessibility boost: ${error.message}`;
      this.io.emit('intervention-update', intervention);
    }
  }
  
  updateAlertThresholds(newThresholds) {
    // Update alert thresholds
    for (const metric in newThresholds) {
      if (this.alertThresholds[metric]) {
        this.alertThresholds[metric] = {
          ...this.alertThresholds[metric],
          ...newThresholds[metric]
        };
      }
    }
    
    // Broadcast threshold update
    this.io.emit('thresholds-updated', this.alertThresholds);
  }
  
  getCurrentStatus(forceRefresh = false) {
    if (!forceRefresh && this.lastStatus) {
      return this.lastStatus;
    }
    
    try {
      const data = fs.readFileSync(this.statusFilePath, 'utf8');
      this.lastStatus = JSON.parse(data);
      return this.lastStatus;
    } catch (error) {
      this.logError('Failed to read status file', error);
      return {
        phase: "unknown",
        protocol: "unknown",
        start_time: new Date().toISOString(),
        target_completion: new Date().toISOString(),
        components: {},
        metrics: {
          cognitive_load: { current: 0, target: 0 },
          '3g_success_rate': { current: 0, target: 0 },
          silent_failures: { current: 0, target: 0 },
          wcag_issues: { current: 0, target: 0 }
        }
      };
    }
  }
  
  saveStatus(status) {
    try {
      fs.writeFileSync(this.statusFilePath, JSON.stringify(status, null, 2));
    } catch (error) {
      this.logError('Failed to save status file', error);
    }
  }
  
  log(category, level, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category,
      level,
      data,
      hostname: os.hostname()
    };
    
    // Determine log file based on category
    let logFile;
    switch(category) {
      case 'user':
        logFile = this.logPaths.user;
        break;
      case 'network':
        logFile = this.logPaths.network;
        break;
      case 'intervention':
        logFile = this.logPaths.intervention;
        break;
      default:
        logFile = this.logPaths.system;
    }
    
    // Append to log file
    try {
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  logError(message, error) {
    this.log('RED2025', 'ERROR', {
      message,
      error: error.message,
      stack: error.stack
    });
  }
  
  logStatusChange(metricChanges, componentChanges) {
    this.log('RED2025', 'STATUS_CHANGE', {
      metrics: metricChanges,
      components: componentChanges
    });
  }
  
  start(port = 3030) {
    this.server.listen(port, () => {
      console.log(`Crisis Command Center running on port ${port}`);
      this.log('RED2025', 'INFO', {
        message: `Crisis Command Center started on port ${port}`,
        mode: this.isSimulationMode ? 'SIMULATION' : 'PRODUCTION'
      });
    });
  }
}

// Create and export the command center instance
const commandCenter = new CrisisCommandCenter();

module.exports = {
  CrisisCommandCenter,
  commandCenter
};

// If this file is run directly, start the server
if (require.main === module) {
  commandCenter.start();
}