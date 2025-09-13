/**
 * Device Health API
 * 
 * This is a simple Express router that provides API endpoints for the Device Health Monitor component
 * in the Juicer Insights Dashboard. It interfaces with the device_audit.js module to provide
 * real device audit data.
 */

const express = require('express');
const router = express.Router();
const deviceAudit = require('../../utils/device_audit');
const deviceHealthMonitor = require('../../utils/device_health_monitor');
const logger = require('../../logger');

// Get device health dashboard data
router.get('/health', async (req, res) => {
  try {
    const dashboardData = await deviceHealthMonitor.getDeviceHealthDashboard();
    res.json(dashboardData);
  } catch (error) {
    logger.error(`Error getting device health dashboard: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get problematic devices
router.get('/problematic', async (req, res) => {
  try {
    const devices = await deviceHealthMonitor.getProblematicDevices();
    res.json(devices);
  } catch (error) {
    logger.error(`Error getting problematic devices: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get transcription quality issues
router.get('/transcriptions', async (req, res) => {
  try {
    const issues = await deviceHealthMonitor.getTranscriptionQualityIssues();
    res.json(issues);
  } catch (error) {
    logger.error(`Error getting transcription issues: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get customer ID issues
router.get('/customers', async (req, res) => {
  try {
    const issues = await deviceHealthMonitor.getCustomerIdIssues();
    res.json(issues);
  } catch (error) {
    logger.error(`Error getting customer ID issues: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get firmware analysis
router.get('/firmware', async (req, res) => {
  try {
    const analysis = await deviceHealthMonitor.getFirmwareAnalysis();
    res.json(analysis);
  } catch (error) {
    logger.error(`Error getting firmware analysis: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get store location health
router.get('/locations', async (req, res) => {
  try {
    const locations = await deviceHealthMonitor.getStoreLocationHealth();
    res.json(locations);
  } catch (error) {
    logger.error(`Error getting store location health: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get device alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await deviceHealthMonitor.getDeviceAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error(`Error getting device alerts: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Run a manual device audit
router.post('/audit', async (req, res) => {
  try {
    const auditResult = await deviceHealthMonitor.runDeviceAudit();
    res.json(auditResult);
  } catch (error) {
    logger.error(`Error running device audit: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;