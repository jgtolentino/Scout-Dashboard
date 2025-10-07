/**
 * Validation utilities for Scout Dashboard
 */

import { TransactionFilters } from '@/lib/dal/transactions'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: any
}

/**
 * Validate and sanitize transaction filters
 */
export function validateTransactionFilters(filters: any): ValidationResult {
  const errors: string[] = []
  const sanitized: TransactionFilters = {}

  // Validate date range
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    if (isNaN(fromDate.getTime())) {
      errors.push('Invalid dateFrom format. Use YYYY-MM-DD.')
    } else {
      sanitized.dateFrom = fromDate.toISOString().split('T')[0]
    }
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo)
    if (isNaN(toDate.getTime())) {
      errors.push('Invalid dateTo format. Use YYYY-MM-DD.')
    } else {
      sanitized.dateTo = toDate.toISOString().split('T')[0]
    }
  }

  // Validate date range logic
  if (sanitized.dateFrom && sanitized.dateTo && sanitized.dateFrom > sanitized.dateTo) {
    errors.push('dateFrom cannot be after dateTo.')
  }

  // Validate array filters
  const arrayFields = ['regions', 'provinces', 'stores', 'brands', 'categories', 'genders', 'ageBrackets']
  
  arrayFields.forEach(field => {
    if (filters[field]) {
      if (Array.isArray(filters[field])) {
        const filtered = filters[field].filter((item: any) => 
          typeof item === 'string' && item.trim().length > 0
        )
        if (filtered.length > 0) {
          sanitized[field as keyof TransactionFilters] = filtered as any
        }
      } else if (typeof filters[field] === 'string') {
        const items = filters[field].split(',').map((item: string) => item.trim()).filter(Boolean)
        if (items.length > 0) {
          sanitized[field as keyof TransactionFilters] = items as any
        }
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validate chat message input
 */
export function validateChatMessage(data: any): ValidationResult {
  const errors: string[] = []

  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required and must be a string.')
  } else if (data.message.trim().length === 0) {
    errors.push('Message cannot be empty.')
  } else if (data.message.length > 1000) {
    errors.push('Message cannot exceed 1000 characters.')
  }

  if (data.conversationId && typeof data.conversationId !== 'string') {
    errors.push('Conversation ID must be a string.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      message: data.message?.trim(),
      conversationId: data.conversationId || null,
      context: data.context || 'general',
      filters: data.filters || {}
    }
  }
}

/**
 * Validate AI analysis parameters
 */
export function validateAIAnalysisParams(params: any): ValidationResult {
  const errors: string[] = []
  
  const validAnalysisTypes = ['trends', 'anomalies', 'predictions', 'recommendations']
  
  if (!params.analysisType || !validAnalysisTypes.includes(params.analysisType)) {
    errors.push(`Analysis type must be one of: ${validAnalysisTypes.join(', ')}.`)
  }

  if (params.confidenceThreshold !== undefined) {
    const confidence = parseFloat(params.confidenceThreshold)
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      errors.push('Confidence threshold must be a number between 0 and 1.')
    } else {
      params.confidenceThreshold = confidence
    }
  }

  if (params.timeframe && typeof params.timeframe !== 'string') {
    errors.push('Timeframe must be a string (e.g., "30d", "7d").')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: params
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: any): ValidationResult {
  const errors: string[] = []
  const sanitized: any = {}

  if (params.limit !== undefined) {
    const limit = parseInt(params.limit, 10)
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push('Limit must be a number between 1 and 1000.')
    } else {
      sanitized.limit = limit
    }
  }

  if (params.offset !== undefined) {
    const offset = parseInt(params.offset, 10)
    if (isNaN(offset) || offset < 0) {
      errors.push('Offset must be a non-negative number.')
    } else {
      sanitized.offset = offset
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Sanitize and validate search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = []

  if (typeof query !== 'string') {
    errors.push('Search query must be a string.')
    return { isValid: false, errors }
  }

  const sanitized = query.trim()

  if (sanitized.length === 0) {
    errors.push('Search query cannot be empty.')
  } else if (sanitized.length > 200) {
    errors.push('Search query cannot exceed 200 characters.')
  }

  // Check for potential SQL injection patterns
  const suspiciousPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)|[;'"\\]/i
  if (suspiciousPatterns.test(sanitized)) {
    errors.push('Search query contains invalid characters.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}