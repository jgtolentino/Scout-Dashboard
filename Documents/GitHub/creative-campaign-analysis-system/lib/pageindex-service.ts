/**
 * TBWA Creative Campaign Analysis System - PageIndex Service
 * TypeScript service wrapper for PageIndex Agent
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface ChunkResult {
  chunk_id: string;
  file_id: string;
  filename: string;
  campaign_name: string;
  title: string;
  snippet: string;
  quality_score: number;
  mood: string;
  confidence: number;
  tags?: string[];
  semantic_topics?: string[];
}

export interface FileChunk {
  chunk_id: string;
  title: string;
  text_snippet: string;
  tags: string[];
  visual_quality_score: number;
  mood_label: string;
  chunk_index: number;
  content_type: string;
  confidence_score: number;
  quality_score?: number;
}

export interface ProcessingStats {
  files_processed: number;
  chunks_created: number;
  errors: number;
  start_time?: string;
}

export interface HealthStatus {
  timestamp: string;
  status: 'healthy' | 'unhealthy';
  checks: {
    sql: string;
    openai: string;
  };
}

export class PageIndexAgent {
  private projectRoot: string;
  private agentPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.agentPath = path.join(this.projectRoot, 'agents', 'pageindex_agent.py');
  }

  async initialize(): Promise<void> {
    // Check if Python agent exists
    try {
      await execAsync(`python3 -c "import sys; print(sys.version)"`);
    } catch (error) {
      throw new Error('Python 3 is required for PageIndex Agent');
    }

    // Verify agent file exists
    const fs = require('fs').promises;
    try {
      await fs.access(this.agentPath);
    } catch (error) {
      throw new Error(`PageIndex Agent not found at: ${this.agentPath}`);
    }
  }

  async processFile(
    filepath: string, 
    campaignName?: string, 
    clientName?: string
  ): Promise<string> {
    try {
      const args = [
        '--file', filepath,
        campaignName ? `--campaign "${campaignName}"` : '',
        clientName ? `--client "${clientName}"` : ''
      ].filter(Boolean).join(' ');

      const command = `cd "${this.projectRoot}" && python3 "${this.agentPath}" ${args}`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('INFO') && !stderr.includes('WARNING')) {
        throw new Error(stderr);
      }

      // Extract file ID from stdout
      const fileIdMatch = stdout.match(/File ID: ([a-f0-9-]+)/);
      if (!fileIdMatch) {
        throw new Error('Failed to extract file ID from agent output');
      }

      return fileIdMatch[1];

    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async searchSemantic(query: string, limit: number = 20): Promise<ChunkResult[]> {
    try {
      const command = `cd "${this.projectRoot}" && python3 "${this.agentPath}" --search "${query.replace(/"/g, '\\"')}"`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('INFO') && !stderr.includes('WARNING')) {
        console.warn('PageIndex search warning:', stderr);
      }

      try {
        const results = JSON.parse(stdout);
        return Array.isArray(results) ? results.slice(0, limit) : [];
      } catch (parseError) {
        console.error('Failed to parse search results:', stdout);
        return [];
      }

    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }

  async getFileChunks(fileId: string): Promise<FileChunk[]> {
    try {
      // For now, use database query approach since Python agent doesn't have this method yet
      const { createConnection } = await import('./database');
      const connection = await createConnection();

      const query = `
        SELECT 
          pi.chunk_id,
          pi.title,
          pi.text_snippet,
          pi.tags,
          pi.visual_quality_score,
          pi.mood_label,
          pi.chunk_index,
          pi.content_type,
          pi.confidence_score,
          qm.overall_score as quality_score
        FROM pageIndex pi
        LEFT JOIN qualityMetrics qm ON pi.chunk_id = qm.chunk_id
        WHERE pi.file_id = ?
        ORDER BY pi.chunk_index
      `;

      const result = await connection.request()
        .input('fileId', fileId)
        .query(query);

      return result.recordset.map(row => ({
        chunk_id: row.chunk_id,
        title: row.title,
        text_snippet: row.text_snippet,
        tags: row.tags ? JSON.parse(row.tags) : [],
        visual_quality_score: row.visual_quality_score,
        mood_label: row.mood_label,
        chunk_index: row.chunk_index,
        content_type: row.content_type,
        confidence_score: row.confidence_score,
        quality_score: row.quality_score
      }));

    } catch (error) {
      console.error('Error getting file chunks:', error);
      return [];
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const command = `cd "${this.projectRoot}" && python3 "${this.agentPath}" --health`;
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });

      if (stderr && !stderr.includes('INFO') && !stderr.includes('WARNING')) {
        console.warn('Health check warning:', stderr);
      }

      try {
        return JSON.parse(stdout);
      } catch (parseError) {
        return {
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
          checks: {
            sql: 'unknown',
            openai: 'unknown'
          }
        };
      }

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        checks: {
          sql: `error: ${error.message}`,
          openai: 'unknown'
        }
      };
    }
  }

  getProcessingStats(): ProcessingStats {
    // Return cached stats or defaults
    // In a real implementation, this would be stored in memory or database
    return {
      files_processed: 0,
      chunks_created: 0,
      errors: 0,
      start_time: new Date().toISOString()
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const { createConnection } = await import('./database');
      const connection = await createConnection();

      // Delete file and cascading chunks
      const query = `
        DELETE FROM fileMetadata WHERE file_id = ?;
        -- Chunks will be deleted automatically due to foreign key cascade
      `;

      await connection.request()
        .input('fileId', fileId)
        .query(query);

    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async deleteChunk(chunkId: string): Promise<void> {
    try {
      const { createConnection } = await import('./database');
      const connection = await createConnection();

      const query = `DELETE FROM pageIndex WHERE chunk_id = ?`;

      await connection.request()
        .input('chunkId', chunkId)
        .query(query);

    } catch (error) {
      console.error('Error deleting chunk:', error);
      throw new Error(`Failed to delete chunk: ${error.message}`);
    }
  }

  // Utility methods for frontend integration
  async getCampaignSummary(campaignName: string): Promise<any> {
    try {
      const { createConnection } = await import('./database');
      const connection = await createConnection();

      const query = `
        SELECT 
          campaign_name,
          client_name,
          total_files,
          total_chunks,
          avg_quality_score,
          dominant_mood,
          effectiveness_prediction,
          key_topics
        FROM campaignInsights
        WHERE campaign_name = ?
      `;

      const result = await connection.request()
        .input('campaignName', campaignName)
        .query(query);

      return result.recordset[0] || null;

    } catch (error) {
      console.error('Error getting campaign summary:', error);
      return null;
    }
  }

  async getFilesByMood(mood: string): Promise<ChunkResult[]> {
    try {
      const { createConnection } = await import('./database');
      const connection = await createConnection();

      const query = `
        SELECT 
          pi.chunk_id,
          pi.file_id,
          fm.original_filename as filename,
          fm.campaign_name,
          pi.title,
          pi.text_snippet as snippet,
          pi.visual_quality_score as quality_score,
          pi.mood_label as mood,
          pi.confidence_score as confidence
        FROM pageIndex pi
        INNER JOIN fileMetadata fm ON pi.file_id = fm.file_id
        WHERE pi.mood_label = ?
        ORDER BY pi.visual_quality_score DESC
      `;

      const result = await connection.request()
        .input('mood', mood)
        .query(query);

      return result.recordset;

    } catch (error) {
      console.error('Error getting files by mood:', error);
      return [];
    }
  }

  async getTopQualityContent(limit: number = 10): Promise<ChunkResult[]> {
    try {
      const { createConnection } = await import('./database');
      const connection = await createConnection();

      const query = `
        SELECT TOP (?)
          pi.chunk_id,
          pi.file_id,
          fm.original_filename as filename,
          fm.campaign_name,
          pi.title,
          pi.text_snippet as snippet,
          pi.visual_quality_score as quality_score,
          pi.mood_label as mood,
          pi.confidence_score as confidence
        FROM pageIndex pi
        INNER JOIN fileMetadata fm ON pi.file_id = fm.file_id
        ORDER BY pi.visual_quality_score DESC, pi.confidence_score DESC
      `;

      const result = await connection.request()
        .input('limit', limit)
        .query(query);

      return result.recordset;

    } catch (error) {
      console.error('Error getting top quality content:', error);
      return [];
    }
  }
}