/**
 * Google Drive ETL Pipeline
 * Extracts Scout Analytics data from Google Drive and loads into bronze layer
 * 
 * Deployment: supabase functions deploy gdrive-etl --no-verify-jwt
 * 
 * Usage:
 * - POST /gdrive-etl (manual trigger)
 * - Scheduled via pg_cron
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { getSecret, VaultSecretError } from "../_lib/vault.ts";

interface GoogleDriveFile {
  id: string;
  name: string;
  size?: string;
  modifiedTime: string;
  mimeType: string;
  parents?: string[];
}

interface GoogleDriveListResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

interface ScoutDataRecord {
  transaction_id?: string;
  tenant_id?: string;
  peso_value?: number;
  transaction_date?: string;
  province?: string;
  brand?: string;
  category?: string;
  basket_size?: number;
  [key: string]: any;
}

interface ETLJobRun {
  id: string;
  job_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  records_processed: number;
  records_inserted: number;
  records_failed: number;
  error_message?: string;
}

class GoogleDriveETL {
  private supabase: any;
  private accessToken: string = '';
  private folderId: string = '';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initialize() {
    try {
      // Get Google Drive credentials from vault
      const [clientId, clientSecret, refreshToken, folderId] = await Promise.all([
        getSecret('GOOGLE_DRIVE_CLIENT_ID'),
        getSecret('GOOGLE_DRIVE_CLIENT_SECRET'), 
        getSecret('GOOGLE_DRIVE_REFRESH_TOKEN'),
        getSecret('GOOGLE_DRIVE_FOLDER_ID')
      ]);

      this.folderId = folderId;
      
      // Get access token using refresh token
      this.accessToken = await this.getAccessToken(clientId, clientSecret, refreshToken);
      
      console.log('Google Drive ETL initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive ETL:', error);
      throw error;
    }
  }

  private async getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async listFiles(pageToken?: string): Promise<GoogleDriveListResponse> {
    const params = new URLSearchParams({
      q: `'${this.folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id,name,size,modifiedTime,mimeType,parents),nextPageToken',
      orderBy: 'modifiedTime desc',
      pageSize: '100'
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async downloadFile(fileId: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async startJobRun(jobName: string, metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await this.supabase.rpc('start_job_run', {
      p_job_name: jobName,
      p_metadata: metadata
    });

    if (error) {
      throw new Error(`Failed to start job run: ${error.message}`);
    }

    return data;
  }

  async completeJobRun(
    jobId: string, 
    status: string, 
    recordsProcessed: number = 0,
    recordsInserted: number = 0, 
    recordsUpdated: number = 0,
    recordsFailed: number = 0,
    errorMessage?: string
  ) {
    const { error } = await this.supabase.rpc('complete_job_run', {
      p_job_id: jobId,
      p_status: status,
      p_records_processed: recordsProcessed,
      p_records_inserted: recordsInserted,
      p_records_updated: recordsUpdated,
      p_records_failed: recordsFailed,
      p_error_message: errorMessage
    });

    if (error) {
      console.error('Failed to complete job run:', error);
    }
  }

  async isFileProcessed(fileId: string, modifiedTime: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('is_file_processed', {
      p_file_id: fileId,
      p_modified_time: modifiedTime
    });

    if (error) {
      console.error('Error checking if file is processed:', error);
      return false;
    }

    return data;
  }

  async recordProcessedFile(
    fileId: string,
    fileName: string,
    fileSize: number,
    modifiedTime: string,
    jobRunId: string,
    recordsExtracted: number,
    checksum?: string,
    metadata: Record<string, any> = {}
  ) {
    const { error } = await this.supabase.rpc('record_processed_file', {
      p_file_id: fileId,
      p_file_name: fileName,
      p_file_size: fileSize,
      p_modified_time: modifiedTime,
      p_job_run_id: jobRunId,
      p_records_extracted: recordsExtracted,
      p_checksum: checksum,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error recording processed file:', error);
    }
  }

  validateScoutData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if data is array
    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors };
    }

    // Validate each record
    for (const [index, record] of data.entries()) {
      if (!record || typeof record !== 'object') {
        errors.push(`Record ${index}: must be an object`);
        continue;
      }

      // Required fields validation
      if (!record.id && !record.transaction_id) {
        errors.push(`Record ${index}: missing required ID field`);
      }

      if (!record.peso_value || typeof record.peso_value !== 'number') {
        errors.push(`Record ${index}: invalid peso_value`);
      }

      if (!record.transaction_date) {
        errors.push(`Record ${index}: missing transaction_date`);
      }

      // Data type validations
      if (record.basket_size && typeof record.basket_size !== 'number') {
        errors.push(`Record ${index}: basket_size must be a number`);
      }

      // Reasonable value checks
      if (record.peso_value && (record.peso_value < 0 || record.peso_value > 1000000)) {
        errors.push(`Record ${index}: peso_value out of reasonable range`);
      }
    }

    return { 
      isValid: errors.length === 0, 
      errors 
    };
  }

  async insertBronzeData(fileId: string, fileName: string, data: any[], jobRunId: string): Promise<number> {
    const bronzeRecords = data.map(record => ({
      file_id: fileId,
      file_name: fileName,
      raw_data: record,
      job_run_id: jobRunId,
      _source_file: fileName,
      _ingestion_timestamp: new Date().toISOString(),
      _row_hash: this.generateRowHash(record)
    }));

    const { data: insertedData, error } = await this.supabase
      .from('bronze.gdrive_scout_data')
      .insert(bronzeRecords)
      .select('id');

    if (error) {
      throw new Error(`Failed to insert bronze data: ${error.message}`);
    }

    return insertedData?.length || 0;
  }

  private generateRowHash(record: any): string {
    const str = JSON.stringify(record, Object.keys(record).sort());
    return btoa(str).slice(0, 32); // Simple hash for change detection
  }

  async processFile(file: GoogleDriveFile, jobRunId: string): Promise<{
    processed: boolean;
    recordsExtracted: number;
    recordsInserted: number;
    error?: string;
  }> {
    try {
      // Check if file was already processed
      const alreadyProcessed = await this.isFileProcessed(file.id, file.modifiedTime);
      if (alreadyProcessed) {
        console.log(`File ${file.name} already processed, skipping`);
        return { processed: false, recordsExtracted: 0, recordsInserted: 0 };
      }

      console.log(`Processing file: ${file.name}`);

      // Download file content
      const fileData = await this.downloadFile(file.id);
      
      // Validate data structure
      const validation = this.validateScoutData(fileData);
      if (!validation.isValid) {
        console.error(`Validation failed for ${file.name}:`, validation.errors);
        return {
          processed: false,
          recordsExtracted: 0,
          recordsInserted: 0,
          error: `Validation failed: ${validation.errors.join('; ')}`
        };
      }

      // Insert into bronze layer
      const recordsInserted = await this.insertBronzeData(file.id, file.name, fileData, jobRunId);
      
      // Record file as processed
      await this.recordProcessedFile(
        file.id,
        file.name,
        parseInt(file.size || '0'),
        file.modifiedTime,
        jobRunId,
        fileData.length,
        this.generateRowHash(fileData),
        { validation_errors: validation.errors }
      );

      console.log(`Successfully processed ${file.name}: ${recordsInserted} records inserted`);
      
      return {
        processed: true,
        recordsExtracted: fileData.length,
        recordsInserted,
      };

    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      return {
        processed: false,
        recordsExtracted: 0,
        recordsInserted: 0,
        error: error.message
      };
    }
  }

  async runETL(): Promise<{
    success: boolean;
    filesProcessed: number;
    recordsInserted: number;
    errors: string[];
  }> {
    const jobRunId = await this.startJobRun('google-drive-etl', {
      folder_id: this.folderId,
      started_by: 'edge-function'
    });

    let totalFilesProcessed = 0;
    let totalRecordsInserted = 0;
    let totalRecordsProcessed = 0;
    let totalRecordsFailed = 0;
    const errors: string[] = [];

    try {
      console.log(`Starting ETL job run: ${jobRunId}`);

      let pageToken: string | undefined;
      let hasMoreFiles = true;

      while (hasMoreFiles) {
        const listResponse = await this.listFiles(pageToken);
        
        for (const file of listResponse.files) {
          // Only process JSON files
          if (!file.name.endsWith('.json')) {
            continue;
          }

          const result = await this.processFile(file, jobRunId);
          
          if (result.processed) {
            totalFilesProcessed++;
            totalRecordsInserted += result.recordsInserted;
            totalRecordsProcessed += result.recordsExtracted;
          }

          if (result.error) {
            errors.push(`${file.name}: ${result.error}`);
            totalRecordsFailed += result.recordsExtracted;
          }
        }

        pageToken = listResponse.nextPageToken;
        hasMoreFiles = !!pageToken;
      }

      // Complete job run
      await this.completeJobRun(
        jobRunId,
        errors.length > 0 ? 'completed' : 'completed', // Still mark as completed if partial success
        totalRecordsProcessed,
        totalRecordsInserted,
        0, // No updates in bronze layer
        totalRecordsFailed
      );

      console.log(`ETL completed. Files: ${totalFilesProcessed}, Records: ${totalRecordsInserted}, Errors: ${errors.length}`);

      return {
        success: errors.length === 0,
        filesProcessed: totalFilesProcessed,
        recordsInserted: totalRecordsInserted,
        errors
      };

    } catch (error) {
      console.error('ETL job failed:', error);
      
      await this.completeJobRun(
        jobRunId,
        'failed',
        totalRecordsProcessed,
        totalRecordsInserted,
        0,
        totalRecordsFailed,
        error.message
      );

      return {
        success: false,
        filesProcessed: totalFilesProcessed,
        recordsInserted: totalRecordsInserted,
        errors: [...errors, error.message]
      };
    }
  }
}

// Main handler
serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting Google Drive ETL process');

    // Initialize ETL pipeline
    const etl = new GoogleDriveETL(supabaseUrl, supabaseKey);
    await etl.initialize();

    // Run the ETL process
    const result = await etl.runETL();

    // Return results
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success 
          ? `ETL completed successfully. Processed ${result.filesProcessed} files, inserted ${result.recordsInserted} records.`
          : `ETL completed with errors. Processed ${result.filesProcessed} files, inserted ${result.recordsInserted} records.`,
        data: {
          files_processed: result.filesProcessed,
          records_inserted: result.recordsInserted,
          errors: result.errors
        }
      }),
      { 
        status: result.success ? 200 : 207, // 207 = Multi-Status for partial success
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unhandled error in Google Drive ETL:', error);
    
    if (error instanceof VaultSecretError) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error', 
          message: 'Please check Google Drive credentials in vault',
          details: error.vaultError
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});