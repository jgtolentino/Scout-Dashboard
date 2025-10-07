/**
 * Event Hub Connector for Client360 Dashboard
 * 
 * This module provides a connection to Azure Event Hubs for real-time data streaming
 * from edge devices (Raspberry Pi) to the Client360 Dashboard
 * 
 * The connector handles:
 * - Speech-to-text data (eh-pi-stt-raw)
 * - Computer vision detections (eh-pi-visual-stream)
 * - Device health metrics (eh-device-heartbeat)
 * - Annotated events (eh-pi-annotated-events)
 * - Insight feedback (eh-insight-feedback)
 */

const { EventHubConsumerClient, EventHubProducerClient, latestEventPosition } = require('@azure/event-hubs');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

/**
 * Configuration defaults for Event Hub connector
 */
const DEFAULT_CONFIG = {
  // Azure Environment
  azure: {
    keyVaultName: process.env.KEY_VAULT_NAME || 'kv-client360',
    resourceGroup: process.env.RESOURCE_GROUP || 'scout-dashboard',
    useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true' || true,
  },

  // Event Hub Configuration
  eventHub: {
    namespace: process.env.EVENT_HUB_NAMESPACE || 'scout-event-hub',
    connectionString: process.env.EVENT_HUB_CONNECTION_STRING || '',
    consumerGroup: process.env.EVENT_HUB_CONSUMER_GROUP || '$Default',
  },

  // Client Behavior
  client: {
    maxRetries: 5,
    retryDelayMs: 1000,
    maxBatchSize: 100,
    processingTimeoutMs: 60000,
  },

  // Monitoring & Logging
  monitoring: {
    enableTelemetry: true,
    logLevel: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  }
};

/**
 * EventHubClient class for handling Azure Event Hub connections
 * and message processing
 */
