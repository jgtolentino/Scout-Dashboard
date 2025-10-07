import { NextRequest, NextResponse } from 'next/server'
import AnalyticsService from '@/lib/services/analytics'
import { ChatRequest, ChatResponse } from '@/types/recommendation'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, context, filters }: ChatRequest = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const analyticsService = new AnalyticsService()
    const result = await analyticsService.processChatMessage(
      message,
      conversationId || `conv-${Date.now()}`,
      {
        dashboardState: {
          section: context || 'general',
          filters: filters || {}
        }
      }
    )

    if (result.error) {
      console.error('Chat processing error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const response: ChatResponse = {
      message: result.response,
      conversationId: result.response.conversation_id,
      suggestions: result.suggestions || [
        'Show me sales trends for the last 30 days',
        'Which provinces are underperforming?',
        'Analyze product mix performance',
        'What are the inventory risks?'
      ],
      actions: result.actions
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

    const analyticsService = new AnalyticsService()
    // Access the private aiDAL property to get chat history
    const aiDAL = (analyticsService as any).aiDAL
    const result = await aiDAL.getChatHistory(conversationId, 50)

    if (result.error) {
      console.error('Chat history error:', result.error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      messages: result.data || [],
      conversationId 
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}