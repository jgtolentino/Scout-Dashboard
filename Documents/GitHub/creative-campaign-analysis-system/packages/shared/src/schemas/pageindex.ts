/**
 * PageIndex Zod Schemas - Runtime validation for PageIndex types
 */

import { z } from 'zod';

// Base schemas
export const ChunkMetadataSchema = z.object({
  chunk_id: z.string().uuid(),
  file_id: z.string().uuid(),
  filepath: z.string().min(1),
  title: z.string().optional(),
  text_snippet: z.string(),
  tags: z.array(z.string()),
  visual_quality_score: z.number().min(0).max(1),
  semantic_topics: z.array(z.string()),
  mood_label: z.string(),
  embedding_vector: z.array(z.number()).optional(),
  chunk_index: z.number().int().min(0),
  chunk_size: z.number().int().min(0),
  content_type: z.enum(['text', 'image', 'slide', 'video']),
  confidence_score: z.number().min(0).max(1),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const FileMetadataSchema = z.object({
  file_id: z.string().uuid(),
  original_filename: z.string().min(1),
  filepath: z.string().min(1),
  file_size: z.number().int().min(0),
  mime_type: z.string(),
  campaign_name: z.string().optional(),
  client_name: z.string().optional(),
  brand_name: z.string().optional(),
  file_type: z.enum(['video', 'image', 'presentation', 'document']),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']),
  total_chunks: z.number().int().min(0),
  azure_blob_url: z.string().url().optional(),
  google_drive_id: z.string().optional(),
  created_at: z.date().optional(),
  processed_at: z.date().optional(),
  error_message: z.string().optional(),
});

export const CampaignInsightsSchema = z.object({
  campaign_id: z.string().uuid(),
  campaign_name: z.string().min(1),
  client_name: z.string().optional(),
  total_files: z.number().int().min(0),
  total_chunks: z.number().int().min(0),
  avg_quality_score: z.number().min(0).max(1),
  dominant_mood: z.string(),
  key_topics: z.array(z.string()),
  effectiveness_prediction: z.number().min(0).max(1),
  creative_features: z.record(z.any()).optional(),
  business_outcomes: z.record(z.any()).optional(),
  award_submissions: z.array(z.string()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const SemanticIndexSchema = z.object({
  search_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
  search_terms: z.string(),
  topic_clusters: z.array(z.string()),
  similarity_hash: z.string(),
  search_rank: z.number().min(0),
  relevance_score: z.number().min(0).max(1),
  created_at: z.date().optional(),
});

export const QualityMetricsSchema = z.object({
  metric_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
  content_clarity: z.number().min(0).max(1),
  visual_appeal: z.number().min(0).max(1),
  message_strength: z.number().min(0).max(1),
  brand_consistency: z.number().min(0).max(1),
  emotional_impact: z.number().min(0).max(1),
  technical_quality: z.number().min(0).max(1),
  overall_score: z.number().min(0).max(1),
  classification_model: z.string(),
  processing_time_ms: z.number().int().min(0),
  created_at: z.date().optional(),
});

export const ProcessingLogSchema = z.object({
  log_id: z.string().uuid(),
  file_id: z.string().uuid().optional(),
  chunk_id: z.string().uuid().optional(),
  operation_type: z.enum(['extraction', 'embedding', 'classification', 'indexing']),
  status: z.enum(['started', 'completed', 'failed']),
  error_message: z.string().optional(),
  processing_time_ms: z.number().int().min(0).optional(),
  model_version: z.string().optional(),
  agent_version: z.string().optional(),
  created_at: z.date().optional(),
});

// Search schemas
export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    campaign_name: z.string().optional(),
    client_name: z.string().optional(),
    file_type: z.enum(['video', 'image', 'presentation', 'document']).optional(),
    mood_label: z.string().optional(),
    content_type: z.enum(['text', 'image', 'slide', 'video']).optional(),
    min_quality_score: z.number().min(0).max(1).optional(),
    date_range: z.object({
      start: z.date(),
      end: z.date(),
    }).optional(),
  }).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const SearchResultSchema = z.object({
  chunk_id: z.string().uuid(),
  file_id: z.string().uuid(),
  original_filename: z.string(),
  campaign_name: z.string().optional(),
  title: z.string().optional(),
  text_snippet: z.string(),
  visual_quality_score: z.number().min(0).max(1),
  mood_label: z.string(),
  confidence_score: z.number().min(0).max(1),
  search_rank: z.number().min(0),
  relevance_score: z.number().min(0).max(1),
  highlight: z.string().optional(),
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  total_count: z.number().int().min(0),
  query: z.string(),
  filters: z.record(z.any()),
  execution_time_ms: z.number().int().min(0),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
});

// Processing schemas
export const ProcessingOptionsSchema = z.object({
  campaign_name: z.string().optional(),
  client_name: z.string().optional(),
  extract_images: z.boolean().default(true),
  extract_videos: z.boolean().default(true),
  generate_embeddings: z.boolean().default(true),
  classify_content: z.boolean().default(true),
  assess_quality: z.boolean().default(true),
  chunk_size: z.number().int().min(100).max(10000).default(1000),
  overlap_size: z.number().int().min(0).max(500).default(100),
});

export const ProcessingResultSchema = z.object({
  success: z.boolean(),
  file_id: z.string().uuid().optional(),
  chunks_created: z.number().int().min(0).optional(),
  processing_time_ms: z.number().int().min(0),
  error: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export const BatchProcessingResultSchema = z.object({
  total_files: z.number().int().min(0),
  successful_files: z.number().int().min(0),
  failed_files: z.number().int().min(0),
  total_chunks: z.number().int().min(0),
  total_processing_time_ms: z.number().int().min(0),
  errors: z.array(z.object({
    file: z.string(),
    error: z.string(),
  })),
  warnings: z.array(z.string()),
});

// Configuration schemas
export const DatabaseConfigSchema = z.object({
  server: z.string().min(1),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  options: z.object({
    encrypt: z.boolean(),
    trustServerCertificate: z.boolean(),
    requestTimeout: z.number().int().min(1000),
    connectionTimeout: z.number().int().min(1000),
    enableArithAbort: z.boolean(),
  }),
  pool: z.object({
    max: z.number().int().min(1),
    min: z.number().int().min(0),
    idleTimeoutMillis: z.number().int().min(1000),
    acquireTimeoutMillis: z.number().int().min(1000),
  }),
});

export const AzureConfigSchema = z.object({
  openai: z.object({
    api_key: z.string().min(1),
    api_version: z.string().min(1),
    endpoint: z.string().url(),
    embedding_model: z.string().min(1),
    chat_model: z.string().min(1),
  }),
  storage: z.object({
    connection_string: z.string().min(1),
    container_name: z.string().min(1),
  }).optional(),
  identity: z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid(),
    client_secret: z.string().min(1),
  }).optional(),
});

// Utility schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  per_page: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean(),
  has_prev: z.boolean(),
});

export const PaginatedSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: PaginationSchema,
  });

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string(),
  });