class EventHubClient {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = { ...DEFAULT_CONFIG, ...options };
    this.consumers = {};
    this.producer = null;
    this.credentials = null;
    this.secretClient = null;
    this.isInitialized = false;
    this.handlers = {};
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      reconnections: 0
    };
  }

  /**
   * Initialize the Event Hub client
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize() {
    try {
      this.log('info', 'Initializing Event Hub client');

      // Set up Azure credentials
      if (this.options.azure.useManagedIdentity) {
        this.credentials = new DefaultAzureCredential();
        this.log('info', 'Using managed identity authentication');
      } else if (this.options.eventHub.connectionString) {
        this.log('info', 'Using connection string authentication');
      } else {
        // Try to get connection string from Key Vault
        await this.initializeKeyVault();
        await this.getSecretFromKeyVault('EVENT-HUB-CONNECTION-STRING');
      }

      this.isInitialized = true;
      this.log('info', 'Event Hub client initialized successfully');
      return true;
    } catch (error) {
      this.log('error', `Failed to initialize Event Hub client: ${error.message}`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Initialize Key Vault connection
   * @returns {Promise<void>}
   */
  async initializeKeyVault() {
    try {
      const keyVaultUrl = `https://${this.options.azure.keyVaultName}.vault.azure.net`;
      this.credentials = new DefaultAzureCredential();
      this.secretClient = new SecretClient(keyVaultUrl, this.credentials);
      this.log('info', `Key Vault client initialized for ${keyVaultUrl}`);
    } catch (error) {
      this.log('error', `Failed to initialize Key Vault client: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get a secret from Key Vault
   * @param {string} secretName - Name of the secret
   * @returns {Promise<string>} Secret value
   */
  async getSecretFromKeyVault(secretName) {
    try {
      if (!this.secretClient) {
        await this.initializeKeyVault();
      }
      const secret = await this.secretClient.getSecret(secretName);
      return secret.value;
    } catch (error) {
      this.log('error', `Failed to get secret ${secretName}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Create Event Hub consumer client
   * @param {string} eventHubName - Name of the Event Hub
   * @returns {Promise<EventHubConsumerClient>} Consumer client
   */
  async createConsumerClient(eventHubName) {
    try {
      let connectionString = this.options.eventHub.connectionString;
      
      // If no connection string provided, try to get from Key Vault
      if (!connectionString) {
        connectionString = await this.getSecretFromKeyVault('EVENT-HUB-CONNECTION-STRING');
      }
      
      // Create consumer client
      const consumerClient = new EventHubConsumerClient(
        this.options.eventHub.consumerGroup,
        connectionString,
        eventHubName
      );
      
      this.log('info', `Created consumer client for Event Hub: ${eventHubName}`);
      return consumerClient;
    } catch (error) {
      this.log('error', `Failed to create consumer client for ${eventHubName}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Add event handler for a specific Event Hub
   * @param {string} eventHubName - Name of the Event Hub
   * @param {Function} handler - Event handler function
   * @returns {Promise<void>}
   */
  async addEventHandler(eventHubName, handler) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this.handlers[eventHubName] = handler;
    this.log('info', `Added event handler for ${eventHubName}`);
  }

  /**
   * Start consuming events from an Event Hub
   * @param {string} eventHubName - Name of the Event Hub
   * @returns {Promise<void>}
   */
  async startConsumer(eventHubName) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (!this.handlers[eventHubName]) {
        throw new Error(`No handler registered for Event Hub ${eventHubName}`);
      }
      
      // Create consumer if it doesn't exist
      if (!this.consumers[eventHubName]) {
        this.consumers[eventHubName] = await this.createConsumerClient(eventHubName);
      }
      
      // Start consuming events
      const consumer = this.consumers[eventHubName];
      
      await consumer.subscribe({
        processEvents: async (events, context) => {
          try {
            this.log('debug', `Received ${events.length} events from ${eventHubName}`);
            this.stats.messagesReceived += events.length;
            
            // Process each event
            for (const event of events) {
              try {
                await this.handlers[eventHubName](event);
              } catch (handlerError) {
                this.log('error', `Error in event handler for ${eventHubName}: ${handlerError.message}`, handlerError);
              }
            }
          } catch (processError) {
            this.log('error', `Error processing events from ${eventHubName}: ${processError.message}`, processError);
            this.stats.errors++;
          }
        },
        processError: async (error, context) => {
          this.log('error', `Error in consumer for ${eventHubName}: ${error.message}`, error);
          this.stats.errors++;
          
          // Handle reconnection
          if (this.shouldRetryConnection(error)) {
            await this.handleReconnection(eventHubName);
          }
        }
      },
      { startPosition: latestEventPosition });
      
      this.log('info', `Started consuming events from ${eventHubName}`);
    } catch (error) {
      this.log('error', `Failed to start consumer for ${eventHubName}: ${error.message}`, error);
      this.stats.errors++;
      
      // Attempt to recover
      setTimeout(() => this.startConsumer(eventHubName), this.options.client.retryDelayMs);
    }
  }

  /**
   * Determine if connection should be retried
   * @param {Error} error - Connection error
   * @returns {boolean} Whether to retry
   */
  shouldRetryConnection(error) {
    // Check error types that should trigger reconnection
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ENETRESET',
    ];
    
    return retryableErrors.some(code => error.code === code) || 
           error.message.includes('connection') ||
           error.message.includes('timeout');
  }

  /**
   * Handle reconnection to Event Hub
   * @param {string} eventHubName - Name of the Event Hub
   * @returns {Promise<void>}
   */
  async handleReconnection(eventHubName) {
    try {
      this.log('info', `Attempting to reconnect to ${eventHubName}`);
      this.stats.reconnections++;
      
      // Close existing consumer
      if (this.consumers[eventHubName]) {
        await this.consumers[eventHubName].close();
        delete this.consumers[eventHubName];
      }
      
      // Exponential backoff
      const delay = Math.min(
        this.options.client.retryDelayMs * Math.pow(2, this.stats.reconnections % 10),
        30000 // Maximum 30 seconds
      );
      
      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Create new consumer and start consuming
      this.consumers[eventHubName] = await this.createConsumerClient(eventHubName);
      await this.startConsumer(eventHubName);
      
      this.log('info', `Reconnected to ${eventHubName} successfully`);
    } catch (error) {
      this.log('error', `Reconnection to ${eventHubName} failed: ${error.message}`, error);
      this.stats.errors++;
      
      // Schedule another reconnection attempt
      setTimeout(() => this.handleReconnection(eventHubName), this.options.client.retryDelayMs);
    }
  }

  /**
   * Stop all Event Hub consumers
   * @returns {Promise<void>}
   */
  async stopAllConsumers() {
    try {
      const eventHubs = Object.keys(this.consumers);
      this.log('info', `Stopping ${eventHubs.length} Event Hub consumers`);
      
      for (const eventHubName of eventHubs) {
        await this.consumers[eventHubName].close();
        this.log('info', `Stopped consumer for ${eventHubName}`);
      }
      
      this.consumers = {};
      this.log('info', 'All consumers stopped');
    } catch (error) {
      this.log('error', `Failed to stop consumers: ${error.message}`, error);
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string} message - Log message
   * @param {Error} [error] - Error object
   */
  log(level, message, error = null) {
    const logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    const configLevel = this.options.monitoring.logLevel.toLowerCase();
    
    if (logLevels[level] >= logLevels[configLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [EventHubClient] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(logMessage);
          break;
        case 'info':
          console.info(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'error':
          console.error(logMessage);
          if (error) {
            console.error(error);
          }
          break;
      }
    }
  }

  /**
   * Get client statistics
   * @returns {Object} Client statistics
   */
  getStats() {
    return {
      ...this.stats,
      timestamp: new Date().toISOString(),
      eventHubs: Object.keys(this.consumers)
    };
  }
}

// Example usage:
//
// const eventHubClient = new EventHubClient();
//
// // Add handlers for each Event Hub
// eventHubClient.addEventHandler('eh-pi-stt-raw', (event) => {
//   // Process speech-to-text event
//   const speechData = event.body;
//   console.log('Received speech data:', speechData);
// });
//
// eventHubClient.addEventHandler('eh-pi-visual-stream', (event) => {
//   // Process visual stream event
//   const visualData = event.body;
//   console.log('Received visual data:', visualData);
// });
//
// eventHubClient.addEventHandler('eh-device-heartbeat', (event) => {
//   // Process device heartbeat event
//   const deviceData = event.body;
//   console.log('Received device data:', deviceData);
// });
//
// // Start consuming events
// eventHubClient.startConsumer('eh-pi-stt-raw');
// eventHubClient.startConsumer('eh-pi-visual-stream');
// eventHubClient.startConsumer('eh-device-heartbeat');
//
// // Stop all consumers when done
// // eventHubClient.stopAllConsumers();

module.exports = EventHubClient;