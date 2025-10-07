#!/usr/bin/env node

/**
 * Maya Telemetry Initialization Script
 * 
 * This script initializes the Maya AI telemetry integration for advanced
 * analytics and monitoring of InsightPulseAI applications.
 */

const path = require('path');
const fs = require('fs');
const { configureMaya, initialize, trackEvent } = require('../utils/telemetry');

// Configuration path
const CONFIG_PATH = path.join(__dirname, '../config/telemetry.json');

// Main function
async function main() {
  try {
    console.log('Initializing Maya AI telemetry integration...');
    
    // Read current configuration
    let config;
    try {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      console.warn(`Could not read telemetry configuration: ${error.message}`);
      config = {};
    }
    
    // Check for environment variables
    const mayaEndpoint = process.env.MAYA_TELEMETRY_ENDPOINT || config.maya?.endpoint || 'https://maya-telemetry.pulserai.com/api/collect';
    const mayaApiKey = process.env.MAYA_API_KEY || config.maya?.apiKey;
    
    if (!mayaApiKey) {
      console.warn('Maya API key not provided. Using simulation mode.');
    }
    
    // Configure Maya
    const mayaConfig = {
      enabled: true,
      endpoint: mayaEndpoint,
      apiKey: mayaApiKey || 'simulation_mode_key',
      sessionSampling: parseInt(process.env.MAYA_SESSION_SAMPLING || config.maya?.sessionSampling || '100'),
      batchSize: parseInt(process.env.MAYA_BATCH_SIZE || config.maya?.batchSize || '10'),
      flushInterval: parseInt(process.env.MAYA_FLUSH_INTERVAL || config.maya?.flushInterval || '30000')
    };
    
    // Apply configuration
    const success = configureMaya(mayaConfig);
    
    if (success) {
      console.log('Maya AI telemetry integration initialized successfully.');
      
      // Force initialization
      initialize();
      
      // Track initialization event
      trackEvent('maya_telemetry_initialized', {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
      
      // Ensure events are flushed
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } else {
      console.error('Failed to initialize Maya AI telemetry integration.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error initializing Maya telemetry: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});