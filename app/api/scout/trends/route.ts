import { serverSupabase } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from") || "2024-01-01"
    const to = searchParams.get("to") || "2025-12-31"
    
    const supabase = serverSupabase()
    const { data, error } = await supabase
      .from("v_trends_daily")
      .select("*")
      .gte("day", from)
      .lte("day", to)
      .order("day", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rows: data || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}