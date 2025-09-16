import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import AnalyticsService from '@/lib/services/analytics'
import { TransactionFilters } from '@/lib/dal/transactions'
import { AgentType } from '@/types/recommendation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters for AI insights
    const filters: TransactionFilters = {
      dateFrom: searchParams.get("from") || "2024-01-01",
      dateTo: searchParams.get("to") || "2025-12-31",
      regions: searchParams.get("regions")?.split(",").filter(Boolean),
      provinces: searchParams.get("provinces")?.split(",").filter(Boolean),
      stores: searchParams.get("stores")?.split(",").filter(Boolean),
      brands: searchParams.get("brands")?.split(",").filter(Boolean),
      categories: searchParams.get("categories")?.split(",").filter(Boolean)
    }
    
    const analysisType = searchParams.get("type") || "trends"
    const timeframe = searchParams.get("timeframe") || "30d"
    const confidenceThreshold = parseFloat(searchParams.get("confidence") || "0.7")
    const context = searchParams.get("context") || "general"
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '20')

    const analyticsService = new AnalyticsService()
    
    // Generate AI insights based on current data
    const result = await analyticsService.getAIInsights({
      context,
      filters,
      analysisType: analysisType as 'trends' | 'anomalies' | 'predictions' | 'recommendations',
      timeframe,
      confidenceThreshold
    })

    if (result.error) {
      console.error('AI insights error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Filter insights based on query parameters
    let insights = result.insights
    if (severity) {
      insights = insights.filter(insight => insight.priority === severity)
    }
    insights = insights.slice(0, limit)

    return NextResponse.json({ 
      insights,
      meta: {
        analysis_type: analysisType,
        timeframe,
        confidence_threshold: confidenceThreshold,
        filters_applied: Object.keys(filters).filter(key => filters[key as keyof TransactionFilters]),
        total_insights: insights.length
      }
    })

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
    const { metrics, days, analysisType } = body

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Metrics array is required' }, { status: 400 })
    }

    const analyticsService = new AnalyticsService()
    
    if (analysisType === 'predictions') {
      // Generate predictions for specified metrics
      const result = await analyticsService.getPredictions(metrics, days || 30)

      if (result.error) {
        console.error('AI predictions error:', result.error)
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ 
        predictions: result.predictions,
        insights: result.insights,
        meta: {
          metrics_requested: metrics,
          forecast_days: days || 30,
          total_predictions: result.predictions.length
        }
      })
    } else if (analysisType === 'anomalies') {
      // Detect anomalies in specified metrics
      const results = await Promise.all(
        metrics.map(metric => analyticsService.detectAnomalies(metric, '7d'))
      )
      
      const anomalies = results.flatMap(result => result.anomalies)
      const insights = results.flatMap(result => result.insights)

      return NextResponse.json({ 
        anomalies,
        insights,
        meta: {
          metrics_analyzed: metrics,
          total_anomalies: anomalies.length,
          total_insights: insights.length
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
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