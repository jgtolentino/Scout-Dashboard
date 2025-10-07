import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { config } from './config/index.js'
import { logger } from './utils/logger.js'
import { metrics } from './utils/metrics.js'
import { setupRoutes } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/auth.js'

const fastify = Fastify({
  logger: logger,
  requestIdLogLabel: 'reqId',
  requestIdHeader: 'x-request-id'
})

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: false
})

await fastify.register(cors, {
  origin: config.cors.allowedOrigins,
  credentials: true
})

await fastify.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
  skipOnError: true
})

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
})

// Global middleware
fastify.addHook('onRequest', authMiddleware)
fastify.setErrorHandler(errorHandler)

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    services: {
      database: 'OK',
      openai: 'OK',
      supabase: 'OK'
    }
  }

  try {
    // Quick database connectivity check
    const { supabase } = await import('./config/database.js')
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('id')
      .limit(1)
    
    if (error) {
      healthCheck.services.database = 'ERROR'
      healthCheck.services.supabase = 'ERROR'
      healthCheck.status = 'DEGRADED'
    }
  } catch (err) {
    healthCheck.services.database = 'ERROR'
    healthCheck.status = 'ERROR'
    return reply.code(503).send(healthCheck)
  }

  return reply.send(healthCheck)
})

// Metrics endpoint
fastify.get('/metrics', async (request, reply) => {
  reply.type('text/plain')
  return metrics.register.metrics()
})

// API routes
setupRoutes(fastify)

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`)
  
  try {
    await fastify.close()
    logger.info('Server closed successfully')
    process.exit(0)
  } catch (err) {
    logger.error('Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
const start = async () => {
  try {
    const address = await fastify.listen({
      port: config.server.port,
      host: config.server.host
    })
    
    logger.info(`🚀 TBWA HRIS Backend running at ${address}`)
    logger.info(`📊 Metrics available at ${address}/metrics`)
    logger.info(`❤️ Health check at ${address}/healthz`)
    
  } catch (err) {
    logger.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()