import { WorkflowDetector } from '../ai-services/workflow/workflowDetector.js'
import { logger } from '../utils/logger.js'

const workflowDetector = new WorkflowDetector()

export const workflowRoutes = async (fastify) => {
  // Detect workflow intent from text
  fastify.post('/detect', {
    schema: {
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1, maxLength: 1000 },
          context: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { text, context = {} } = request.body
      const userId = request.user.id

      logger.workflow('Detecting workflow intent', {
        userId,
        textLength: text.length,
        hasContext: Object.keys(context).length > 0
      })

      const intent = await workflowDetector.detectIntent(text, context)

      return {
        success: true,
        intent: intent.intent,
        confidence: intent.confidence,
        entities: intent.entities,
        matchCount: intent.matchCount
      }

    } catch (error) {
      logger.error('Workflow detection error', {
        error: error.message,
        userId: request.user.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to detect workflow intent'
      })
    }
  })

  // Execute workflow
  fastify.post('/execute', {
    schema: {
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'object',
            required: ['intent'],
            properties: {
              intent: { type: 'string' },
              entities: { type: 'object' },
              confidence: { type: 'number' },
              type: { type: 'string' },
              arguments: { type: 'object' }
            }
          },
          sessionId: { type: 'string' },
          conversationId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { action, sessionId, conversationId } = request.body
      const userId = request.user.id

      logger.workflow('Executing workflow', {
        userId,
        intent: action.intent,
        confidence: action.confidence,
        sessionId,
        conversationId
      })

      const result = await workflowDetector.executeWorkflow({
        action,
        userId,
        sessionId,
        conversationId
      })

      return {
        success: true,
        result
      }

    } catch (error) {
      logger.error('Workflow execution error', {
        error: error.message,
        userId: request.user.id,
        intent: request.body.action?.intent
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to execute workflow'
      })
    }
  })

  // Get available workflows
  fastify.get('/', async (request, reply) => {
    try {
      const workflows = Array.from(workflowDetector.workflows.keys()).map(key => {
        const workflow = workflowDetector.workflows.get(key)
        return {
          name: key,
          description: `${key.replace('_', ' ')} workflow`,
          quickActions: workflow.getQuickActions ? workflow.getQuickActions() : []
        }
      })

      return {
        success: true,
        workflows
      }

    } catch (error) {
      logger.error('Get workflows error', { error: error.message })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve workflows'
      })
    }
  })

  // Get workflow execution history
  fastify.get('/executions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          status: { type: 'string', enum: ['started', 'in_progress', 'completed', 'failed', 'cancelled'] },
          workflowType: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { limit = 20, offset = 0, status, workflowType } = request.query
      const userId = request.user.id

      // This would typically query the workflow_executions table
      // For now, return a placeholder response
      return {
        success: true,
        executions: [],
        limit,
        offset,
        hasMore: false
      }

    } catch (error) {
      logger.error('Get workflow executions error', {
        error: error.message,
        userId: request.user.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve workflow executions'
      })
    }
  })
}