/**
 * Analytics Service Layer
 * Orchestrates DAL operations and business logic for analytics
 */

import TransactionDAL, { TransactionFilters } from '@/lib/dal/transactions'
import AIDAL, { AIAnalysisParams, ChatContext } from '@/lib/dal/ai'
import type { 
  TrendData, 
  BehaviorData, 
  ProductMixData, 
  ProfilingData, 
  GeoData, 
  TimeHeatmapData, 
  CompetitiveData 
} from '@/lib/types/transactions'
import type { AIInsight, RecommendationData, ChatMessage } from '@/lib/types/ai'

export interface AnalyticsServiceOptions {
  enableCaching?: boolean
  enableAI?: boolean
  defaultCacheTTL?: number
}

class AnalyticsService {
  private transactionDAL: TransactionDAL
  private aiDAL: AIDAL
  private options: AnalyticsServiceOptions

  constructor(options: AnalyticsServiceOptions = {}) {
    this.transactionDAL = new TransactionDAL()
    this.aiDAL = new AIDAL()
    this.options = {
      enableCaching: true,
      enableAI: true,
      defaultCacheTTL: 300000,
      ...options
    }
  }

  /**
   * Get comprehensive dashboard data for a specific view
   */
  async getDashboardData(
    section: string,
    filters: TransactionFilters = {},
    includeAI: boolean = true
  ): Promise<{
    data: any
    insights?: AIInsight[]
    recommendations?: RecommendationData[]
    error?: string
  }> {
    try {
      let dashboardData: any = {}
      let insights: AIInsight[] = []
      let recommendations: RecommendationData[] = []

      // Get section-specific data
      switch (section) {
        case 'transaction-trends':
          const { data: trendsData, error: trendsError } = await this.transactionDAL.getTrends(filters)
          if (trendsError) throw new Error(trendsError)
          dashboardData.trends = trendsData
          break

        case 'product-mix':
          const { data: productData, error: productError } = await this.transactionDAL.getProductMix(filters)
          if (productError) throw new Error(productError)
          dashboardData.productMix = productData
          break

        case 'consumer-behavior':
          const { data: behaviorData, error: behaviorError } = await this.transactionDAL.getBehaviorData(filters)
          if (behaviorError) throw new Error(behaviorError)
          dashboardData.behavior = behaviorData
          break

        case 'consumer-profiling':
          const { data: profilingData, error: profilingError } = await this.transactionDAL.getProfiling(filters)
          if (profilingError) throw new Error(profilingError)
          dashboardData.profiling = profilingData
          break

        case 'geographical-intelligence':
          const { data: geoData, error: geoError } = await this.transactionDAL.getGeoData(filters)
          if (geoError) throw new Error(geoError)
          dashboardData.geo = geoData
          break

        case 'competitive-analysis':
          const { data: competitiveData, error: competitiveError } = await this.transactionDAL.getCompetitiveData(filters)
          if (competitiveError) throw new Error(competitiveError)
          dashboardData.competitive = competitiveData
          break

        default:
          // Get overview data for general dashboard
          const [trendsResult, behaviorResult, geoResult] = await Promise.all([
            this.transactionDAL.getTrends(filters),
            this.transactionDAL.getBehaviorData(filters),
            this.transactionDAL.getGeoData(filters)
          ])
          
          dashboardData = {
            trends: trendsResult.data,
            behavior: behaviorResult.data,
            geo: geoResult.data
          }
      }

      // Get AI insights and recommendations if enabled
      if (includeAI && this.options.enableAI) {
        const [insightsResult, recommendationsResult] = await Promise.all([
          this.aiDAL.generateInsights({
            context: section,
            filters,
            analysisType: 'trends',
            timeframe: '30d'
          }),
          this.aiDAL.getRecommendations(section, { filters })
        ])

        insights = insightsResult.data || []
        recommendations = recommendationsResult.data || []
      }

      return {
        data: dashboardData,
        insights,
        recommendations
      }
    } catch (error) {
      return {
        data: null,
        error: (error as Error).message
      }
    }
  }

  /**
   * Get time-based heatmap data with insights
   */
  async getTimeAnalysis(filters: TransactionFilters = {}): Promise<{
    heatmap: TimeHeatmapData[] | null
    insights: AIInsight[]
    error?: string
  }> {
    try {
      const { data: heatmapData, error } = await this.transactionDAL.getTimeHeatmap(filters)
      if (error) throw new Error(error)

      // Generate time-based insights
      const insights = await this.generateTimeInsights(heatmapData || [])

      return {
        heatmap: heatmapData,
        insights
      }
    } catch (error) {
      return {
        heatmap: null,
        insights: [],
        error: (error as Error).message
      }
    }
  }

