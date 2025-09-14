/**
 * Embeddings Queue Worker
 * Processes text embeddings asynchronously using OpenAI API
 * 
 * Deployment: supabase functions deploy q-embed-worker --no-verify-jwt
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getSecret, VaultSecretError } from "../_lib/vault.ts";

interface EmbeddingJob {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: {
    doc_id: string;
    content: string;
    org_id?: string;
    metadata?: Record<string, any>;
    created_at: string;
    priority: string;
  };
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

async function fetchJob(): Promise<EmbeddingJob | null> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_readonly_sql`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "params=single-object"
      },
      body: JSON.stringify({
        q: "select * from pgmq.read('embeddings', 1, 30) limit 1"
      })
    });

    if (!response.ok) {
      console.error("Failed to fetch job:", response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    return result?.[0] || null;
    
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}

async function deleteJob(messageId: number): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_readonly_sql`, {
      method: "POST", 
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "params=single-object"
      },
      body: JSON.stringify({
        q: `select pgmq.delete('embeddings', ${messageId})`
      })
    });

    return response.ok;
    
  } catch (error) {
    console.error("Error deleting job:", error);
    return false;
  }
}

async function moveToDeadLetterQueue(messageId: number, error: string): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/rest/v1/rpc/queues.move_to_dlq`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "params=single-object"
      },
      body: JSON.stringify({
        source_queue: "embeddings",
        message_id: messageId,
        error_details: { error, timestamp: new Date().toISOString() }
      })
    });
  } catch (err) {
    console.error("Failed to move to DLQ:", err);
  }
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002"
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const result: OpenAIEmbeddingResponse = await response.json();
  return result.data[0].embedding;
}

async function storeEmbedding(docId: string, embedding: number[], orgId?: string): Promise<void> {
  // Store embedding in ai schema (assuming we have an embeddings table)
  const response = await fetch(`${supabaseUrl}/rest/v1/ai.embeddings`, {
    method: "POST",
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      doc_id: docId,
      org_id: orgId,
      embedding,
      model: "text-embedding-ada-002",
      created_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to store embedding: ${response.status} ${error}`);
  }
}

serve(async (req: Request) => {
  const start = performance.now();
  
  try {
    // Check if this is a health check
    if (req.method === "GET") {
      return new Response(JSON.stringify({ 
        ok: true, 
        service: "embeddings-worker",
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Fetch next job from queue
    const job = await fetchJob();
    
    if (!job) {
      return new Response(JSON.stringify({
        ok: true,
        empty: true,
        message: "No jobs in queue"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`Processing embedding job ${job.msg_id} for doc ${job.message.doc_id}`);

    // Get OpenAI API key from Vault
    let openaiKey: string;
    try {
      openaiKey = await getSecret("OPENAI_API_KEY");
    } catch (error) {
      console.error("Failed to get OpenAI API key:", error);
      await moveToDeadLetterQueue(job.msg_id, `Vault error: ${error.message}`);
      
      return new Response(JSON.stringify({
        ok: false,
        error: "Failed to get API key from vault",
        job_id: job.msg_id
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Generate embedding
      const embedding = await generateEmbedding(job.message.content, openaiKey);
      
      // Store embedding
      await storeEmbedding(
        job.message.doc_id, 
        embedding, 
        job.message.org_id || undefined
      );
      
      // Delete job from queue
      await deleteJob(job.msg_id);
      
      const duration = performance.now() - start;
      
      console.log(`Successfully processed embedding job ${job.msg_id} in ${duration.toFixed(2)}ms`);
      
      return new Response(JSON.stringify({
        ok: true,
        processed: 1,
        job_id: job.msg_id,
        doc_id: job.message.doc_id,
        duration_ms: Math.round(duration),
        embedding_dimensions: embedding.length
      }), {
        headers: { "Content-Type": "application/json" }
      });
      
    } catch (error) {
      console.error(`Failed to process embedding job ${job.msg_id}:`, error);
      
      // Move to dead letter queue after 3 retries
      if (job.read_ct >= 3) {
        await moveToDeadLetterQueue(job.msg_id, error.message);
        console.log(`Moved job ${job.msg_id} to DLQ after ${job.read_ct} attempts`);
      }
      
      return new Response(JSON.stringify({
        ok: false,
        error: error.message,
        job_id: job.msg_id,
        retry_count: job.read_ct,
        moved_to_dlq: job.read_ct >= 3
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error("Worker error:", error);
    
    return new Response(JSON.stringify({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});