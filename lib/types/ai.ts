/**
 * AI/LLM Related Types for Scout Dashboard
 */

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  context?: string
  filters?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
}

export interface ChatResponse {
  message: ChatMessage
  conversationId: string
  suggestions?: string[]
  actions?: ChatAction[]
}

export interface ChatRequest {
  message: string
  conversationId?: string
  context?: string
  filters?: Record<string, any>
  userId?: string
}

export interface ChatAction {
  type: 'navigate' | 'filter' | 'export' | 'analyze'
  label: string
  payload: Record<string, any>
}

export interface AIInsight {
  id: string
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'alert'
  title: string
  description: string
  confidence: number // 0-1 scale
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'financial' | 'operational' | 'marketing' | 'inventory' | 'customer'
  recommendations?: string[]
  metrics?: string[]
  data?: any
  metadata?: Record<string, any>
  created_at: string
  expires_at?: string
}

export interface RecommendationData {
  id: string
  type: 'optimization' | 'alert' | 'opportunity' | 'risk' | 'inventory' | 'marketing'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  category: string
  metrics: string[]
  estimatedImprovement?: string
  timeline?: string
  actions?: RecommendationAction[]
  priority?: number
  created_at: string
}

export interface RecommendationAction {
  id: string
  label: string
  type: 'primary' | 'secondary'
  action: 'navigate' | 'filter' | 'export' | 'configure'
  payload: Record<string, any>
}

export interface AIAnalysisResult {
  insights: AIInsight[]
  recommendations: RecommendationData[]
  anomalies: AnomalyDetection[]
  predictions: PredictionResult[]
  confidence: number
  processingTime: number
}

export interface AnomalyDetection {
  id: string
  metric: string
  value: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  context?: Record<string, any>
}

export interface PredictionResult {
  metric: string
  forecast: ForecastPoint[]
  confidence: number
  methodology: 'linear' | 'seasonal' | 'ml_model'
  assumptions: string[]
  created_at: string
}

export interface ForecastPoint {
  date: string
  value: number
  upperBound?: number
  lowerBound?: number
  confidence: number
}

export interface SemanticSearchResult {
  id: string
  title: string
  description: string
  score: number
  category: string
  metadata: Record<string, any>
  url?: string
}

export interface AIConfiguration {
  enableInsights: boolean
  enablePredictions: boolean
  enableAnomalyDetection: boolean
  enableNLP: boolean
  confidenceThreshold: number
  updateFrequency: number // minutes
  maxCacheAge: number // minutes
  providers: {
    llm?: 'openai' | 'anthropic' | 'local'
    embeddings?: 'openai' | 'local'
    analytics?: 'builtin' | 'external'
  }
}

export interface ConversationContext {
  userId?: string
  sessionId: string
  currentDashboard?: string
  currentFilters?: Record<string, any>
  userPreferences?: Record<string, any>
  conversationHistory?: ChatMessage[]
  businessContext?: {
    industry: string
    role: string
    goals: string[]
  }
}

export interface NLPIntent {
  intent: string
  confidence: number
  entities: NLPEntity[]
  parameters: Record<string, any>
}

export interface NLPEntity {
  type: string
  value: string
  confidence: number
  start?: number
  end?: number
}

export interface AIModelResponse {
  response: string
  confidence: number
  reasoning?: string
  citations?: string[]
  followUp?: string[]
  actions?: ChatAction[]
}