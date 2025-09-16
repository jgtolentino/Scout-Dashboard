/**
 * Scout Analytics - Platinum Layer Types
 * Comprehensive type definitions for AI/ML features, recommendations, and semantic layer
 */

// =============================================
// CORE RECOMMENDATION SYSTEM
// =============================================

export type RecoTier = 
  | 'operational'      // Hours-7d: Store/ops immediate actions
  | 'tactical'         // 2-12 weeks: Brand/market campaigns  
  | 'strategic'        // 1-4 quarters: Business unit decisions
  | 'transformational' // 1-3 years: Technology/capability investments
  | 'governance'       // Continuous: Compliance/risk/policy
  | 'financial'        // 1-12 months: Pricing/commercial optimization
  | 'experiment';      // 2-10 weeks: A/B testing/learning

export type AnalyticsMode = 
  | 'descriptive'  // What happened?
  | 'diagnostic'   // Why did it happen?
  | 'predictive'   // What will happen?
  | 'prescriptive'; // What should we do?

export type RecommendationStatus = 
  | 'proposed'     // Initial recommendation generated
  | 'queued'       // Approved, waiting for execution  
  | 'in_progress'  // Currently being implemented
  | 'implemented'  // Successfully executed
  | 'rejected'     // Declined by decision maker
  | 'archived';    // Historical record

export type Severity = 'info' | 'warning' | 'critical';

// =============================================
// RECOMMENDATION INTERFACES
// =============================================

export interface Recommendation {
  id: string;
  tier: RecoTier;
  mode: AnalyticsMode;
  scope: RecommendationScope;
  statement: string;
  rationale?: RecommendationRationale;
  horizon_days?: number;
  expected_impact?: ExpectedImpact;
  confidence?: number; // 0-1 confidence score
  constraints?: Record<string, any>; // Business constraints
  owner?: string;
  owner_id?: string | null;
  status: RecommendationStatus;
  last_changed_by?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface RecommendationScope {
  // Geographic scope
  region?: string;
  province?: string; 
  city?: string;
  store_id?: number;
  
  // Product scope
  brand?: string;
  category?: string;
  sku?: string;
  
  // Customer scope  
  persona?: string;
  segment?: string;
  demographic?: string;
  
  // Channel scope
  channel?: string;
  platform?: string;
  
  // Campaign scope
  campaign_id?: string;
  creative_id?: number;
  
  // Custom attributes
  [key: string]: any;
}

export interface RecommendationRationale {
  // Primary drivers
  drivers?: string[];
  driver_values?: Record<string, number>;
  
  // Evidence supporting the recommendation
  evidence?: string[];
  evidence_at?: string;
  
  // Analysis method used
  method?: string;
  model_version?: string;
  confidence_interval?: [number, number];
  
  // Supporting data
  current_state?: Record<string, any>;
  projected_state?: Record<string, any>;
  assumptions?: string[];
  
  // Risk factors
  risks?: string[];
  mitigations?: string[];
}

export interface ExpectedImpact {
  // Primary KPI impact
  kpi: string;
  direction: 'up' | 'down';
  value: number; // Expected change (absolute or percentage)
  
  // Secondary impacts
  secondary_kpis?: Record<string, string>;
  
  // Financial impact
  revenue_impact?: number;
  cost_impact?: number;
  roi?: number;
  payback_months?: number;
  
  // Non-financial impacts
  customer_satisfaction?: number;
  brand_health?: number;
  operational_efficiency?: number;
  
