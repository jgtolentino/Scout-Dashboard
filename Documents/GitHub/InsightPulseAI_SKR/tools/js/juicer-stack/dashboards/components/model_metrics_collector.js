/**
 * Model Metrics Collector
 * 
 * This module collects and calculates metrics related to STT, vision, and other AI models
 * for display in the Data Insights Dashboard. It serves as a bridge between
 * internal technical metrics and client-facing business metrics.
 */

class ModelMetricsCollector {
  constructor(options = {}) {
    this.options = Object.assign({
      apiEndpoint: '/api/devices/health',
      sttApiEndpoint: '/api/models/stt/metrics',
      visionApiEndpoint: '/api/models/vision/metrics',
      azureWafEndpoint: '/api/azure/waf/metrics',
      refreshInterval: 60000, // 1 minute refresh by default
    }, options);
    
    this.metrics = null;
  }
  
  /**
   * Initialize the collector
   */
  async init() {
    try {
      // Initial metrics fetch
      await this.refreshMetrics();
      
      // Set up auto-refresh if interval specified
      if (this.options.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => this.refreshMetrics(), this.options.refreshInterval);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize ModelMetricsCollector:', error);
      return false;
    }
  }
  
  /**
   * Refresh metrics from various APIs
   */
  async refreshMetrics() {
    try {
      // Fetch metrics from different sources in parallel
      const [deviceHealth, sttMetrics, visionMetrics, azureWaf] = await Promise.all([
        this.fetchDeviceHealthMetrics(),
        this.fetchSttMetrics(),
        this.fetchVisionMetrics(),
        this.fetchAzureWafMetrics()
      ]);
      
      // Calculate derived metrics
      const modelReliabilityScore = this.calculateModelReliabilityScore(sttMetrics, visionMetrics);
      const dataHealthScore = this.calculateDataHealthScore(deviceHealth);
      const infrastructureUptimeScore = this.calculateInfrastructureUptimeScore(azureWaf, deviceHealth);
      
      // Compose consolidated metrics object
      this.metrics = {
        timestamp: new Date().toISOString(),
        deviceHealth,
        sttMetrics,
        visionMetrics,
        azureWaf,
        derivedMetrics: {
          modelReliabilityScore,
          dataHealthScore,
          infrastructureUptimeScore,
          overallSystemHealth: this.calculateOverallSystemHealth(
            modelReliabilityScore,
            dataHealthScore,
            infrastructureUptimeScore
          )
        },
        clientFacingMetrics: this.generateClientFacingMetrics(
          modelReliabilityScore,
          dataHealthScore,
          infrastructureUptimeScore
        )
      };
      
      // Emit event when metrics are updated
      this.emitMetricsUpdated();
      
      return this.metrics;
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      throw error;
    }
  }
  
