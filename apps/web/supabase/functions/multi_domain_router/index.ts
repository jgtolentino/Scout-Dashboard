/**
 * Multi-Domain AI Router
 * Routes queries across Scout (retail), CES (creative), and Docs (documentation) domains
 * with intelligent intent detection and performance monitoring
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import ROUTING_CONFIG from "./routing-config.json" assert { type: "json" };

type Domain = "scout" | "ces" | "docs";
type Intent = "executive" | "consumer" | "competition" | "geographic" | "creative" | "effectiveness" | "documentation" | "tutorial";

interface RoutingRequest {
  query: string;
  context?: string;
  domain_hint?: Domain;
  user_id?: string;
  session_id?: string;
}

interface RoutingResponse {
  domain: Domain;
  intent: Intent;
  handler: string;
  data: any;
  confidence: number;
  latency_ms: number;
  explain: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMB_URL = Deno.env.get("EMBEDDINGS_URL") || "";
const EMB_KEY = Deno.env.get("EMBEDDINGS_API_KEY") || "";

// Domain-specific exemplars for intent classification
const DOMAIN_EXEMPLARS: Record<Domain, Record<string, string[]>> = {
  scout: {
    executive: ["revenue trend", "sales kpi", "performance metrics", "business overview"],
    consumer: ["customer behavior", "shopping patterns", "buyer personas", "purchase frequency"],
    competition: ["market share", "competitor analysis", "brand positioning", "competitive landscape"],
    geographic: ["regional sales", "location performance", "geographic trends", "store analysis"]
  },
  ces: {
    creative: ["creative effectiveness", "campaign performance", "ad impact", "creative strategy"],
    effectiveness: ["roi measurement", "campaign attribution", "media effectiveness", "conversion tracking"]
  },
  docs: {
    documentation: ["api documentation", "how to guide", "technical specs", "integration docs"],
    tutorial: ["step by step", "getting started", "walkthrough", "learning guide"]
  }
};

// Cache for exemplar embeddings
let exemplarCache: Record<string, number[]> = {};

/**
 * Generate embeddings for text using external API
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

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-9);
}

/**
 * Initialize exemplar embeddings cache
 */
async function initializeExemplars() {
  if (Object.keys(exemplarCache).length > 0) return;
  
  for (const [domain, intents] of Object.entries(DOMAIN_EXEMPLARS)) {
    for (const [intent, examples] of Object.entries(intents)) {
      for (const example of examples) {
        const key = `${domain}:${intent}:${example}`;
        exemplarCache[key] = await embed(example);
      }
    }
  }
}

/**
 * Keyword-based domain and intent detection (first tier)
 */
function keywordRouting(query: string): { domain: Domain | null; intent: Intent | null; confidence: number } {
  const searchText = query.toLowerCase();
  
  // Scout domain keywords
  const scoutKeywords = ROUTING_CONFIG.domains.scout.keywords;
  if (scoutKeywords.some((keyword: string) => searchText.includes(keyword.toLowerCase()))) {
    // Scout intent detection
    const scoutIntents = ROUTING_CONFIG.domains.scout.intents;
    for (const [intent, keywords] of Object.entries(scoutIntents)) {
      if ((keywords as string[]).some(k => searchText.includes(k.toLowerCase()))) {
        return { domain: "scout", intent: intent as Intent, confidence: 0.9 };
      }
    }
    return { domain: "scout", intent: "executive", confidence: 0.7 };
  }
  
  // CES domain keywords
  const cesKeywords = ROUTING_CONFIG.domains.ces.keywords;
  if (cesKeywords.some((keyword: string) => searchText.includes(keyword.toLowerCase()))) {
    // CES intent detection
    const cesIntents = ROUTING_CONFIG.domains.ces.intents;
    for (const [intent, keywords] of Object.entries(cesIntents)) {
      if ((keywords as string[]).some(k => searchText.includes(k.toLowerCase()))) {
        return { domain: "ces", intent: intent as Intent, confidence: 0.9 };
      }
    }
    return { domain: "ces", intent: "creative", confidence: 0.7 };
  }
  
  // Docs domain keywords  
  const docsKeywords = ROUTING_CONFIG.domains.docs.keywords;
  if (docsKeywords.some((keyword: string) => searchText.includes(keyword.toLowerCase()))) {
    // Docs intent detection
    const docsIntents = ROUTING_CONFIG.domains.docs.intents;
    for (const [intent, keywords] of Object.entries(docsIntents)) {
      if ((keywords as string[]).some(k => searchText.includes(k.toLowerCase()))) {
        return { domain: "docs", intent: intent as Intent, confidence: 0.9 };
      }
    }
    return { domain: "docs", intent: "documentation", confidence: 0.7 };
  }
  
  return { domain: null, intent: null, confidence: 0.0 };
}