  /**
   * Perform advanced analytics
   */
  async getAdvancedAnalytics(
    analysisType: 'cohort' | 'funnel' | 'retention' | 'attribution',
    params: Record<string, any> = {}
  ): Promise<{ data: any[] | null; insights: AIInsight[]; error?: string }> {
    try {
      const { data, error } = await this.transactionDAL.getAdvancedAnalytics(analysisType, params)
      if (error) throw new Error(error)

      // Generate insights from advanced analytics
      const insights = await this.generateAdvancedInsights(analysisType, data || [])

      return {
        data,
        insights
      }
    } catch (error) {
      return {
        data: null,
        insights: [],
        error: (error as Error).message
      }
    }
  }

  /**
   * Chat interface for natural language queries
   */
  async processChatMessage(
    message: string,
    conversationId: string,
    context: Partial<ChatContext> = {}
  ): Promise<{
    response: ChatMessage
    suggestions: string[]
    actions?: any[]
    error?: string
  }> {
    try {
      // Store user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        conversation_id: conversationId,
        role: 'user',
        content: message,
        context: context.dashboardState?.section || 'general',
        filters: context.dashboardState?.filters,
        created_at: new Date().toISOString()
      }

      await this.aiDAL.storeChatMessage(userMessage)

      // Process natural language query
      const fullContext: ChatContext = {
        conversationId,
        userContext: context.userContext,
        dashboardState: context.dashboardState,
        previousMessages: context.previousMessages
      }

      const { data: response, error } = await this.aiDAL.processNaturalLanguageQuery(message, fullContext)
      if (error) throw new Error(error)

      // Generate AI response
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        conversation_id: conversationId,
        role: 'assistant',
        content: response.message || this.generateContextualResponse(message, context),
        context: context.dashboardState?.section || 'general',
        created_at: new Date().toISOString()
      }

      // Store assistant response
      await this.aiDAL.storeChatMessage(assistantMessage)

