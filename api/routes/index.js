import { chatRoutes } from './chat.js'
import { workflowRoutes } from './workflow.js'
import { documentRoutes } from './documents.js'
import { expenseRoutes } from './expenses.js'
import { trackHttpRequest } from '../utils/metrics.js'

export const setupRoutes = (fastify) => {
  // Request tracking middleware
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now()
    request.trackMetrics = trackHttpRequest(request.method, request.routerPath || request.url)
  })

  fastify.addHook('onResponse', async (request, reply) => {
    if (request.trackMetrics) {
      request.trackMetrics(reply.statusCode)
    }
  })

  // API prefix
  fastify.register(async function (fastify) {
    // Core AI services
    await fastify.register(chatRoutes, { prefix: '/chat' })
    await fastify.register(workflowRoutes, { prefix: '/workflow' })
    await fastify.register(documentRoutes, { prefix: '/docs' })
    
    // Business logic routes
    await fastify.register(expenseRoutes, { prefix: '/expenses' })
    
    // API info endpoint
    fastify.get('/', async (request, reply) => {
      return {
        name: 'TBWA HRIS Backend',
        version: '1.0.0',
        description: 'AI-Central HRIS Backend Services',
        endpoints: {
          chat: '/api/chat',
          workflow: '/api/workflow',
          documents: '/api/docs',
          expenses: '/api/expenses',
          health: '/healthz',
          metrics: '/metrics'
        },
        timestamp: new Date().toISOString()
      }
    })
    
  }, { prefix: '/api' })
}