/**
 * AI/LLM Data Access Layer
 * Handles AI-powered analytics, insights, and chat functionality
 */

import BaseDAL from './base'
import { ChatMessage, AIInsight, RecommendationData } from '@/lib/types/ai'

export interface AIAnalysisParams {
  context: string
  filters?: Record<string, any>
  analysisType: 'trends' | 'anomalies' | 'predictions' | 'recommendations'
  timeframe?: string
  confidenceThreshold?: number
}

export interface ChatContext {
  conversationId: string
  userContext?: Record<string, any>
  dashboardState?: Record<string, any>
  previousMessages?: ChatMessage[]
}

class AIDAL extends BaseDAL {

  /**
   * Store and retrieve chat messages
   */
  async storeChatMessage(message: ChatMessage): Promise<{ data: ChatMessage | null; error: string | null }> {
    return this.executeQuery<ChatMessage>(
      async (client) => {
        const { data, error } = await client
          .schema('platinum')
          .from('chat_messages')
          .insert([message])
          .select()
          .single()

        return { data, error }
      }
    )
  }

  async getChatHistory(conversationId: string, limit: number = 50): Promise<{ data: ChatMessage[] | null; error: string | null }> {
    const cacheKey = `chat_history_${conversationId}`
    
    return this.executeQuery<ChatMessage[]>(
      async (client) => {
        const { data, error } = await client
          .schema('platinum')
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(limit)

        return { data, error }
      },
      cacheKey,
      60000 // 1 minute cache for chat
    )
  }

  /**
   * Generate AI insights from transaction data
   */
  async generateInsights(params: AIAnalysisParams): Promise<{ data: AIInsight[] | null; error: string | null }> {
    const cacheKey = `insights_${JSON.stringify(params)}`
    
    return this.executeQuery<AIInsight[]>(
      async (client) => {
        // First, get the data context for AI analysis
        const contextQuery = this.buildContextQuery(params)
        const { data: contextData, error: contextError } = await (client as any).rpc('get_ai_context', {
          analysis_type: params.analysisType,
          filters: params.filters || {},
          timeframe: params.timeframe || '30d'
        })

        if (contextError) {
          return { data: null, error: contextError }
        }

        // For now, generate rule-based insights
        // In production, this would call OpenAI/Anthropic APIs
        const insights = this.generateRuleBasedInsights(contextData, params)
        
        // Store insights for tracking
        const { error: storeError } = await client
          .schema('platinum')
          .from('ai_insights')
          .insert(insights.map(insight => ({
            ...insight,
            created_at: new Date().toISOString(),
            analysis_params: params
          })))

        if (storeError) {
          console.warn('Failed to store insights:', storeError)
        }

        return { data: insights, error: null }
      },
      cacheKey,
      600000 // 10 minutes cache
    )
  }

  /**
   * Get AI-powered recommendations
   */
  async getRecommendations(
    section: string, 
    userContext: Record<string, any> = {}
  ): Promise<{ data: RecommendationData[] | null; error: string | null }> {
    const cacheKey = `recommendations_${section}_${JSON.stringify(userContext)}`
    
    return this.executeQuery<RecommendationData[]>(
      async (client) => {
        // Get recent performance data for recommendations
        const { data: performanceData, error: perfError } = await (client as any).rpc('get_recommendation_context', {
          section,
          user_context: userContext
        })

        if (perfError) {
          return { data: null, error: perfError }
        }

        // Generate contextual recommendations
        const recommendations = this.generateRecommendations(section, performanceData, userContext)
        
        return { data: recommendations, error: null }
      },
      cacheKey,
      300000 // 5 minutes cache
    )
  }

  /**
   * Perform semantic search across transaction data and insights
   */
  async semanticSearch(query: string, filters: Record<string, any> = {}): Promise<{ data: any[] | null; error: string | null }> {
    const cacheKey = `semantic_${query}_${JSON.stringify(filters)}`
    
    return this.executeQuery<any[]>(
      async (client) => {
        // Use PostgreSQL full-text search for now
        // In production, this would use vector embeddings
        const { data, error } = await (client as any).rpc('semantic_search', {
          search_query: query,
          filters: filters,
          limit: 20
        })

        return { data, error }
      },
      cacheKey,
      300000 // 5 minutes cache
    )
  }

  /**
   * Detect anomalies in transaction patterns
   */
  async detectAnomalies(
    metric: string = 'sales',
    timeframe: string = '7d',
    sensitivity: number = 2.0
  ): Promise<{ data: any[] | null; error: string | null }> {
    const cacheKey = `anomalies_${metric}_${timeframe}_${sensitivity}`
    
    return this.executeQuery<any[]>(
      async (client) => {
        const { data, error } = await (client as any).rpc('detect_anomalies', {
          metric_name: metric,
          time_window: timeframe,
          sensitivity_threshold: sensitivity
        })

        return { data, error }
      },
      cacheKey,
      600000 // 10 minutes cache
    )
  }

