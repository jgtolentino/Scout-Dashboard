import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditLogEntry {
  mcp_server_name: string;
  operation_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'FUNCTION';
  schema_name?: string;
  table_name?: string;
  user_context: string;
  role: string;
  query?: string;
  affected_rows?: number;
  error?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook secret
    const webhookSecret = Deno.env.get('MCP_WEBHOOK_SECRET')
    const providedSecret = req.headers.get('x-webhook-secret')
    
    if (!webhookSecret || providedSecret !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse audit log entry
    const auditEntry: AuditLogEntry = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store in audit log table
    const { data, error } = await supabase
      .from('mcp_audit_logs')
      .insert({
        mcp_server_name: auditEntry.mcp_server_name,
        operation_type: auditEntry.operation_type,
        schema_name: auditEntry.schema_name,
        table_name: auditEntry.table_name,
        user_context: auditEntry.user_context,
        role: auditEntry.role,
        query: auditEntry.query,
        affected_rows: auditEntry.affected_rows,
        error: auditEntry.error,
        metadata: auditEntry.metadata,
        ip_address: auditEntry.ip_address || req.headers.get('x-forwarded-for') || 'unknown',
        created_at: auditEntry.timestamp
      })

    if (error) {
      console.error('Failed to insert audit log:', error)
      throw error
    }

    // Check for suspicious activity
    const suspiciousPatterns = [
      { pattern: /DROP\s+TABLE/i, severity: 'critical', description: 'Table deletion attempt' },
      { pattern: /TRUNCATE/i, severity: 'high', description: 'Table truncation attempt' },
      { pattern: /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i, severity: 'critical', description: 'Mass deletion attempt' },
      { pattern: /UPDATE.*SET.*WHERE\s+1\s*=\s*1/i, severity: 'high', description: 'Mass update attempt' },
      { pattern: /ALTER\s+TABLE.*DROP\s+COLUMN/i, severity: 'high', description: 'Column deletion attempt' },
      { pattern: /GRANT|REVOKE/i, severity: 'high', description: 'Permission change attempt' },
    ]

    // Check for suspicious activity
    let alertRequired = false
    let alertDetails: any = null

    if (auditEntry.query) {
      for (const { pattern, severity, description } of suspiciousPatterns) {
        if (pattern.test(auditEntry.query)) {
          alertRequired = true
          alertDetails = {
            severity,
            description,
            query: auditEntry.query,
            mcp_server: auditEntry.mcp_server_name,
            user_context: auditEntry.user_context,
            timestamp: auditEntry.timestamp
          }
          break
        }
      }
    }

    // Check for high-volume operations
    if (auditEntry.affected_rows && auditEntry.affected_rows > 1000) {
      alertRequired = true
      alertDetails = {
        severity: 'medium',
        description: 'High-volume operation detected',
        affected_rows: auditEntry.affected_rows,
        operation: auditEntry.operation_type,
        mcp_server: auditEntry.mcp_server_name,
        user_context: auditEntry.user_context,
        timestamp: auditEntry.timestamp
      }
    }

    // Send alerts if needed
    if (alertRequired && alertDetails) {
      await sendSecurityAlert(alertDetails, supabase)
    }

    // Check rate limits
    const rateLimitViolation = await checkRateLimit(
      auditEntry.mcp_server_name,
      auditEntry.user_context,
      supabase
    )

    if (rateLimitViolation) {
      await sendRateLimitAlert(rateLimitViolation, supabase)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        logged: true,
        alertTriggered: alertRequired 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Audit webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function sendSecurityAlert(alertDetails: any, supabase: any) {
  try {
    // Store security alert
    await supabase
      .from('mcp_security_alerts')
      .insert({
        severity: alertDetails.severity,
        description: alertDetails.description,
        details: alertDetails,
        resolved: false,
        created_at: new Date().toISOString()
      })

    // In production, also send to:
    // - Slack webhook
    // - PagerDuty
    // - Email to security team
    console.log('Security alert triggered:', alertDetails)

  } catch (error) {
    console.error('Failed to send security alert:', error)
  }
}

async function checkRateLimit(
  mcpServerName: string, 
  userContext: string,
  supabase: any
): Promise<any> {
  try {
    // Check operations in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('mcp_audit_logs')
      .select('count')
      .eq('mcp_server_name', mcpServerName)
      .eq('user_context', userContext)
      .gte('created_at', oneHourAgo)

    if (error) throw error

    const operationCount = data?.[0]?.count || 0

    // Define rate limits per server type
    const rateLimits: Record<string, number> = {
      'supabase_hr_intelligence': 500,
      'supabase_finance_operations': 500,
      'supabase_executive_dashboard': 1000,
      'supabase_scout_dashboard': 2000,
      'supabase_agent_repository': 5000,
      'default': 300
    }

    const limit = rateLimits[mcpServerName] || rateLimits.default

    if (operationCount > limit) {
      return {
        mcp_server: mcpServerName,
        user_context: userContext,
        operation_count: operationCount,
        limit: limit,
        period: '1 hour'
      }
    }

    return null

  } catch (error) {
    console.error('Rate limit check failed:', error)
    return null
  }
}

async function sendRateLimitAlert(violation: any, supabase: any) {
  try {
    await supabase
      .from('mcp_rate_limit_violations')
      .insert({
        mcp_server_name: violation.mcp_server,
        user_context: violation.user_context,
        operation_count: violation.operation_count,
        limit_threshold: violation.limit,
        period: violation.period,
        created_at: new Date().toISOString()
      })

    console.log('Rate limit violation detected:', violation)

  } catch (error) {
    console.error('Failed to log rate limit violation:', error)
  }
}