  /**
   * Fetch device health metrics
   */
  async fetchDeviceHealthMetrics() {
    try {
      // In production, this would call the actual API
      // For demo purposes, we'll return mocked data or try to fetch from the endpoint
      
      // Try to fetch from API first
      try {
        const response = await fetch(this.options.apiEndpoint);
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (fetchError) {
        console.warn('Could not fetch device health metrics from API, using mock data');
      }
      
      // Mock data as fallback
      return {
        deviceCount: 156,
        silentDeviceCount: 3,
        criticalAlertCount: 2,
        silentDevicePercentage: 1.92,
        dataQualityScore: 98.7,
        transcriptionIssuePercentage: 0.8,
        customerIdIssuePercentage: 1.2,
        firmwareVersions: [
          { version: '2.1.0', deviceCount: 98, healthScore: 99.2 },
          { version: '2.0.1', deviceCount: 42, healthScore: 94.5 },
          { version: '1.3.2', deviceCount: 16, healthScore: 92.3 }
        ],
        storeLocationHealth: [
          { location: 'North', deviceCount: 45, healthScore: 97.8 },
          { location: 'South', deviceCount: 38, healthScore: 98.9 },
          { location: 'East', deviceCount: 42, healthScore: 99.2 },
          { location: 'West', deviceCount: 31, healthScore: 98.4 }
        ]
      };
    } catch (error) {
      console.error('Error fetching device health metrics:', error);
      throw error;
    }
  }
  
  /**
   * Fetch STT model metrics
   */
  async fetchSttMetrics() {
    try {
      // Try to fetch from API first if available
      try {
        const response = await fetch(this.options.sttApiEndpoint);
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (fetchError) {
        console.warn('Could not fetch STT metrics from API, using mock data');
      }
      
      // Mock data as fallback
      return {
        wordErrorRate: 4.2,           // 4.2% WER
        confidenceScore: 92.5,        // 92.5% average confidence
        latencyMs: 267,               // 267ms average latency
        throughputPerSecond: 12.4,    // Can process 12.4 seconds of audio per second
        totalProcessed: 187465,       // Total number of audio segments processed
        averageAudioLengthSeconds: 8.2, // Average audio segment length
        languageBreakdown: {
          english: 92.3,              // Percentage of transcripts in English
          spanish: 4.7,               // Spanish
          mandarin: 1.2,              // Mandarin
          other: 1.8                  // Other languages
        },
        deviceTypeBreakdown: {
          kiosk: 42.7,
          mobileApp: 28.9,
          iotDevice: 18.4,
          other: 10.0
        }
      };
    } catch (error) {
      console.error('Error fetching STT metrics:', error);
      throw error;
    }
  }
  
  /**
   * Fetch vision model metrics
   */
  async fetchVisionMetrics() {
    try {
      // Try to fetch from API first if available
      try {
        const response = await fetch(this.options.visionApiEndpoint);
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (fetchError) {
        console.warn('Could not fetch vision metrics from API, using mock data');
      }
      
      // Mock data as fallback
      return {
        meanAveragePrecision: 90.1,    // mAP@0.5 score
        confidenceThreshold: 0.65,     // Confidence threshold used
        averageInferenceTimeMs: 82,    // 82ms average inference time
        framesProcessedPerSecond: 18.4, // FPS
        totalFramesProcessed: 932541,  // Total frames processed
        deviceUtilization: 68.2,       // GPU/CPU utilization percentage
        detectionCategories: {
          person: { count: 523987, accuracy: 96.8 },
          product: { count: 142376, accuracy: 93.2 },
          shoppingCart: { count: 45982, accuracy: 91.5 },
          shelf: { count: 78541, accuracy: 94.3 },
          other: { count: 25632, accuracy: 88.7 }
        },
        successfulDetectionRate: 96.2, // Percentage of frames with successful detections
        falsePositiveRate: 1.8        // False positive rate
      };
    } catch (error) {
      console.error('Error fetching vision metrics:', error);
      throw error;
    }
  }
  
  /**
   * Fetch Azure WAF metrics
   */
  async fetchAzureWafMetrics() {
    try {
      // Try to fetch from API first if available
      try {
        const response = await fetch(this.options.azureWafEndpoint);
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (fetchError) {
        console.warn('Could not fetch Azure WAF metrics from API, using mock data');
      }
      
      // Mock data as fallback
      const timestamp = new Date().toISOString();
      return {
        overview: {
          reliabilityScore: 99.8,      // Overall WAF reliability score
          securityScore: 97.2,         // Security assessment score
          costOptimizationScore: 91.4, // Cost optimization score
          performanceScore: 93.5       // Performance efficiency score
        },
        services: {
          blobStorage: { 
            uptime: 99.99, 
            averageLatencyMs: 23.4,
            requestsPerSecond: 45.2,
            errorRate: 0.02
          },
          cognitiveServices: { 
            uptime: 99.95, 
            averageLatencyMs: 187.6,
            requestsPerSecond: 23.8,
            errorRate: 0.05
          },
          databricks: { 
            uptime: 99.98, 
            averageLatencyMs: 142.3,
            requestsPerSecond: 8.6,
            errorRate: 0.01
          },
          functions: { 
            uptime: 99.94, 
            averageLatencyMs: 78.5,
            requestsPerSecond: 32.7,
            errorRate: 0.03
          }
        },
        costMetrics: {
          lastBillingCycle: 4275.82,    // Cost last month in USD
          projectedCurrent: 4132.45,    // Projected cost this month
          savingsOpportunities: 412.30  // Potential savings identified
        },
        securityEvents: {
          criticalCount: 0,
          warningCount: 3,
          infoCount: 17
        },
        timestamp
      };
    } catch (error) {
      console.error('Error fetching Azure WAF metrics:', error);
      throw error;
    }
  }
  
  /**
   * Calculate model reliability score
   * @param {Object} sttMetrics STT metrics
   * @param {Object} visionMetrics Vision metrics
   * @returns {number} Model reliability score (0-100)
   */
  calculateModelReliabilityScore(sttMetrics, visionMetrics) {
    if (!sttMetrics || !visionMetrics) return 0;
    
    // Calculate STT reliability component (0-100)
    const sttReliability = (
      (100 - sttMetrics.wordErrorRate) * 0.6 +  // Lower WER is better
      sttMetrics.confidenceScore * 0.4          // Higher confidence is better
    );
    
    // Calculate vision reliability component (0-100)
    const visionReliability = (
      visionMetrics.meanAveragePrecision * 0.7 +  // Higher mAP is better
      (100 - (visionMetrics.falsePositiveRate * 5)) * 0.3  // Lower false positive rate is better (weighted)
    );
    
    // Weight STT and vision reliability by their relative importance
    const overallReliability = (
      sttReliability * 0.5 +
      visionReliability * 0.5
    );
    
    return parseFloat(overallReliability.toFixed(1));
  }
  
  /**
   * Calculate data health score
   * @param {Object} deviceHealth Device health metrics
   * @returns {number} Data health score (0-100)
   */
  calculateDataHealthScore(deviceHealth) {
    if (!deviceHealth) return 0;
    
    // Data quality factors: transcription quality, customer ID completeness, etc.
    const transcriptionQuality = 100 - (deviceHealth.transcriptionIssuePercentage || 0);
    const customerIdCompleteness = 100 - (deviceHealth.customerIdIssuePercentage || 0);
    const dataQualityScore = deviceHealth.dataQualityScore || 0;
    
    // Weight the factors for an overall data health score
    const dataHealthScore = (
      transcriptionQuality * 0.4 +
      customerIdCompleteness * 0.3 +
      dataQualityScore * 0.3
    );
    
    return parseFloat(dataHealthScore.toFixed(1));
  }
  
  /**
   * Calculate infrastructure uptime score
   * @param {Object} azureWaf Azure WAF metrics
   * @param {Object} deviceHealth Device health metrics
   * @returns {number} Infrastructure uptime score (0-100)
   */
  calculateInfrastructureUptimeScore(azureWaf, deviceHealth) {
    if (!azureWaf || !deviceHealth) return 0;
    
    // Calculate device uptime component
    const deviceUptimePercentage = 100 - (deviceHealth.silentDevicePercentage || 0);
    
    // Calculate Azure services uptime component
    const azureServicesUptime = (
      azureWaf.services.blobStorage.uptime * 0.25 +
      azureWaf.services.cognitiveServices.uptime * 0.25 +
      azureWaf.services.databricks.uptime * 0.25 +
      azureWaf.services.functions.uptime * 0.25
    );
    
    // Weight device uptime and Azure uptime for overall score
    const infrastructureUptimeScore = (
      deviceUptimePercentage * 0.6 +
      azureServicesUptime * 0.4
    );
    
    return parseFloat(infrastructureUptimeScore.toFixed(1));
  }
  
  /**
   * Calculate overall system health
   * @param {number} modelReliabilityScore Model reliability score
   * @param {number} dataHealthScore Data health score
   * @param {number} infrastructureUptimeScore Infrastructure uptime score
   * @returns {number} Overall system health score (0-100)
   */
  calculateOverallSystemHealth(modelReliabilityScore, dataHealthScore, infrastructureUptimeScore) {
    // Weight the three main components based on their relative importance
    const overallScore = (
      modelReliabilityScore * 0.35 +
      dataHealthScore * 0.35 +
      infrastructureUptimeScore * 0.3
    );
    
    return parseFloat(overallScore.toFixed(1));
  }
  
  /**
   * Generate client-facing metrics
   * Simplifies technical metrics into business-friendly format
   */
  generateClientFacingMetrics(modelReliabilityScore, dataHealthScore, infrastructureUptimeScore) {
    const overallHealth = this.calculateOverallSystemHealth(
      modelReliabilityScore,
      dataHealthScore,
      infrastructureUptimeScore
    );
    
    return {
      aiModelReliability: {
        score: modelReliabilityScore,
        status: this.getStatusFromScore(modelReliabilityScore),
        label: "AI Model Reliability",
        description: "STT & Vision health (past 48h)"
      },
      dataQuality: {
        score: dataHealthScore,
        status: this.getStatusFromScore(dataHealthScore),
        label: "Data Quality",
        description: "Transcript & customer data completeness"
      },
      systemUptime: {
        score: infrastructureUptimeScore,
        status: this.getStatusFromScore(infrastructureUptimeScore),
        label: "System Uptime",
        description: "Device & cloud infrastructure"
      },
      overallSystemHealth: {
        score: overallHealth,
        status: this.getStatusFromScore(overallHealth),
        label: "Overall System Health",
        description: "Combined AI, data, and infrastructure"
      },
      summaryText: this.generateSummaryText(
        modelReliabilityScore,
        dataHealthScore,
        infrastructureUptimeScore
      )
    };
  }
  
  /**
   * Generate a summary text for client display
   */
  generateSummaryText(modelReliabilityScore, dataHealthScore, infrastructureUptimeScore) {
    const overallHealth = this.calculateOverallSystemHealth(
      modelReliabilityScore,
      dataHealthScore,
      infrastructureUptimeScore
    );
    
    // Get average response time (latency) from STT and vision metrics or use default
    let avgLatencyMs = 0;
    let latencyCount = 0;
    
    if (this.metrics && this.metrics.sttMetrics && this.metrics.sttMetrics.latencyMs) {
      avgLatencyMs += this.metrics.sttMetrics.latencyMs;
      latencyCount++;
    }
    
    if (this.metrics && this.metrics.visionMetrics && this.metrics.visionMetrics.averageInferenceTimeMs) {
      avgLatencyMs += this.metrics.visionMetrics.averageInferenceTimeMs;
      latencyCount++;
    }
    
    const avgResponseTime = latencyCount > 0
      ? (avgLatencyMs / latencyCount).toFixed(0)
      : "300"; // Default fallback
    
    // Change wording based on overall health
    let healthDesc = "excellent";
    if (overallHealth < 90) healthDesc = "good";
    if (overallHealth < 80) healthDesc = "acceptable";
    if (overallHealth < 70) healthDesc = "degraded";
    
    // Construct summary text
    return `Your AI models are operating at ${overallHealth}% reliability with ${avgResponseTime}ms average response time across all devices in the past 48h. System health is ${healthDesc}.`;
  }
  
  /**
   * Get status string from score
   */
  getStatusFromScore(score) {
    if (score >= 97) return "excellent";
    if (score >= 90) return "good";
    if (score >= 80) return "acceptable";
    if (score >= 70) return "fair";
    return "poor";
  }
  
  /**
   * Emit metrics updated event
   */
  emitMetricsUpdated() {
    // Use custom event to notify listeners that metrics have been updated
    const event = new CustomEvent('metrics-updated', { detail: this.metrics });
    window.dispatchEvent(event);
  }
  
  /**
   * Get the current metrics
   */
  getMetrics() {
    return this.metrics;
  }
  
  /**
   * Get client-facing metrics
   */
  getClientFacingMetrics() {
    return this.metrics ? this.metrics.clientFacingMetrics : null;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelMetricsCollector;
} else {
  window.ModelMetricsCollector = ModelMetricsCollector;
}