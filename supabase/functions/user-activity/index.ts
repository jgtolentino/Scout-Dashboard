import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface ActivityEvent {
  userId: string;
  eventType: 'page_view' | 'button_click' | 'form_submit' | 'api_call';
  eventData: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const method = req.method;

    switch (method) {
      case 'POST':
        // Track activity event
        const body = await req.json() as ActivityEvent;
        
        // Validate required fields
        if (!body.eventType || !body.eventData) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: eventType, eventData' }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        // Enrich activity data
        const activity = {
          user_id: user.id,
          event_type: body.eventType,
          event_data: body.eventData,
          timestamp: body.timestamp || new Date().toISOString(),
          session_id: body.sessionId || crypto.randomUUID(),
          user_agent: req.headers.get('User-Agent') || body.userAgent,
          ip_address: req.headers.get('CF-Connecting-IP') || 
                      req.headers.get('X-Forwarded-For') || 
                      body.ipAddress,
          created_at: new Date().toISOString()
        };

        // Store in database (assuming we have an analytics.user_activity table)
        const { data: insertedActivity, error: insertError } = await supabase
          .from('analytics.user_activity')
          .insert(activity)
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting activity:', insertError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to track activity',
              details: insertError.message 
            }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        // Send real-time notification if needed
        await supabase.channel('activity-tracking').send({
          type: 'broadcast',
          event: 'new-activity',
          payload: insertedActivity
        });

        return new Response(
          JSON.stringify({
            success: true,
            activityId: insertedActivity.id,
            message: 'Activity tracked successfully'
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 201
          }
        );

      case 'GET':
        // Get user's recent activity
        const limit = parseInt(new URL(req.url).searchParams.get('limit') || '10');
        const offset = parseInt(new URL(req.url).searchParams.get('offset') || '0');

        const { data: activities, error: fetchError } = await supabase
          .from('analytics.user_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .range(offset, offset + limit - 1);

        if (fetchError) {
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch activities',
              details: fetchError.message 
            }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        // Get activity summary
        const { data: summary } = await supabase
          .rpc('get_activity_summary', { p_user_id: user.id });

        return new Response(
          JSON.stringify({
            activities,
            summary,
            pagination: {
              limit,
              offset,
              total: summary?.total_activities || 0
            }
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 200
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 405
          }
        );
    }
  } catch (error) {
    console.error('Error in user-activity function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500
      }
    );
  }
});