  // Risk quantification
  downside_risk?: number;
  upside_potential?: number;
}

// =============================================
// AI AGENT SYSTEM
// =============================================

export type AgentType = 
  | 'sales_performance'
  | 'inventory_optimization'  
  | 'customer_behavior'
  | 'geographic_analysis'
  | 'anomaly_detection';

export type InsightType = 
  | 'trend'        // Pattern or trend identification
  | 'anomaly'      // Unusual behavior detection
  | 'opportunity'  // Growth/optimization opportunity
  | 'risk'         // Potential problem identification
  | 'correlation'  // Relationship discovery
  | 'prediction';  // Future state forecast

export interface AgentInsight {
  id: string;
  agent_type: AgentType;
  insight_type: InsightType;
  severity: Severity;
  title: string;
  description: string;
  recommendations?: string[] | Recommendation[]; // Array of recommendation IDs or inline recos
  evidence: InsightEvidence;
  context: InsightContext;
  confidence: number;
  tenant_id?: string;
  filters_applied?: Record<string, any>;
  dashboard_state?: Record<string, any>;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsightEvidence {
  // Quantitative evidence
  metrics?: Record<string, number>;
  trends?: Array<{
    metric: string;
    change: number;
    period: string;
  }>;
  
  // Supporting data points
  data_points?: Array<{
    label: string;
    value: number | string;
    context?: string;
  }>;
  
  // External factors
  external_factors?: string[];
  
  // Model outputs
  model_predictions?: Record<string, any>;
  shap_values?: Record<string, number>;
  
  // Visual evidence references
  chart_refs?: string[];
  screenshot_urls?: string[];
}

export interface InsightContext {
  // Temporal context
  time_window?: string;
  baseline_period?: string;
  seasonality?: string;
  
  // Dimensional context
  affected_regions?: string[];
  affected_products?: string[];
  affected_segments?: string[];
  
  // Business context
  current_campaigns?: string[];
  recent_changes?: string[];
  competitive_activity?: string[];
  
  // System context
  data_quality_score?: number;
  processing_time_ms?: number;
  model_version?: string;
}

// =============================================
// CHAT & RAG SYSTEM
// =============================================

export interface ChatConversation {
  id: string;
  user_id?: string;
  tenant_id?: string;
  session_id?: string;
  messages: ChatMessage[];
  context?: ConversationContext;
  conversation_type: ConversationType;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export type ConversationType = 
  | 'general'         // General questions and exploration
  | 'analysis'        // Deep-dive analysis requests
  | 'troubleshooting' // Problem-solving conversations
  | 'exploration';    // Data discovery and insights

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  
  // Enhanced message properties
  message_type?: 'text' | 'chart_request' | 'data_query' | 'recommendation';
  attachments?: MessageAttachment[];
  
  // Context and metadata
  dashboard_context?: DashboardContext;
  generated_insights?: string[]; // Insight IDs
  generated_recommendations?: string[]; // Recommendation IDs
  
  // AI processing metadata
  tokens_used?: number;
  processing_time_ms?: number;
  confidence_score?: number;
  sources_used?: string[];
}

export interface MessageAttachment {
  type: 'chart' | 'table' | 'image' | 'link';
  url?: string;
  title?: string;
  description?: string;
  data?: any; // Chart data or table data
}

export interface ConversationContext {
  // Current dashboard state
  active_filters?: Record<string, any>;
  current_view?: string;
  visible_charts?: string[];
  
  // User preferences
  preferred_metrics?: string[];
  frequent_queries?: string[];
  language_preference?: string;
  
  // Session memory
  mentioned_entities?: Record<string, any>;
  previous_topics?: string[];
  conversation_flow?: string[];
  
  // Business context
  user_role?: string;
  department?: string;
  responsibilities?: string[];
}

export interface DashboardContext {
  current_page: string;
  active_filters: Record<string, any>;
  visible_widgets: string[];
  date_range: {
    start: string;
    end: string;
    period: string;
  };
  
  // Current data state
  selected_metrics?: string[];
  drill_down_path?: string[];
  comparison_enabled?: boolean;
  
