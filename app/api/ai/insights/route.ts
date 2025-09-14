import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AgentInsight, AgentType } from '@/types/recommendation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentType = searchParams.get('agent') as AgentType | null
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '20')

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    let query = supabase
      .from('platinum.agent_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (agentType) {
      query = query.eq('agent_type', agentType)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    // Only show non-expired insights
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

    const { data: insights, error } = await query

    if (error) {
      console.error('Error fetching insights:', error)
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({ insights })

  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agent_type,
      title,
      description,
      severity,
      metrics,
      recommendations,
      expires_at,
      source_data
    } = body

    // Validate required fields
    if (!agent_type || !title || !description) {
      return NextResponse.json(
        { error: 'agent_type, title, and description are required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const insight: Partial<AgentInsight> = {
      agent_type,
      title,
      description,
      severity: severity || 'info',
      metrics: metrics || {},
      recommendations: recommendations || [],
      expires_at: expires_at || null,
      source_data: source_data || {},
      tenant_id: 'default' // In production, extract from auth
    }

    const { data, error } = await supabase
      .from('platinum.agent_insights')
      .insert([insight])
      .select()
      .single()

    if (error) {
      console.error('Error creating insight:', error)
      return NextResponse.json(
        { error: 'Failed to create insight' },
        { status: 500 }
      )
    }

    return NextResponse.json({ insight: data }, { status: 201 })

  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to create insight' },
      { status: 500 }
    )
  }
}

// Agent health check endpoint - returns status of all agents
export async function HEAD(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check recent activity for each agent type
    const agentTypes: AgentType[] = [
      'sales_performance',
      'inventory_optimization', 
      'customer_behavior',
      'geographic_analysis',
      'anomaly_detection'
    ]

    const healthStatus = await Promise.all(
      agentTypes.map(async (agentType) => {
        const { data, error } = await supabase
          .from('platinum.agent_insights')
          .select('id, created_at')
          .eq('agent_type', agentType)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
          .limit(1)

        const isHealthy = !error && data && data.length > 0
        const lastActivity = data && data.length > 0 ? data[0].created_at : null

        return {
          agent: agentType,
          healthy: isHealthy,
          lastActivity
        }
      })
    )

    const overallHealth = healthStatus.every(agent => agent.healthy)

    return NextResponse.json({
      healthy: overallHealth,
      agents: healthStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Agent health check error:', error)
    return NextResponse.json(
      { 
        healthy: false,
        error: 'Failed to check agent health',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}