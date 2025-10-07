import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mode?: string;
  domain_hint?: 'scout' | 'ces' | 'docs';
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, domain_hint } = body;

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    if (userMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Call the multi-domain router
    const routerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/multi_domain_router`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          domain_hint,
          user_id: request.headers.get('x-user-id'),
          session_id: request.headers.get('x-session-id') || crypto.randomUUID()
        }),
      }
    );

    if (!routerResponse.ok) {
      const errorData = await routerResponse.json().catch(() => ({}));
      console.error('Multi-domain router error:', errorData);
      throw new Error('Failed to process query');
    }

    const routerData = await routerResponse.json();
    
    // Format response based on domain and data
    let formattedResponse: string;
    
    switch (routerData.domain) {
      case 'scout':
        formattedResponse = formatScoutResponse(routerData.data, userMessage.content);
        break;
      case 'ces':
        formattedResponse = formatCESResponse(routerData.data, userMessage.content);
        break;
      case 'docs':
        formattedResponse = formatDocsResponse(routerData.data, userMessage.content);
        break;
      default:
        formattedResponse = "I'm not sure how to help with that query. Please try rephrasing or specify if you're asking about retail data (Scout), creative effectiveness (CES), or documentation.";
    }

    return NextResponse.json({
      success: true,
      response: formattedResponse,
      context: {
        domain: routerData.domain,
        intent: routerData.intent,
        confidence: routerData.confidence,
        routing_method: routerData.explain,
        latency_ms: routerData.latency_ms
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

function formatScoutResponse(data: any, query: string): string {
  if (!data?.data) {
    return `I found your Scout query "${query}" but there's no data available right now. Please check if the Scout analytics system is running and has data.`;
  }

  // Format based on Scout data structure
  let response = `Based on your Scout retail analytics query: "${query}"\n\n`;
  
  if (data.data.kpis) {
    response += "📊 **Key Metrics:**\n";
    data.data.kpis.forEach((kpi: any) => {
      response += `• ${kpi.label}: ${kpi.value}\n`;
    });
    response += "\n";
  }

  if (data.data.trends && data.data.trends.length > 0) {
    response += "📈 **Trends:** Found " + data.data.trends.length + " data points\n\n";
  }

  response += `*Confidence: ${Math.round((data.confidence || 0.5) * 100)}% | Response time: ${data.latency_ms}ms*`;
  
  return response;
}

function formatCESResponse(data: any, query: string): string {
  if (!data) {
    return `I found your Creative Effectiveness query "${query}" but there's no CES data available yet. The CES system is being set up to analyze campaign performance and creative effectiveness.`;
  }

  let response = `Based on your Creative Effectiveness query: "${query}"\n\n`;
  
  if (data.type === 'creative_analysis') {
    response += "🎨 **Creative Analysis:** Campaign and creative asset performance data\n";
  } else if (data.type === 'effectiveness_analysis') {
    response += "📊 **Effectiveness Analysis:** ROI and attribution metrics\n";
  }

  response += "\n*Note: CES integration is in progress. Full campaign data will be available once connected to your creative effectiveness platforms.*";
  
  return response;
}

function formatDocsResponse(data: any, query: string): string {
  if (!data?.results || data.results.length === 0) {
    return `I couldn't find documentation for "${query}". The documentation search system is being set up. Please check back soon or try rephrasing your question.`;
  }

  let response = `Found documentation for: "${query}"\n\n`;
  
  if (data.search_method === 'semantic') {
    response += "🔍 **Semantic Search Results:**\n";
  } else {
    response += "🔍 **Keyword Search Results:**\n";
  }

  data.results.slice(0, 3).forEach((doc: any, index: number) => {
    response += `${index + 1}. **${doc.title}**\n`;
    response += `   ${doc.content.substring(0, 150)}...\n`;
    if (doc.category) {
      response += `   *Category: ${doc.category}*\n`;
    }
    response += "\n";
  });

  response += `*Found ${data.results.length} total results*`;
  
  return response;
}