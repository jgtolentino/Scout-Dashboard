import { NextRequest } from 'next/server';
import { 
  withApiVersion, 
  versionedResponse, 
  versionedError,
  isFeatureAvailable,
  getFeatureFlags 
} from '@/lib/api/versioning';
import { z } from 'zod';

// Version-specific schemas
const UserSchemaV1 = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
});

const UserSchemaV2 = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['user', 'admin', 'moderator', 'viewer']),
  metadata: z.object({
    department: z.string().optional(),
    location: z.string().optional(),
    preferences: z.record(z.any()).optional(),
  }).optional(),
  aiEnabled: z.boolean().default(false),
});

// GET /api/users (works with v1 and v2)
export const GET = withApiVersion(async (req: NextRequest, version) => {
  const features = getFeatureFlags(version);
  
  // Mock data - in production, fetch from database
  let users = [
    { 
      id: '1', 
      name: 'John Doe', 
      email: 'john@example.com', 
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      role: 'user',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  // Apply version-specific transformations
  if (version === 'v2') {
    users = users.map(user => ({
      ...user,
      metadata: {
        department: 'Engineering',
        location: 'Remote',
        preferences: {},
      },
      aiEnabled: features.aiChat,
      analytics: features.analytics ? {
        lastLogin: '2024-01-20T10:00:00Z',
        loginCount: 42,
      } : undefined,
    }));
  }

  // Apply filters if advanced filtering is available
  if (features.advancedFilters) {
    const role = req.nextUrl.searchParams.get('role');
    if (role) {
      users = users.filter(u => u.role === role);
    }
  }

  return Response.json(versionedResponse(users, version, {
    count: users.length,
    features,
  }));
});

// POST /api/users
export const POST = withApiVersion(async (req: NextRequest, version) => {
  try {
    const body = await req.json();
    
    // Use version-specific schema
    const schema = version === 'v2' ? UserSchemaV2 : UserSchemaV1;
    const validated = schema.parse(body);
    
    // Check feature availability
    if ('aiEnabled' in validated && !isFeatureAvailable(version, 'ai')) {
      return Response.json(
        versionedError(
          'AI features not available in this version',
          'FEATURE_NOT_AVAILABLE',
          version,
          { requestedFeature: 'ai', availableIn: ['v2'] }
        ),
        { status: 400 }
      );
    }
    
    // Mock create user - in production, save to database
    const newUser = {
      id: crypto.randomUUID(),
      ...validated,
      createdAt: new Date().toISOString(),
    };
    
    return Response.json(versionedResponse(newUser, version), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        versionedError(
          'Validation failed',
          'VALIDATION_ERROR',
          version,
          error.errors
        ),
        { status: 400 }
      );
    }
    
    return Response.json(
      versionedError(
        'Internal server error',
        'INTERNAL_ERROR',
        version
      ),
      { status: 500 }
    );
  }
});