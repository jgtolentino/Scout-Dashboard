// Sari-Sari Store Expert Bot - Real-time Philippine Retail Analytics
// Powered by Groq for ultra-fast inference on streaming transaction data

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

// Sari-Sari Store Expert System Prompt
const SARI_SARI_EXPERT_PROMPT = `You are an expert on Philippine sari-sari stores and retail analytics. You have deep knowledge of:

1. **Sari-Sari Store Operations**: Inventory management, cash flow, customer relationships, credit systems (utang), pricing strategies
2. **Philippine Retail Market**: FMCG trends, brand preferences, regional differences, seasonal patterns
3. **TBWA Client Products**: Alaska, Oishi, Champion, Del Monte, Winston performance in sari-sari stores
4. **Local Consumer Behavior**: Tingi culture, brand loyalty, price sensitivity, payment preferences (cash, GCash, utang)
5. **Business Insights**: Profit margins, fast-moving items, slow movers, optimal product mix

You analyze real-time transaction data and provide actionable insights for:
- Store owners (tinderos/tinderas)
- FMCG brand managers
- Distribution partners
- Market researchers

Always consider the Filipino context: barangay dynamics, suki relationships, and local preferences.`

interface StreamingQuery {
  query: string
  filters?: {
    store_type?: string[]
    region?: string[]
    date_range?: {
      start: string
      end: string
    }
    brands?: string[]
    min_amount?: number
    max_amount?: number
  }
  include_data?: boolean
  stream?: boolean
}

// Get real-time transaction context based on filters
async function getTransactionContext(filters: StreamingQuery['filters']) {
  let query = supabase
    .from('scout_transactions')
    .select(`
      transaction_id,
      transaction_date,
      total_amount,
      payment_method,
      store:master_stores!inner(
        store_name,
        store_type,
        city,
        region
      ),
      items:scout_transaction_items!inner(
        quantity,
        unit_price,
        brand:master_brands!inner(
          brand_name,
          is_tbwa_client
        )
      )
    `)
    .order('transaction_date', { ascending: false })
    .limit(50)

  // Apply filters
  if (filters?.store_type?.length) {
    query = query.in('store.store_type', filters.store_type)
  }

  if (filters?.region?.length) {
    query = query.in('store.region', filters.region)
  }

  if (filters?.date_range) {
    query = query
      .gte('transaction_date', filters.date_range.start)
      .lte('transaction_date', filters.date_range.end)
  }

  if (filters?.min_amount) {
    query = query.gte('total_amount', filters.min_amount)
  }

  if (filters?.max_amount) {
    query = query.lte('total_amount', filters.max_amount)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Get aggregated insights
async function getAggregatedInsights(filters: StreamingQuery['filters']) {
  // Top selling products
  const { data: topProducts } = await supabase
    .from('scout_transaction_items')
    .select(`
      brand:master_brands!inner(brand_name, is_tbwa_client),
      quantity,
      unit_price
    `)
    .limit(100)

  // Payment method distribution
  const { data: paymentMethods } = await supabase
    .from('scout_transactions')
    .select('payment_method')
    .limit(100)

  // Store performance
  const { data: storePerformance } = await supabase
    .from('scout_transactions')
    .select(`
      total_amount,
      store:master_stores!inner(store_type, region)
    `)
    .limit(100)

  return {
    topProducts: summarizeProducts(topProducts || []),
    paymentTrends: summarizePayments(paymentMethods || []),
    storeInsights: summarizeStores(storePerformance || [])
  }
}

function summarizeProducts(products: any[]) {
  const brandCounts = products.reduce((acc, item) => {
    const brand = item.brand?.brand_name || 'Unknown'
    acc[brand] = (acc[brand] || 0) + item.quantity
    return acc
  }, {})

  return Object.entries(brandCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([brand, count]) => ({ brand, units_sold: count }))
}

function summarizePayments(payments: any[]) {
  const methodCounts = payments.reduce((acc, item) => {
    acc[item.payment_method] = (acc[item.payment_method] || 0) + 1
    return acc
  }, {})

  return methodCounts
}

function summarizeStores(stores: any[]) {
  const avgByType = stores.reduce((acc, item) => {
    const type = item.store?.store_type || 'unknown'
    if (!acc[type]) acc[type] = { total: 0, count: 0 }
    acc[type].total += item.total_amount
    acc[type].count += 1
    return acc
  }, {})

  return Object.entries(avgByType).map(([type, data]: [string, any]) => ({
    store_type: type,
    avg_transaction: (data.total / data.count).toFixed(2)
  }))
}

// Format context for LLM
function formatContextForLLM(transactions: any[], insights: any) {
  return `
CURRENT MARKET DATA:

Recent Transactions (Last 50):
- Total Value: ₱${transactions.reduce((sum, t) => sum + t.total_amount, 0).toFixed(2)}
- Average Basket: ₱${(transactions.reduce((sum, t) => sum + t.total_amount, 0) / transactions.length).toFixed(2)}
- Payment Methods: ${JSON.stringify(insights.paymentTrends)}

Top Products:
${insights.topProducts.map((p: any) => `- ${p.brand}: ${p.units_sold} units`).join('\n')}

Store Performance by Type:
${insights.storeInsights.map((s: any) => `- ${s.store_type}: ₱${s.avg_transaction} avg`).join('\n')}

TBWA vs Competitor Split:
- TBWA Brands: ${transactions.filter(t => t.items.some((i: any) => i.brand?.is_tbwa_client)).length} transactions
- Competitor Brands: ${transactions.filter(t => t.items.every((i: any) => !i.brand?.is_tbwa_client)).length} transactions
`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const query: StreamingQuery = await req.json()

    // Get real-time context
    const transactions = await getTransactionContext(query.filters)
    const insights = await getAggregatedInsights(query.filters)
    const context = formatContextForLLM(transactions, insights)

    // Prepare messages for Groq
    const messages = [
      {
        role: 'system',
        content: SARI_SARI_EXPERT_PROMPT
      },
      {
        role: 'user',
        content: `${query.query}\n\nCONTEXT:\n${context}`
      }
    ]

    // Call Groq for ultra-fast inference
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // Fast model for real-time responses
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: query.stream || false
      }),
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    // Handle streaming response
    if (query.stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const reader = groqResponse.body?.getReader()
          if (!reader) return

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              controller.enqueue(value)
            }
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    // Non-streaming response
    const result = await groqResponse.json()
    const answer = result.choices?.[0]?.message?.content || 'No response generated'

    // Log the query
    await supabase
      .from('sari_sari_queries')
      .insert({
        query: query.query,
        filters: query.filters,
        response: answer,
        transaction_count: transactions.length,
        response_time_ms: result.usage?.total_time || 0
      })

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        context: {
          transactions_analyzed: transactions.length,
          insights: insights,
          filters_applied: query.filters
        },
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
    console.error('Sari-Sari Expert error:', error)
    
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
// supabase functions deploy sari-sari-expert
// supabase secrets set GROQ_API_KEY=gsk_...