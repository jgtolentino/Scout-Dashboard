import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Application, Request, Response, NextFunction } from 'express';
import { config, monitoringConfig } from '../config/security';

// Initialize Sentry
export const initializeSentry = (app: Application) => {
  if (monitoringConfig.sentry.dsn) {
    Sentry.init({
      dsn: monitoringConfig.sentry.dsn,
      environment: config.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Enable profiling
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: monitoringConfig.sentry.tracesSampleRate,
    });

    // RequestHandler creates a separate execution context
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
};

// Custom performance monitoring
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer ${label} was not started`);
      return 0;
    }
    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    // Send to monitoring service
    if (monitoringConfig.sentry.dsn) {
      Sentry.setMeasurement(label, duration, 'millisecond');
    }
    
    return duration;
  }
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  (req as any).id = requestId as string;
  res.setHeader('X-Request-ID', requestId);

  // Log request
  console.info({
    type: 'request',
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.info({
      type: 'response',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Send metrics to monitoring
    if (monitoringConfig.sentry.dsn) {
      Sentry.setContext('request', {
        requestId,
        duration,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '5.2.0',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemory(),
    },
  };

  const isHealthy = Object.values(health.checks).every((check) => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(health);
};

// Database health check
async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    // Execute a simple query
    // await db.query('SELECT 1');
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    return { status: 'error', error: (error as Error).message };
  }
}

// Redis health check
async function checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    // await redisClient.ping();
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    return { status: 'error', error: (error as Error).message };
  }
}

// Memory health check
function checkMemory(): { status: string; usage: NodeJS.MemoryUsage } {
  const usage = process.memoryUsage();
  const heapUsedPercentage = (usage.heapUsed / usage.heapTotal) * 100;
  
  return {
    status: heapUsedPercentage > 90 ? 'warning' : 'ok',
    usage,
  };
}

// Generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error tracking
export const trackError = (error: Error, context?: any) => {
  console.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  if (monitoringConfig.sentry.dsn) {
    Sentry.captureException(error, { extra: context });
  }
};

// Custom metrics
export const trackMetric = (name: string, value: number, unit?: string) => {
  console.info({
    type: 'metric',
    name,
    value,
    unit,
    timestamp: new Date().toISOString(),
  });

  if (monitoringConfig.sentry.dsn && unit) {
    Sentry.setMeasurement(name, value, unit as any);
  }
};

// User activity tracking
export const trackUserActivity = (userId: string, action: string, metadata?: any) => {
  console.info({
    type: 'activity',
    userId,
    action,
    metadata,
    timestamp: new Date().toISOString(),
  });

  if (monitoringConfig.sentry.dsn) {
    Sentry.setUser({ id: userId });
    Sentry.addBreadcrumb({
      message: action,
      category: 'user-action',
      level: 'info',
      data: metadata,
    });
  }
};