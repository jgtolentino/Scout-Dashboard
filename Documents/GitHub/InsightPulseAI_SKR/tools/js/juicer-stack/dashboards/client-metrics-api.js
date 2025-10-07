/**
 * Client Metrics API
 * 
 * Express router that provides API endpoints for client-facing metrics.
 * This serves as a bridge between internal technical metrics and client-friendly metrics.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../logger');

// Mock data for client metrics
const generateClientMetrics = () => {
  return {
    timestamp: new Date().toISOString(),
    metrics: {
      aiModelReliability: {
        score: 96.2,
        status: "excellent",
        label: "AI Model Reliability",
        description: "STT & Vision health (past 48h)"
      },
      dataQuality: {
        score: 94.8,
        status: "good",
        label: "Data Quality",
        description: "Transcript & customer data completeness"
      },
      systemUptime: {
        score: 99.7,
        status: "excellent",
        label: "System Uptime",
        description: "Device & cloud infrastructure"
      },
      overallSystemHealth: {
        score: 97.1,
        status: "excellent",
        label: "Overall System Health",
        description: "Combined AI, data, and infrastructure"
      }
    },
    summaryText: "Your AI models are operating at 96.2% reliability with 285ms average response time across all devices in the past 48h. System health is excellent.",
    brandPerformance: {
      score: 92,
      status: "good",
      label: "Brand Performance",
      description: "Brand visibility, share of voice, sentiment"
    },
    competitorAnalysis: {
      score: 68,
      status: "fair",
      label: "Competitor Analysis",
      description: "Market and social trends analysis"
    },
    retailPerformance: {
      score: 100,
      status: "excellent",
      label: "Retail Performance",
      description: "Store-level performance metrics"
    },
    marketingROI: {
      score: 100,
      status: "excellent",
      label: "Marketing ROI",
      description: "Ad spend effectiveness, optimization score"
    }
  };
};

// GET /api/client-metrics
router.get('/', (req, res) => {
  try {
    const clientMetrics = generateClientMetrics();
    res.json(clientMetrics);
  } catch (error) {
    logger.error(`Error getting client metrics: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-metrics/model-reliability
router.get('/model-reliability', (req, res) => {
  try {
    const clientMetrics = generateClientMetrics();
    res.json({
      modelReliability: clientMetrics.metrics.aiModelReliability,
      timestamp: clientMetrics.timestamp
    });
  } catch (error) {
    logger.error(`Error getting model reliability metrics: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-metrics/data-quality
router.get('/data-quality', (req, res) => {
  try {
    const clientMetrics = generateClientMetrics();
    res.json({
      dataQuality: clientMetrics.metrics.dataQuality,
      timestamp: clientMetrics.timestamp
    });
  } catch (error) {
    logger.error(`Error getting data quality metrics: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-metrics/system-uptime
router.get('/system-uptime', (req, res) => {
  try {
    const clientMetrics = generateClientMetrics();
    res.json({
      systemUptime: clientMetrics.metrics.systemUptime,
      timestamp: clientMetrics.timestamp
    });
  } catch (error) {
    logger.error(`Error getting system uptime metrics: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-metrics/summary
router.get('/summary', (req, res) => {
  try {
    const clientMetrics = generateClientMetrics();
    res.json({
      overallSystemHealth: clientMetrics.metrics.overallSystemHealth,
      summaryText: clientMetrics.summaryText,
      timestamp: clientMetrics.timestamp
    });
  } catch (error) {
    logger.error(`Error getting metrics summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;