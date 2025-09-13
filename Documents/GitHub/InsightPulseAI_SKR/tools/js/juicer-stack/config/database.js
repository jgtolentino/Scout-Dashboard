/**
 * Simplified database connection for direct device data ingestion
 * 
 * This module provides a simplified database connection for direct device data ingestion,
 * replacing the more complex IoT Hub + Event Hubs architecture for single-device scenarios.
 */

const mysql = require('mysql2/promise');
const logger = require('../../logger');

// Default configuration
const defaultConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'juicer_user',
  password: process.env.DB_PASSWORD || 'juicer_password',
  database: process.env.DB_NAME || 'insight_pulse_ai',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10')
};

// Create a connection pool
let pool;

/**
 * Initialize database connection pool
 * @param {Object} config - Database configuration
 * @returns {Promise<Object>} Connection pool
 */
async function init(config = {}) {
  try {
    // Only initialize once
    if (pool) return pool;
    
    // Create connection pool
    pool = mysql.createPool({
      ...defaultConfig,
      ...config
    });
    
    // Test connection
    await pool.query('SELECT 1');
    
    logger.info(`Database connection established: ${defaultConfig.host}/${defaultConfig.database}`);
    
    // Create required tables if they don't exist
    await createTablesIfNotExist();
    
    return pool;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    
    // In development mode, set up mock database
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Setting up mock database for development');
      pool = setupMockDatabase();
      return pool;
    }
    
    throw error;
  }
}

/**
 * Execute SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  try {
    // Initialize pool if not already initialized
    if (!pool) await init();
    
    // Execute query
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    logger.error(`Database query error: ${error.message}`);
    logger.debug(`Failed query: ${sql}`);
    throw error;
  }
}

/**
 * Create required tables if they don't exist
 * @returns {Promise<void>}
 */
async function createTablesIfNotExist() {
  try {
    // Create devices table
    await query(`
      CREATE TABLE IF NOT EXISTS devices (
        deviceId VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        firmwareVersion VARCHAR(20) NOT NULL,
        location VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        lastDataTransmission DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create bronze_device_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS bronze_device_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        DeviceID VARCHAR(50) NOT NULL,
        StoreID VARCHAR(50),
        EventTimestamp DATETIME NOT NULL,
        Payload TEXT NOT NULL,
        LogType VARCHAR(50),
        SessionID VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_id (DeviceID),
        INDEX idx_session_id (SessionID),
        FOREIGN KEY (DeviceID) REFERENCES devices(deviceId) ON DELETE CASCADE
      )
    `);
    
    // Create bronze_transcriptions table
    await query(`
      CREATE TABLE IF NOT EXISTS bronze_transcriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        DeviceID VARCHAR(50) NOT NULL,
        StoreID VARCHAR(50),
        Timestamp DATETIME NOT NULL,
        TranscriptText TEXT NOT NULL,
        FacialID VARCHAR(100),
        SessionID VARCHAR(100) NOT NULL,
        Confidence FLOAT,
        WordCount INT,
        LanguageCode VARCHAR(20),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_id (DeviceID),
        INDEX idx_session_id (SessionID),
        INDEX idx_facial_id (FacialID),
        FOREIGN KEY (DeviceID) REFERENCES devices(deviceId) ON DELETE CASCADE
      )
    `);
    
    // Create bronze_vision_detections table
    await query(`
      CREATE TABLE IF NOT EXISTS bronze_vision_detections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        DeviceID VARCHAR(50) NOT NULL,
        StoreID VARCHAR(50),
        Timestamp DATETIME NOT NULL,
        DetectedObject VARCHAR(100) NOT NULL,
        Confidence FLOAT,
        BoundingBox TEXT,
        ImageURL VARCHAR(255),
        SessionID VARCHAR(100) NOT NULL,
        ModelVersion VARCHAR(50),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_id (DeviceID),
        INDEX idx_session_id (SessionID),
        FOREIGN KEY (DeviceID) REFERENCES devices(deviceId) ON DELETE CASCADE
      )
    `);
    
    // Create SalesInteractions table
    await query(`
      CREATE TABLE IF NOT EXISTS SalesInteractions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        DeviceID VARCHAR(50) NOT NULL,
        StoreID VARCHAR(50),
        Timestamp DATETIME NOT NULL,
        CustomerID VARCHAR(100),
        ProductID VARCHAR(100),
        InteractionType VARCHAR(50) NOT NULL,
        Duration INT,
        Outcome VARCHAR(50),
        SessionID VARCHAR(100) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_id (DeviceID),
        INDEX idx_session_id (SessionID),
        INDEX idx_customer_id (CustomerID),
        FOREIGN KEY (DeviceID) REFERENCES devices(deviceId) ON DELETE CASCADE
      )
    `);
    
    logger.info('Database tables created or verified');
  } catch (error) {
    logger.error(`Error creating tables: ${error.message}`);
    throw error;
  }
}

/**
 * Setup mock database for development
 * @returns {Object} Mock database interface
 */
