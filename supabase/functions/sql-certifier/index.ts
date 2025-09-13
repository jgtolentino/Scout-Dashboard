import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FORBIDDEN_KEYWORDS = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter', 'create']
const MAX_ROWS = parseInt(Deno.env.get('SQL_CERTIFIER_MAX_ROWS') || '1000')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sql, query, validate } = await req.json()
    const sqlToCheck = sql || query || validate || ''
    
    if (!sqlToCheck) {
      return new Response(JSON.stringify({
        approved: false,
        error: "No SQL provided"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }
    
    // Security check
    const lowerSQL = sqlToCheck.toLowerCase()
    const violations = FORBIDDEN_KEYWORDS.filter(keyword => lowerSQL.includes(keyword))
    
    if (violations.length > 0) {
      return new Response(JSON.stringify({
        approved: false,
        violations,
        error: `Forbidden operations detected: ${violations.join(', ')}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Check for LIMIT clause
    if (!lowerSQL.includes('limit')) {
      return new Response(JSON.stringify({
        approved: false,
        warning: `No LIMIT clause detected. Maximum ${MAX_ROWS} rows will be returned.`,
        suggested: sqlToCheck + ` LIMIT ${MAX_ROWS}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({
      approved: true,
      sql: sqlToCheck,
      message: "SQL query approved for execution"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      approved: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