      return {
        response: assistantMessage,
        suggestions: this.generateSuggestions(message, context),
        actions: response.actions
      }
    } catch (error) {
      return {
        response: {
          id: `msg_${Date.now()}_error`,
          conversation_id: conversationId,
          role: 'assistant',
          content: 'I encountered an error processing your request. Please try again.',
          created_at: new Date().toISOString()
        },
        suggestions: ['Try a different question', 'Check your filters', 'Refresh the page'],
        error: (error as Error).message
      }
    }
  }

  /**
   * Get AI-powered insights for specific metrics
   */
  async getAIInsights(
    params: AIAnalysisParams
  ): Promise<{ insights: AIInsight[]; error?: string }> {
    try {
      const { data: insights, error } = await this.aiDAL.generateInsights(params)
      if (error) throw new Error(error)

      return {
        insights: insights || []
      }
    } catch (error) {
      return {
        insights: [],
        error: (error as Error).message
      }
    }
  }

  /**
   * Detect anomalies in business metrics
   */
  async detectAnomalies(
    metric: string = 'sales',
    timeframe: string = '7d'
  ): Promise<{ anomalies: any[]; insights: AIInsight[]; error?: string }> {
    try {
      const { data: anomalies, error } = await this.aiDAL.detectAnomalies(metric, timeframe)
      if (error) throw new Error(error)

      // Generate insights from anomalies
      const insights = await this.generateAnomalyInsights(anomalies || [])

      return {
        anomalies: anomalies || [],
        insights
      }
    } catch (error) {
      return {
        anomalies: [],
        insights: [],
        error: (error as Error).message
      }
    }
  }

  /**
   * Get predictions for business metrics
   */
  async getPredictions(
    metrics: string[] = ['sales', 'transactions'],
    days: number = 30
  ): Promise<{ predictions: any[]; insights: AIInsight[]; error?: string }> {
    try {
      const { data: predictions, error } = await this.aiDAL.generatePredictions(metrics, days)
      if (error) throw new Error(error)

      // Generate insights from predictions
      const insights = await this.generatePredictionInsights(predictions || [])

      return {
        predictions: predictions || [],
        insights
      }
    } catch (error) {
      return {
        predictions: [],
        insights: [],
        error: (error as Error).message
      }
    }
  }

  /**
   * Semantic search across analytics data
   */
  async semanticSearch(
    query: string,
    filters: Record<string, any> = {}
  ): Promise<{ results: any[]; error?: string }> {
    try {
      const { data: results, error } = await this.aiDAL.semanticSearch(query, filters)
      if (error) throw new Error(error)

      return {
        results: results || []
      }
    } catch (error) {
      return {
        results: [],
        error: (error as Error).message
      }
    }
  }

  // Private helper methods
  private async generateTimeInsights(heatmapData: TimeHeatmapData[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    if (heatmapData.length === 0) return insights

    // Find peak hours
    const maxTx = Math.max(...heatmapData.map(d => d.tx_count))
    const peakHours = heatmapData.filter(d => d.tx_count === maxTx)

    if (peakHours.length > 0) {
      insights.push({
        id: `time_peak_${Date.now()}`,
        type: 'trend',
        title: 'Peak Performance Hours Identified',
        description: `Highest transaction volume occurs during ${peakHours.map(h => h.time_of_day).join(', ')}`,
        confidence: 0.9,
        priority: 'medium',
        category: 'operational',
        recommendations: [
          'Schedule more staff during peak hours',
          'Plan promotional activities during high-traffic periods'
        ],
        created_at: new Date().toISOString()
      })
    }

    return insights
  }

  private async generateAdvancedInsights(type: string, data: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    switch (type) {
      case 'retention':
        if (data.length > 0) {
          const avgRetention = data.reduce((sum, d) => sum + d.active_stores, 0) / data.length
          insights.push({
            id: `retention_${Date.now()}`,
            type: 'trend',
            title: 'Store Retention Analysis',
            description: `Average store retention is ${avgRetention.toFixed(1)} stores per month`,
            confidence: 0.8,
            priority: 'medium',
            category: 'operational',
            created_at: new Date().toISOString()
          })
        }
        break

      case 'attribution':
        if (data.length > 0) {
          const campaignData = data.find(d => d.source === 'Campaign')
          const organicData = data.find(d => d.source === 'Organic')
          
          if (campaignData && organicData) {
            const campaignROI = (campaignData.revenue / campaignData.transactions) / (organicData.revenue / organicData.transactions)
            insights.push({
              id: `attribution_${Date.now()}`,
              type: 'prediction',
              title: 'Campaign Attribution Impact',
              description: `Campaign-influenced transactions have ${campaignROI.toFixed(1)}x higher value than organic`,
              confidence: 0.85,
              priority: 'high',
              category: 'marketing',
              created_at: new Date().toISOString()
            })
          }
        }
        break
    }

    return insights
  }

  private async generateAnomalyInsights(anomalies: any[]): Promise<AIInsight[]> {
    return anomalies.map(anomaly => ({
      id: `anomaly_insight_${Date.now()}_${anomaly.id || Math.random()}`,
      type: 'anomaly' as const,
      title: `${anomaly.metric} Anomaly Detected`,
      description: `Unusual ${anomaly.metric} value detected: ${anomaly.value}`,
      confidence: 0.8,
      priority: anomaly.severity === 'high' ? 'high' as const : 'medium' as const,
      category: 'operational' as const,
      recommendations: [
        'Investigate potential causes',
        'Check data quality',
        'Monitor for trend continuation'
      ],
      created_at: new Date().toISOString()
    }))
  }

  private async generatePredictionInsights(predictions: any[]): Promise<AIInsight[]> {
    return predictions.map(prediction => ({
      id: `prediction_insight_${Date.now()}_${prediction.metric}`,
      type: 'prediction' as const,
      title: `${prediction.metric} Forecast Generated`,
      description: `30-day forecast shows ${prediction.forecast.length} data points with ${(prediction.confidence * 100).toFixed(1)}% confidence`,
      confidence: prediction.confidence,
      priority: prediction.confidence > 0.8 ? 'high' as const : 'medium' as const,
      category: 'financial' as const,
      created_at: new Date().toISOString()
    }))
  }

  private generateContextualResponse(message: string, context: Partial<ChatContext>): string {
    const section = context.dashboardState?.section || 'general'
    
    const responses = {
      'transaction-trends': 'I can help you analyze transaction trends. What specific time period or metric interests you?',
      'product-mix': 'I can analyze your product performance data. Which categories or brands would you like to explore?',
      'consumer-behavior': 'I can provide insights into consumer behavior patterns. What aspect of customer behavior are you curious about?',
      'geographical-intelligence': 'I can help with geographic performance analysis. Which regions or provinces are you interested in?',
      'competitive-analysis': 'I can analyze competitive positioning and market share. What competitors or categories should we focus on?',
      'general': 'I can help you explore your analytics data. What would you like to learn about your business performance?'
    }

    return responses[section as keyof typeof responses] || responses.general
  }

  private generateSuggestions(message: string, context: Partial<ChatContext>): string[] {
    const section = context.dashboardState?.section || 'general'
    
    const suggestions = {
      'transaction-trends': [
        'Show me sales trends for the last 30 days',
        'Compare this month vs last month',
        'What are the peak transaction hours?'
      ],
      'product-mix': [
        'Which products are top performers?',
        'Show me category performance',
        'Analyze brand market share'
      ],
      'consumer-behavior': [
        'What are the most common purchase patterns?',
        'Analyze customer segmentation',
        'Show conversion funnel data'
      ],
      'geographical-intelligence': [
        'Which regions perform best?',
        'Compare provincial sales',
        'Show geographic distribution'
      ],
      'competitive-analysis': [
        'Compare competitor performance',
        'Show market share trends',
        'Analyze pricing strategies'
      ],
      'general': [
        'Show me key performance indicators',
        'What are the latest insights?',
        'Generate a business summary'
      ]
    }

    return suggestions[section as keyof typeof suggestions] || suggestions.general
  }
}

export default AnalyticsService