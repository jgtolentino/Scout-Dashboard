/**
 * Simplified Single-Device Data Ingestion API
 * 
 * This module provides a lightweight REST API for direct device data ingestion,
 * replacing the more complex IoT Hub + Event Hubs architecture for single-device scenarios.
 * 
 * Features:
 * - Simple authentication with API key
 * - Direct database writes for device data
 * - Support for all data types (logs, transcriptions, vision, interactions)
 * - Session tracking and management
 * - Integration with device health monitoring
 */

const express = require('express');
const router = express.Router();
const logger = require('../../logger');
const db = require('../config/database'); // Simplified database connection

// Authentication middleware for device API requests
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  // Simple API key validation - in production, use a more secure approach
  if (!apiKey || apiKey !== process.env.DEVICE_API_KEY) {
    logger.warn(`Unauthorized device API request: ${req.originalUrl}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

/**
 * Device registration and heartbeat endpoint
 * POST /api/device-data/register
 */
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { 
      deviceId, 
      deviceType = 'generic',
      model = 'unknown',
      firmware = '1.0.0',
      location = 'default'
    } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceID is required' });
    }
    
    // Check if device exists, if not create it
    const deviceExists = await db.query(
      'SELECT COUNT(*) as count FROM devices WHERE deviceId = ?',
      [deviceId]
    );
    
    if (deviceExists[0].count === 0) {
      // Create new device record
      await db.query(
        'INSERT INTO devices (deviceId, type, model, firmwareVersion, location, status, lastDataTransmission) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [deviceId, deviceType, model, firmware, location, 'active']
      );
      
      logger.info(`New device registered: ${deviceId} (${deviceType}, ${model}, ${location})`);
    } else {
      // Update existing device
      await db.query(
        'UPDATE devices SET lastDataTransmission = NOW(), status = ?, firmwareVersion = ? WHERE deviceId = ?',
        ['active', firmware, deviceId]
      );
      
      logger.debug(`Device heartbeat: ${deviceId}`);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Device registered/updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error registering device: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Device data ingestion endpoint - logs
 * POST /api/device-data/logs
 */
router.post('/logs', authMiddleware, async (req, res) => {
  try {
    const { 
      deviceId,
      storeId, 
      sessionId,
      logType,
      payload
    } = req.body;
    
    if (!deviceId || !payload) {
      return res.status(400).json({ error: 'DeviceID and payload are required' });
    }
    
    // Insert log data into bronze_device_logs
    await db.query(
      'INSERT INTO bronze_device_logs (DeviceID, StoreID, EventTimestamp, Payload, LogType, SessionID) VALUES (?, ?, NOW(), ?, ?, ?)',
      [deviceId, storeId, JSON.stringify(payload), logType, sessionId]
    );
    
    // Update device last transmission time
    await db.query(
      'UPDATE devices SET lastDataTransmission = NOW() WHERE deviceId = ?',
      [deviceId]
    );
    
    res.status(200).json({ 
      success: true, 
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error ingesting device logs: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Device data ingestion endpoint - transcriptions
 * POST /api/device-data/transcriptions
 */
router.post('/transcriptions', authMiddleware, async (req, res) => {
  try {
    const { 
      deviceId,
      storeId,
      sessionId,
      transcriptText,
      facialId,
      confidence,
      wordCount,
      languageCode = 'en-US'
    } = req.body;
    
    if (!deviceId || !sessionId || !transcriptText) {
      return res.status(400).json({ 
        error: 'DeviceID, SessionID, and TranscriptText are required' 
      });
    }
    
    // Calculate word count if not provided
    const calculatedWordCount = wordCount || 
      (transcriptText ? transcriptText.split(/\s+/).filter(Boolean).length : 0);
    
    // Insert transcription data into bronze_transcriptions
    await db.query(
      `INSERT INTO bronze_transcriptions 
        (DeviceID, StoreID, Timestamp, TranscriptText, FacialID, SessionID, Confidence, WordCount, LanguageCode) 
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [deviceId, storeId, transcriptText, facialId, sessionId, confidence, calculatedWordCount, languageCode]
    );
    
    // Update device last transmission time
    await db.query(
      'UPDATE devices SET lastDataTransmission = NOW() WHERE deviceId = ?',
      [deviceId]
    );
    
    res.status(200).json({ 
      success: true, 
      wordCount: calculatedWordCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error ingesting transcription: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Device data ingestion endpoint - vision detections
 * POST /api/device-data/vision
 */
router.post('/vision', authMiddleware, async (req, res) => {
  try {
    const { 
      deviceId,
      storeId,
      sessionId,
      detectedObject,
      confidence,
      boundingBox,
      imageUrl,
      modelVersion
    } = req.body;
    
    if (!deviceId || !sessionId || !detectedObject) {
      return res.status(400).json({ 
        error: 'DeviceID, SessionID, and DetectedObject are required' 
      });
    }
    
    // Insert vision detection data into bronze_vision_detections
    await db.query(
      `INSERT INTO bronze_vision_detections 
        (DeviceID, StoreID, Timestamp, DetectedObject, Confidence, BoundingBox, ImageURL, SessionID, ModelVersion) 
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [deviceId, storeId, detectedObject, confidence, JSON.stringify(boundingBox), imageUrl, sessionId, modelVersion]
    );
    
    // Update device last transmission time
    await db.query(
      'UPDATE devices SET lastDataTransmission = NOW() WHERE deviceId = ?',
      [deviceId]
    );
    
    res.status(200).json({ 
      success: true, 
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error ingesting vision detection: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Device data ingestion endpoint - sales interactions
 * POST /api/device-data/interactions
 */
router.post('/interactions', authMiddleware, async (req, res) => {
  try {
    const { 
      deviceId,
      storeId,
      sessionId,
      customerId,
      productId,
      interactionType,
      duration,
      outcome
    } = req.body;
    
    if (!deviceId || !sessionId || !interactionType) {
      return res.status(400).json({ 
        error: 'DeviceID, SessionID, and InteractionType are required' 
      });
    }
    
    // Insert interaction data into SalesInteractions
    await db.query(
      `INSERT INTO SalesInteractions 
        (DeviceID, StoreID, Timestamp, CustomerID, ProductID, InteractionType, Duration, Outcome, SessionID) 
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [deviceId, storeId, customerId, productId, interactionType, duration, outcome, sessionId]
    );
    
    // Update device last transmission time
    await db.query(
      'UPDATE devices SET lastDataTransmission = NOW() WHERE deviceId = ?',
      [deviceId]
    );
    
    res.status(200).json({ 
      success: true, 
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error ingesting sales interaction: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate unique session ID for new device sessions
 * GET /api/device-data/session
 */
router.get('/session', authMiddleware, async (req, res) => {
  try {
    const { deviceId, storeId } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceID is required' });
    }
    
    // Generate a unique session ID
    const sessionId = `SESSION-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Log session creation (optional)
    logger.info(`New session created: ${sessionId} for device ${deviceId} at store ${storeId || 'unknown'}`);
    
    res.status(200).json({ 
      success: true, 
      sessionId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error generating session ID: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get device status and information
 * GET /api/device-data/device/:deviceId
 */
router.get('/device/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'DeviceID is required' });
    }
    
    // Get device information
    const deviceData = await db.query(
      'SELECT * FROM devices WHERE deviceId = ?',
      [deviceId]
    );
    
    if (!deviceData || deviceData.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get recent activity counts
    const lastDayActivity = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM bronze_device_logs WHERE DeviceID = ? AND EventTimestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)) AS logCount,
        (SELECT COUNT(*) FROM bronze_transcriptions WHERE DeviceID = ? AND Timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)) AS transcriptionCount,
        (SELECT COUNT(*) FROM bronze_vision_detections WHERE DeviceID = ? AND Timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)) AS visionCount,
        (SELECT COUNT(*) FROM SalesInteractions WHERE DeviceID = ? AND Timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)) AS interactionCount
      `,
      [deviceId, deviceId, deviceId, deviceId]
    );
    
    res.status(200).json({ 
      success: true,
      device: deviceData[0],
      activity: lastDayActivity[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error fetching device info: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;