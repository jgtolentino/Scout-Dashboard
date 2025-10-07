import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Query retail data
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('stock_quantity', { ascending: false })
      .limit(5)
    
    const { data: sales } = await supabase
      .from('sales')
      .select('*, products(*)')
      .order('sale_date', { ascending: false })
      .limit(10)
    
    // Generate response
    const response = {
      query: query || "retail overview",
      insights: {
        top_products: products || [],
        recent_sales: sales || [],
        summary: `Found ${products?.length || 0} products and ${sales?.length || 0} recent sales`
      },
      timestamp: new Date().toISOString()
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
