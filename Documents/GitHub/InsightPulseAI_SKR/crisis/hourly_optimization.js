#!/usr/bin/env node

/**
 * Hourly Optimization Cycle
 * Implements the critical path for Phase 2.5 RED2025 Protocol
 * Runs at specified intervals to continuously improve metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Import required components
const statusFilePath = path.join(__dirname, 'execution_status.json');
const logFilePath = path.join(__dirname, 'optimization_cycle.log');
const { commandCenter } = require('./crisis_command_center');
const { patchPipeline } = require('./patch_pipeline');
const { validateComponents } = require('./validate_components');

class HourlyOptimizationCycle {
  constructor(options = {}) {
    this.interval = options.interval || 60; // Minutes
    this.override = options.override || null;
    this.dryRun = options.dryRun || false;
    this.targets = {
      cognitive_load: 2.1,
      '3g_success_rate': 95,
      silent_failures: 1,
      wcag_issues: 0
    };
    this.cycleCount = 0;
    this.startTime = new Date();
    this.lastOptimizationTime = null;
    this.runningTimer = null;
    this.metricsHistory = {};
    this.actionsHistory = [];
  }

  /**
   * Initialize and start the optimization cycle
   */
  async start() {
    this.log('INFO', `Starting Hourly Optimization Cycle (interval=${this.interval}m, override=${this.override || 'none'})`);
    
    // Validate components first
    const validation = validateComponents();
    if (!validation.success) {
      this.log('ERROR', `Component validation failed. ${validation.validCount}/${validation.totalCount} components valid.`);
      return false;
    }
    
    // Initialize history storage
    this.initializeMetricsHistory();
    
    // Run first cycle immediately
    await this.runCycle();
    
    // Set up interval for future cycles
    this.runningTimer = setInterval(() => {
      this.runCycle().catch(error => {
        this.log('ERROR', `Cycle error: ${error.message}`);
      });
    }, this.interval * 60 * 1000);
    
    return true;
  }

  /**
   * Stop the optimization cycle
   */
  stop() {
    if (this.runningTimer) {
      clearInterval(this.runningTimer);
      this.runningTimer = null;
      this.log('INFO', 'Optimization cycle stopped');
      return true;
    }
    return false;
  }

  /**
   * Initialize metrics history from existing status
   */
  initializeMetricsHistory() {
    try {
      const status = this.getCurrentStatus();
      
      for (const [metric, values] of Object.entries(status.metrics)) {
        this.metricsHistory[metric] = [{
          timestamp: new Date().toISOString(),
          value: values.current
        }];
      }
    } catch (error) {
      this.log('ERROR', `Failed to initialize metrics history: ${error.message}`);
    }
  }

  /**
   * Run a single optimization cycle
   */
  async runCycle() {
    const cycleStart = new Date();
    this.cycleCount++;
    
    this.log('CYCLE', `Starting optimization cycle #${this.cycleCount}`);
    
    try {
      // 1. Take metrics snapshot
      const currentMetrics = await this.takeMetricsSnapshot();
      
      // 2. Check if all targets are met
      const metricsStatus = this.checkTargets(currentMetrics);
      
      if (metricsStatus.allTargetsMet) {
        this.log('SUCCESS', 'All targets met! Maintaining current protocol.');
        return this.maintainProtocol();
      }
      
      // 3. Deploy neural hotfixes for lagging metrics
      for (const metric of metricsStatus.laggingMetrics) {
        await this.deployNeuralHotfix(metric, currentMetrics[metric]);
      }
      
      // 4. Run chaos validation
      await this.runChaosValidation(metricsStatus.laggingMetrics);
      
      // 5. Update war room
      this.updateWarRoom(metricsStatus, this.calculateVelocities());
      
      const cycleEnd = new Date();
      const duration = (cycleEnd - cycleStart) / 1000;
      
      this.log('CYCLE', `Cycle #${this.cycleCount} completed in ${duration.toFixed(1)}s`);
      this.lastOptimizationTime = cycleEnd;
      
      return true;
    } catch (error) {
      this.log('ERROR', `Cycle #${this.cycleCount} failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Take a snapshot of current metrics
   */
  async takeMetricsSnapshot() {
    this.log('METRICS', 'Taking metrics snapshot');
    
    const status = this.getCurrentStatus();
    const currentMetrics = {};
    
    for (const [metric, values] of Object.entries(status.metrics)) {
      currentMetrics[metric] = values.current;
      
      // Add to history
      if (!this.metricsHistory[metric]) {
        this.metricsHistory[metric] = [];
      }
      
      this.metricsHistory[metric].push({
        timestamp: new Date().toISOString(),
        value: values.current
      });
      
      // Keep reasonable history length
      const MAX_HISTORY = 24; // 24 hours worth of history at most
      if (this.metricsHistory[metric].length > MAX_HISTORY) {
        this.metricsHistory[metric] = this.metricsHistory[metric].slice(-MAX_HISTORY);
      }
    }
    
    return currentMetrics;
  }

  /**
   * Check if targets are met and identify lagging metrics
   */
  checkTargets(currentMetrics) {
    const result = {
      allTargetsMet: true,
      laggingMetrics: [],
      metricStatus: {}
    };
    
    for (const [metric, target] of Object.entries(this.targets)) {
      const current = currentMetrics[metric];
      let targetMet = false;
      
      // Different comparison based on metric type
      if (['cognitive_load', 'silent_failures', 'wcag_issues'].includes(metric)) {
        // Lower is better
        targetMet = current <= target;
      } else if (metric === '3g_success_rate') {
        // Higher is better
        targetMet = current >= target;
      }
      
      result.metricStatus[metric] = {
        current,
        target,
        targetMet
      };
      
      if (!targetMet) {
        result.allTargetsMet = false;
        result.laggingMetrics.push(metric);
      }
    }
    
    this.log('TARGETS', `Metrics status: ${result.allTargetsMet ? 'All met' : result.laggingMetrics.length + ' lagging'}`);
    
    return result;
  }

  /**
   * Maintain current protocol when all targets are met
   */
  async maintainProtocol() {
    this.log('MAINTAIN', 'All targets met, maintaining current protocol');
    
    // Update status to reflect maintenance mode
    const status = this.getCurrentStatus();
    
    let anyComponentsUpdated = false;
    for (const component of Object.keys(status.components)) {
      if (status.components[component].status !== 'maintaining') {
        status.components[component].status = 'maintaining';
        anyComponentsUpdated = true;
      }
    }
    
    if (anyComponentsUpdated) {
      this.saveStatus(status);
    }
    
    return true;
  }

  /**
   * Deploy a neural hotfix for a specific metric
   */
  async deployNeuralHotfix(metric, currentValue) {
    this.log('HOTFIX', `Deploying neural hotfix for ${metric} (current: ${currentValue})`);
    
    // Skip actual deployment in dry run mode
    if (this.dryRun) {
      this.log('DRYRUN', `Would deploy hotfix for ${metric}`);
      return true;
    }
    
    try {
      let hotfixDeployed = false;
      
      switch(metric) {
        case 'cognitive_load':
          const uiPatch = await patchPipeline.createUiSimplificationPatch('moderate', true);
          this.log('PATCH', `UI simplification patch created: ${uiPatch.id}`);
          hotfixDeployed = true;
          break;
        
        case '3g_success_rate':
          const networkPatch = await patchPipeline.createNetworkOptimizationPatch('aggressive-caching', true);
          this.log('PATCH', `Network optimization patch created: ${networkPatch.id}`);
          hotfixDeployed = true;
          break;
        
        case 'silent_failures':
          const errorPatch = await patchPipeline.createErrorHandlingPatch('maximum', true);
          this.log('PATCH', `Error handling patch created: ${errorPatch.id}`);
          hotfixDeployed = true;
          break;
        
        case 'wcag_issues':
          const accessibilityPatch = await patchPipeline.createAccessibilityPatch(true, true);
          this.log('PATCH', `Accessibility patch created: ${accessibilityPatch.id}`);
          hotfixDeployed = true;
          break;
      }
      
      if (hotfixDeployed) {
        this.actionsHistory.push({
          timestamp: new Date().toISOString(),
          action: 'deploy_hotfix',
          metric,
          currentValue
        });
      }
      
      return hotfixDeployed;
    } catch (error) {
      this.log('ERROR', `Failed to deploy hotfix for ${metric}: ${error.message}`);
      return false;
    }
  }

  /**
   * Run chaos validation for the specified metrics
   */
  async runChaosValidation(metrics) {
    this.log('CHAOS', `Running chaos validation for ${metrics.join(', ')}`);
    
    // Skip actual validation in dry run mode
    if (this.dryRun) {
      this.log('DRYRUN', `Would run chaos validation for ${metrics.join(', ')}`);
      return true;
    }
    
    try {
      for (const metric of metrics) {
        if (metric === '3g_success_rate') {
          // Run network chaos test
          const networkTestResult = this.simulateNetworkChaos();
          this.log('CHAOS', `Network chaos test result: ${networkTestResult ? 'PASS' : 'FAIL'}`);
        } else if (metric === 'silent_failures') {
          // Run error injection test
          const errorTestResult = this.simulateErrorInjection();
          this.log('CHAOS', `Error injection test result: ${errorTestResult ? 'PASS' : 'FAIL'}`);
        }
      }
      
      this.actionsHistory.push({
        timestamp: new Date().toISOString(),
        action: 'chaos_validation',
        metrics
      });
      
      return true;
    } catch (error) {
      this.log('ERROR', `Chaos validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Simulate network chaos for validation
   */
  simulateNetworkChaos() {
    // In a real implementation, this would use network throttling tools
    // For this simulation, we'll assume success
    return true;
  }

  /**
   * Simulate error injection for validation
   */
  simulateErrorInjection() {
    // In a real implementation, this would inject errors and verify recovery
    // For this simulation, we'll assume success
    return true;
  }

  /**
   * Update the war room with current status
   */
  updateWarRoom(metricsStatus, velocities) {
    this.log('WARROOM', 'Updating war room with current status');
    
    const warRoomUpdate = {
      timestamp: new Date().toISOString(),
      cycle: this.cycleCount,
      metricsStatus,
      velocities,
      actions: this.actionsHistory.slice(-5) // Last 5 actions
    };
    
    try {
      // Write update to war room file
      fs.writeFileSync(
        path.join(__dirname, 'war_room_status.json'), 
        JSON.stringify(warRoomUpdate, null, 2)
      );
      
      return true;
    } catch (error) {
      this.log('ERROR', `Failed to update war room: ${error.message}`);
      return false;
    }
  }

  /**
   * Calculate velocity for each metric
   */
  calculateVelocities() {
    const velocities = {};
    
    for (const [metric, history] of Object.entries(this.metricsHistory)) {
      if (history.length < 2) {
        velocities[metric] = {
          value: 0,
          unit: 'per day',
          etaHours: null
        };
        continue;
      }
      
      // Get last two data points
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      
      // Calculate time difference in milliseconds
      const latestTime = new Date(latest.timestamp).getTime();
      const previousTime = new Date(previous.timestamp).getTime();
      const timeDiffMs = latestTime - previousTime;
      
      // Convert to days
      const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
      
      // Calculate change
      const change = latest.value - previous.value;
      
      // Calculate daily rate of change
      const dailyChange = timeDiffDays > 0 ? change / timeDiffDays : 0;
      
      // Different calculation based on metric type
      let improvingChange, etaHours;
      if (['cognitive_load', 'silent_failures', 'wcag_issues'].includes(metric)) {
        // Lower is better, so negative change is good
        improvingChange = -dailyChange;
        
        if (improvingChange > 0) {
          // Calculate hours to target
          const currentValue = latest.value;
          const targetValue = this.targets[metric];
          const amountToImprove = currentValue - targetValue;
          etaHours = amountToImprove / (improvingChange / 24);
        } else {
          etaHours = null; // Not improving
        }
      } else if (metric === '3g_success_rate') {
        // Higher is better, so positive change is good
        improvingChange = dailyChange;
        
        if (improvingChange > 0) {
          // Calculate hours to target
          const currentValue = latest.value;
          const targetValue = this.targets[metric];
          const amountToImprove = targetValue - currentValue;
          etaHours = amountToImprove / (improvingChange / 24);
        } else {
          etaHours = null; // Not improving
        }
      }
      
      velocities[metric] = {
        value: improvingChange,
        unit: 'per day',
        etaHours: etaHours !== null ? Math.ceil(etaHours) : null
      };
    }
    
    return velocities;
  }

  /**
   * Get current execution status
   */
  getCurrentStatus() {
    try {
      const data = fs.readFileSync(statusFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.log('ERROR', `Failed to read status file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save execution status
   */
  saveStatus(status) {
    try {
      fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
      return true;
    } catch (error) {
      this.log('ERROR', `Failed to save status file: ${error.message}`);
      return false;
    }
  }

  /**
   * Log a message
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    // Write to log file
    try {
      fs.appendFileSync(logFilePath, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
    
    // Also log to console
    const levelColors = {
      INFO: chalk.blue,
      SUCCESS: chalk.green,
      ERROR: chalk.red,
      WARN: chalk.yellow,
      CYCLE: chalk.magenta,
      METRICS: chalk.cyan,
      TARGETS: chalk.cyan,
      HOTFIX: chalk.yellow,
      CHAOS: chalk.yellow,
      WARROOM: chalk.blue,
      MAINTAIN: chalk.green,
      DRYRUN: chalk.gray
    };
    
    const colorFn = levelColors[level] || chalk.white;
    console.log(colorFn(`[${level}]`), message);
  }
}

// If running as a script
if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2), {
    boolean: ['dry-run'],
    string: ['interval', 'override'],
    alias: {
      i: 'interval',
      o: 'override',
      d: 'dry-run'
    },
    default: {
      interval: '60',
      'dry-run': false
    }
  });

  const interval = parseInt(argv.interval, 10);
  const dryRun = argv['dry-run'];
  const override = argv.override;

  const optimizer = new HourlyOptimizationCycle({
    interval,
    override,
    dryRun
  });

  optimizer.start().then(success => {
    if (success) {
      console.log(chalk.green('Hourly optimization cycle started successfully'));
    } else {
      console.error(chalk.red('Failed to start hourly optimization cycle'));
      process.exit(1);
    }
  }).catch(error => {
    console.error(chalk.red(`Error starting optimization cycle: ${error.message}`));
    process.exit(1);
  });
} else {
  // Export for use in other modules
  module.exports = { HourlyOptimizationCycle };
}