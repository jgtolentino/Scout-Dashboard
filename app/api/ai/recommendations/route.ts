import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Recommendation, RecoTier, RecommendationStatus } from '@/types/recommendation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') as RecoTier | null
    const status = searchParams.get('status') as RecommendationStatus | null
    const limit = parseInt(searchParams.get('limit') || '10')

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
      .from('scout.recommendations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (tier) {
      query = query.eq('tier', tier)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: recommendations, error } = await query

    if (error) {
      console.error('Error fetching recommendations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ recommendations })

  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tier,
      title,
      description,
      reasoning,
      priority,
      scope,
      impact_estimate,
      confidence_score,
      source_data,
      expires_at
    } = body

    // Validate required fields
    if (!tier || !title) {
      return NextResponse.json(
        { error: 'tier and title are required' },
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

    // Map API fields to Recommendation interface
    const recommendation: Partial<Recommendation> = {
      tier,
      mode: 'prescriptive', // Default analytics mode
      statement: title, // Map title to statement
      scope: scope || {}, // Use provided scope or empty object
      status: 'proposed',
      confidence: confidence_score || 0.5, // Map confidence_score to confidence
      tenant_id: 'default' // In production, extract from auth
    }

    // Add rationale if we have description or reasoning
    if (description || reasoning || source_data) {
      recommendation.rationale = {
        evidence: description ? [description] : undefined,
        drivers: reasoning ? [reasoning] : undefined,
        current_state: source_data || undefined
      }
    }

    // Add expected impact if provided
    if (impact_estimate && typeof impact_estimate === 'object') {
      recommendation.expected_impact = impact_estimate
    }

    const { data, error } = await supabase
      .from('scout.recommendations')
      .insert([recommendation])
      .select()
      .single()

    if (error) {
      console.error('Error creating recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to create recommendation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ recommendation: data }, { status: 201 })

  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
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

    const { data, error } = await supabase
      .from('scout.recommendations')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ recommendation: data })

  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
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

    const { error } = await supabase
      .from('scout.recommendations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to delete recommendation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete recommendation' },
      { status: 500 }
    )
  }
}