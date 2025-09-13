// OpenTelemetry initialization for Brand Performance API
// This must be imported before any other modules to ensure proper instrumentation

'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { AzureMonitorTraceExporter } = require('@azure/monitor-opentelemetry-exporter');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Environment configuration
const APPINSIGHTS_CONNECTION_STRING = process.env.APPINSIGHTS_CONNECTION_STRING;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_VERSION = process.env.API_VERSION || '1.0.0';

// Create resource with service information
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'brands-api',
  [SemanticResourceAttributes.SERVICE_VERSION]: API_VERSION,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: NODE_ENV,
});

// Initialize telemetry only if connection string is available
let sdk = null;

if (APPINSIGHTS_CONNECTION_STRING) {
  try {
    console.log('🔍 Initializing OpenTelemetry with Application Insights...');
    
    const exporter = new AzureMonitorTraceExporter({
      connectionString: APPINSIGHTS_CONNECTION_STRING
    });

    sdk = new NodeSDK({
      resource,
      traceExporter: exporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable file system instrumentation to reduce noise
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          // Configure HTTP instrumentation
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingRequestHook: (req) => {
              // Ignore health check requests to reduce telemetry noise
              return req.url === '/health' || req.url === '/api/status';
            },
          },
          // Configure Express instrumentation
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          // Configure Redis instrumentation
          '@opentelemetry/instrumentation-ioredis': {
            enabled: true,
          },
        }),
      ],
    });

    sdk.start();
    console.log('✅ OpenTelemetry initialized successfully');
    
  } catch (error) {
    console.warn('⚠️ Failed to initialize OpenTelemetry:', error.message);
    sdk = null;
  }
} else {
  console.log('ℹ️ OpenTelemetry disabled (missing APPINSIGHTS_CONNECTION_STRING)');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  if (sdk) {
    console.log('🛑 Shutting down OpenTelemetry...');
    sdk.shutdown()
      .then(() => console.log('✅ OpenTelemetry shutdown complete'))
      .catch(console.error)
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  if (sdk) {
    console.log('🛑 Shutting down OpenTelemetry...');
    sdk.shutdown()
      .then(() => console.log('✅ OpenTelemetry shutdown complete'))
      .catch(console.error)
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

module.exports = { sdk };