/**
 * Embedding-based routing (second tier)
 */
async function embeddingRouting(query: string): Promise<{ domain: Domain; intent: Intent; confidence: number }> {
  const queryVec = await embed(query);
  let bestMatch = { domain: "scout" as Domain, intent: "executive" as Intent, confidence: 0.0 };
  
  for (const [domain, intents] of Object.entries(DOMAIN_EXEMPLARS)) {
    for (const [intent, examples] of Object.entries(intents)) {
      for (const example of examples) {
        const key = `${domain}:${intent}:${example}`;
        const exemplarVec = exemplarCache[key];
        if (exemplarVec) {
          const similarity = cosineSimilarity(queryVec, exemplarVec);
          if (similarity > bestMatch.confidence) {
            bestMatch = { 
              domain: domain as Domain, 
              intent: intent as Intent, 
              confidence: similarity 
            };
          }
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Route request to appropriate handler based on domain and intent
 */
async function routeToHandler(
  domain: Domain, 
  intent: Intent, 
  query: string, 
  supabase: any
): Promise<{ handler: string; data: any }> {
  const params = { 
    p_query: query,
    p_limit: 10 
  };

  switch (domain) {
    case "scout":
      // Route to existing scout AI router
      const scoutResponse = await fetch(`${SUPABASE_URL}/functions/v1/scout_ai_router`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SRK}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          hint: intent
        })
      });
      const scoutData = await scoutResponse.json();
      return { handler: "scout_ai_router", data: scoutData };
      
    case "ces":
      // Route to CES handler (to be created)
      const { data: cesData } = await supabase
        .rpc("ces_ai_handler", { ...params, p_intent: intent });
      return { handler: "ces_ai_handler", data: cesData };
      
    case "docs":
      // Route to documentation search
      const { data: docsData } = await supabase
        .rpc("docs_search_handler", { ...params, p_intent: intent });
      return { handler: "docs_search_handler", data: docsData };
      
    default:
      throw new Error(`Unknown domain: ${domain}`);
  }
}

/**
 * Main Edge Function handler
 */
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
    // Initialize embeddings cache
    await initializeExemplars();
    
    const body: RoutingRequest = await req.json().catch(() => ({}));
    const { query, domain_hint, user_id, session_id } = body;

    if (!query?.trim()) {
      return new Response(JSON.stringify({ 
        error: "Query parameter is required" 
      }), { status: 400 });
    }

    let domain: Domain;
    let intent: Intent;
    let confidence: number;
    let routingMethod: string;

    // Step 1: Check for explicit domain hint
    if (domain_hint && ["scout", "ces", "docs"].includes(domain_hint)) {
      domain = domain_hint;
      // Use embedding routing for intent within hinted domain
      const embeddingResult = await embeddingRouting(query);
      if (embeddingResult.domain === domain) {
        intent = embeddingResult.intent;
        confidence = embeddingResult.confidence;
        routingMethod = "hint+embedding";
      } else {
        intent = DOMAIN_EXEMPLARS[domain] ? Object.keys(DOMAIN_EXEMPLARS[domain])[0] as Intent : "executive";
        confidence = 0.6;
        routingMethod = "hint+fallback";
      }
    } else {
      // Step 2: Try keyword routing
      const keywordResult = keywordRouting(query);
      if (keywordResult.domain && keywordResult.confidence >= 0.7) {
        domain = keywordResult.domain;
        intent = keywordResult.intent!;
        confidence = keywordResult.confidence;
        routingMethod = "keyword";
      } else {
        // Step 3: Use embedding routing
        const embeddingResult = await embeddingRouting(query);
        if (embeddingResult.confidence >= 0.5) {
          domain = embeddingResult.domain;
          intent = embeddingResult.intent;
          confidence = embeddingResult.confidence;
          routingMethod = "embedding";
        } else {
          // Step 4: Default fallback
          domain = "scout";
          intent = "executive";
          confidence = 0.3;
          routingMethod = "fallback";
        }
      }
    }

    // Route to appropriate handler
    const { handler, data } = await routeToHandler(domain, intent, query, supabase);
    
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    // Log routing decision
    supabase.from("multi_domain_router_logs").insert({
      user_id,
      session_id,
      query: query.substring(0, 500),
      domain,
      intent,
      handler,
      confidence,
      routing_method: routingMethod,
      latency_ms: latencyMs
    }).then().catch(() => {});

    const response: RoutingResponse = {
      domain,
      intent,
      handler,
      data,
      confidence,
      latency_ms: latencyMs,
      explain: `router=multi-domain-v1(${routingMethod})`
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });

  } catch (error) {
    console.error("Multi-domain router error:", error);
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