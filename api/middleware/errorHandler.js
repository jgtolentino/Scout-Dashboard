import { logger } from '../utils/logger.js'
import { metrics } from '../utils/metrics.js'

export const errorHandler = (error, request, reply) => {
  // Track error metrics
  metrics.httpRequests.inc({
    method: request.method,
    route: request.routerPath || request.url,
    status_code: error.statusCode || 500
  })

  // Log error details
  logger.error('Request error', {
    error: error.message,
    statusCode: error.statusCode || 500,
    method: request.method,
    url: request.url,
    userId: request.user?.id,
    stack: error.stack,
    requestId: request.id
  })

  // Determine error type and response
  let statusCode = error.statusCode || 500
  let errorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    requestId: request.id
  }

  // Handle specific error types
  if (error.validation) {
    statusCode = 400
    errorResponse = {
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.validation,
      requestId: request.id
    }
  } else if (error.code === 'FST_ERR_VALIDATION') {
    statusCode = 400
    errorResponse = {
      error: 'Validation Error',
      message: error.message,
      requestId: request.id
    }
  } else if (error.statusCode === 401) {
    errorResponse = {
      error: 'Unauthorized',
      message: 'Authentication required',
      requestId: request.id
    }
  } else if (error.statusCode === 403) {
    errorResponse = {
      error: 'Forbidden',
      message: 'Insufficient permissions',
      requestId: request.id
    }
  } else if (error.statusCode === 404) {
    errorResponse = {
      error: 'Not Found',
      message: 'Resource not found',
      requestId: request.id
    }
  } else if (error.statusCode === 429) {
    errorResponse = {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      requestId: request.id
    }
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    statusCode = 503
    errorResponse = {
      error: 'Service Unavailable',
      message: 'External service unavailable',
      requestId: request.id
    }
  } else if (error.code && error.code.startsWith('23')) {
    // PostgreSQL constraint errors
    statusCode = 409
    errorResponse = {
      error: 'Conflict',
      message: 'Data constraint violation',
      requestId: request.id
    }
  }

  // Add development-specific error details
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack
    errorResponse.details = error.details || error
  }

  // Security: Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      errorResponse.message = 'Internal server error'
      delete errorResponse.stack
      delete errorResponse.details
    }
  }

  reply.code(statusCode).send(errorResponse)
}

export default errorHandler