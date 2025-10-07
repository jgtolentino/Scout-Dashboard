import { z } from 'zod';

/**
 * User schemas for API documentation
 */
export const UserSchemas = {
  // Base user schema
  User: z.object({
    id: z.string().uuid().describe('Unique user identifier'),
    name: z.string().min(1).max(100).describe('User full name'),
    email: z.string().email().describe('User email address'),
    role: z.enum(['user', 'admin', 'moderator', 'viewer']).describe('User role'),
    createdAt: z.string().datetime().describe('User creation timestamp'),
    updatedAt: z.string().datetime().describe('Last update timestamp'),
  }),

  // Create user request
  CreateUser: z.object({
    name: z.string().min(1).max(100).describe('User full name'),
    email: z.string().email().describe('User email address'),
    role: z.enum(['user', 'admin', 'moderator', 'viewer']).default('user').describe('User role'),
    metadata: z.object({
      department: z.string().optional().describe('User department'),
      location: z.string().optional().describe('User location'),
      preferences: z.record(z.any()).optional().describe('User preferences'),
    }).optional().describe('Additional user metadata'),
  }),

  // Update user request
  UpdateUser: z.object({
    name: z.string().min(1).max(100).optional().describe('User full name'),
    email: z.string().email().optional().describe('User email address'),
    role: z.enum(['user', 'admin', 'moderator', 'viewer']).optional().describe('User role'),
    metadata: z.object({
      department: z.string().optional(),
      location: z.string().optional(),
      preferences: z.record(z.any()).optional(),
    }).optional().describe('Additional user metadata'),
  }),

  // User query parameters
  UserQuery: z.object({
    role: z.enum(['user', 'admin', 'moderator', 'viewer']).optional().describe('Filter by role'),
    department: z.string().optional().describe('Filter by department'),
    search: z.string().optional().describe('Search in name or email'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    limit: z.coerce.number().min(1).max(100).default(20).describe('Items per page'),
  }),
};

/**
 * Health check schemas
 */
export const HealthSchemas = {
  HealthCheck: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).describe('Overall system status'),
    timestamp: z.string().datetime().describe('Health check timestamp'),
    uptime: z.number().describe('System uptime in seconds'),
    environment: z.string().describe('Current environment'),
    version: z.string().describe('API version'),
    services: z.record(
      z.union([
        z.string(),
        z.object({
          status: z.string(),
          latency: z.number().optional(),
          connections: z.number().optional(),
          memory: z.string().optional(),
          usage: z.string().optional(),
          available: z.string().optional(),
          hitRate: z.number().optional(),
          model: z.string().optional(),
          requests: z.number().optional(),
        }),
      ])
    ).describe('Service statuses'),
    metrics: z.object({
      requestsPerMinute: z.number(),
      averageResponseTime: z.number(),
      errorRate: z.number(),
      uptime: z.string(),
    }).optional().describe('Performance metrics (v2 only)'),
  }),
};

/**
 * Authentication schemas
 */
