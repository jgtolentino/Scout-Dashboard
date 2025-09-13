import { NextRequest } from 'next/server';
import { migrateRequestData, ApiVersion } from '@/lib/api/versioning';

// POST /api/migration - Migrate data between API versions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, fromVersion, toVersion } = body;

    if (!data || !fromVersion || !toVersion) {
      return Response.json(
        {
          error: 'Missing required fields',
          required: ['data', 'fromVersion', 'toVersion'],
        },
        { status: 400 }
      );
    }

    // Validate versions
    const validVersions: ApiVersion[] = ['legacy', 'v1', 'v2'];
    if (!validVersions.includes(fromVersion) || !validVersions.includes(toVersion)) {
      return Response.json(
        {
          error: 'Invalid version specified',
          validVersions,
        },
        { status: 400 }
      );
    }

    // Perform migration
    const migratedData = migrateRequestData(data, fromVersion, toVersion);

    return Response.json({
      success: true,
      fromVersion,
      toVersion,
      originalData: data,
      migratedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}