import OpenAI from 'openai'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'
import { supabase } from '../../config/database.js'
import { metrics } from '../../utils/metrics.js'

const openai = new OpenAI({
  apiKey: config.openai.apiKey
})

export class DocumentSearch {
  constructor() {
    this.embeddingModel = config.openai.embeddingModel
    this.embeddingCache = new Map()
  }

  async searchDocuments(query, options = {}) {
    const startTime = Date.now()
    metrics.documentSearchTotal.inc()

    try {
      const {
        limit = 5,
        threshold = 0.7,
        documentTypes = null,
        includeContent = true
      } = options

      logger.info('Searching documents', {
        query: query.substring(0, 100),
        limit,
        threshold,
        documentTypes
      })

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)
      
      if (!queryEmbedding) {
        logger.error('Failed to generate query embedding')
        return []
      }

      // Perform vector similarity search
      let searchQuery = supabase
        .rpc('search_documents', {
          query_embedding: queryEmbedding,
          similarity_threshold: threshold,
          match_count: limit
        })

      // Filter by document types if specified
      if (documentTypes && documentTypes.length > 0) {
        searchQuery = searchQuery.in('type', documentTypes)
      }

      const { data: documents, error } = await searchQuery

      if (error) {
        logger.error('Document search query failed', { error })
        return []
      }

      // Process and enrich results
      const results = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        url: doc.url,
        similarity: doc.similarity,
        content: includeContent ? doc.content : null,
        metadata: doc.metadata || {},
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }))

      // Log search metrics
      metrics.documentSearchTime.observe(Date.now() - startTime)
      metrics.documentSearchResults.observe(results.length)

      logger.info('Document search completed', {
        resultsCount: results.length,
        avgSimilarity: results.length > 0 
          ? results.reduce((sum, doc) => sum + doc.similarity, 0) / results.length 
          : 0,
        processingTime: Date.now() - startTime
      })

      return results

    } catch (error) {
      logger.error('Document search error', {
        error: error.message,
        query: query.substring(0, 100),
        stack: error.stack
      })

      metrics.documentSearchTotal.inc({ status: 'error' })
      return []
    }
  }

  async generateEmbedding(text) {
    try {
      // Check cache first
      const cacheKey = this.hashText(text)
      if (this.embeddingCache.has(cacheKey)) {
        return this.embeddingCache.get(cacheKey)
      }

      // Generate new embedding
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text.substring(0, 8000), // Limit input length
        encoding_format: 'float'
      })

      const embedding = response.data[0].embedding

      // Cache the result (with size limit)
      if (this.embeddingCache.size < 1000) {
        this.embeddingCache.set(cacheKey, embedding)
      }

      return embedding

    } catch (error) {
      logger.error('Embedding generation error', {
        error: error.message,
        text: text.substring(0, 100)
      })
      return null
    }
  }

  async indexDocument({ title, content, type, url, metadata = {} }) {
    try {
      logger.info('Indexing document', { title, type, url })

      // Generate embedding for the document content
      const fullText = `${title}\n\n${content}`
      const embedding = await this.generateEmbedding(fullText)

      if (!embedding) {
        throw new Error('Failed to generate embedding for document')
      }

      // Store document with embedding
      const document = {
        title,
        content,
        type,
        url,
        embedding,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single()

      if (error) {
        logger.error('Failed to store document', { error, title })
        throw error
      }

      logger.info('Document indexed successfully', { 
        documentId: data.id, 
        title 
      })

      return data

    } catch (error) {
      logger.error('Document indexing error', {
        error: error.message,
        title,
        type
      })
      throw error
    }
  }

  async updateDocument(documentId, updates) {
    try {
      // If content is being updated, regenerate embedding
      if (updates.content || updates.title) {
        const fullText = `${updates.title || ''}\n\n${updates.content || ''}`
        updates.embedding = await this.generateEmbedding(fullText)
      }

      updates.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        throw error
      }

      logger.info('Document updated successfully', { documentId })
      return data

    } catch (error) {
      logger.error('Document update error', {
        error: error.message,
        documentId
      })
      throw error
    }
  }

  async deleteDocument(documentId) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        throw error
      }

      logger.info('Document deleted successfully', { documentId })

    } catch (error) {
      logger.error('Document deletion error', {
        error: error.message,
        documentId
      })
      throw error
    }
  }

  async getDocumentById(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) {
        throw error
      }

      return data

    } catch (error) {
      logger.error('Document fetch error', {
        error: error.message,
        documentId
      })
      return null
    }
  }

  async getDocumentsByType(type, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options

      const { data, error } = await supabase
        .from('documents')
        .select('id, title, type, url, metadata, created_at, updated_at')
        .eq('type', type)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data

    } catch (error) {
      logger.error('Documents by type fetch error', {
        error: error.message,
        type
      })
      return []
    }
  }

  // Batch index multiple documents
  async batchIndexDocuments(documents) {
    const results = []
    const batchSize = 5 // Process in small batches to avoid rate limits

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      
      const batchPromises = batch.map(doc => 
        this.indexDocument(doc).catch(error => ({
          error: error.message,
          document: doc.title
        }))
      )

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Small delay between batches
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const successCount = results.filter(r => !r.error).length
    const errorCount = results.filter(r => r.error).length

    logger.info('Batch indexing completed', {
      total: documents.length,
      successful: successCount,
      errors: errorCount
    })

    return {
      total: documents.length,
      successful: successCount,
      errors: errorCount,
      results
    }
  }

  // Get search suggestions based on query
  async getSearchSuggestions(partialQuery, limit = 5) {
    try {
      // Simple implementation - could be enhanced with more sophisticated matching
      const { data, error } = await supabase
        .from('documents')
        .select('title, type')
        .ilike('title', `%${partialQuery}%`)
        .limit(limit)

      if (error) {
        throw error
      }

      return data.map(doc => ({
        suggestion: doc.title,
        type: doc.type
      }))

    } catch (error) {
      logger.error('Search suggestions error', { error: error.message })
      return []
    }
  }

  // Helper function to hash text for caching
  hashText(text) {
    let hash = 0
    if (text.length === 0) return hash
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return hash.toString()
  }

  // Clear embedding cache
  clearEmbeddingCache() {
    this.embeddingCache.clear()
    logger.info('Embedding cache cleared')
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      maxSize: 1000
    }
  }
}

export default DocumentSearch