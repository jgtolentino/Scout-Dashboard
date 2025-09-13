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
    const { query, metrics = ['impressions', 'clicks'] } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Query campaign data
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*, metrics(*)')
      .order('created_at', { ascending: false })
    
    // Calculate ROI and performance
    const performance = campaigns?.map(campaign => ({
      name: campaign.name,
      platform: campaign.platform,
      budget: campaign.budget,
      metrics: campaign.metrics?.[0] || {},
      roi: campaign.metrics?.[0] ? 
        ((campaign.metrics[0].conversions * 100 - campaign.metrics[0].spend) / campaign.metrics[0].spend * 100).toFixed(2) + '%' 
        : '0%'
    }))
    
    return new Response(JSON.stringify({
      query: query || "campaign performance",
      campaigns: performance || [],
      summary: `Analyzing ${campaigns?.length || 0} campaigns`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
