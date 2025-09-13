/**
 * Health Check Endpoint for Client360 Dashboard
 * This can be served as a static file or used in serverless functions
 */

const HEALTH_CHECK_CONFIG = {
  service: 'client360-dashboard',
  version: '2.4.0',
  environment: 'production',
  checks: {
    core_files: [
      '/index.html',
      '/js/dashboard.js',
      '/data/sim/navigation.json',
      '/staticwebapp.config.json',
      '/version.json'
    ],
    data_sources: [
      '/data/sim/stores.geojson',
      '/data/simulated/kpis.json'
    ]
  }
};

/**
 * Browser-based health check function
 * Can be called from the dashboard itself for self-monitoring
 */
async function performHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    service: HEALTH_CHECK_CONFIG.service,
    version: HEALTH_CHECK_CONFIG.version,
    environment: HEALTH_CHECK_CONFIG.environment,
    status: 'healthy',
    checks: {},
    errors: []
  };

  try {
    // Check version endpoint
    const versionResponse = await fetch('/version.json');
    if (versionResponse.ok) {
      const versionData = await versionResponse.json();
      results.checks.version = {
        status: 'pass',
        version: versionData.version,
        buildDate: versionData.buildDate
      };
    } else {
      results.checks.version = {
        status: 'fail',
        error: 'Version endpoint not accessible'
      };
      results.errors.push('Version check failed');
    }

    // Check core files
    const coreFileChecks = await Promise.allSettled(
      HEALTH_CHECK_CONFIG.checks.core_files.map(async (file) => {
        const response = await fetch(file, { method: 'HEAD' });
        return {
          file,
          status: response.ok ? 'pass' : 'fail',
          statusCode: response.status
        };
      })
    );

    results.checks.core_files = coreFileChecks.map(check => 
      check.status === 'fulfilled' ? check.value : {
        file: 'unknown',
        status: 'fail',
        error: check.reason.message
      }
    );

    // Check data sources
    const dataSourceChecks = await Promise.allSettled(
      HEALTH_CHECK_CONFIG.checks.data_sources.map(async (file) => {
        const response = await fetch(file, { method: 'HEAD' });
        return {
          file,
          status: response.ok ? 'pass' : 'fail',
          statusCode: response.status
        };
      })
    );

    results.checks.data_sources = dataSourceChecks.map(check => 
      check.status === 'fulfilled' ? check.value : {
        file: 'unknown',
        status: 'fail',
        error: check.reason.message
      }
    );

    // Determine overall status
    const allChecks = [
      ...results.checks.core_files,
      ...results.checks.data_sources
    ];

    const failedChecks = allChecks.filter(check => check.status === 'fail');
    
    if (failedChecks.length > 0) {
      results.status = failedChecks.length > allChecks.length / 2 ? 'unhealthy' : 'degraded';
      results.errors.push(`${failedChecks.length} file checks failed`);
    }

    // Check if version check failed
    if (results.checks.version?.status === 'fail') {
      results.status = 'unhealthy';
    }

  } catch (error) {
    results.status = 'unhealthy';
    results.errors.push(`Health check error: ${error.message}`);
  }

  return results;
}

/**
 * Simple health check for static hosting
 * Returns basic status information
 */
function getSimpleHealthStatus() {
  return {
    timestamp: new Date().toISOString(),
    service: HEALTH_CHECK_CONFIG.service,
    version: HEALTH_CHECK_CONFIG.version,
    environment: HEALTH_CHECK_CONFIG.environment,
    status: 'healthy',
    uptime: Date.now(),
    message: 'Client360 dashboard is operational'
  };
}

// Export for use in other modules or as a static health endpoint
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    performHealthCheck,
    getSimpleHealthStatus,
    HEALTH_CHECK_CONFIG
  };
}

// For browser environment, attach to window
if (typeof window !== 'undefined') {
  window.HealthCheck = {
    performHealthCheck,
    getSimpleHealthStatus,
    config: HEALTH_CHECK_CONFIG
  };
}