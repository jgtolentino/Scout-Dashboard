/**
 * TBWA Database Package - Entry point
 * Exports database connection, utilities, and types
 */

// Core database connection
export { db } from './connection.js';
export type { DatabaseConnection } from './connection.js';
export { dbConfig, env } from './config.js';

// Migration utilities
export { runMigrations, loadMigrations, executeMigration } from './migrate.js';

// Status utilities
export { getDatabaseStatus, formatStatus, runStatusCheck } from './status.js';

// Re-export shared types for convenience
export type {
  ChunkMetadata,
  FileMetadata,
  CampaignInsights,
  SemanticIndex,
  QualityMetrics,
  ProcessingLog,
  SearchQuery,
  SearchResult,
  SearchResponse,
  ProcessingOptions,
  ProcessingResult,
  DatabaseConfig,
  AzureConfig,
} from '@tbwa/shared';