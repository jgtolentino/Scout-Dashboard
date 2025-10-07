import { NextRequest } from 'next/server';
import { API_VERSIONS, DEFAULT_VERSION, LATEST_VERSION } from '@/lib/api/versioning';

// GET /api/versions - List all API versions
export async function GET(req: NextRequest) {
  const versions = Object.entries(API_VERSIONS).map(([version, config]) => ({
    version,
    ...config,
    current: version === DEFAULT_VERSION,
    latest: version === LATEST_VERSION,
  }));

  return Response.json({
    versions,
    default: DEFAULT_VERSION,
    latest: LATEST_VERSION,
    timestamp: new Date().toISOString(),
  });
}