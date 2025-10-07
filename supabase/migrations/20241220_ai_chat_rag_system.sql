-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Knowledge Base for RAG
CREATE TABLE IF NOT EXISTS scout_ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS scout_ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS scout_ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- SQL Query History
CREATE TABLE IF NOT EXISTS scout_ai_sql_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  natural_query TEXT NOT NULL,
  sql_query TEXT NOT NULL,
  explanation TEXT,
  tables_used TEXT[],
  row_count INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON ai_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_chat_session_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sql_history_user ON ai_sql_history(user_id);

-- RLS Policies
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sql_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own chat sessions" ON ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON ai_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see messages from their sessions
CREATE POLICY "Users can view own chat messages" ON ai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

-- Users can only see their SQL history
CREATE POLICY "Users can view own SQL history" ON ai_sql_history
  FOR SELECT USING (auth.uid() = user_id);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_knowledge_scout(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM ai_knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Safe SQL execution function
CREATE OR REPLACE FUNCTION execute_safe_query_scout(
  query_text TEXT,
  user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  exec_time_ms INTEGER;
BEGIN
  -- Validate query is SELECT only
  IF NOT (query_text ~* '^\s*SELECT' AND 
          query_text !~* '(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Record start time
  start_time := clock_timestamp();
  
  -- Execute query
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  -- Record end time
  end_time := clock_timestamp();
  exec_time_ms := EXTRACT(MILLISECOND FROM (end_time - start_time));
  
  -- Log query execution
  IF user_id IS NOT NULL THEN
    INSERT INTO ai_sql_history (
      user_id,
      natural_query,
      sql_query,
      row_count,
      execution_time_ms
    ) VALUES (
      user_id,
      'Direct SQL execution',
      query_text,
      json_array_length(result),
      exec_time_ms
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;