function setupMockDatabase() {
  // In-memory mock data
  const mockData = {
    devices: [],
    bronze_device_logs: [],
    bronze_transcriptions: [],
    bronze_vision_detections: [],
    SalesInteractions: []
  };
  
  // Mock query function
  const mockQuery = async (sql, params = []) => {
    logger.debug(`Mock DB query: ${sql}`);
    
    // Handle different query types
    if (sql.match(/SELECT COUNT\(\*\) as count FROM devices/i)) {
      // Device existence check
      const deviceId = params[0];
      const count = mockData.devices.some(d => d.deviceId === deviceId) ? 1 : 0;
      return [{ count }];
    } else if (sql.match(/INSERT INTO devices/i)) {
      // Insert device
      const device = {
        deviceId: params[0],
        type: params[1],
        model: params[2],
        firmwareVersion: params[3],
        location: params[4],
        status: params[5],
        lastDataTransmission: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockData.devices.push(device);
      return [{ insertId: mockData.devices.length, affectedRows: 1 }];
    } else if (sql.match(/UPDATE devices SET lastDataTransmission/i)) {
      // Update device
      const deviceId = params[params.length - 1];
      const deviceIndex = mockData.devices.findIndex(d => d.deviceId === deviceId);
      if (deviceIndex >= 0) {
        if (params.length === 3) {
          // Update status and firmware
          mockData.devices[deviceIndex].status = params[0];
          mockData.devices[deviceIndex].firmwareVersion = params[1];
        }
        mockData.devices[deviceIndex].lastDataTransmission = new Date();
        mockData.devices[deviceIndex].updatedAt = new Date();
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    } else if (sql.match(/INSERT INTO bronze_device_logs/i)) {
      // Insert device log
      const log = {
        id: mockData.bronze_device_logs.length + 1,
        DeviceID: params[0],
        StoreID: params[1],
        EventTimestamp: new Date(),
        Payload: params[2],
        LogType: params[3],
        SessionID: params[4],
        createdAt: new Date()
      };
      mockData.bronze_device_logs.push(log);
      return [{ insertId: log.id, affectedRows: 1 }];
    } else if (sql.match(/INSERT INTO bronze_transcriptions/i)) {
      // Insert transcription
      const transcription = {
        id: mockData.bronze_transcriptions.length + 1,
        DeviceID: params[0],
        StoreID: params[1],
        Timestamp: new Date(),
        TranscriptText: params[2],
        FacialID: params[3],
        SessionID: params[4],
        Confidence: params[5],
        WordCount: params[6],
        LanguageCode: params[7],
        createdAt: new Date()
      };
      mockData.bronze_transcriptions.push(transcription);
      return [{ insertId: transcription.id, affectedRows: 1 }];
    } else if (sql.match(/INSERT INTO bronze_vision_detections/i)) {
      // Insert vision detection
      const detection = {
        id: mockData.bronze_vision_detections.length + 1,
        DeviceID: params[0],
        StoreID: params[1],
        Timestamp: new Date(),
        DetectedObject: params[2],
        Confidence: params[3],
        BoundingBox: params[4],
        ImageURL: params[5],
        SessionID: params[6],
        ModelVersion: params[7],
        createdAt: new Date()
      };
      mockData.bronze_vision_detections.push(detection);
      return [{ insertId: detection.id, affectedRows: 1 }];
    } else if (sql.match(/INSERT INTO SalesInteractions/i)) {
      // Insert sales interaction
      const interaction = {
        id: mockData.SalesInteractions.length + 1,
        DeviceID: params[0],
        StoreID: params[1],
        Timestamp: new Date(),
        CustomerID: params[2],
        ProductID: params[3],
        InteractionType: params[4],
        Duration: params[5],
        Outcome: params[6],
        SessionID: params[7],
        createdAt: new Date()
      };
      mockData.SalesInteractions.push(interaction);
      return [{ insertId: interaction.id, affectedRows: 1 }];
    } else if (sql.match(/SELECT \* FROM devices WHERE deviceId/i)) {
      // Get device info
      const deviceId = params[0];
      const device = mockData.devices.find(d => d.deviceId === deviceId);
      return device ? [device] : [];
    } else if (sql.match(/SELECT.*COUNT.*FROM/i)) {
      // Activity counts
      const deviceId = params[0];
      return [{
        logCount: mockData.bronze_device_logs.filter(l => l.DeviceID === deviceId).length,
        transcriptionCount: mockData.bronze_transcriptions.filter(t => t.DeviceID === deviceId).length,
        visionCount: mockData.bronze_vision_detections.filter(v => v.DeviceID === deviceId).length,
        interactionCount: mockData.SalesInteractions.filter(i => i.DeviceID === deviceId).length
      }];
    } else if (sql.match(/SELECT 1/i)) {
      // Connection test
      return [{ '1': 1 }];
    }
    
    // Default empty response
    return [];
  };
  
  // Return mock database interface
  return {
    query: mockQuery,
    end: async () => true
  };
}

module.exports = {
  init,
  query,
  createTablesIfNotExist
};