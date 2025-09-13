import { NextRequest } from 'next/server';
import { withApiVersion, versionedResponse } from '@/lib/api/versioning';

export const GET = withApiVersion(async (req: NextRequest, version) => {
  // V2 includes more detailed health information
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: 'v2',
    services: {
      database: {
        status: 'operational',
        latency: 12,
        connections: 45,
      },
      cache: {
        status: 'operational',
        hitRate: 0.94,
        memory: '256MB',
      },
      storage: {
        status: 'operational',
        usage: '45%',
        available: '55GB',
      },
      ai: {
        status: 'operational',
        model: 'gpt-4',
        requests: 1250,
      },
    },
    metrics: {
      requestsPerMinute: 120,
      averageResponseTime: 145,
      errorRate: 0.002,
      uptime: '99.99%',
    },
  };

  return Response.json(versionedResponse(health, version));
});