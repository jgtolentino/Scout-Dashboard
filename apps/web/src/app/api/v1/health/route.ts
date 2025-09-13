import { NextRequest } from 'next/server';
import { withApiVersion, versionedResponse } from '@/lib/api/versioning';

export const GET = withApiVersion(async (req: NextRequest, version) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: 'v1',
    services: {
      database: 'operational',
      cache: 'operational',
      storage: 'operational',
    },
  };

  return Response.json(versionedResponse(health, version));
});