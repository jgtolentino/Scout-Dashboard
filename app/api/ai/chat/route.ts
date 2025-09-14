import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ChatRequest, ChatResponse, ChatMessage } from '@/types/recommendation'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, context, filters }: ChatRequest = await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Store the user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      conversation_id: conversationId || `conv-${Date.now()}`,
      role: 'user',
      content: message,
      context,
      filters,
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('platinum.chat_messages')
      .insert([userMessage])

    if (insertError) {
      console.error('Error storing user message:', insertError)
    }

    // Build context-aware prompt
    let systemPrompt = `You are Scout, an AI analytics assistant for retail intelligence. 
    
Current context:
- Dashboard filters: ${JSON.stringify(filters || {})}
- Context: ${context || 'General dashboard'}
- Conversation ID: ${userMessage.conversation_id}

You have access to retail data including:
- Transaction trends and sales performance
- Geographic distribution across Philippines provinces  
- Product mix and brand performance
- Consumer behavior patterns
- Inventory and supply chain data

Provide insights based on the current dashboard context and user's question. Be specific and actionable.`

    // For demo purposes, we'll use a simple response
    // In production, this would call OpenAI/Anthropic APIs
    let assistantContent = ''
    
    if (message.toLowerCase().includes('sales')) {
      assistantContent = 'Based on your current filters, I can see sales performance trends. Would you like me to analyze specific regions or time periods?'
    } else if (message.toLowerCase().includes('inventory') || message.toLowerCase().includes('stock')) {
      assistantContent = 'I can help with inventory analysis. Current stock levels show some optimization opportunities in key categories.'
    } else if (message.toLowerCase().includes('region') || message.toLowerCase().includes('province')) {
      assistantContent = 'Looking at geographic performance, I notice interesting patterns across different provinces. Which regions are you most interested in?'
    } else {
      assistantContent = `I understand you're asking about "${message}". Based on your current dashboard view, I can provide specific insights. Could you be more specific about what metrics or aspects you'd like me to analyze?`
    }

    // Store assistant response
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      conversation_id: userMessage.conversation_id,
      role: 'assistant',
      content: assistantContent,
      context,
      filters,
      created_at: new Date().toISOString()
    }

    const { error: assistantError } = await supabase
      .from('platinum.chat_messages')
      .insert([assistantMessage])

    if (assistantError) {
      console.error('Error storing assistant message:', assistantError)
    }

    const response: ChatResponse = {
      message: assistantMessage,
      conversationId: userMessage.conversation_id,
      suggestions: [
        'Show me sales trends for the last 30 days',
        'Which provinces are underperforming?',
        'Analyze product mix performance',
        'What are the inventory risks?'
      ]
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: messages, error } = await supabase
      .from('platinum.chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching conversation:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}