export const AuthSchemas = {
  LoginRequest: z.object({
    email: z.string().email().describe('User email'),
    password: z.string().min(8).describe('User password'),
    rememberMe: z.boolean().optional().default(false).describe('Remember login'),
  }),

  LoginResponse: z.object({
    token: z.string().describe('JWT access token'),
    refreshToken: z.string().describe('Refresh token'),
    user: UserSchemas.User.describe('User information'),
    expiresIn: z.number().describe('Token expiration time in seconds'),
  }),

  RefreshRequest: z.object({
    refreshToken: z.string().describe('Refresh token'),
  }),

  RegisterRequest: z.object({
    name: z.string().min(1).max(100).describe('User full name'),
    email: z.string().email().describe('User email'),
    password: z.string().min(8).describe('Password (min 8 characters)'),
    confirmPassword: z.string().describe('Password confirmation'),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

/**
 * Common response schemas
 */
export const CommonSchemas = {
  // Success response wrapper
  SuccessResponse: <T extends z.ZodType<any>>(dataSchema: T) =>
    z.object({
      version: z.string().describe('API version used'),
      data: dataSchema.describe('Response data'),
      metadata: z.object({
        timestamp: z.string().datetime().describe('Response timestamp'),
        deprecated: z.boolean().optional().describe('Version deprecation status'),
        sunset: z.string().optional().describe('Deprecation sunset date'),
      }),
    }),

  // Error response
  ErrorResponse: z.object({
    version: z.string().describe('API version used'),
    error: z.object({
      code: z.string().describe('Error code'),
      message: z.string().describe('Human-readable error message'),
      details: z.any().optional().describe('Additional error details'),
    }),
    metadata: z.object({
      timestamp: z.string().datetime().describe('Error timestamp'),
      requestId: z.string().optional().describe('Request ID for tracking'),
    }),
  }),

  // Pagination metadata
  PaginationMeta: z.object({
    page: z.number().describe('Current page number'),
    limit: z.number().describe('Items per page'),
    total: z.number().describe('Total number of items'),
    totalPages: z.number().describe('Total number of pages'),
    hasNext: z.boolean().describe('Whether there is a next page'),
    hasPrev: z.boolean().describe('Whether there is a previous page'),
  }),

  // Paginated response
  PaginatedResponse: <T extends z.ZodType<any>>(dataSchema: T) =>
    z.object({
      version: z.string(),
      data: z.array(dataSchema),
      pagination: CommonSchemas.PaginationMeta,
      metadata: z.object({
        timestamp: z.string().datetime(),
        deprecated: z.boolean().optional(),
      }),
    }),

  // Version info
  VersionInfo: z.object({
    versions: z.array(
      z.object({
        version: z.string().describe('Version identifier'),
        supported: z.boolean().describe('Whether version is supported'),
        deprecated: z.boolean().describe('Whether version is deprecated'),
        sunset: z.string().optional().describe('Sunset date if deprecated'),
        features: z.array(z.string()).describe('Available features'),
        current: z.boolean().optional().describe('Whether this is the current version'),
        latest: z.boolean().optional().describe('Whether this is the latest version'),
      })
    ),
    default: z.string().describe('Default version'),
    latest: z.string().describe('Latest version'),
    timestamp: z.string().datetime().describe('Response timestamp'),
  }),

  // ID parameter
  IdParam: z.object({
    id: z.string().uuid().describe('Resource identifier'),
  }),

  // Common query parameters
  CommonQuery: z.object({
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    limit: z.coerce.number().min(1).max(100).default(20).describe('Items per page'),
    sort: z.string().optional().describe('Field to sort by'),
    order: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),
    search: z.string().optional().describe('Search query'),
  }),
};

/**
 * Dashboard/Analytics schemas
 */
export const DashboardSchemas = {
  // KPI data
  KPIData: z.object({
    name: z.string().describe('KPI name'),
    value: z.number().describe('Current value'),
    change: z.number().describe('Change from previous period'),
    changePercent: z.number().describe('Percentage change'),
    trend: z.enum(['up', 'down', 'stable']).describe('Trend direction'),
    target: z.number().optional().describe('Target value'),
  }),

  // Analytics query
  AnalyticsQuery: z.object({
    dateFrom: z.string().date().describe('Start date'),
    dateTo: z.string().date().describe('End date'),
    granularity: z.enum(['hour', 'day', 'week', 'month']).default('day').describe('Data granularity'),
    metrics: z.array(z.string()).optional().describe('Specific metrics to include'),
    filters: z.record(z.any()).optional().describe('Additional filters'),
  }),

  // Time series data point
  TimeSeriesPoint: z.object({
    timestamp: z.string().datetime().describe('Data point timestamp'),
    value: z.number().describe('Metric value'),
    metadata: z.record(z.any()).optional().describe('Additional metadata'),
  }),

  // Dashboard data
  DashboardData: z.object({
    kpis: z.array(DashboardSchemas.KPIData).describe('Key performance indicators'),
    timeSeries: z.record(
      z.array(DashboardSchemas.TimeSeriesPoint)
    ).describe('Time series data by metric'),
    summary: z.object({
      totalUsers: z.number(),
      totalRevenue: z.number(),
      conversionRate: z.number(),
      averageSessionDuration: z.number(),
    }).describe('Summary statistics'),
  }),
};

/**
 * AI Chat schemas (v2 only)
 */
export const AIChatSchemas = {
  ChatMessage: z.object({
    id: z.string().uuid().describe('Message ID'),
    role: z.enum(['user', 'assistant', 'system']).describe('Message role'),
    content: z.string().describe('Message content'),
    timestamp: z.string().datetime().describe('Message timestamp'),
    metadata: z.object({
      model: z.string().optional().describe('AI model used'),
      tokens: z.number().optional().describe('Token count'),
      confidence: z.number().optional().describe('Response confidence'),
    }).optional(),
  }),

  ChatRequest: z.object({
    message: z.string().min(1).max(4000).describe('User message'),
    context: z.object({
      conversationId: z.string().uuid().optional().describe('Conversation ID'),
      userId: z.string().uuid().describe('User ID'),
      sessionData: z.record(z.any()).optional().describe('Session context'),
    }),
    options: z.object({
      model: z.string().optional().describe('Preferred AI model'),
      temperature: z.number().min(0).max(2).optional().describe('Response creativity'),
      maxTokens: z.number().min(1).max(4000).optional().describe('Maximum response length'),
    }).optional(),
  }),

  ChatResponse: z.object({
    message: AIChatSchemas.ChatMessage.describe('AI response message'),
    conversation: z.object({
      id: z.string().uuid().describe('Conversation ID'),
      messageCount: z.number().describe('Total messages in conversation'),
    }),
    usage: z.object({
      promptTokens: z.number().describe('Input tokens used'),
      completionTokens: z.number().describe('Output tokens generated'),
      totalTokens: z.number().describe('Total tokens used'),
    }),
  }),

  // SQL query request (NL-to-SQL)
  SQLQueryRequest: z.object({
    query: z.string().min(1).describe('Natural language query'),
    context: z.object({
      schema: z.string().optional().describe('Database schema context'),
      tables: z.array(z.string()).optional().describe('Available tables'),
      userId: z.string().uuid().describe('User ID for permissions'),
    }),
    options: z.object({
      limit: z.number().min(1).max(1000).default(100).describe('Result limit'),
      explain: z.boolean().default(false).describe('Include query explanation'),
    }).optional(),
  }),

  SQLQueryResponse: z.object({
    sql: z.string().describe('Generated SQL query'),
    explanation: z.string().optional().describe('Query explanation'),
    results: z.array(z.record(z.any())).describe('Query results'),
    metadata: z.object({
      executionTime: z.number().describe('Execution time in ms'),
      rowCount: z.number().describe('Number of rows returned'),
      fromCache: z.boolean().describe('Whether results were cached'),
    }),
  }),
};