/**
 * Telemetry and Monitoring Module
 * 
 * This module provides instrumentation for application monitoring, 
 * performance tracking, and error reporting using Application Insights.
 */

// Simulation mode for development environments
const SIMULATION_MODE = process.env.NODE_ENV !== 'production';

// Configuration for telemetry
const config = {
  // Application Insights instrumentation key
  instrumentationKey: process.env.REACT_APP_APPINSIGHTS_KEY || '00000000-0000-0000-0000-000000000000',
  
  // Enable/disable telemetry
  enabled: process.env.REACT_APP_ENABLE_TELEMETRY !== 'false',
  
  // Minimum logging level
  logLevel: process.env.REACT_APP_LOG_LEVEL || 'info',
  
  // Sample rate for performance metrics (0-100)
  performanceSampleRate: parseInt(process.env.REACT_APP_PERF_SAMPLE_RATE || '100'),
  
  // Performance thresholds (in milliseconds)
  thresholds: {
    pageLoadTime: parseInt(process.env.REACT_APP_THRESHOLD_PAGE_LOAD || '2000'),
    apiResponseTime: parseInt(process.env.REACT_APP_THRESHOLD_API_RESPONSE || '500'),
    renderTime: parseInt(process.env.REACT_APP_THRESHOLD_RENDER || '100'),
    interactionTime: parseInt(process.env.REACT_APP_THRESHOLD_INTERACTION || '200'),
  }
};

// Initialize telemetry client
let client = null;

/**
 * Initialize the telemetry system
 */
function initialize() {
  if (SIMULATION_MODE) {
    console.log('Telemetry running in simulation mode');
    client = createSimulatedClient();
    return;
  }
  
  if (!config.enabled) {
    console.log('Telemetry is disabled');
    return;
  }
  
  try {
    // In a real implementation, this would initialize Application Insights
    // For example:
    // const { ApplicationInsights } = require('@microsoft/applicationinsights-web');
    // client = new ApplicationInsights({
    //   config: {
    //     instrumentationKey: config.instrumentationKey,
    //     enableAutoRouteTracking: true,
    //   }
    // });
    // client.loadAppInsights();
    // client.trackPageView();
    
    // For this example, create a simulated client
    client = createSimulatedClient();
    
    console.log('Telemetry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize telemetry:', error);
  }
}

/**
 * Create a simulated telemetry client for development
 */
function createSimulatedClient() {
  return {
    trackEvent: (name, properties) => {
      console.log(`[Telemetry Event] ${name}`, properties);
    },
    trackException: (exception, properties) => {
      console.error(`[Telemetry Exception] ${exception.message}`, properties);
    },
    trackMetric: (name, value, properties) => {
      console.log(`[Telemetry Metric] ${name}: ${value}`, properties);
    },
    trackTrace: (message, severity, properties) => {
      console.log(`[Telemetry Trace] [${severity}] ${message}`, properties);
    },
    trackPageView: (name, url, properties, measurements) => {
      console.log(`[Telemetry PageView] ${name} - ${url}`, properties, measurements);
    },
    flush: () => {
      console.log('[Telemetry] Flushing data');
    }
  };
}

/**
 * Track a custom event
 * @param {string} name - Event name
 * @param {Object} properties - Custom properties
 */
