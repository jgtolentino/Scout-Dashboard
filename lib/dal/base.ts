/**
 * Base Data Access Layer for Scout Dashboard
 * Provides centralized database operations with error handling and caching
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export type ScoutDatabase = Database

class BaseDAL {
  private client: SupabaseClient<ScoutDatabase>
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()

  constructor() {
    this.client = createClient<ScoutDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public'
        }
      }
    )
  }

  /**
   * Get Supabase client instance
   */
  getClient(): SupabaseClient<ScoutDatabase> {
    return this.client
  }

  /**
   * Execute query with error handling and optional caching
   */
  async executeQuery<T>(
    queryFn: (client: SupabaseClient<ScoutDatabase>) => Promise<{ data: T | null; error: any }>,
    cacheKey?: string,
    cacheTTL: number = 300000 // 5 minutes default
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // Check cache first if cache key provided
      if (cacheKey) {
        const cached = this.cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          return { data: cached.data, error: null }
        }
      }

      const { data, error } = await queryFn(this.client)

      if (error) {
        console.error('Database query error:', error)
        return { data: null, error: error.message }
      }

      // Cache successful result if cache key provided
      if (cacheKey && data) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: cacheTTL
        })
      }

      return { data, error: null }
    } catch (err) {
      const error = err as Error
      console.error('Database execution error:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Clear cache by key or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Build dynamic filters for queries
   */
  buildFilters(filters: Record<string, any>): Record<string, any> {
    const cleanFilters: Record<string, any> = {}
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          cleanFilters[key] = value
        } else if (!Array.isArray(value)) {
          cleanFilters[key] = value
        }
      }
    })

    return cleanFilters
  }

  /**
   * Execute raw SQL query (for complex analytics)
   */
  async executeRawQuery<T>(
    query: string,
    params: any[] = [],
    cacheKey?: string,
    cacheTTL: number = 300000
  ): Promise<{ data: T | null; error: string | null }> {
    return this.executeQuery<T>(
      async (client) => {
        const { data, error } = await client.rpc('execute_sql', {
          query_text: query,
          params: params
        })
        return { data, error }
      },
      cacheKey,
      cacheTTL
    )
  }
}

export default BaseDAL