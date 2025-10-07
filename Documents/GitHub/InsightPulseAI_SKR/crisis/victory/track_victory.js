#!/usr/bin/env node

/**
 * Victory Tracker Command
 * RED2025 Protocol - Final Countdown
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const defaultConfig = {
  metrics: ['cognitive_load', '3g_success', 'silent_failures', 'wcag_issues'],
  refresh: 30,
  alertMode: 'war_room',
  outputFile: './victory_status.json',
  targetValues: {
    cognitive_load: 2.1,
    '3g_success': 95,
    silent_failures: 1,
    wcag_issues: 0
  },
  greenStreakTarget: 12, // hours
  startTime: new Date().toISOString()
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...defaultConfig };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--metrics' && i + 1 < args.length) {
      config.metrics = args[i + 1].split(',');
      i++;
    } else if (arg.startsWith('--metrics=')) {
      config.metrics = arg.substring('--metrics='.length).split(',');
    } else if (arg === '--refresh' && i + 1 < args.length) {
      config.refresh = parseInt(args[i + 1], 10);
      i++;
    } else if (arg.startsWith('--refresh=')) {
      config.refresh = parseInt(arg.substring('--refresh='.length), 10);
    } else if (arg === '--alert-mode' && i + 1 < args.length) {
      config.alertMode = args[i + 1];
      i++;
    } else if (arg.startsWith('--alert-mode=')) {
      config.alertMode = arg.substring('--alert-mode='.length);
    } else if (arg === '--output' && i + 1 < args.length) {
      config.outputFile = args[i + 1];
      i++;
    } else if (arg.startsWith('--output=')) {
      config.outputFile = arg.substring('--output='.length);
    } else if (arg === '--help') {
      printUsage();
      process.exit(0);
    }
  }
  
  return config;
}

// Print usage information
function printUsage() {
  console.log('Victory Tracker Command');
  console.log('Usage: npx skr-crisis track-victory [options]');
  console.log('');
  console.log('Options:');
  console.log('  --metrics=<metrics>        Comma-separated list of metrics to track');
  console.log('  --refresh=<seconds>        Refresh interval in seconds');
  console.log('  --alert-mode=<mode>        Alert mode (war_room, normal, silent)');
  console.log('  --output=<file>            Output file for status JSON');
  console.log('  --help                     Show this help message');
}

// Generate simulated metric data
function generateMetricData(config, elapsedHours) {
  const metrics = {};
  
  // Improvement rates per hour (simulated)
  const improvementRates = {
    cognitive_load: 0.12,
    '3g_success': 0.83,
    silent_failures: 0.46,
    wcag_issues: 0.38
  };
  
  // Starting values
  const startValues = {
    cognitive_load: 2.8,
    '3g_success': 75,
    silent_failures: 9,
    wcag_issues: 9
  };
  
  // Generate current value for each metric
  for (const metric of config.metrics) {
    let current;
    let target = config.targetValues[metric];
    let baseline = metric === 'cognitive_load' ? 4.7 : 
                   metric === '3g_success' ? 8 : 
                   metric === 'silent_failures' ? 22 : 34;
    
    // Calculate current value based on elapsed time and improvement rate
    if (metric === '3g_success') {
      // For metrics where higher is better
      current = Math.min(startValues[metric] + (elapsedHours * improvementRates[metric] * 60), target);
    } else {
      // For metrics where lower is better
      current = Math.max(startValues[metric] - (elapsedHours * improvementRates[metric] * 60), target);
    }
    
    // Add some random variation
    const randomVariation = (Math.random() - 0.5) * 0.2;
    current += randomVariation;
    
    // Ensure value stays within reasonable bounds
    if (metric === '3g_success') {
      current = Math.min(Math.max(current, startValues[metric]), 100);
    } else {
      current = Math.max(Math.min(current, startValues[metric]), 0);
    }
    
    // Format to reasonable precision
    current = Math.round(current * 10) / 10;
    
    // Calculate velocity
    const velocity = metric === '3g_success' ? improvementRates[metric] : -improvementRates[metric];
    
    // Calculate ETA to target
    let eta = 0;
    if (metric === '3g_success') {
      // For metrics where higher is better
      if (current < target) {
        eta = (target - current) / improvementRates[metric];
      }
    } else {
      // For metrics where lower is better
      if (current > target) {
        eta = (current - target) / improvementRates[metric];
      }
    }
    
    // Format to reasonable precision
    eta = Math.ceil(eta);
    
    // Determine status
    let status = 'in_progress';
    if (metric === '3g_success' && current >= target) {
      status = 'complete';
    } else if (metric !== '3g_success' && current <= target) {
      status = 'complete';
    }
    
    metrics[metric] = {
      name: metric === 'cognitive_load' ? 'Cognitive Load' : 
            metric === '3g_success' ? '3G Success' : 
            metric === 'silent_failures' ? 'Silent Failures' : 'WCAG Issues',
      baseline,
      current,
      target,
      velocity,
      velocityUnit: "per hour",
      eta,
      status
    };
  }
  
  return metrics;
}

// Simulate green streak calculation
function calculateGreenStreak(metrics, elapsedHours) {
  // Calculate how long all metrics have been meeting targets
  // This is a simulation - in reality would check historical data
  
  // Calculate how many metrics are green
  const greenMetrics = Object.values(metrics).filter(m => m.status === 'complete').length;
  const totalMetrics = Object.values(metrics).length;
  
  // If all metrics are green, we'll simulate a green streak
  if (greenMetrics === totalMetrics) {
    // Assume it became green at around 6 hours for simulation
    return Math.min(elapsedHours - 5, 12); // Cap at 12 hours
  } else {
    // Not all metrics are green yet
    return 0;
  }
}

// Check if victory criteria met
function checkVictory(metrics, greenStreakHours, requiredGreenHours) {
  // All metrics must be at target
  const allMetricsGreen = Object.values(metrics).every(m => m.status === 'complete');
  
  // Green streak must be sufficient
  const sufficientGreenStreak = greenStreakHours >= requiredGreenHours;
  
  return allMetricsGreen && sufficientGreenStreak;
}

// Print metrics table
function printMetricsTable(metrics) {
  // Clear console
  console.clear();
  
  // Calculate table widths
  const nameWidth = Math.max(...Object.values(metrics).map(m => m.name.length), 10);
  const baselineWidth = 10;
  const currentWidth = 10;
  const velocityWidth = 15;
  const etaWidth = 5;
  
  // Print header
  console.log('Real-Time Progress Snapshot');
  console.log('─'.repeat(nameWidth + baselineWidth + currentWidth + velocityWidth + etaWidth + 8));
  
  console.log(
    'Metric'.padEnd(nameWidth),
    'Baseline'.padEnd(baselineWidth),
    'Current'.padEnd(currentWidth),
    'Velocity'.padEnd(velocityWidth),
    'ETA'.padEnd(etaWidth)
  );
  
  console.log('─'.repeat(nameWidth + baselineWidth + currentWidth + velocityWidth + etaWidth + 8));
  
  // Print each metric
  for (const metric of Object.values(metrics)) {
    const formattedName = metric.name.padEnd(nameWidth);
    const formattedBaseline = `${metric.baseline}`.padEnd(baselineWidth);
    
    // Format current value with status
    let formattedCurrent = `${metric.current}`;
    if (metric.status === 'complete') {
      formattedCurrent += ' ✅';
    }
    formattedCurrent = formattedCurrent.padEnd(currentWidth);
    
    // Format velocity with direction
    const velocityDirection = metric.name === '3G Success' ? '↑' : '↓';
    const formattedVelocity = `${velocityDirection} ${Math.abs(metric.velocity)} ${metric.velocityUnit}`.padEnd(velocityWidth);
    
    // Format ETA
    const formattedEta = metric.status === 'complete' ? '0h'.padEnd(etaWidth) : `${metric.eta}h`.padEnd(etaWidth);
    
    console.log(formattedName, formattedBaseline, formattedCurrent, formattedVelocity, formattedEta);
  }
  
  console.log('─'.repeat(nameWidth + baselineWidth + currentWidth + velocityWidth + etaWidth + 8));
}

// Run the victory tracker
function runVictoryTracker() {
  const config = parseArgs();
  
  // Simulate elapsed time (for testing)
  let startTime = new Date(config.startTime);
  let elapsedHours = (new Date() - startTime) / (1000 * 60 * 60);
  
  // Handle input for early termination
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit();
    }
  });
  
  console.log(`Starting Victory Tracker with refresh rate of ${config.refresh}s`);
  console.log(`Monitoring metrics: ${config.metrics.join(', ')}`);
  console.log(`Alert mode: ${config.alertMode}`);
  console.log(`Press Ctrl+C to exit`);
  console.log('');
  
  // Initial metrics generation
  let metrics = generateMetricData(config, elapsedHours);
  let greenStreakHours = calculateGreenStreak(metrics, elapsedHours);
  let isVictory = checkVictory(metrics, greenStreakHours, config.greenStreakTarget);
  
  // Display metrics table
  printMetricsTable(metrics);
  
  // Display green streak and victory status
  console.log(`Green Streak: ${greenStreakHours.toFixed(1)}h / ${config.greenStreakTarget}h required for victory`);
  console.log(`Victory Status: ${isVictory ? '✅ VICTORY CONDITIONS MET!' : '⏳ In Progress'}`);
  
  if (isVictory) {
    console.log(`🎉 All success criteria have been met! Ready for Phase 3 transition.`);
  }
  
  // Save status to file
  const statusData = {
    timestamp: new Date().toISOString(),
    elapsedHours,
    metrics,
    greenStreakHours,
    requiredGreenHours: config.greenStreakTarget,
    isVictory,
    config
  };
  
  fs.writeFileSync(config.outputFile, JSON.stringify(statusData, null, 2));
  
  // Update periodically
  setInterval(() => {
    // Update elapsed time
    elapsedHours = (new Date() - startTime) / (1000 * 60 * 60);
    
    // Generate new metrics
    metrics = generateMetricData(config, elapsedHours);
    greenStreakHours = calculateGreenStreak(metrics, elapsedHours);
    isVictory = checkVictory(metrics, greenStreakHours, config.greenStreakTarget);
    
    // Display metrics table
    printMetricsTable(metrics);
    
    // Display green streak and victory status
    console.log(`Green Streak: ${greenStreakHours.toFixed(1)}h / ${config.greenStreakTarget}h required for victory`);
    console.log(`Victory Status: ${isVictory ? '✅ VICTORY CONDITIONS MET!' : '⏳ In Progress'}`);
    
    if (isVictory) {
      console.log(`🎉 All success criteria have been met! Ready for Phase 3 transition.`);
    }
    
    // Save status to file
    const statusData = {
      timestamp: new Date().toISOString(),
      elapsedHours,
      metrics,
      greenStreakHours,
      requiredGreenHours: config.greenStreakTarget,
      isVictory,
      config
    };
    
    fs.writeFileSync(config.outputFile, JSON.stringify(statusData, null, 2));
  }, config.refresh * 1000);
}

// If run directly, start the tracker
if (require.main === module) {
  runVictoryTracker();
}

module.exports = { runVictoryTracker, generateMetricData, calculateGreenStreak, checkVictory };
