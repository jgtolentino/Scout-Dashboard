import { RouteDefinition } from './generator';
import { UserSchemas, HealthSchemas, AuthSchemas, CommonSchemas, DashboardSchemas, AIChatSchemas } from './schemas';

/**
 * Define all API routes for OpenAPI documentation
 */
export const apiRoutes: RouteDefinition[] = [
  // Health endpoints
  {
    method: 'get',
    path: '/api/health',
    summary: 'Health check',
    description: 'Check the health status of the API and its dependencies',
    tags: ['Health'],
    responses: {
      200: {
        description: 'Service is healthy',
        schema: CommonSchemas.SuccessResponse(HealthSchemas.HealthCheck),
      },
      503: {
        description: 'Service is unhealthy',
        schema: CommonSchemas.ErrorResponse,
      },
    },
  },

  {
    method: 'get',
    path: '/api/v1/health',
    summary: 'Health check (v1)',
    description: 'Version 1 health check with basic information',
    tags: ['Health', 'v1'],
    responses: {
      200: {
        description: 'Service is healthy',
        schema: CommonSchemas.SuccessResponse(HealthSchemas.HealthCheck),
      },
    },
  },

  {
    method: 'get',
    path: '/api/v2/health',
    summary: 'Health check (v2)',
    description: 'Version 2 health check with detailed metrics',
    tags: ['Health', 'v2'],
    responses: {
      200: {
        description: 'Service is healthy with detailed metrics',
        schema: CommonSchemas.SuccessResponse(HealthSchemas.HealthCheck),
      },
    },
  },

  // Version management
  {
    method: 'get',
    path: '/api/versions',
    summary: 'List API versions',
    description: 'Get information about all available API versions',
    tags: ['Meta'],
    responses: {
      200: {
        description: 'List of available API versions',
        schema: CommonSchemas.VersionInfo,
      },
    },
  },

  // User management endpoints
  {
    method: 'get',
    path: '/api/users',
    summary: 'List users',
    description: 'Retrieve a paginated list of users with optional filtering',
    tags: ['Users'],
    request: {
      query: UserSchemas.UserQuery,
    },
    responses: {
      200: {
        description: 'List of users',
        schema: CommonSchemas.PaginatedResponse(UserSchemas.User),
        headers: {
          'X-Total-Count': {
            description: 'Total number of users',
            schema: { type: 'integer' },
          },
        },
      },
      400: {
        description: 'Invalid query parameters',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  {
    method: 'post',
    path: '/api/users',
    summary: 'Create user',
    description: 'Create a new user account',
    tags: ['Users'],
    request: {
      body: UserSchemas.CreateUser,
    },
    responses: {
      201: {
        description: 'User created successfully',
        schema: CommonSchemas.SuccessResponse(UserSchemas.User),
      },
      400: {
        description: 'Invalid user data',
        schema: CommonSchemas.ErrorResponse,
      },
      409: {
        description: 'User already exists',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  {
    method: 'get',
    path: '/api/users/{id}',
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID',
    tags: ['Users'],
    request: {
      params: CommonSchemas.IdParam,
    },
    responses: {
      200: {
        description: 'User details',
        schema: CommonSchemas.SuccessResponse(UserSchemas.User),
      },
      404: {
        description: 'User not found',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  {
    method: 'put',
    path: '/api/users/{id}',
    summary: 'Update user',
    description: 'Update an existing user',
    tags: ['Users'],
    request: {
      params: CommonSchemas.IdParam,
      body: UserSchemas.UpdateUser,
    },
    responses: {
      200: {
        description: 'User updated successfully',
        schema: CommonSchemas.SuccessResponse(UserSchemas.User),
      },
      400: {
        description: 'Invalid user data',
        schema: CommonSchemas.ErrorResponse,
      },
      404: {
        description: 'User not found',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  {
    method: 'delete',
    path: '/api/users/{id}',
    summary: 'Delete user',
    description: 'Delete a user account',
    tags: ['Users'],
    request: {
      params: CommonSchemas.IdParam,
    },
    responses: {
      204: {
        description: 'User deleted successfully',
      },
      404: {
        description: 'User not found',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // Authentication endpoints
  {
    method: 'post',
    path: '/api/auth/login',
    summary: 'User login',
    description: 'Authenticate user and return access token',
    tags: ['Authentication'],
    request: {
      body: AuthSchemas.LoginRequest,
    },
    responses: {
      200: {
        description: 'Login successful',
        schema: CommonSchemas.SuccessResponse(AuthSchemas.LoginResponse),
      },
      401: {
        description: 'Invalid credentials',
        schema: CommonSchemas.ErrorResponse,
      },
      429: {
        description: 'Too many login attempts',
        schema: CommonSchemas.ErrorResponse,
      },
    },
  },

  {
    method: 'post',
    path: '/api/auth/register',
    summary: 'User registration',
    description: 'Register a new user account',
    tags: ['Authentication'],
    request: {
      body: AuthSchemas.RegisterRequest,
    },
    responses: {
      201: {
        description: 'Registration successful',
        schema: CommonSchemas.SuccessResponse(AuthSchemas.LoginResponse),
      },
      400: {
        description: 'Invalid registration data',
        schema: CommonSchemas.ErrorResponse,
      },
      409: {
        description: 'User already exists',
        schema: CommonSchemas.ErrorResponse,
      },
    },
  },

  {
    method: 'post',
    path: '/api/auth/refresh',
    summary: 'Refresh token',
    description: 'Refresh the access token using a refresh token',
    tags: ['Authentication'],
    request: {
      body: AuthSchemas.RefreshRequest,
    },
    responses: {
      200: {
        description: 'Token refreshed successfully',
        schema: CommonSchemas.SuccessResponse(AuthSchemas.LoginResponse),
      },
      401: {
        description: 'Invalid refresh token',
        schema: CommonSchemas.ErrorResponse,
      },
    },
  },

  {
    method: 'post',
    path: '/api/auth/logout',
    summary: 'User logout',
    description: 'Logout user and invalidate tokens',
    tags: ['Authentication'],
    responses: {
      200: {
        description: 'Logout successful',
        schema: CommonSchemas.SuccessResponse({ message: 'Logged out successfully' }),
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // Dashboard/Analytics endpoints (v2 only)
  {
    method: 'get',
    path: '/api/v2/dashboard',
    summary: 'Get dashboard data',
    description: 'Retrieve dashboard data including KPIs and analytics',
    tags: ['Dashboard', 'v2'],
    request: {
      query: DashboardSchemas.AnalyticsQuery,
    },
    responses: {
      200: {
        description: 'Dashboard data',
        schema: CommonSchemas.SuccessResponse(DashboardSchemas.DashboardData),
      },
      400: {
        description: 'Invalid query parameters',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  {
    method: 'get',
    path: '/api/v2/analytics',
    summary: 'Get analytics data',
    description: 'Retrieve detailed analytics and metrics',
    tags: ['Analytics', 'v2'],
    request: {
      query: DashboardSchemas.AnalyticsQuery,
    },
    responses: {
      200: {
        description: 'Analytics data',
        schema: CommonSchemas.SuccessResponse({
          metrics: DashboardSchemas.KPIData.array(),
          timeSeries: DashboardSchemas.TimeSeriesPoint.array(),
        }),
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // AI Chat endpoints (v2 only)
  {
    method: 'post',
    path: '/api/v2/ai/chat',
    summary: 'AI chat completion',
    description: 'Send a message to the AI chat system and get a response',
    tags: ['AI', 'v2'],
    request: {
      body: AIChatSchemas.ChatRequest,
    },
    responses: {
      200: {
        description: 'AI response',
        schema: CommonSchemas.SuccessResponse(AIChatSchemas.ChatResponse),
      },
      400: {
        description: 'Invalid chat request',
        schema: CommonSchemas.ErrorResponse,
      },
      429: {
        description: 'Rate limit exceeded',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  {
    method: 'post',
    path: '/api/v2/ai/sql',
    summary: 'Natural language to SQL',
    description: 'Convert natural language queries to SQL and execute them',
    tags: ['AI', 'v2'],
    request: {
      body: AIChatSchemas.SQLQueryRequest,
    },
    responses: {
      200: {
        description: 'SQL query and results',
        schema: CommonSchemas.SuccessResponse(AIChatSchemas.SQLQueryResponse),
      },
      400: {
        description: 'Invalid query request',
        schema: CommonSchemas.ErrorResponse,
      },
      403: {
        description: 'Query not allowed',
        schema: CommonSchemas.ErrorResponse,
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // Data migration endpoint
  {
    method: 'post',
    path: '/api/migration',
    summary: 'Migrate data between API versions',
    description: 'Transform data from one API version format to another',
    tags: ['Migration'],
    request: {
      body: {
        data: 'any',
        fromVersion: 'string',
        toVersion: 'string',
      },
    },
    responses: {
      200: {
        description: 'Migration successful',
        schema: {
          success: 'boolean',
          fromVersion: 'string',
          toVersion: 'string',
          originalData: 'any',
          migratedData: 'any',
          timestamp: 'string',
        },
      },
      400: {
        description: 'Invalid migration request',
        schema: CommonSchemas.ErrorResponse,
      },
    },
  },

  // Error testing endpoints (development only)
  {
    method: 'get',
    path: '/api/monitoring/sentry-example',
    summary: 'Sentry error testing',
    description: 'Test endpoint for Sentry error tracking (development only)',
    tags: ['Monitoring'],
    request: {
      query: {
        scenario: 'string?',
      },
    },
    responses: {
      200: {
        description: 'Test response',
        schema: { message: 'string', scenarios: 'array' },
      },
      500: {
        description: 'Test error response',
        schema: CommonSchemas.ErrorResponse,
      },
    },
  },
];