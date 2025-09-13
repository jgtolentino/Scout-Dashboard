import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { query } = await req.json()
  return new Response(JSON.stringify({
    response: "HR Assistant is helping with: " + query,
    status: "ready"
  }), {
    headers: { "Content-Type": "application/json" },
  })
})