function trackEvent(name, properties = {}) {
  if (!client || !config.enabled) return;
  
  try {
    client.trackEvent(name, {
      timestamp: new Date().toISOString(),
      ...properties
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Track an exception
 * @param {Error} exception - The exception to track
 * @param {Object} properties - Custom properties
 */
function trackException(exception, properties = {}) {
  if (!client || !config.enabled) return;
  
  try {
    client.trackException({ 
      exception,
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
  } catch (error) {
    console.error('Error tracking exception:', error);
  }
}

/**
 * Track a performance metric
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} properties - Custom properties
 */
function trackMetric(name, value, properties = {}) {
  if (!client || !config.enabled) return;
  
  // Sample metrics based on configured rate
  if (Math.random() * 100 > config.performanceSampleRate) {
    return;
  }
  
  try {
    // Check against thresholds
    let thresholdExceeded = false;
    let thresholdValue = null;
    
    if (name === 'PageLoadTime' && value > config.thresholds.pageLoadTime) {
      thresholdExceeded = true;
      thresholdValue = config.thresholds.pageLoadTime;
    } else if (name === 'ApiResponseTime' && value > config.thresholds.apiResponseTime) {
      thresholdExceeded = true;
      thresholdValue = config.thresholds.apiResponseTime;
    } else if (name === 'RenderTime' && value > config.thresholds.renderTime) {
      thresholdExceeded = true;
      thresholdValue = config.thresholds.renderTime;
    } else if (name === 'InteractionTime' && value > config.thresholds.interactionTime) {
      thresholdExceeded = true;
      thresholdValue = config.thresholds.interactionTime;
    }
    
    // Track the metric
    client.trackMetric(name, value, {
      timestamp: new Date().toISOString(),
      thresholdExceeded: thresholdExceeded ? 'true' : 'false',
      thresholdValue: thresholdValue,
      ...properties
    });
    
    // For threshold violations, also track as an event
    if (thresholdExceeded) {
      trackEvent(`${name}ThresholdExceeded`, {
        metricName: name,
        metricValue: value,
        threshold: thresholdValue,
        ...properties
      });
    }
  } catch (error) {
    console.error('Error tracking metric:', error);
  }
}

/**
 * Track a page view
 * @param {string} name - Page name
 * @param {string} url - Page URL
 * @param {Object} properties - Custom properties
 * @param {Object} measurements - Custom measurements
 */
function trackPageView(name, url, properties = {}, measurements = {}) {
  if (!client || !config.enabled) return;
  
  try {
    client.trackPageView({
      name,
      uri: url,
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      },
      measurements
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Performance monitoring for components
 * @param {string} componentName - The component being measured
 * @returns {Object} - Timing methods
 */
function measureComponent(componentName) {
  if (!config.enabled) {
    return { start: () => {}, end: () => {} };
  }
  
  let startTime = null;
  
  return {
    start: () => {
      startTime = performance.now();
    },
    end: (properties = {}) => {
      if (!startTime) return;
      
      const duration = performance.now() - startTime;
      trackMetric(`${componentName}RenderTime`, duration, properties);
      startTime = null;
    }
  };
}

/**
 * Track a user interaction
 * @param {string} action - Interaction name
 * @param {Object} properties - Custom properties
 */
function trackInteraction(action, properties = {}) {
  trackEvent(`Interaction:${action}`, properties);
}

/**
 * Create a custom dimension context for tracking
 * @param {Object} dimensions - Custom dimensions to include in all events
 * @returns {Object} - Telemetry methods with context
 */
function createContext(dimensions = {}) {
  return {
    trackEvent: (name, properties = {}) => trackEvent(name, { ...dimensions, ...properties }),
    trackException: (exception, properties = {}) => trackException(exception, { ...dimensions, ...properties }),
    trackMetric: (name, value, properties = {}) => trackMetric(name, value, { ...dimensions, ...properties }),
    trackPageView: (name, url, properties = {}, measurements = {}) => 
      trackPageView(name, url, { ...dimensions, ...properties }, measurements),
    trackInteraction: (action, properties = {}) => trackInteraction(action, { ...dimensions, ...properties })
  };
}

// Error boundary for React components
class TelemetryErrorBoundary extends Error {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    trackException(error, {
      component: this.props.componentName || 'Unknown',
      errorInfo: JSON.stringify(errorInfo)
    });
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong. Please try again later.</div>;
    }
    
    return this.props.children;
  }
}

// Export the module
module.exports = {
  initialize,
  trackEvent,
  trackException,
  trackMetric,
  trackPageView,
  trackInteraction,
  measureComponent,
  createContext,
  TelemetryErrorBoundary,
  flush: () => client && client.flush(),
  config
};