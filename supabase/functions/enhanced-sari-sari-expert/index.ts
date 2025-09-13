// Enhanced Sari-Sari Expert Bot - Project Scout Integration
// Connects Expert Bot with 18K+ real transaction dataset
// Ultra-fast inference powered by Groq + Real Philippine retail data

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Enhanced Expert System Prompt with Project Scout Context
const ENHANCED_EXPERT_PROMPT = `You are an expert on Philippine sari-sari stores with access to REAL data from 18,000+ transactions. You analyze:

1. **Real Transaction Patterns**: Actual purchase behaviors, basket compositions, payment methods
2. **Filipino Cultural Context**: Real customer phrases like "Pabili po", "May stock po ba?", politeness markers
3. **Buyer Personas from Real Data**:
   - Juan (Rural Male Worker): Yosi, softdrinks, cash payments
   - Maria (Urban Housewife): Family items, cooking ingredients, GCash user
   - Carlo (Young Professional): Energy drinks, digital payments
   - Lola Rosa (Elderly): Small purchases, always cash
4. **Substitution Patterns**: Real success rates when products are out of stock
5. **TBWA Brand Performance**: Actual market share vs competitors from real data

You provide insights based on REAL data, not theoretical assumptions.`

interface EnhancedQuery {
  query: string
  filters?: any
  include_substitution_analysis?: boolean
  include_persona_matching?: boolean
  include_cultural_context?: boolean
  analyze_partial_transaction?: {
    payment_amount: number
    change_given: number
    time_of_day: string
    customer_profile?: string
  }
}

