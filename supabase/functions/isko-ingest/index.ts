// Isko Agent - Supabase Edge Function
// LLM-free, deterministic SKU ingestion endpoint

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { 
      sku_id, 
      brand_name, 
      sku_name,
      pack_size,
      pack_unit,
      category, 
      msrp,
      source_url,
      metadata 
    } = await req.json()

    // Validate required fields
    if (!sku_id || !sku_name) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Missing required fields: sku_id and sku_name are mandatory' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Prepare data for upsert
    const skuData = {
      sku_id,
      brand_name: brand_name || sku_name.split(' ')[0], // Infer brand if not provided
      sku_name,
      pack_size: pack_size || null,
      pack_unit: pack_unit || null,
      category: category || 'Uncategorized',
      msrp: msrp || null,
      updated_at: new Date().toISOString()
    }

    // Upsert to sku_catalog
    const { data, error } = await supabaseClient
      .from('sku_catalog')
      .upsert([skuData], { 
        onConflict: 'sku_id',
        returning: 'minimal' 
      })

    if (error) {
      console.error('Supabase error:', error)
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Database operation failed',
          error: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log scraping activity
    if (source_url) {
      await supabaseClient
        .from('isko_scraping_history')
        .insert([{
          category: category || 'Uncategorized',
          url: source_url,
          items_found: 1,
          items_new: 1,
          items_updated: 0,
          status: 'success',
          metadata: metadata || {}
        }])
        .catch(err => console.error('Failed to log scraping history:', err))
    }

    // Log ingestion attempt
    const startTime = Date.now()
    await supabaseClient
      .from('sku_ingest_log')
      .insert([{
        sku_id: sku_id,
        sku_name: sku_name,
        source_url: source_url || null,
        source_type: 'edge_function',
        status: 'success',
        request_payload: skuData,
        processing_time_ms: Date.now() - startTime,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      }])
      .catch(err => console.error('Failed to log ingestion:', err))

    // Return success response
    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'SKU ingested successfully',
        sku_id: sku_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: 'Invalid request format',
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})