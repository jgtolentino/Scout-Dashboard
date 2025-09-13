import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    // Get request method and URL
    const url = new URL(req.url);
    const method = req.method;

    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        // Get query parameters
        const name = url.searchParams.get('name') || 'World';
        
        return new Response(
          JSON.stringify({
            message: `Hello ${name}!`,
            timestamp: new Date().toISOString(),
            method: 'GET',
            environment: Deno.env.get('ENVIRONMENT') || 'production'
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 200
          }
        );

      case 'POST':
        // Parse request body
        const body = await req.json();
        const { name, data } = body;

        // Process the data
        const response = {
          message: `Hello ${name || 'there'}!`,
          timestamp: new Date().toISOString(),
          method: 'POST',
          receivedData: data,
          processedAt: new Date().toISOString()
        };

        return new Response(
          JSON.stringify(response),
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
    console.error('Error in hello-world function:', error);
    
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