  /**
   * Generate predictions for business metrics
   */
  async generatePredictions(
    metrics: string[],
    forecastDays: number = 30
  ): Promise<{ data: any[] | null; error: string | null }> {
    const cacheKey = `predictions_${metrics.join(',')}_${forecastDays}`
    
    return this.executeQuery<any[]>(
      async (client) => {
        // Simple linear regression for now
        // In production, use more sophisticated ML models
        const predictions = []
        
        for (const metric of metrics) {
          const { data: historicalData, error } = await (client as any)
            .from('v_trends_daily')
            .select(`day, ${metric}`)
            .order('day', { ascending: false })
            .limit(90) // Use 90 days for trend analysis

          if (error) continue

          const forecast = this.generateLinearForecast(historicalData, metric, forecastDays)
          predictions.push({
            metric,
            forecast,
            confidence: this.calculateForecastConfidence(historicalData)
          })
        }

        return { data: predictions, error: null }
      },
      cacheKey,
      1800000 // 30 minutes cache
    )
  }

  /**
   * Process natural language query for dashboard insights
   */
  async processNaturalLanguageQuery(
    query: string,
    context: ChatContext
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      // Parse intent from query
      const intent = this.parseQueryIntent(query)
      
      // Generate appropriate response based on intent
      let response
      switch (intent.type) {
        case 'data_request':
          response = await this.handleDataRequest(intent, context)
          break
        case 'analysis_request':
          response = await this.handleAnalysisRequest(intent, context)
          break
        case 'comparison_request':
          response = await this.handleComparisonRequest(intent, context)
          break
        default:
          response = await this.handleGeneralQuery(query, context)
      }

      return { data: response, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  // Private helper methods
  private buildContextQuery(params: AIAnalysisParams): string {
    // Build SQL query based on analysis parameters
    const baseQuery = `
      SELECT 
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as transactions,
        SUM(peso_value) as revenue,
        AVG(peso_value) as avg_order_value,
        COUNT(DISTINCT store_id) as unique_stores
      FROM transactions
      WHERE timestamp >= NOW() - INTERVAL '${params.timeframe || '30d'}'
    `
    
    if (params.filters) {
      // Add filter conditions
      Object.entries(params.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          baseQuery + ` AND ${key} = ANY($${value})`
        } else {
          baseQuery + ` AND ${key} = '${value}'`
        }
      })
    }
    
    return baseQuery + ' GROUP BY DATE_TRUNC(\'day\', timestamp) ORDER BY date'
  }

  private generateRuleBasedInsights(data: any[], params: AIAnalysisParams): AIInsight[] {
    const insights: AIInsight[] = []
    
    if (params.analysisType === 'trends') {
      // Detect trend patterns
      if (data.length >= 7) {
        const recentWeek = data.slice(-7)
        const previousWeek = data.slice(-14, -7)
        
        const recentAvg = recentWeek.reduce((sum, d) => sum + d.revenue, 0) / recentWeek.length
        const previousAvg = previousWeek.reduce((sum, d) => sum + d.revenue, 0) / previousWeek.length
        
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100
        
        insights.push({
          id: `trend_${Date.now()}`,
          type: 'trend',
          title: `Revenue ${changePercent > 0 ? 'Growth' : 'Decline'} Detected`,
          description: `Revenue has ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% compared to the previous week.`,
          confidence: Math.min(Math.abs(changePercent) / 10, 1),
          priority: changePercent > 15 || changePercent < -10 ? 'high' : 'medium',
          category: 'financial',
          recommendations: [
            changePercent > 15 ? 'Analyze successful strategies and scale them' : 'Investigate factors causing the decline',
            'Monitor closely for continued trend'
          ],
          created_at: new Date().toISOString()
        })
      }
    }
    
    if (params.analysisType === 'anomalies') {
      // Detect anomalies in data
      const revenues = data.map(d => d.revenue)
      const mean = revenues.reduce((sum, r) => sum + r, 0) / revenues.length
      const stdDev = Math.sqrt(revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / revenues.length)
      
      data.forEach((point, index) => {
        const zScore = Math.abs((point.revenue - mean) / stdDev)
        if (zScore > 2) {
          insights.push({
            id: `anomaly_${Date.now()}_${index}`,
            type: 'anomaly',
            title: `Revenue Anomaly on ${point.date}`,
            description: `Revenue of ₱${point.revenue.toLocaleString()} is ${zScore.toFixed(1)} standard deviations from normal.`,
            confidence: Math.min(zScore / 3, 1),
            priority: zScore > 3 ? 'high' : 'medium',
            category: 'operational',
            recommendations: [
              'Investigate the root cause of this anomaly',
              'Check for data quality issues or exceptional events'
            ],
            created_at: new Date().toISOString()
          })
        }
      })
    }
    
    return insights
  }

