/**
 * Documentation Search Handler
 * Processes documentation and tutorial queries with semantic search
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMB_URL = Deno.env.get("EMBEDDINGS_URL") || "";
const EMB_KEY = Deno.env.get("EMBEDDINGS_API_KEY") || "";

interface DocsRequest {
  query: string;
  intent?: "documentation" | "tutorial";
  filters?: {
    category?: string;
    difficulty_level?: "beginner" | "intermediate" | "advanced";
    tags?: string[];
  };
  limit?: number;
}

/**
 * Generate embeddings for semantic search
 */
async function embed(text: string): Promise<number[]> {
  if (!EMB_URL) return new Array(1536).fill(0);
  
  try {
    const response = await fetch(EMB_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(EMB_KEY ? { Authorization: `Bearer ${EMB_KEY}` } : {})
      },
      body: JSON.stringify({ input: text })
    });
    
    const result = await response.json();
    return result?.data?.[0]?.embedding ?? new Array(1536).fill(0);
  } catch (error) {
    console.warn("Embedding API failed:", error);
    return new Array(1536).fill(0);
  }
}

serve(async (req) => {
  const startTime = performance.now();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const supabase = createClient(SUPABASE_URL, SRK, { 
    auth: { persistSession: false } 
  });

  try {
    const body: DocsRequest = await req.json().catch(() => ({}));
    const { query, intent, filters, limit = 10 } = body;

    if (!query?.trim()) {
      return new Response(JSON.stringify({ 
        error: "Query parameter is required" 
      }), { status: 400 });
    }

    // Generate embedding for semantic search
    const queryEmbedding = await embed(query);
    
    let data: any = {};
    const baseParams = { 
      p_query: query,
      p_embedding: JSON.stringify(queryEmbedding),
      p_limit: limit,
      p_filters: filters || {}
    };

    switch (intent) {
      case "documentation":
        // Search API documentation, references, specs
        const { data: docsData, error: docsError } = await supabase
          .rpc("docs_semantic_search", {
            ...baseParams,
            p_content_types: ["api", "reference", "specification"]
          });
        
        if (docsError) throw docsError;
        
        data = {
          type: "documentation_search",
          documents: docsData?.documents || [],
          api_endpoints: docsData?.api_endpoints || [],
          code_examples: docsData?.code_examples || [],
          related_topics: docsData?.related_topics || []
        };
        break;
        
      case "tutorial":
        // Search tutorials, guides, how-tos
        const { data: tutorialData, error: tutorialError } = await supabase
          .rpc("docs_semantic_search", {
            ...baseParams,
            p_content_types: ["tutorial", "guide", "walkthrough"]
          });
        
        if (tutorialError) throw tutorialError;
        
        data = {
          type: "tutorial_search",
          tutorials: tutorialData?.tutorials || [],
          step_by_step_guides: tutorialData?.guides || [],
          examples: tutorialData?.examples || [],
          prerequisites: tutorialData?.prerequisites || []
        };
        break;
        
      default:
        // General documentation search - mixed results
        const { data: generalData, error: generalError } = await supabase
          .rpc("docs_semantic_search", baseParams);
        
        if (generalError) throw generalError;
        
        data = {
          type: "general_search",
          all_results: generalData?.results || [],
          top_matches: generalData?.top_matches || [],
          categories: generalData?.categories || {},
          suggested_queries: generalData?.suggested_queries || []
        };
    }

    // Fallback to keyword search if semantic search returns no results
    if (!data.documents?.length && !data.tutorials?.length && !data.all_results?.length) {
      const { data: keywordData } = await supabase
        .from("documentation")
        .select("*")
        .textSearch("content", query)
        .limit(limit);
      
      data = {
        type: "keyword_fallback",
        results: keywordData || [],
        search_method: "keyword_search"
      };
    }

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    // Log the search request
    supabase.from("docs_search_logs").insert({
      query: query.substring(0, 500),
      intent,
      filters,
      result_count: data.documents?.length || data.tutorials?.length || data.all_results?.length || 0,
      search_method: data.search_method || "semantic_search",
      latency_ms: latencyMs
    }).then().catch(() => {});

    return new Response(JSON.stringify({
      data,
      latency_ms: latencyMs,
      explain: `docs-handler-v1(${intent || 'general'})`
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });

  } catch (error) {
    console.error("Docs search handler error:", error);
    return new Response(JSON.stringify({ 
      error: String(error?.message || error) 
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});