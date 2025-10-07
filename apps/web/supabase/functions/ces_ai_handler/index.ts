/**
 * CES (Creative Effectiveness System) AI Handler
 * Processes creative effectiveness and campaign performance queries
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CESRequest {
  query: string;
  intent?: "creative" | "effectiveness";
  filters?: {
    campaign_id?: string;
    brand?: string;
    date_range?: { from: string; to: string };
    media_type?: string;
  };
  limit?: number;
}

serve(async (req) => {
  const startTime = performance.now();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const supabase = createClient(SUPABASE_URL, SRK, { 
    auth: { persistSession: false } 
  });

  try {
    const body: CESRequest = await req.json().catch(() => ({}));
    const { query, intent, filters, limit = 10 } = body;

    if (!query?.trim()) {
      return new Response(JSON.stringify({ 
        error: "Query parameter is required" 
      }), { status: 400 });
    }

    let data: any = {};
    const params = { 
      p_query: query,
      p_limit: limit,
      p_filters: filters || {}
    };

    switch (intent) {
      case "creative":
        // Get creative performance data
        const { data: creativeData, error: creativeError } = await supabase
          .rpc("ces_creative_analysis", params);
        
        if (creativeError) throw creativeError;
        
        data = {
          type: "creative_analysis",
          campaigns: creativeData?.campaigns || [],
          creative_assets: creativeData?.creative_assets || [],
          performance_metrics: creativeData?.performance_metrics || {},
          insights: creativeData?.insights || []
        };
        break;
        
      case "effectiveness":
        // Get campaign effectiveness data
        const { data: effectivenessData, error: effectivenessError } = await supabase
          .rpc("ces_effectiveness_analysis", params);
        
        if (effectivenessError) throw effectivenessError;
        
        data = {
          type: "effectiveness_analysis",
          attribution_data: effectivenessData?.attribution || {},
          roi_metrics: effectivenessData?.roi_metrics || {},
          conversion_funnel: effectivenessData?.conversion_funnel || [],
          recommendations: effectivenessData?.recommendations || []
        };
        break;
        
      default:
        // General CES query - return mixed results
        const [creativeRes, effectivenessRes] = await Promise.allSettled([
          supabase.rpc("ces_creative_analysis", { ...params, p_limit: 5 }),
          supabase.rpc("ces_effectiveness_analysis", { ...params, p_limit: 5 })
        ]);
        
        data = {
          type: "mixed_analysis",
          creative: creativeRes.status === "fulfilled" ? creativeRes.value.data : null,
          effectiveness: effectivenessRes.status === "fulfilled" ? effectivenessRes.value.data : null
        };
    }

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    // Log the request
    supabase.from("ces_handler_logs").insert({
      query: query.substring(0, 500),
      intent,
      filters,
      latency_ms: latencyMs,
      result_count: Array.isArray(data.campaigns) ? data.campaigns.length : 
                   Array.isArray(data.attribution_data) ? Object.keys(data.attribution_data).length : 0
    }).then().catch(() => {});

    return new Response(JSON.stringify({
      data,
      latency_ms: latencyMs,
      explain: `ces-handler-v1(${intent || 'mixed'})`
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });

  } catch (error) {
    console.error("CES AI handler error:", error);
    return new Response(JSON.stringify({ 
      error: String(error?.message || error) 
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});