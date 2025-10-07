import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface InstallRequest {
  action: string
  components: string[]
  options: {
    create_tables: boolean
    seed_data: boolean
    enable_rls: boolean
    create_indexes: boolean
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, components, options }: InstallRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🚀 Installing Platinum Layer components:', components)

    const results: Record<string, boolean> = {}

    // Install 7-tier recommendation system
    if (components.includes('7_tier_recommendations')) {
      console.log('📊 Installing 7-tier recommendation system...')
      
      if (options.create_tables) {
        const { error: recError } = await supabase.rpc('exec_sql', {
          sql: `
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
          `
        })
        
        if (recError) throw recError
      }
      
      results['recommendations'] = true
    }

    // Install AI agent infrastructure
    if (components.includes('ai_agent_infrastructure')) {
      console.log('🤖 Installing AI agent infrastructure...')
      
      if (options.create_tables) {
        const { error: aiError } = await supabase.rpc('exec_sql', {
          sql: `
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
          `
        })
        
        if (aiError) throw aiError
      }
      
      results['agent_insights'] = true
      results['agent_sessions'] = true
    }

    // Install RAG chat interface
    if (components.includes('rag_chat_interface')) {
      console.log('💬 Installing RAG chat interface...')
      
      if (options.create_tables) {
        const { error: chatError } = await supabase.rpc('exec_sql', {
          sql: `
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
          `
        })
        
        if (chatError) throw chatError
      }
      
      results['chat_conversations'] = true
      results['chat_messages'] = true
    }

    // Install vector embeddings if requested
    if (components.includes('vector_embeddings')) {
      console.log('🧠 Installing vector embeddings...')
      
      if (options.create_tables) {
        const { error: vectorError } = await supabase.rpc('exec_sql', {
          sql: `
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
          `
        })
        
        if (vectorError) throw vectorError
      }
      
      results['embeddings'] = true
    }

    // Enable RLS policies if requested
    if (options.enable_rls && components.includes('security_policies')) {
      console.log('🔒 Enabling security policies...')
      
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE IF EXISTS recommendations ENABLE ROW LEVEL SECURITY;
          ALTER TABLE IF EXISTS agent_insights ENABLE ROW LEVEL SECURITY;
          ALTER TABLE IF EXISTS agent_sessions ENABLE ROW LEVEL SECURITY;
          ALTER TABLE IF EXISTS chat_conversations ENABLE ROW LEVEL SECURITY;
          ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
          
          -- Recommendations policies
          CREATE POLICY IF NOT EXISTS "Users can view their own recommendations" ON recommendations
            FOR SELECT USING (auth.uid() = user_id);
          
          -- Chat policies  
          CREATE POLICY IF NOT EXISTS "Users can manage their own conversations" ON chat_conversations
            FOR ALL USING (auth.uid() = user_id);
            
          CREATE POLICY IF NOT EXISTS "Users can manage their own messages" ON chat_messages
            FOR ALL USING (EXISTS (
              SELECT 1 FROM chat_conversations 
              WHERE id = conversation_id AND user_id = auth.uid()
            ));
        `
      })
      
      if (rlsError) throw rlsError
      results['security_policies'] = true
    }

    // Seed initial data if requested
    if (options.seed_data) {
      console.log('🌱 Seeding initial data...')
      
      const { error: seedError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Insert sample recommendation tiers
          INSERT INTO recommendations (tier, product_id, brand_name, category, confidence_score, reasoning)
          VALUES 
            (1, 'SKU001', 'Premium Brand A', 'Electronics', 0.95, 'High confidence based on user preferences'),
            (2, 'SKU002', 'Quality Brand B', 'Electronics', 0.87, 'Good match for user profile'),
            (3, 'SKU003', 'Standard Brand C', 'Electronics', 0.72, 'Moderate confidence recommendation')
          ON CONFLICT DO NOTHING;
        `
      })
      
      if (seedError) console.warn('Seed data warning:', seedError)
    }

    console.log('✅ Platinum Layer installation complete')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Platinum Layer installed successfully',
        components: Object.keys(results),
        installation_time: new Date().toISOString(),
        details: results
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Installation failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})