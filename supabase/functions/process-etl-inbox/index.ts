// Scout Dashboard ETL Processor Edge Function
// Processes JSON files from etl-inbox bucket

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionData {
  store_id: string
  customer_id: string
  transaction_date: string
  total_amount?: number
  payment_method?: string
  items: Array<{
    brand_id: string
    category_id?: string
    quantity: number
    unit_price: number
    discount?: number
  }>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request parameters
    const { fileName, autoArchive = true } = await req.json()

    if (!fileName) {
      throw new Error('fileName parameter is required')
    }

    console.log(`Processing file: ${fileName}`)

    // Step 1: Check if file exists in etl-inbox
    const { data: fileList, error: listError } = await supabase
      .storage
      .from('etl-inbox')
      .list('', {
        search: fileName
      })

    if (listError || !fileList || fileList.length === 0) {
      throw new Error(`File not found in etl-inbox: ${fileName}`)
    }

    // Step 2: Download the JSON file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('etl-inbox')
      .download(fileName)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    // Convert blob to JSON
    const jsonText = await fileData.text()
    let jsonData: TransactionData[]

    try {
      jsonData = JSON.parse(jsonText)
      if (!Array.isArray(jsonData)) {
        jsonData = [jsonData] // Handle single transaction
      }
    } catch (e) {
      throw new Error(`Invalid JSON format: ${e.message}`)
    }

    // Step 3: Create ingestion log entry
    const { data: logEntry, error: logError } = await supabase
      .from('ingestion_log')
      .insert({
        file_name: fileName,
        file_path: `etl-inbox/${fileName}`,
        file_size: fileData.size,
        uploaded_at: new Date().toISOString(),
        processing_started_at: new Date().toISOString(),
        status: 'processing',
        metadata: {
          total_records: jsonData.length,
          processed_by: 'etl-edge-function'
        }
      })
      .select()
      .single()

    if (logError || !logEntry) {
      throw new Error(`Failed to create log entry: ${logError?.message}`)
    }

    console.log(`Created log entry: ${logEntry.log_id}`)

    // Step 4: Process transactions in batches
    const batchSize = 100
    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize)
      
      // Call the processing function
      const { data: result, error: processError } = await supabase
        .rpc('process_transaction_batch', {
          batch_data: batch,
          log_id: logEntry.log_id
        })

      if (processError) {
        console.error(`Batch processing error: ${processError.message}`)
        errorCount += batch.length
        errors.push({
          batch_start: i,
          batch_end: i + batch.length,
          error: processError.message
        })
      } else if (result && result.length > 0) {
        successCount += result[0].success_count || 0
        errorCount += result[0].error_count || 0
      }
    }

    // Step 5: Update log with final status
    const finalStatus = errorCount === 0 ? 'completed' : 
                       successCount === 0 ? 'failed' : 
                       'completed_with_errors'

    await supabase
      .from('ingestion_log')
      .update({
        status: finalStatus,
        processing_completed_at: new Date().toISOString(),
        records_processed: successCount,
        records_failed: errorCount,
        error_details: errors.length > 0 ? { errors } : null
      })
      .eq('log_id', logEntry.log_id)

    // Step 6: Archive or move file based on result
    if (autoArchive) {
      const destinationBucket = errorCount === 0 ? 'etl-archive' : 'etl-errors'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const archivePath = `${timestamp}/${fileName}`

      // Copy to archive
      const { error: copyError } = await supabase
        .storage
        .from(destinationBucket)
        .upload(archivePath, fileData)

      if (!copyError) {
        // Delete from inbox
        await supabase
          .storage
          .from('etl-inbox')
          .remove([fileName])

        console.log(`Archived file to ${destinationBucket}/${archivePath}`)
      } else {
        console.error(`Failed to archive file: ${copyError.message}`)
      }
    }

    // Return processing summary
    return new Response(
      JSON.stringify({
        success: true,
        logId: logEntry.log_id,
        fileName: fileName,
        totalRecords: jsonData.length,
        successCount,
        errorCount,
        status: finalStatus,
        archived: autoArchive
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('ETL processing error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// To deploy:
// supabase functions deploy process-etl-inbox