import { NextRequest } from 'next/server';
import { OpenAPIGenerator } from '@/lib/openapi/generator';
import { apiRoutes } from '@/lib/openapi/routes';

/**
 * GET /api/docs - Generate OpenAPI documentation
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';
  const version = searchParams.get('version') || 'all';

  try {
    // Create OpenAPI generator
    const generator = new OpenAPIGenerator({
      title: 'Scout Dashboard API',
      version: '5.0.0',
      description: `
        Scout Dashboard v5.0 API with Medallion Architecture
        
        This API provides access to enterprise data platform features including:
        - User management and authentication
        - Dashboard analytics and KPIs
        - AI-powered chat and natural language queries
        - Real-time data operations
        
        ## Versioning
        
        The API supports multiple versions:
        - **v1**: Stable version with core features
        - **v2**: Latest version with AI and advanced analytics
        - **legacy**: Deprecated version (sunset 2024-12-31)
        
        Specify version via URL path (\`/api/v1/...\`) or header (\`API-Version: v2\`).
        
        ## Authentication
        
        Most endpoints require authentication via JWT bearer token:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`
        
        ## Rate Limits
        
        - **v1**: 100 requests per 15 minutes
        - **v2**: 200 requests per 15 minutes  
        - **legacy**: 50 requests per 15 minutes
        
        ## Error Handling
        
        All errors follow a consistent format:
        \`\`\`json
        {
          "version": "v1",
          "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {}
          },
          "metadata": {
            "timestamp": "2024-01-20T10:00:00Z",
            "requestId": "uuid"
          }
        }
        \`\`\`
      `,
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://scout-dashboard.vercel.app',
          description: 'Production server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'System health and monitoring endpoints',
        },
        {
          name: 'Meta',
          description: 'API metadata and version information',
        },
        {
          name: 'Authentication',
          description: 'User authentication and authorization',
        },
        {
          name: 'Users',
          description: 'User management operations',
        },
        {
          name: 'Dashboard',
          description: 'Dashboard data and KPIs (v2)',
        },
        {
          name: 'Analytics',
          description: 'Analytics and reporting (v2)',
        },
        {
          name: 'AI',
          description: 'AI-powered features (v2)',
        },
        {
          name: 'Migration',
          description: 'Version migration utilities',
        },
        {
          name: 'Monitoring',
          description: 'Development and monitoring tools',
        },
        {
          name: 'v1',
          description: 'Version 1 specific endpoints',
        },
        {
          name: 'v2',
          description: 'Version 2 specific endpoints',
        },
      ],
      security: [
        {
          bearerAuth: [],
        },
      ],
    });

    // Filter routes by version if specified
    let routes = apiRoutes;
    if (version !== 'all') {
      routes = apiRoutes.filter(route => {
        if (version === 'v1') {
          return !route.path.includes('/v2/') && !route.tags?.includes('v2');
        } else if (version === 'v2') {
          return !route.path.includes('/v1/') || route.tags?.includes('v2');
        } else if (version === 'legacy') {
          return route.path.includes('/legacy/') || route.tags?.includes('legacy');
        }
        return true;
      });
    }

    // Add routes to generator
    generator.addRoutes(routes);

    // Generate documentation
    const spec = generator.generate();

    // Add version-specific info if filtered
    if (version !== 'all') {
      spec.info.title += ` (${version.toUpperCase()})`;
      spec.info.description = `API documentation for ${version.toUpperCase()} endpoints only.\n\n${spec.info.description}`;
    }

    // Return in requested format
    if (format === 'yaml') {
      return new Response(generator.toYAML(), {
        headers: {
          'Content-Type': 'text/yaml',
          'X-API-Version': version,
        },
      });
    }

    return Response.json(spec, {
      headers: {
        'X-API-Version': version,
        'X-Generated-At': new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI docs:', error);
    
    return Response.json(
      {
        error: 'Failed to generate API documentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/docs - Validate OpenAPI schema
 */
export async function POST(req: NextRequest) {
  try {
    const schema = await req.json();
    
    // Basic validation - in production you might want to use a proper OpenAPI validator
    if (!schema.openapi || !schema.info || !schema.paths) {
      return Response.json(
        {
          valid: false,
          errors: ['Invalid OpenAPI schema structure'],
        },
        { status: 400 }
      );
    }

    return Response.json({
      valid: true,
      version: schema.openapi,
      title: schema.info.title,
      pathCount: Object.keys(schema.paths).length,
    });
  } catch (error) {
    return Response.json(
      {
        valid: false,
        errors: ['Invalid JSON'],
      },
      { status: 400 }
    );
  }
}