  // Visual context
  chart_types?: Record<string, string>;
  active_interactions?: string[];
}

// =============================================
// SEMANTIC LAYER & UNITY CATALOG
// =============================================

export interface SemanticDefinition {
  id: string;
  metric_name: string;
  display_name: string;
  description?: string;
  formula?: string;
  category: SemanticCategory;
  data_type: DataType;
  unit?: string;
  tags?: string[];
  business_owner?: string;
  technical_owner?: string;
  unity_catalog_ref?: string;
  source_tables?: string[];
  depends_on?: string[]; // Other metric dependencies
  refresh_frequency: RefreshFrequency;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  deprecated_at?: string | null;
}

export type SemanticCategory = 
  | 'sales'       // Revenue, transactions, conversions
  | 'inventory'   // Stock levels, turnover, OOS
  | 'customer'    // LTV, churn, satisfaction
  | 'marketing'   // CES, ROAS, engagement
  | 'operational' // Efficiency, costs, time
  | 'financial'   // Margins, profitability, ROI
  | 'quality'     // Accuracy, completeness, freshness
  | 'governance'; // Compliance, risk, audit

export type DataType = 
  | 'numeric'     // Raw numbers
  | 'currency'    // Peso amounts
  | 'percentage'  // Ratios and rates
  | 'count'       // Integer counts
  | 'duration'    // Time periods
  | 'score'       // Scaled scores (0-1, 0-100)
  | 'ratio';      // Mathematical ratios

export type RefreshFrequency = 
  | 'real_time'   // Live streaming
  | 'minutely'    // Every minute
  | 'hourly'      // Every hour
  | 'daily'       // Daily batch
  | 'weekly'      // Weekly aggregation
  | 'monthly'     // Monthly reporting
  | 'on_demand';  // Manual refresh

// =============================================
// VECTOR EMBEDDINGS & SEARCH
// =============================================

export interface Embedding {
  id: string;
  content: string;
  content_type: EmbeddingContentType;
  source_table?: string;
  source_id?: string;
  embedding: number[]; // Vector representation
  metadata?: EmbeddingMetadata;
  tenant_id?: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export type EmbeddingContentType = 
  | 'metric_definition'     // Semantic metric descriptions
  | 'business_rule'        // Business logic and rules
  | 'insight'              // Historical insights and learnings
  | 'documentation'        // System and process docs
  | 'query_pattern'        // Common query patterns
  | 'recommendation';      // Historical recommendations

export interface EmbeddingMetadata {
  // Content classification
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  subcategory?: string;
  tags?: string[];
  
  // Business context
  business_impact?: 'high' | 'medium' | 'low';
  frequency_of_use?: number;
  last_accessed?: string;
  
  // Technical metadata
  model_version?: string;
  embedding_quality_score?: number;
  content_hash?: string;
  
  // Relationships
  related_metrics?: string[];
  related_entities?: string[];
}

export interface SemanticSearchResult {
  content: string;
  similarity: number;
  metadata: EmbeddingMetadata;
  source_table?: string;
  source_id?: string;
  
  // Enhanced result properties  
  relevance_score?: number;
  context_match?: boolean;
  snippet?: string;
  highlighted_terms?: string[];
}

export interface SemanticSearchQuery {
  query: string;
  filters?: {
    content_type?: EmbeddingContentType[];
    category?: string[];
    tenant_id?: string;
    language?: string;
  };
  options?: {
    similarity_threshold?: number; // 0-1, default 0.8
    max_results?: number;          // default 10
    include_metadata?: boolean;
    highlight_terms?: boolean;
  };
  context?: {
    current_dashboard?: string;
    active_filters?: Record<string, any>;
    user_role?: string;
  };
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    processing_time_ms?: number;
  };
}

export type RecommendationListResponse = ApiResponse<{
  recommendations: Recommendation[];
  summary: {
    by_tier: Record<RecoTier, number>;
    by_status: Record<RecommendationStatus, number>;
    avg_confidence: number;
  };
}>;

export type AgentInsightResponse = ApiResponse<{
  insights: AgentInsight[];
  summary: {
    by_agent: Record<AgentType, number>;
    by_severity: Record<Severity, number>;
    active_count: number;
  };
}>;

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: DashboardContext;
  filters?: Record<string, any>;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId?: string;
  suggestions?: string[];
  actions?: any[];
}

export type SemanticSearchResponse = ApiResponse<{
  results: SemanticSearchResult[];
  query_understanding?: {
    intent: string;
    entities: Record<string, string>;
    confidence: number;
  };
}>;

// =============================================
// UTILITY TYPES
// =============================================

export interface PlatinumConfig {
  // AI/ML settings
  openai_model: string;
  anthropic_model: string;
  embedding_model: string;
  max_context_length: number;
  
