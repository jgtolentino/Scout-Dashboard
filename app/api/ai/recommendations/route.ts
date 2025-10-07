import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Recommendation, RecoTier, RecoStatus } from '@/types/recommendation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') as RecoTier | null
    const status = searchParams.get('status') as RecoStatus | null
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
    if (!tier || !title || !description) {
      return NextResponse.json(
        { error: 'tier, title, and description are required' },
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

    const recommendation: Partial<Recommendation> = {
      tier,
      title,
      description,
      reasoning,
      priority: priority || 'medium',
      scope: scope || {},
      status: 'pending',
      impact_estimate: impact_estimate || 'unknown',
      confidence_score: confidence_score || 0.5,
      source_data: source_data || {},
      expires_at: expires_at || null,
      tenant_id: 'default' // In production, extract from auth
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