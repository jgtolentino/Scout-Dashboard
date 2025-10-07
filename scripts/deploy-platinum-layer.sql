-- Platinum Layer Installation Script
-- Creates the complete recommendation system infrastructure

BEGIN;

-- Create recommendations table for 7-tier system
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tier INTEGER CHECK (tier BETWEEN 1 AND 7),
  product_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  reasoning TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_tier ON recommendations(user_id, tier);
CREATE INDEX IF NOT EXISTS idx_recommendations_product ON recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_confidence ON recommendations(confidence_score DESC);

-- Create AI agent infrastructure
CREATE TABLE IF NOT EXISTS agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  content JSONB NOT NULL,
  confidence DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  agent_type TEXT NOT NULL,
  session_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_insights_type ON agent_insights(agent_type, insight_type);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id, status);

-- Create RAG chat interface
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT DEFAULT 'New Conversation',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

-- Create vector embeddings table
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS policies
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY IF NOT EXISTS "Users can view their own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage their own conversations" ON chat_conversations
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY IF NOT EXISTS "Users can manage their own messages" ON chat_messages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

-- Insert sample data
INSERT INTO recommendations (tier, product_id, brand_name, category, confidence_score, reasoning)
VALUES 
  (1, 'SKU001', 'Premium Brand A', 'Electronics', 0.95, 'High confidence based on user preferences'),
  (2, 'SKU002', 'Quality Brand B', 'Electronics', 0.87, 'Good match for user profile'),
  (3, 'SKU003', 'Standard Brand C', 'Electronics', 0.72, 'Moderate confidence recommendation')
ON CONFLICT DO NOTHING;

-- Create the function to simulate Edge Function behavior
CREATE OR REPLACE FUNCTION install_platinum_layer(request_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Platinum Layer installed successfully',
    'components', ARRAY['recommendations', 'agent_insights', 'agent_sessions', 'chat_conversations', 'chat_messages', 'embeddings'],
    'installation_time', NOW()::TEXT,
    'details', jsonb_build_object(
      'recommendations', true,
      'agent_insights', true,
      'agent_sessions', true,
      'chat_conversations', true,
      'chat_messages', true,
      'embeddings', true,
      'security_policies', true
    )
  );
END;
$$;

COMMIT;

-- Confirm installation
SELECT 'Platinum Layer installed successfully!' AS status;