  // Vector search settings
  vector_dimension: number;
  similarity_threshold: number;
  max_search_results: number;
  
  // Agent settings
  agent_polling_interval: number;
  insight_retention_days: number;
  recommendation_auto_archive_days: number;
  
  // Chat settings
  max_conversation_length: number;
  context_window_messages: number;
  response_timeout_seconds: number;
}

export interface TenantConfiguration {
  tenant_id: string;
  name: string;
  config: Partial<PlatinumConfig>;
  features_enabled: {
    recommendations: boolean;
    ai_agents: boolean;
    chat_interface: boolean;
    semantic_search: boolean;
  };
  limits: {
    max_recommendations: number;
    max_conversations: number;
    max_embeddings: number;
    api_calls_per_day: number;
  };
}

// =============================================
// REACT COMPONENT PROP TYPES
// =============================================

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusChange?: (id: string, status: RecommendationStatus) => void;
  onEdit?: (recommendation: Recommendation) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
}

export interface ChatInterfaceProps {
  conversationId?: string;
  initialContext?: DashboardContext;
  onInsightGenerated?: (insight: AgentInsight) => void;
  onRecommendationGenerated?: (recommendation: Recommendation) => void;
  className?: string;
  minimizable?: boolean;
  draggable?: boolean;
}

export interface AgentInsightPanelProps {
  agentType?: AgentType;
  severity?: Severity;
  limit?: number;
  onInsightClick?: (insight: AgentInsight) => void;
  realtime?: boolean;
}

export interface SemanticQueryBuilderProps {
  onQuerySubmit?: (query: SemanticSearchQuery) => void;
  initialQuery?: string;
  availableMetrics?: SemanticDefinition[];
  context?: DashboardContext;
}

// =============================================
// HOOK RETURN TYPES
// =============================================

export interface UseRecommendationsResult {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  createRecommendation: (data: Partial<Recommendation>) => Promise<string>;
  updateRecommendation: (id: string, data: Partial<Recommendation>) => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  refresh: () => void;
}

export interface UseChatResult {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (content: string, context?: DashboardContext) => Promise<void>;
  clearConversation: () => void;
  isTyping: boolean;
}

export interface UseAgentInsightsResult {
  insights: AgentInsight[];
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  dismissInsight: (id: string) => Promise<void>;
  refresh: () => void;
}

// =============================================
// VALIDATION SCHEMAS (for runtime checking)
// =============================================

export const RECO_TIERS: readonly RecoTier[] = [
  'operational', 'tactical', 'strategic', 
  'transformational', 'governance', 'financial', 'experiment'
] as const;

export const ANALYTICS_MODES: readonly AnalyticsMode[] = [
  'descriptive', 'diagnostic', 'predictive', 'prescriptive'
] as const;

export const RECOMMENDATION_STATUSES: readonly RecommendationStatus[] = [
  'proposed', 'queued', 'in_progress', 'implemented', 'rejected', 'archived'
] as const;

export const AGENT_TYPES: readonly AgentType[] = [
  'sales_performance', 'inventory_optimization', 'customer_behavior',
  'geographic_analysis', 'anomaly_detection'
] as const;

export const INSIGHT_TYPES: readonly InsightType[] = [
  'trend', 'anomaly', 'opportunity', 'risk', 'correlation', 'prediction'
] as const;

// Helper functions for type validation
export const isValidRecoTier = (tier: string): tier is RecoTier => 
  RECO_TIERS.includes(tier as RecoTier);

export const isValidAnalyticsMode = (mode: string): mode is AnalyticsMode =>
  ANALYTICS_MODES.includes(mode as AnalyticsMode);

export const isValidRecommendationStatus = (status: string): status is RecommendationStatus =>
  RECOMMENDATION_STATUSES.includes(status as RecommendationStatus);