// Get real Project Scout transaction patterns
async function getRealTransactionContext(filters: any, spent_amount?: number) {
  let query = supabase
    .from('transactions')
    .select(`
      id,
      total_amount,
      customer_age,
      customer_gender,
      store_location,
      payment_method,
      request_type,
      transcription,
      suggestion_accepted,
      created_at,
      transaction_products!inner(
        quantity,
        products!inner(
          id,
          name,
          price,
          category,
          brands!inner(
            id,
            name,
            is_client
          )
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Filter by amount range if inferring transaction
  if (spent_amount !== undefined) {
    query = query
      .gte('total_amount', spent_amount - 5)
      .lte('total_amount', spent_amount + 5)
  }

  // Apply additional filters
  if (filters?.payment_method) {
    query = query.in('payment_method', filters.payment_method)
  }

  if (filters?.date_range) {
    query = query
      .gte('created_at', filters.date_range.start)
      .lte('created_at', filters.date_range.end)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Extract Filipino cultural patterns from transcriptions
function extractFilipinoPatterns(transactions: any[]) {
  const patterns = {
    common_phrases: {} as Record<string, number>,
    politeness_rate: 0,
    request_styles: {} as Record<string, number>,
    peak_hours: {} as Record<string, number>
  }

  const filipinoPhrases = [
    'pabili po', 'may stock po', 'magkano po', 'wala po ba',
    'sige po', 'salamat po', 'pakibot po', 'may ice cream po',
    'pahiram po', 'utang po', 'bayad po', 'sukli po'
  ]

  let politeTransactions = 0

  transactions.forEach(t => {
    if (!t.transcription) return

    const lowerTrans = t.transcription.toLowerCase()
    
    // Count politeness markers
    if (lowerTrans.includes('po') || lowerTrans.includes('opo')) {
      politeTransactions++
    }

    // Count phrase occurrences
    filipinoPhrases.forEach(phrase => {
      if (lowerTrans.includes(phrase)) {
        patterns.common_phrases[phrase] = (patterns.common_phrases[phrase] || 0) + 1
      }
    })

    // Track request styles
    if (t.request_type) {
      patterns.request_styles[t.request_type] = (patterns.request_styles[t.request_type] || 0) + 1
    }

    // Track peak hours
    const hour = new Date(t.created_at).getHours()
    const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    patterns.peak_hours[timeSlot] = (patterns.peak_hours[timeSlot] || 0) + 1
  })

  patterns.politeness_rate = transactions.length > 0 
    ? (politeTransactions / transactions.length) * 100 
    : 0

  return patterns
}

// Match buyer persona from real data
function matchPersonaFromRealData(transactions: any[], profile?: string) {
  const personas = {
    'Juan - Rural Male Worker': {
      criteria: (t: any) => 
        t.customer_gender === 'Male' &&
        t.customer_age >= 25 && t.customer_age <= 44 &&
        t.payment_method === 'cash',
      matches: 0,
      typical_products: ['cigarettes', 'softdrinks', 'alcohol']
    },
    'Maria - Urban Housewife': {
      criteria: (t: any) =>
        t.customer_gender === 'Female' &&
        t.customer_age >= 35 && t.customer_age <= 54 &&
        (t.payment_method === 'GCash' || t.transcription?.includes('pamilya')),
      matches: 0,
      typical_products: ['cooking oil', 'rice', 'vegetables', 'household items']
    },
    'Carlo - Young Professional': {
      criteria: (t: any) =>
        t.customer_age >= 18 && t.customer_age <= 34 &&
        ['GCash', 'PayMaya', 'card'].includes(t.payment_method),
      matches: 0,
      typical_products: ['energy drinks', 'snacks', 'mobile load']
    },
    'Lola Rosa - Elderly Pensioner': {
      criteria: (t: any) =>
        t.customer_age >= 55 &&
        t.payment_method === 'cash' &&
        t.total_amount < 50,
      matches: 0,
      typical_products: ['medicine', 'bread', 'coffee']
    }
  }

  // Count matches for each persona
  transactions.forEach(t => {
    Object.entries(personas).forEach(([name, persona]) => {
      if (persona.criteria(t)) {
        persona.matches++
      }
    })
  })

  // Sort by match count
  const sortedPersonas = Object.entries(personas)
    .map(([name, data]) => ({
      name,
      confidence: transactions.length > 0 ? (data.matches / transactions.length) * 100 : 0,
      typical_products: data.typical_products
    }))
    .sort((a, b) => b.confidence - a.confidence)

  return sortedPersonas[0]
}

// Get substitution patterns from real data
async function getSubstitutionPatterns() {
  const { data } = await supabase
    .from('substitution_patterns')
    .select('*')
    .order('acceptance_rate', { ascending: false })
    .limit(10)

  return data || []
}

// Infer transaction from partial data
async function inferTransactionFromPartial(partial: any) {
  const spent = partial.payment_amount - partial.change_given
  
  // Get similar real transactions
  const transactions = await getRealTransactionContext({}, spent)
  
  // Get substitution patterns
  const substitutions = await getSubstitutionPatterns()
  
  // Extract patterns
  const culturalPatterns = extractFilipinoPatterns(transactions)
  const persona = matchPersonaFromRealData(transactions, partial.customer_profile)
  
  // Analyze likely products based on amount and patterns
  const productFrequency: Record<string, number> = {}
  transactions.forEach(t => {
    t.transaction_products?.forEach((tp: any) => {
      const productName = tp.products?.name
      if (productName) {
        productFrequency[productName] = (productFrequency[productName] || 0) + 1
      }
    })
  })
  
  const likelyProducts = Object.entries(productFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([product, count]) => ({
      product,
      probability: (count / transactions.length) * 100
    }))

  return {
    spent_amount: spent,
    confidence_score: transactions.length > 10 ? 0.85 : 0.65,
    buyer_persona: persona,
    likely_products: likelyProducts,
    cultural_context: culturalPatterns,
    similar_transactions: transactions.length,
    substitution_opportunities: substitutions.slice(0, 3)
  }
}

// Generate insights from real data
async function generateRealDataInsights(query: string, context: any) {
  const insights = []

  // Add substitution insights if relevant
  if (context.substitution_patterns?.length > 0) {
    const topSub = context.substitution_patterns[0]
    insights.push(`Substitution Insight: When ${topSub.original_product} is out of stock, ${(topSub.acceptance_rate * 100).toFixed(0)}% of customers accept ${topSub.substitute_product} as alternative.`)
  }

  // Add cultural insights
  if (context.cultural_patterns?.politeness_rate > 80) {
    insights.push(`Cultural Note: ${context.cultural_patterns.politeness_rate.toFixed(0)}% of customers use "po" showing high respect culture in this area.`)
  }

  // Add payment insights
  const digitalPayments = context.transactions?.filter((t: any) => 
    ['GCash', 'PayMaya'].includes(t.payment_method)
  ).length || 0
  
  if (context.transactions?.length > 0) {
    const digitalRate = (digitalPayments / context.transactions.length) * 100
    insights.push(`Payment Trend: ${digitalRate.toFixed(0)}% use digital payments (GCash/PayMaya), ${(100 - digitalRate).toFixed(0)}% still prefer cash.`)
  }

  return insights
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const query: EnhancedQuery = await req.json()

    let analysisContext: any = {}
    let additionalPrompt = ''

    // Handle transaction inference from partial data
    if (query.analyze_partial_transaction) {
      const inference = await inferTransactionFromPartial(query.analyze_partial_transaction)
      analysisContext.transaction_inference = inference
      
      additionalPrompt += `\n\nTRANSACTION INFERENCE:
Customer paid ₱${query.analyze_partial_transaction.payment_amount} and received ₱${query.analyze_partial_transaction.change_given} change.
Spent: ₱${inference.spent_amount}
Likely buyer: ${inference.buyer_persona.name} (${inference.buyer_persona.confidence.toFixed(0)}% confidence)
Likely products: ${inference.likely_products.map((p: any) => `${p.product} (${p.probability.toFixed(0)}%)`).join(', ')}
Based on ${inference.similar_transactions} similar real transactions.`
    }

    // Get real transaction context
    const transactions = await getRealTransactionContext(query.filters)
    analysisContext.transactions = transactions
    analysisContext.transaction_count = transactions.length

    // Extract cultural patterns if requested
    if (query.include_cultural_context) {
      analysisContext.cultural_patterns = extractFilipinoPatterns(transactions)
    }

    // Get substitution patterns if requested
    if (query.include_substitution_analysis) {
      analysisContext.substitution_patterns = await getSubstitutionPatterns()
    }

    // Generate real data insights
    const realInsights = await generateRealDataInsights(query.query, analysisContext)

    // Prepare enhanced context for LLM
    const contextSummary = `
REAL DATA CONTEXT (${transactions.length} transactions analyzed):

Transaction Summary:
- Total Value: ₱${transactions.reduce((sum, t) => sum + t.total_amount, 0).toFixed(2)}
- Average Transaction: ₱${transactions.length > 0 ? (transactions.reduce((sum, t) => sum + t.total_amount, 0) / transactions.length).toFixed(2) : '0'}
- Digital Payments: ${transactions.filter(t => ['GCash', 'PayMaya'].includes(t.payment_method)).length} transactions

${realInsights.join('\n')}

${additionalPrompt}

Remember: All insights are based on REAL Project Scout data from 18,000+ Philippine retail transactions.`

    // Call Groq for enhanced analysis
    const messages = [
      {
        role: 'system',
        content: ENHANCED_EXPERT_PROMPT
      },
      {
        role: 'user',
        content: `${query.query}\n\nCONTEXT:${contextSummary}`
      }
    ]

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    const result = await groqResponse.json()
    const answer = result.choices?.[0]?.message?.content || 'No response generated'

    // Log the enhanced query
    await supabase
      .from('sari_sari_queries')
      .insert({
        query: query.query,
        filters: query.filters,
        response: answer,
        transaction_count: transactions.length,
        response_time_ms: result.usage?.total_time || 0,
        metadata: {
          used_real_data: true,
          project_scout_integration: true,
          analysis_features: {
            substitution_analysis: query.include_substitution_analysis,
            persona_matching: query.include_persona_matching,
            cultural_context: query.include_cultural_context,
            transaction_inference: !!query.analyze_partial_transaction
          }
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        context: analysisContext,
        data_source: 'project_scout_18k_transactions',
        usage: result.usage
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Enhanced Sari-Sari Expert error:', error)
    
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

// Deploy with:
// supabase functions deploy enhanced-sari-sari-expert
// Uses same GROQ_API_KEY secret