export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  details: z.object({
    database: z.boolean(),
    azure_openai: z.boolean(),
    storage: z.boolean(),
    timestamp: z.string(),
    version: z.string(),
  }),
});

// Environment schemas
export const EnvironmentSchema = z.object({
  // Azure SQL
  AZURE_SQL_SERVER: z.string().default('sqltbwaprojectscoutserver.database.windows.net'),
  AZURE_SQL_DATABASE: z.string().default('SQL-TBWA-ProjectScout-Reporting-Prod'),
  AZURE_SQL_USER: z.string().default('sqladmin'),
  AZURE_SQL_PASSWORD: z.string(),
  
  // Azure OpenAI
  AZURE_OPENAI_API_KEY: z.string(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-02-15-preview'),
  AZURE_OPENAI_ENDPOINT: z.string().url(),
  AZURE_OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-ada-002'),
  AZURE_OPENAI_CHAT_MODEL: z.string().default('gpt-4'),
  
  // Azure Storage
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER: z.string().default('pageindex-files'),
  
  // Azure Identity
  AZURE_TENANT_ID: z.string().uuid().optional(),
  AZURE_CLIENT_ID: z.string().uuid().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Processing
  MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(500).default(100),
  MAX_BATCH_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  PROCESSING_TIMEOUT_MS: z.coerce.number().int().min(10000).default(300000),
  
  // API
  API_PORT: z.coerce.number().int().min(1000).max(65535).default(3000),
  API_HOST: z.string().default('localhost'),
  CORS_ORIGINS: z.string().default('*'),
  
  // Database Connection
  CONNECTION_TIMEOUT: z.coerce.number().int().min(1000).default(30000),
  REQUEST_TIMEOUT: z.coerce.number().int().min(1000).default(30000),
  POOL_MAX: z.coerce.number().int().min(1).default(10),
  POOL_MIN: z.coerce.number().int().min(0).default(0),
  POOL_IDLE_TIMEOUT: z.coerce.number().int().min(1000).default(30000),
});

// Export inferred types
export type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type CampaignInsights = z.infer<typeof CampaignInsightsSchema>;
export type SemanticIndex = z.infer<typeof SemanticIndexSchema>;
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;
export type ProcessingLog = z.infer<typeof ProcessingLogSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;
export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;
export type BatchProcessingResult = z.infer<typeof BatchProcessingResultSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AzureConfig = z.infer<typeof AzureConfigSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;