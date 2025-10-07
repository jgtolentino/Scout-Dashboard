import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { description, amount } = await req.json()
  return new Response(JSON.stringify({
    category: description.includes("travel") ? "Travel" : "Other",
    compliant: amount < 5000,
    confidence: 0.95
  }), {
    headers: { "Content-Type": "application/json" },
  })
})
