/**
 * TBWA Shared Package - Entry point
 * Exports all types, schemas, and utilities
 */

// Types (import/export separately to avoid conflicts)
export type * from './types/pageindex.js';

// Schemas (with renamed exports to avoid conflicts)
export {
  ChunkMetadataSchema,
  FileMetadataSchema,
  CampaignInsightsSchema,
  SemanticIndexSchema,
  QualityMetricsSchema,
  ProcessingLogSchema,
  SearchQuerySchema,
  SearchResultSchema,
  SearchResponseSchema,
  ProcessingOptionsSchema,
  ProcessingResultSchema,
  BatchProcessingResultSchema,
  DatabaseConfigSchema,
  AzureConfigSchema,
  EnvironmentSchema,
} from './schemas/pageindex.js';

// Utils
export * from './utils/index.js';

// Re-export commonly used utilities
export {
  formatDate,
  calculateDuration,
  getFileExtension,
  getMimeType,
  formatFileSize,
  isValidFileType,
  truncateText,
  cleanText,
  extractKeywords,
  generateUUID,
  isValidUUID,
  chunk,
  unique,
  groupBy,
  omit,
  pick,
  isEmpty,
  isValidEmail,
  isValidUrl,
  retry,
  measure,
  debounce,
  throttle,
  AppError,
  isAppError,
  createErrorResponse,
  parseEnvBoolean,
  parseEnvNumber,
  parseEnvArray,
  createLogger,
} from './utils/index.js';