  private generateRecommendations(section: string, data: any[], context: Record<string, any>): RecommendationData[] {
    const recommendations: RecommendationData[] = []
    
    // Section-specific recommendations
    switch (section) {
      case 'transaction-trends':
        recommendations.push({
          id: `rec_trends_${Date.now()}`,
          type: 'optimization',
          title: 'Optimize Peak Hours',
          description: 'Focus marketing efforts during 2-4 PM when conversion rates are highest',
          impact: 'high',
          effort: 'medium',
          category: 'marketing',
          metrics: ['conversion_rate', 'revenue'],
          estimatedImprovement: '15-20%',
          timeline: '2-4 weeks',
          created_at: new Date().toISOString()
        })
        break
        
      case 'product-mix':
        recommendations.push({
          id: `rec_product_${Date.now()}`,
          type: 'inventory',
          title: 'Adjust Inventory Mix',
          description: 'Increase stock for top-performing categories and reduce underperformers',
          impact: 'high',
          effort: 'low',
          category: 'inventory',
          metrics: ['inventory_turnover', 'profit_margin'],
          estimatedImprovement: '10-15%',
          timeline: '1-2 weeks',
          created_at: new Date().toISOString()
        })
        break
    }
    
    return recommendations
  }

  private parseQueryIntent(query: string): { type: string; entities: string[]; parameters: Record<string, any> } {
    const lowercaseQuery = query.toLowerCase()
    
    // Simple intent classification
    if (lowercaseQuery.includes('show') || lowercaseQuery.includes('display') || lowercaseQuery.includes('get')) {
      return { type: 'data_request', entities: [], parameters: {} }
    }
    
    if (lowercaseQuery.includes('analyze') || lowercaseQuery.includes('analysis')) {
      return { type: 'analysis_request', entities: [], parameters: {} }
    }
    
    if (lowercaseQuery.includes('compare') || lowercaseQuery.includes('vs')) {
      return { type: 'comparison_request', entities: [], parameters: {} }
    }
    
    return { type: 'general', entities: [], parameters: {} }
  }

  private async handleDataRequest(intent: any, context: ChatContext): Promise<any> {
    // Handle data requests
    return {
      type: 'data_response',
      message: 'I can help you access specific data. What metrics would you like to see?',
      suggestions: ['Show sales trends', 'Display top products', 'Get regional performance']
    }
  }

  private async handleAnalysisRequest(intent: any, context: ChatContext): Promise<any> {
    // Handle analysis requests
    return {
      type: 'analysis_response',
      message: 'I can perform various analyses on your data. What type of analysis interests you?',
      suggestions: ['Trend analysis', 'Anomaly detection', 'Predictive modeling']
    }
  }

  private async handleComparisonRequest(intent: any, context: ChatContext): Promise<any> {
    // Handle comparison requests
    return {
      type: 'comparison_response',
      message: 'I can help you compare different metrics or time periods. What would you like to compare?',
      suggestions: ['Compare regions', 'Month-over-month trends', 'Product performance']
    }
  }

  private async handleGeneralQuery(query: string, context: ChatContext): Promise<any> {
    // Handle general queries
    return {
      type: 'general_response',
      message: `I understand you're asking about "${query}". Could you be more specific about what data or analysis you need?`,
      suggestions: ['Ask about specific metrics', 'Request trend analysis', 'Compare time periods']
    }
  }

  private generateLinearForecast(data: any[], metric: string, days: number): any[] {
    // Simple linear regression forecast
    const points = data.map((d, i) => ({ x: i, y: d[metric] }))
    
    // Calculate linear regression
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Generate forecast points
    const forecast = []
    for (let i = 0; i < days; i++) {
      const x = n + i
      const y = slope * x + intercept
      forecast.push({
        day: i + 1,
        predicted_value: Math.max(0, y), // Ensure non-negative
        confidence: Math.max(0, 1 - (i / days) * 0.5) // Decreasing confidence over time
      })
    }
    
    return forecast
  }

  private calculateForecastConfidence(data: any[]): number {
    // Calculate R-squared for confidence measure
    if (data.length < 3) return 0.5
    
    const values = data.map(d => d.revenue || d.sales || 0)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    
    const totalVariation = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0)
    const trend = this.calculateTrendLine(values)
    const explainedVariation = values.reduce((sum, v, i) => sum + Math.pow(trend[i] - mean, 2), 0)
    
    const rSquared = explainedVariation / totalVariation
    return Math.min(Math.max(rSquared, 0.1), 0.95) // Bounded confidence
  }

  private calculateTrendLine(values: number[]): number[] {
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, v) => sum + v, 0)
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0)
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return values.map((_, i) => slope * i + intercept)
  }
}

export default AIDAL