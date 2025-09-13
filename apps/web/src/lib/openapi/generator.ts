import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';
import type { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI generator configuration
 */
export interface OpenAPIConfig {
  title: string;
  version: string;
  description?: string;
  servers?: OpenAPIV3.ServerObject[];
  tags?: OpenAPIV3.TagObject[];
  security?: OpenAPIV3.SecurityRequirementObject[];
}

/**
 * Route definition for OpenAPI
 */
export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  request?: {
    params?: z.ZodType<any>;
    query?: z.ZodType<any>;
    body?: z.ZodType<any>;
    headers?: z.ZodType<any>;
  };
  responses: {
    [statusCode: number]: {
      description: string;
      schema?: z.ZodType<any>;
      headers?: Record<string, OpenAPIV3.HeaderObject>;
    };
  };
  security?: OpenAPIV3.SecurityRequirementObject[];
  deprecated?: boolean;
}

/**
 * Generate OpenAPI schema from Zod schemas
 */
export class OpenAPIGenerator {
  private spec: OpenAPIV3.Document;
  private routes: RouteDefinition[] = [];

  constructor(config: OpenAPIConfig) {
    this.spec = {
      openapi: '3.0.3',
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers || [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Default server',
        },
      ],
      tags: config.tags || [],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
      security: config.security || [],
    };
  }

  /**
   * Add a route definition
   */
  addRoute(route: RouteDefinition): void {
    this.routes.push(route);
  }

  /**
   * Add multiple routes
   */
  addRoutes(routes: RouteDefinition[]): void {
    this.routes.push(...routes);
  }

  /**
   * Generate the OpenAPI specification
   */
  generate(): OpenAPIV3.Document {
    // Process each route
    for (const route of this.routes) {
      const path = this.normalizePath(route.path);
      
      if (!this.spec.paths[path]) {
        this.spec.paths[path] = {};
      }

      const operation: OpenAPIV3.OperationObject = {
        summary: route.summary,
        description: route.description,
        tags: route.tags,
        deprecated: route.deprecated,
        responses: {},
      };

      // Add security if specified
      if (route.security) {
        operation.security = route.security;
      }

      // Process request parameters
      if (route.request) {
        // Path parameters
        if (route.request.params) {
          operation.parameters = operation.parameters || [];
          const params = this.zodToParameters(route.request.params, 'path');
          operation.parameters.push(...params);
        }

        // Query parameters
        if (route.request.query) {
          operation.parameters = operation.parameters || [];
          const params = this.zodToParameters(route.request.query, 'query');
          operation.parameters.push(...params);
        }

        // Request body
        if (route.request.body) {
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: this.zodToOpenAPISchema(route.request.body),
              },
            },
          };
        }

        // Headers
        if (route.request.headers) {
          operation.parameters = operation.parameters || [];
          const params = this.zodToParameters(route.request.headers, 'header');
          operation.parameters.push(...params);
        }
      }

      // Process responses
      for (const [statusCode, response] of Object.entries(route.responses)) {
        const responseObject: OpenAPIV3.ResponseObject = {
          description: response.description,
        };

        if (response.schema) {
          responseObject.content = {
            'application/json': {
              schema: this.zodToOpenAPISchema(response.schema),
            },
          };
        }

        if (response.headers) {
          responseObject.headers = response.headers;
        }

        operation.responses[statusCode] = responseObject;
      }

      // Add operation to path
      this.spec.paths[path][route.method] = operation;
    }

    return this.spec;
  }

  /**
   * Convert Zod schema to OpenAPI schema
   */
  private zodToOpenAPISchema(schema: z.ZodType<any>): OpenAPIV3.SchemaObject {
    try {
      return generateSchema(schema) as OpenAPIV3.SchemaObject;
    } catch (error) {
      // Fallback for complex schemas
      return {
        type: 'object',
        description: 'Complex schema - see source code for details',
      };
    }
  }

  /**
   * Convert Zod schema to OpenAPI parameters
   */
  private zodToParameters(
    schema: z.ZodType<any>,
    location: 'path' | 'query' | 'header'
  ): OpenAPIV3.ParameterObject[] {
    const parameters: OpenAPIV3.ParameterObject[] = [];

    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      
      for (const [key, value] of Object.entries(shape)) {
        const param: OpenAPIV3.ParameterObject = {
          name: key,
          in: location,
          required: !value.isOptional(),
          schema: this.zodToOpenAPISchema(value as z.ZodType<any>),
        };

        // Add description if available
        if (value._def?.description) {
          param.description = value._def.description;
        }

        parameters.push(param);
      }
    }

    return parameters;
  }

  /**
   * Normalize path for OpenAPI
   */
  private normalizePath(path: string): string {
    // Convert Next.js dynamic routes to OpenAPI format
    return path
      .replace(/\[([^\]]+)\]/g, '{$1}') // [id] -> {id}
      .replace(/\[\.\.\.(.*?)\]/g, '{$1*}'); // [...slug] -> {slug*}
  }

  /**
   * Export as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.generate(), null, 2);
  }

  /**
   * Export as YAML
   */
  toYAML(): string {
    // For YAML export, you would need to install and use a YAML library
    // For now, return a comment
    return '# Install js-yaml to export as YAML\n' + this.toJSON();
  }
}

/**
 * Create OpenAPI schema for common patterns
 */
export const commonSchemas = {
  // Pagination parameters
  paginationQuery: z.object({
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    limit: z.coerce.number().min(1).max(100).default(20).describe('Items per page'),
    sort: z.string().optional().describe('Sort field'),
    order: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),
  }),

  // Common error response
  errorResponse: z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }),
    metadata: z.object({
      timestamp: z.string(),
      requestId: z.string().optional(),
    }),
  }),

  // Success response wrapper
  successResponse: <T extends z.ZodType<any>>(dataSchema: T) =>
    z.object({
      success: z.literal(true),
      data: dataSchema,
      metadata: z.object({
        timestamp: z.string(),
        version: z.string().optional(),
      }),
    }),

  // ID parameters
  idParam: z.object({
    id: z.string().uuid().describe('Resource ID'),
  }),
};

/**
 * Zod extension for OpenAPI metadata
 */
export function extendZodWithOpenAPI() {
  // Add OpenAPI metadata to Zod schemas
  z.ZodType.prototype.openapi = function (metadata: any) {
    this._def = { ...this._def, openapi: metadata };
    return this;
  };
}

// Type declaration for the extension
declare module 'zod' {
  interface ZodType<Output = any, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = Output> {
    openapi(metadata: any): this;
  }
}