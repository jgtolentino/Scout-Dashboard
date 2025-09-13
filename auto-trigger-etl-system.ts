// 🚀 AUTO-TRIGGER ETL SYSTEM FOR SCOUT-INGEST UPLOADS
// Automatically processes any new data uploaded to scout-ingest bucket

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface StorageWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    name: string;
    bucket_id: string;
    owner: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: any;
  };
  schema: string;
  old_record?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload: StorageWebhookPayload = await req.json();
    console.log('🔔 Storage webhook triggered:', payload);

    // Only process INSERT events (new files)
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Not an INSERT event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only process files in scout-ingest bucket
    if (payload.record.bucket_id !== 'scout-ingest') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Not scout-ingest bucket' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const fileName = payload.record.name;
    const fileSize = payload.record.metadata?.size || 0;
    
    console.log(`📁 Processing new file: ${fileName} (${fileSize} bytes)`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine processing strategy based on file type
    let processingResult;
    
    if (fileName.endsWith('.zip')) {
      // 📦 Process ZIP files (like Eugene's 720KB data)
      console.log(`🔄 Processing ZIP file: ${fileName}`);
      processingResult = await processZipFile(supabase, fileName);
      
    } else if (fileName.endsWith('.json')) {
      // 📄 Process individual JSON files
      console.log(`🔄 Processing JSON file: ${fileName}`);
      processingResult = await processJsonFile(supabase, fileName);
      
    } else if (fileName.endsWith('.jsonl') || fileName.endsWith('.ndjson')) {
      // 🌊 Process JSONL/NDJSON streams (from Pi devices)
      console.log(`🔄 Processing JSONL stream: ${fileName}`);
      processingResult = await processJsonlFile(supabase, fileName);
      
    } else {
      // ⏭️ Skip unsupported file types
      console.log(`⏭️ Skipping unsupported file: ${fileName}`);
      return new Response(JSON.stringify({ 
        skipped: true, 
        reason: `Unsupported file type: ${fileName}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 📊 Log the processing event to database
    await logProcessingEvent(supabase, {
      fileName,
      fileSize,
      processingResult,
      triggeredBy: 'storage_webhook'
    });

    console.log(`✅ Processing complete for ${fileName}:`, processingResult);

    return new Response(JSON.stringify({
      success: true,
      fileName,
      fileSize,
      processingResult,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Storage webhook error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// 📦 Process ZIP files (Eugene's data format)
async function processZipFile(supabase: any, fileName: string) {
  try {
    console.log(`🔧 Calling process-eugene-data for ${fileName}`);
    
    // Call our existing process-eugene-data function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-eugene-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          action: 'process-zip',
          payload: { zipPath: fileName }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ZIP processing failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      recordsProcessed: result.bronze_processed || 0,
      silverProcessed: result.silver_processed || 0,
      method: 'zip_extraction',
      details: result
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: 'zip_extraction'
    };
  }
}

// 📄 Process individual JSON files
async function processJsonFile(supabase: any, fileName: string) {
  try {
    console.log(`📥 Downloading JSON file: ${fileName}`);
    
    // Download the JSON file
    const { data: file, error: downloadError } = await supabase
      .storage
      .from('scout-ingest')
      .download(fileName);

    if (downloadError) throw downloadError;

    const content = await file.text();
    const jsonData = JSON.parse(content);

    // Process single JSON object or array
    const records = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    console.log(`💾 Inserting ${records.length} records to bronze layer`);
    
    // Insert into bronze layer
    const bronzeRecords = records.map((record, index) => ({
      id: `${fileName}-${Date.now()}-${index}`,
      device_id: record.device_id || 'json-upload',
      captured_at: record.timestamp || new Date().toISOString(),
      src_filename: fileName,
      payload: record,
      ingested_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('scout.bronze_edge_raw')
      .insert(bronzeRecords);

    if (insertError) throw insertError;

    // Promote to silver layer
    console.log(`⚡ Promoting to silver layer`);
    const { data: silverResult } = await supabase.rpc('scout.process_bronze_to_silver');

    return {
      success: true,
      recordsProcessed: records.length,
      silverProcessed: silverResult || 0,
      method: 'json_direct'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: 'json_direct'
    };
  }
}

// 🌊 Process JSONL/NDJSON streams (Pi device format)
async function processJsonlFile(supabase: any, fileName: string) {
  try {
    console.log(`🌊 Processing JSONL stream: ${fileName}`);
    
    // Download the JSONL file
    const { data: file, error: downloadError } = await supabase
      .storage
      .from('scout-ingest')
      .download(fileName);

    if (downloadError) throw downloadError;

    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    let processedCount = 0;
    const batchSize = 100;
    
    console.log(`📊 Processing ${lines.length} lines in batches of ${batchSize}`);
    
    // Process in batches for efficiency
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const records = [];
      
      for (const [index, line] of batch.entries()) {
        try {
          const record = JSON.parse(line);
          records.push({
            id: `${fileName}-${Date.now()}-${i + index}`,
            device_id: record.device_id || 'jsonl-stream',
            captured_at: record.timestamp || new Date().toISOString(),
            src_filename: fileName,
            payload: record,
            ingested_at: new Date().toISOString()
          });
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse JSONL line ${i + index}:`, parseError);
        }
      }
      
      if (records.length > 0) {
        const { error } = await supabase
          .from('scout.bronze_edge_raw')
          .insert(records);
          
        if (error) throw error;
        processedCount += records.length;
        
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${records.length} records inserted`);
      }
    }

    // Promote to silver layer
    console.log(`⚡ Promoting ${processedCount} records to silver layer`);
    const { data: silverResult } = await supabase.rpc('scout.process_bronze_to_silver');

    return {
      success: true,
      recordsProcessed: processedCount,
      silverProcessed: silverResult || 0,
      method: 'jsonl_stream',
      batchesProcessed: Math.ceil(lines.length / batchSize)
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: 'jsonl_stream'
    };
  }
}

// 📊 Log processing events for monitoring
async function logProcessingEvent(supabase: any, event: any) {
  try {
    // Create processing log table if it doesn't exist
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS scout.processing_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          file_name TEXT NOT NULL,
          file_size BIGINT,
          processing_status TEXT NOT NULL,
          records_processed INTEGER DEFAULT 0,
          silver_processed INTEGER DEFAULT 0,
          processing_method TEXT,
          error_message TEXT,
          triggered_by TEXT DEFAULT 'unknown',
          processed_at TIMESTAMPTZ DEFAULT NOW(),
          details JSONB
        );
        
        CREATE INDEX IF NOT EXISTS idx_processing_log_file_name 
        ON scout.processing_log(file_name);
        
        CREATE INDEX IF NOT EXISTS idx_processing_log_processed_at 
        ON scout.processing_log(processed_at DESC);
      `
    });

    // Insert the log entry
    await supabase
      .from('scout.processing_log')
      .insert({
        file_name: event.fileName,
        file_size: event.fileSize,
        processing_status: event.processingResult.success ? 'completed' : 'failed',
        records_processed: event.processingResult.recordsProcessed || 0,
        silver_processed: event.processingResult.silverProcessed || 0,
        processing_method: event.processingResult.method,
        error_message: event.processingResult.error || null,
        triggered_by: event.triggeredBy,
        processed_at: new Date().toISOString(),
        details: event.processingResult.details || {}
      });

    console.log(`📋 Logged processing event for ${event.fileName}`);
    
  } catch (error) {
    console.error('⚠️ Failed to log processing event:', error);
    // Don't fail the main processing if logging fails
  }
}