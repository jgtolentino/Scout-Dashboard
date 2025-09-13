/**
 * Device Simulator
 * 
 * This script simulates a device sending data to the device data ingestion API.
 * It can be used for testing and development purposes.
 * 
 * Usage:
 *   node device_simulator.js --mode=full
 * 
 * Options:
 *   --mode=full      Run a full simulation with all data types
 *   --mode=logs      Send only device logs
 *   --mode=voice     Send only voice transcriptions
 *   --mode=vision    Send only vision detections
 *   --mode=sales     Send only sales interactions
 *   --deviceId=XXX   Use a specific device ID (default: DEV-SIMULATOR-001)
 *   --storeId=XXX    Use a specific store ID (default: STORE-NORTH)
 *   --count=XXX      Number of messages to send (default: 10)
 *   --delay=XXX      Delay between messages in ms (default: 2000)
 */

const fetch = require('node-fetch');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('mode', {
    alias: 'm',
    type: 'string',
    description: 'Simulation mode',
    default: 'full',
    choices: ['full', 'logs', 'voice', 'vision', 'sales']
  })
  .option('deviceId', {
    alias: 'd',
    type: 'string',
    description: 'Device ID',
    default: 'DEV-SIMULATOR-001'
  })
  .option('storeId', {
    alias: 's',
    type: 'string',
    description: 'Store ID',
    default: 'STORE-NORTH'
  })
  .option('count', {
    alias: 'c',
    type: 'number',
    description: 'Number of messages to send',
    default: 10
  })
  .option('delay', {
    alias: 'l',
    type: 'number',
    description: 'Delay between messages in ms',
    default: 2000
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configuration
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3001/api/device-data',
  apiKey: process.env.DEVICE_API_KEY || 'test-api-key',
  deviceId: argv.deviceId,
  storeId: argv.storeId,
  mode: argv.mode,
  count: argv.count,
  delay: argv.delay,
  sessionId: `SESSION-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
};

console.log('Device Simulator Configuration:');
console.log(`API URL: ${config.apiUrl}`);
console.log(`Device ID: ${config.deviceId}`);
console.log(`Store ID: ${config.storeId}`);
console.log(`Mode: ${config.mode}`);
console.log(`Count: ${config.count}`);
console.log(`Delay: ${config.delay}ms`);
console.log(`Session ID: ${config.sessionId}\n`);

// Sample data for simulation
const sampleData = {
  logTypes: ['INFO', 'WARNING', 'ERROR', 'DEBUG'],
  logMessages: [
    'System startup completed',
    'Network connection established',
    'Low memory warning',
    'Database connection successful',
    'User authentication failed',
    'Session expired',
    'Cache invalidated',
    'File upload completed',
    'HTTP request failed',
    'New user registered'
  ],
  transcriptions: [
    'I would like to order a cheeseburger with fries',
    'Do you have any vegetarian options available?',
    'What is your most popular item on the menu?',
    'Is the chicken sandwich spicy?',
    'I have a coupon for a free drink',
    'How much is a kids meal?',
    'Are you serving breakfast right now?',
    'Can I get this order to go?',
    'Do you accept credit cards?',
    'What time do you close today?'
  ],
  detectedObjects: [
    'person', 'employee', 'customer',
    'tray', 'cup', 'burger',
    'bag', 'drink', 'napkin',
    'menu', 'sign', 'chair'
  ],
  interactionTypes: [
    'VIEW', 'PICK', 'INQUIRY',
    'PURCHASE', 'RETURN', 'BROWSE'
  ],
  outcomes: [
    'COMPLETED', 'ABANDONED', 'ASSISTED',
    'REFERRED', 'PURCHASED', 'NO_DECISION'
  ],
  productIds: [
    'PROD-001', 'PROD-002', 'PROD-003',
    'PROD-004', 'PROD-005', 'PROD-006'
  ]
};

// Helper to pick a random item from an array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate a random bounding box
const randomBoundingBox = () => ({
  x: Math.floor(Math.random() * 800),
  y: Math.floor(Math.random() * 600),
  width: Math.floor(Math.random() * 200) + 50,
  height: Math.floor(Math.random() * 200) + 50
});

// Helper to generate a random customer ID (sometimes null)
const randomCustomerId = () => 
  Math.random() < 0.7 ? `CUST-${Math.floor(Math.random() * 10000)}` : null;

// Helper to generate a random facial ID (sometimes null)
const randomFacialId = () => 
  Math.random() < 0.7 ? `FACE-${Math.floor(Math.random() * 1000)}` : null;

// Send a device log message
async function sendLogMessage() {
  try {
    const logType = randomItem(sampleData.logTypes);
    const message = randomItem(sampleData.logMessages);
    const payload = {
      message,
      timestamp: new Date().toISOString(),
      level: logType,
      details: {
        memory: Math.floor(Math.random() * 1000) + 200,
        cpu: Math.floor(Math.random() * 100)
      }
    };
    
    const response = await fetch(`${config.apiUrl}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        storeId: config.storeId,
        sessionId: config.sessionId,
        logType,
        payload
      })
    });
    
    const data = await response.json();
    console.log(`Log sent (${logType}): ${message} - ${data.success ? 'SUCCESS' : 'FAILED'}`);
    return data;
  } catch (error) {
    console.error(`Error sending log: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Send a transcription
async function sendTranscription() {
  try {
    const transcriptText = randomItem(sampleData.transcriptions);
    const wordCount = transcriptText.split(/\s+/).length;
    const confidence = (0.7 + Math.random() * 0.3).toFixed(2);
    const facialId = randomFacialId();
    
    const response = await fetch(`${config.apiUrl}/transcriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        storeId: config.storeId,
        sessionId: config.sessionId,
        transcriptText,
        facialId,
        confidence,
        wordCount,
        languageCode: 'en-US'
      })
    });
    
    const data = await response.json();
    console.log(`Transcription sent: "${transcriptText.substring(0, 30)}..." - ${data.success ? 'SUCCESS' : 'FAILED'}`);
    return data;
  } catch (error) {
    console.error(`Error sending transcription: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Send a vision detection
async function sendVisionDetection() {
  try {
    const detectedObject = randomItem(sampleData.detectedObjects);
    const confidence = (0.6 + Math.random() * 0.4).toFixed(2);
    const boundingBox = randomBoundingBox();
    
    const response = await fetch(`${config.apiUrl}/vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        storeId: config.storeId,
        sessionId: config.sessionId,
        detectedObject,
        confidence,
        boundingBox,
        imageUrl: `https://example.com/images/${Math.floor(Math.random() * 1000)}.jpg`,
        modelVersion: '2.0.1'
      })
    });
    
    const data = await response.json();
    console.log(`Vision detection sent: ${detectedObject} (${confidence}) - ${data.success ? 'SUCCESS' : 'FAILED'}`);
    return data;
  } catch (error) {
    console.error(`Error sending vision detection: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Send a sales interaction
async function sendSalesInteraction() {
  try {
    const interactionType = randomItem(sampleData.interactionTypes);
    const outcome = randomItem(sampleData.outcomes);
    const productId = randomItem(sampleData.productIds);
    const customerId = randomCustomerId();
    const duration = Math.floor(Math.random() * 300);
    
    const response = await fetch(`${config.apiUrl}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        storeId: config.storeId,
        sessionId: config.sessionId,
        customerId,
        productId,
        interactionType,
        duration,
        outcome
      })
    });
    
    const data = await response.json();
    console.log(`Sales interaction sent: ${interactionType} - ${productId} - ${outcome} - ${data.success ? 'SUCCESS' : 'FAILED'}`);
    return data;
  } catch (error) {
    console.error(`Error sending sales interaction: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Register device
async function registerDevice() {
  try {
    const response = await fetch(`${config.apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        deviceType: 'simulator',
        model: 'Simulator-2000',
        firmware: '1.0.0',
        location: config.storeId
      })
    });
    
    const data = await response.json();
    console.log(`Device registration: ${data.success ? 'SUCCESS' : 'FAILED'}`);
    return data;
  } catch (error) {
    console.error(`Error registering device: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to send a random message based on mode
async function sendRandomMessage() {
  switch (config.mode) {
    case 'logs':
      return await sendLogMessage();
    case 'voice':
      return await sendTranscription();
    case 'vision':
      return await sendVisionDetection();
    case 'sales':
      return await sendSalesInteraction();
    case 'full':
    default:
      // Pick a random message type
      const rand = Math.random();
      if (rand < 0.25) {
        return await sendLogMessage();
      } else if (rand < 0.5) {
        return await sendTranscription();
      } else if (rand < 0.75) {
        return await sendVisionDetection();
      } else {
        return await sendSalesInteraction();
      }
  }
}

// Main function to run the simulation
async function runSimulation() {
  try {
    console.log('Starting device simulation...');
    
    // Register device first
    await registerDevice();
    
    // Send messages
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < config.count; i++) {
      console.log(`\nSending message ${i + 1}/${config.count}...`);
      const result = await sendRandomMessage();
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Wait between messages
      if (i < config.count - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }
    }
    
    // Print summary
    console.log('\nSimulation complete!');
    console.log(`Messages sent: ${config.count}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    
  } catch (error) {
    console.error(`Simulation error: ${error.message}`);
  }
}

// Run the simulation
runSimulation();