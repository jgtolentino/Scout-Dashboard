import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { query, contentTypes, limit = 10 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required and must be a string' },
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

    // For now, we'll implement a simple text search
    // In production, this would use vector similarity search with pgvector
    let searchQuery = supabase
      .from('platinum.embeddings')
      .select('id, content, content_type, metadata, source_table, source_id')
      .textSearch('content', query)
      .limit(limit)

    if (contentTypes && Array.isArray(contentTypes)) {
      searchQuery = searchQuery.in('content_type', contentTypes)
    }

    const { data: results, error } = await searchQuery

    if (error) {
      console.error('Semantic search error:', error)
      return NextResponse.json(
        { error: 'Failed to perform semantic search' },
        { status: 500 }
      )
    }

    // Calculate relevance scores (simplified)
    const resultsWithScores = results?.map(result => ({
      ...result,
      relevance_score: calculateRelevanceScore(query, result.content),
      snippet: generateSnippet(result.content, query)
    })).sort((a, b) => b.relevance_score - a.relevance_score)

    return NextResponse.json({
      query,
      results: resultsWithScores || [],
      total: resultsWithScores?.length || 0
    })

  } catch (error) {
    console.error('Semantic search API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    )
  }
}

// Simple relevance scoring based on keyword matches
function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/)
  const contentLower = content.toLowerCase()
  
  let score = 0
  for (const word of queryWords) {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length
    score += matches * (word.length > 3 ? 2 : 1) // Weight longer words more
  }
  
  return Math.min(score / queryWords.length, 1.0) // Normalize to 0-1
}

// Generate snippet with highlighted terms
function generateSnippet(content: string, query: string, maxLength = 200): string {
  const queryWords = query.toLowerCase().split(/\s+/)
  const sentences = content.split(/[.!?]+/)
  
  // Find sentence with most query words
  let bestSentence = sentences[0] || ''
  let maxScore = 0
  
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase()
    const score = queryWords.reduce((acc, word) => 
      acc + (sentenceLower.includes(word) ? 1 : 0), 0
    )
    
    if (score > maxScore) {
      maxScore = score
      bestSentence = sentence
    }
  }
  
  // Truncate if too long
  if (bestSentence.length > maxLength) {
    bestSentence = bestSentence.substring(0, maxLength) + '...'
  }
  
  return bestSentence.trim()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')

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

    let query = supabase
      .from('platinum.embeddings')
      .select('content_type, count(*)')
      .order('content_type')

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data: stats, error } = await query

    if (error) {
      console.error('Error fetching search stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch search statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      contentTypes: stats || [],
      totalEmbeddings: stats?.reduce((sum, item) => sum + (item.count || 0), 0) || 0
    })

  } catch (error) {
    console.error('Semantic search stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search statistics' },
      { status: 500 }
    )
  }
}