import { ChatService } from '../ai-services/chat/chatService.js'
import { logger } from '../utils/logger.js'
import { rateLimitByUser } from '../middleware/auth.js'

const chatService = new ChatService()

export const chatRoutes = async (fastify) => {
  // Rate limiting for chat endpoints
  fastify.addHook('preHandler', rateLimitByUser(50, 60000)) // 50 requests per minute

  // Chat message processing
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 2000 },
          sessionId: { type: 'string' },
          context: {
            type: 'object',
            properties: {
              previousIntent: { type: 'string' },
              userProfile: { type: 'object' },
              location: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { message, sessionId, context = {} } = request.body
      const userId = request.user.id

      // Generate session ID if not provided
      const effectiveSessionId = sessionId || `session_${userId}_${Date.now()}`

      logger.chat('Processing chat message', {
        userId,
        sessionId: effectiveSessionId,
        messageLength: message.length,
        hasContext: Object.keys(context).length > 0
      })

      const response = await chatService.processMessage({
        sessionId: effectiveSessionId,
        userId,
        message,
        context: {
          ...context,
          userProfile: {
            id: userId,
            email: request.user.email,
            role: request.user.role,
            ...context.userProfile
          }
        }
      })

      return {
        success: true,
        sessionId: effectiveSessionId,
        ...response
      }

    } catch (error) {
      logger.error('Chat route error', {
        error: error.message,
        userId: request.user.id,
        stack: error.stack
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to process chat message',
        message: 'An error occurred while processing your message. Please try again.'
      })
    }
  })

  // Get conversation history
  fastify.get('/history/:sessionId', {
    schema: {
      params: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.params
      const { limit = 20, offset = 0 } = request.query
      const userId = request.user.id

      const history = await chatService.getConversationHistory(sessionId, limit, offset)

      // Filter to only conversations for this user (additional security)
      const userHistory = history.filter(conv => conv.user_id === userId)

      return {
        success: true,
        sessionId,
        conversations: userHistory,
        limit,
        offset,
        hasMore: userHistory.length === limit
      }

    } catch (error) {
      logger.error('Chat history route error', {
        error: error.message,
        userId: request.user.id,
        sessionId: request.params.sessionId
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve conversation history'
      })
    }
  })

  // Get user's active sessions
  fastify.get('/sessions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { limit = 10 } = request.query
      const userId = request.user.id

      const sessions = await chatService.getUserSessions(userId, limit)

      return {
        success: true,
        sessions,
        limit
      }

    } catch (error) {
      logger.error('Chat sessions route error', {
        error: error.message,
        userId: request.user.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve chat sessions'
      })
    }
  })

  // Delete a conversation/session
  fastify.delete('/sessions/:sessionId', {
    schema: {
      params: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.params
      const userId = request.user.id

      await chatService.deleteSession(sessionId, userId)

      return {
        success: true,
        message: 'Session deleted successfully'
      }

    } catch (error) {
      logger.error('Delete session route error', {
        error: error.message,
        userId: request.user.id,
        sessionId: request.params.sessionId
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to delete session'
      })
    }
  })

  // Chat analytics for the user
  fastify.get('/analytics', async (request, reply) => {
    try {
      const userId = request.user.id
      const analytics = await chatService.getUserAnalytics(userId)

      return {
        success: true,
        analytics
      }

    } catch (error) {
      logger.error('Chat analytics route error', {
        error: error.message,
        userId: request.user.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve analytics'
      })
    }
  })
}