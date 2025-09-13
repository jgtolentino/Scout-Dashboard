import { DocumentSearch } from '../ai-services/documents/documentSearch.js'
import { logger } from '../utils/logger.js'
import { requireRole } from '../middleware/auth.js'

const documentSearch = new DocumentSearch()

export const documentRoutes = async (fastify) => {
  // Search documents
  fastify.post('/search', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 500 },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
          threshold: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
          documentTypes: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 10
          },
          includeContent: { type: 'boolean', default: true }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { query, limit, threshold, documentTypes, includeContent } = request.body
      const userId = request.user.id

      logger.info('Document search request', {
        userId,
        query: query.substring(0, 100),
        limit,
        threshold,
        documentTypes
      })

      const documents = await documentSearch.searchDocuments(query, {
        limit,
        threshold,
        documentTypes,
        includeContent
      })

      return {
        success: true,
        query,
        documents,
        count: documents.length,
        limit,
        threshold
      }

    } catch (error) {
      logger.error('Document search error', {
        error: error.message,
        userId: request.user.id,
        query: request.body.query?.substring(0, 100)
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to search documents'
      })
    }
  })

  // Get document by ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const userId = request.user.id

      const document = await documentSearch.getDocumentById(id)

      if (!document) {
        return reply.code(404).send({
          success: false,
          error: 'Document not found'
        })
      }

      logger.info('Document retrieved', {
        userId,
        documentId: id,
        documentTitle: document.title
      })

      return {
        success: true,
        document
      }

    } catch (error) {
      logger.error('Get document error', {
        error: error.message,
        userId: request.user.id,
        documentId: request.params.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve document'
      })
    }
  })

  // Get documents by type
  fastify.get('/type/:type', {
    schema: {
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type } = request.params
      const { limit, offset } = request.query
      const userId = request.user.id

      const documents = await documentSearch.getDocumentsByType(type, {
        limit,
        offset
      })

      logger.info('Documents by type retrieved', {
        userId,
        type,
        count: documents.length,
        limit,
        offset
      })

      return {
        success: true,
        type,
        documents,
        count: documents.length,
        limit,
        offset,
        hasMore: documents.length === limit
      }

    } catch (error) {
      logger.error('Get documents by type error', {
        error: error.message,
        userId: request.user.id,
        type: request.params.type
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve documents'
      })
    }
  })

  // Get search suggestions
  fastify.get('/suggest/:query', {
    schema: {
      params: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { query } = request.params
      const { limit } = request.query

      const suggestions = await documentSearch.getSearchSuggestions(query, limit)

      return {
        success: true,
        query,
        suggestions,
        limit
      }

    } catch (error) {
      logger.error('Get search suggestions error', {
        error: error.message,
        query: request.params.query
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to get search suggestions'
      })
    }
  })

  // Admin routes for document management
  fastify.register(async function (fastify) {
    // Add admin role requirement
    fastify.addHook('preHandler', requireRole('admin'))

    // Index new document
    fastify.post('/', {
      schema: {
        body: {
          type: 'object',
          required: ['title', 'content', 'type'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            content: { type: 'string', minLength: 1, maxLength: 50000 },
            type: { type: 'string', minLength: 1, maxLength: 50 },
            url: { type: 'string', maxLength: 500 },
            metadata: { type: 'object' }
          }
        }
      }
    }, async (request, reply) => {
      try {
        const { title, content, type, url, metadata } = request.body
        const userId = request.user.id

        const document = await documentSearch.indexDocument({
          title,
          content,
          type,
          url,
          metadata: {
            ...metadata,
            createdBy: userId
          }
        })

        logger.info('Document indexed', {
          userId,
          documentId: document.id,
          title,
          type
        })

        return {
          success: true,
          document
        }

      } catch (error) {
        logger.error('Index document error', {
          error: error.message,
          userId: request.user.id,
          title: request.body.title
        })

        return reply.code(500).send({
          success: false,
          error: 'Failed to index document'
        })
      }
    })

    // Update document
    fastify.put('/:id', {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            content: { type: 'string', minLength: 1, maxLength: 50000 },
            type: { type: 'string', minLength: 1, maxLength: 50 },
            url: { type: 'string', maxLength: 500 },
            metadata: { type: 'object' }
          }
        }
      }
    }, async (request, reply) => {
      try {
        const { id } = request.params
        const updates = request.body
        const userId = request.user.id

        const document = await documentSearch.updateDocument(id, {
          ...updates,
          metadata: {
            ...updates.metadata,
            updatedBy: userId
          }
        })

        logger.info('Document updated', {
          userId,
          documentId: id
        })

        return {
          success: true,
          document
        }

      } catch (error) {
        logger.error('Update document error', {
          error: error.message,
          userId: request.user.id,
          documentId: request.params.id
        })

        return reply.code(500).send({
          success: false,
          error: 'Failed to update document'
        })
      }
    })

    // Delete document
    fastify.delete('/:id', {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      }
    }, async (request, reply) => {
      try {
        const { id } = request.params
        const userId = request.user.id

        await documentSearch.deleteDocument(id)

        logger.info('Document deleted', {
          userId,
          documentId: id
        })

        return {
          success: true,
          message: 'Document deleted successfully'
        }

      } catch (error) {
        logger.error('Delete document error', {
          error: error.message,
          userId: request.user.id,
          documentId: request.params.id
        })

        return reply.code(500).send({
          success: false,
          error: 'Failed to delete document'
        })
      }
    })

  }, { prefix: '/admin' })
}