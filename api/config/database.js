import { createClient } from '@supabase/supabase-js'
import { config } from './index.js'
import { logger } from '../utils/logger.js'

// Create Supabase client with service role key for backend operations
export const supabase = createClient(
  config.database.supabaseUrl,
  config.database.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

// Create client-facing Supabase client (with anon key)
export const supabasePublic = createClient(
  config.database.supabaseUrl,
  config.database.supabaseAnonKey
)

// Database schema types
export const DatabaseSchema = {
  chat_conversations: {
    id: 'uuid',
    session_id: 'text',
    user_id: 'text',
    user_message: 'text',
    assistant_message: 'text',
    referenced_documents: 'text[]',
    workflow_action: 'jsonb',
    metadata: 'jsonb',
    created_at: 'timestamptz',
    updated_at: 'timestamptz'
  },
  
  documents: {
    id: 'uuid',
    title: 'text',
    content: 'text',
    type: 'text',
    url: 'text',
    embedding: 'vector(1536)',
    metadata: 'jsonb',
    created_at: 'timestamptz',
    updated_at: 'timestamptz'
  },
  
  workflows: {
    id: 'uuid',
    name: 'text',
    description: 'text',
    intent_patterns: 'text[]',
    function_schema: 'jsonb',
    is_active: 'boolean',
    created_at: 'timestamptz',
    updated_at: 'timestamptz'
  },
  
  workflow_executions: {
    id: 'uuid',
    workflow_id: 'uuid',
    user_id: 'text',
    session_id: 'text',
    input_data: 'jsonb',
    output_data: 'jsonb',
    status: 'text',
    error_message: 'text',
    created_at: 'timestamptz',
    completed_at: 'timestamptz'
  }
}

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('id')
      .limit(1)
    
    if (error) {
      logger.error('Database connection test failed:', error)
      return false
    }
    
    logger.info('✅ Database connection successful')
    return true
  } catch (err) {
    logger.error('Database connection error:', err)
    return false
  }
}

// Initialize database connection on startup
testConnection()