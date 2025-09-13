import { NextRequest } from 'next/server';

// API versioning utilities
export const API_VERSIONS = {
  v1: {
    supported: true,
    deprecated: false,
    sunset: null,
    features: ['basic', 'auth', 'data'],
  },
  v2: {
    supported: true,
    deprecated: false,
    sunset: null,
    features: ['basic', 'auth', 'data', 'analytics', 'ai'],
  },
  legacy: {
    supported: true,
    deprecated: true,
    sunset: '2024-12-31',
    features: ['basic'],
  },
} as const;

export type ApiVersion = keyof typeof API_VERSIONS;

export const DEFAULT_VERSION: ApiVersion = 'v1';
export const LATEST_VERSION: ApiVersion = 'v2';

/**
 * Get API version from request
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  // Check header first
  const versionHeader = request.headers.get('x-api-version') || request.headers.get('api-version');
  if (versionHeader && versionHeader in API_VERSIONS) {
    return versionHeader as ApiVersion;
  }

  // Check URL path
  const pathname = request.nextUrl.pathname;
  const match = pathname.match(/^\/api\/(v\d+|legacy)\//);
  if (match && match[1] in API_VERSIONS) {
    return match[1] as ApiVersion;
  }

  return DEFAULT_VERSION;
}

/**
 * Check if a feature is available in a version
 */
export function isFeatureAvailable(version: ApiVersion, feature: string): boolean {
  const versionConfig = API_VERSIONS[version];
  return versionConfig.features.includes(feature);
}

/**
 * Version-aware response wrapper
 */
export function versionedResponse<T>(
  data: T,
  version: ApiVersion,
  metadata?: Record<string, any>
) {
  const versionConfig = API_VERSIONS[version];
  
  const response = {
    version,
    data,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      deprecated: versionConfig.deprecated,
      ...(versionConfig.deprecated && { sunset: versionConfig.sunset }),
    },
  };

  return response;
}

/**
 * Version-specific error response
 */
export function versionedError(
  error: string,
  code: string,
  version: ApiVersion,
  details?: any
) {
  const versionConfig = API_VERSIONS[version];
  
  return {
    version,
    error: {
      code,
      message: error,
      ...(details && { details }),
    },
    metadata: {
      timestamp: new Date().toISOString(),
      deprecated: versionConfig.deprecated,
      ...(versionConfig.deprecated && { sunset: versionConfig.sunset }),
    },
  };
}

/**
 * Decorator for version-specific route handlers
 */
export function withApiVersion(
  handler: (req: NextRequest, version: ApiVersion) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const version = getApiVersion(req);
    
    // Check if version is supported
    if (!API_VERSIONS[version]?.supported) {
      return Response.json(
        versionedError(
          'Unsupported API version',
          'VERSION_NOT_SUPPORTED',
          DEFAULT_VERSION,
          { requestedVersion: version, supportedVersions: Object.keys(API_VERSIONS) }
        ),
        { status: 400 }
      );
    }

    // Add version headers
    const response = await handler(req, version);
    response.headers.set('X-API-Version', version);
    response.headers.set('X-API-Latest-Version', LATEST_VERSION);
    
    // Add deprecation headers if needed
    const versionConfig = API_VERSIONS[version];
    if (versionConfig.deprecated) {
      response.headers.set('X-API-Deprecated', 'true');
      response.headers.set('X-API-Sunset', versionConfig.sunset || 'TBD');
      response.headers.set(
        'Deprecation',
        `version="${version}"; sunset="${versionConfig.sunset || 'TBD'}"`
      );
    }

    return response;
  };
}

/**
 * Version migration helper
 */
export function migrateRequestData(
  data: any,
  fromVersion: ApiVersion,
  toVersion: ApiVersion
): any {
  // Define migration rules between versions
  const migrations: Record<string, Record<string, (data: any) => any>> = {
    'legacy-v1': {
      default: (data) => ({
        ...data,
        // Add default fields for v1
        version: 'v1',
        migrated: true,
      }),
    },
    'v1-v2': {
      default: (data) => ({
        ...data,
        // Transform data structure for v2
        metadata: {
          version: 'v2',
          migrated: true,
          originalVersion: 'v1',
        },
      }),
    },
  };

  const migrationKey = `${fromVersion}-${toVersion}`;
  const migration = migrations[migrationKey];
  
  if (migration && migration.default) {
    return migration.default(data);
  }

  return data;
}

/**
 * Feature flag based on version
 */
export function getFeatureFlags(version: ApiVersion): Record<string, boolean> {
  const flags: Record<string, boolean> = {
    aiChat: false,
    analytics: false,
    advancedFilters: false,
    realtimeUpdates: false,
    batchOperations: false,
  };

  switch (version) {
    case 'v2':
      flags.aiChat = true;
      flags.analytics = true;
      flags.advancedFilters = true;
      flags.realtimeUpdates = true;
      flags.batchOperations = true;
      break;
    case 'v1':
      flags.advancedFilters = true;
      flags.batchOperations = true;
      break;
    case 'legacy':
      // Minimal features for legacy
      break;
  }

  return flags;
}