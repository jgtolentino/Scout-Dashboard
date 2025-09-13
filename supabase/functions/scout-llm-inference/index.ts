// Scout Dashboard LLM Inference Edge Function
// Supports multiple LLM providers with fallback capabilities

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface InferenceRequest {
  prompt: string
  context?: any
  provider?: 'openai' | 'claude' | 'groq' | 'ollama'
  model?: string
  temperature?: number
  max_tokens?: number
  system_prompt?: string
  user_id?: string
  metadata?: Record<string, any>
}

interface LLMProvider {
  name: string
  call: (request: InferenceRequest) => Promise<string>
}

// OpenAI Provider
const openAIProvider: LLMProvider = {
  name: 'openai',
  call: async (request: InferenceRequest) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: request.system_prompt || 'You are Scout Analytics AI, an expert in Philippine retail analytics. You help analyze TBWA client performance, market trends, and provide actionable insights.'
          },
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    return result.choices?.[0]?.message?.content || 'No response generated'
  }
}

// Claude Provider (via Anthropic API)
const claudeProvider: LLMProvider = {
  name: 'claude',
  call: async (request: InferenceRequest) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-opus-20240229',
        messages: [{ 
          role: 'user', 
          content: request.prompt 
        }],
        system: request.system_prompt || 'You are Scout Analytics AI, specializing in Philippine retail data analysis for TBWA clients.',
        max_tokens: request.max_tokens || 1000,
        temperature: request.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    return result.content?.[0]?.text || 'No response generated'
  }
}

// Groq Provider (fast inference)
const groqProvider: LLMProvider = {
  name: 'groq',
  call: async (request: InferenceRequest) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'mixtral-8x7b-32768',
        messages: [
          { 
            role: 'system', 
            content: request.system_prompt || 'You are a retail analytics expert focused on Philippine market data.'
          },
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const result = await response.json()
    return result.choices?.[0]?.message?.content || 'No response generated'
  }
}

// Scout-specific prompt templates
const PROMPT_TEMPLATES = {
  brand_analysis: (brand: string, period: string) => `
    Analyze the performance of ${brand} for ${period} in the Philippine retail market.
    Include: market share trends, customer segments, top SKUs, and growth recommendations.
  `,
  
  market_insights: (category: string) => `
    Provide market insights for the ${category} category in the Philippines.
    Cover: competitive landscape, consumer trends, pricing strategies, and opportunities for TBWA clients.
  `,
  
  forecast: (metric: string, timeframe: string) => `
    Generate a forecast for ${metric} over the next ${timeframe}.
    Include confidence intervals, key drivers, and potential risks.
  `,
  
  anomaly_explanation: (anomaly: any) => `
    Explain this anomaly in the retail data: ${JSON.stringify(anomaly)}.
    Provide possible causes, business impact, and recommended actions.
  `
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const inferenceRequest: InferenceRequest = await req.json()
    
    // Get user context if authenticated
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        userId = user.id
        inferenceRequest.user_id = userId
      }
    }

    // Apply template if requested
    if (inferenceRequest.metadata?.template) {
      const template = PROMPT_TEMPLATES[inferenceRequest.metadata.template as keyof typeof PROMPT_TEMPLATES]
      if (template && typeof template === 'function') {
        inferenceRequest.prompt = template(
          inferenceRequest.metadata.param1,
          inferenceRequest.metadata.param2
        )
      }
    }

    // Add context from database if needed
    if (inferenceRequest.context?.include_recent_data) {
      const { data: recentTransactions } = await supabase
        .from('scout_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(100)
      
      inferenceRequest.prompt += `\n\nRecent transaction context: ${JSON.stringify(recentTransactions)}`
    }

    // Select provider
    const provider = inferenceRequest.provider || 'openai'
    let llmProvider: LLMProvider
    
    switch (provider) {
      case 'claude':
        llmProvider = claudeProvider
        break
      case 'groq':
        llmProvider = groqProvider
        break
      case 'openai':
      default:
        llmProvider = openAIProvider
    }

    // Call LLM with retry logic
    let response: string
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        response = await llmProvider.call(inferenceRequest)
        break
      } catch (error) {
        attempts++
        console.error(`LLM call attempt ${attempts} failed:`, error)
        
        if (attempts >= maxAttempts) {
          // Try fallback provider
          if (provider !== 'groq') {
            console.log('Trying Groq as fallback...')
            response = await groqProvider.call(inferenceRequest)
          } else {
            throw error
          }
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }

    // Log the inference
    const { error: logError } = await supabase
      .from('llm_inference_logs')
      .insert({
        prompt: inferenceRequest.prompt,
        response: response!,
        provider: llmProvider.name,
        model: inferenceRequest.model,
        user_id: userId,
        metadata: {
          temperature: inferenceRequest.temperature,
          max_tokens: inferenceRequest.max_tokens,
          context: inferenceRequest.context,
          template: inferenceRequest.metadata?.template
        }
      })

    if (logError) {
      console.error('Failed to log inference:', logError)
    }

    // Return structured response
    return new Response(
      JSON.stringify({
        success: true,
        response: response!,
        provider: llmProvider.name,
        timestamp: new Date().toISOString(),
        usage: {
          prompt_tokens: inferenceRequest.prompt.split(' ').length,
          completion_tokens: response!.split(' ').length
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Inference error:', error)
    
    // Log error
    await supabase
      .from('llm_inference_logs')
      .insert({
        prompt: req.body,
        response: '',
        metadata: { error: error.message },
        provider: 'error'
      })

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
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

// Deployment instructions:
// supabase functions deploy scout-llm-inference
// supabase secrets set OPENAI_API_KEY=sk-...
// supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// supabase secrets set GROQ_API_KEY=gsk_...