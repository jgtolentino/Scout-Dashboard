import { serverSupabase } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const group = searchParams.get("group") || "category"
    
    const supabase = serverSupabase()
    
    if (group === "category") {
      // Group by product category
      const { data, error } = await supabase
        .from("v_product_mix")
        .select("product_category, n:n.sum(), total_sales:total_sales.sum()")
        .not("product_category", "eq", "unknown")
        .order("n", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Aggregate by category
      const aggregated = (data || []).reduce((acc: any[], curr: any) => {
        const existing = acc.find(item => item.product_category === curr.product_category)
        if (existing) {
          existing.n += curr.n || 0
          existing.total_sales += curr.total_sales || 0
        } else {
          acc.push({
            product_category: curr.product_category,
            n: curr.n || 0,
            total_sales: curr.total_sales || 0
          })
        }
        return acc
      }, [])

      return NextResponse.json({ rows: aggregated.sort((a, b) => b.n - a.n) })
      
    } else if (group === "brand") {
      // Group by brand
      const { data, error } = await supabase
        .from("v_product_mix")
        .select("brand_name, n:n.sum(), total_sales:total_sales.sum()")
        .not("brand_name", "eq", "unknown")
        .order("n", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Aggregate by brand
      const aggregated = (data || []).reduce((acc: any[], curr: any) => {
        const existing = acc.find(item => item.brand_name === curr.brand_name)
        if (existing) {
          existing.n += curr.n || 0
          existing.total_sales += curr.total_sales || 0
        } else {
          acc.push({
            brand_name: curr.brand_name,
            n: curr.n || 0,
            total_sales: curr.total_sales || 0
          })
        }
        return acc
      }, [])

      return NextResponse.json({ rows: aggregated.sort((a, b) => b.n - a.n) })
    } else {
      // Return both category and brand data
      const { data, error } = await supabase
        .from("v_product_mix")
        .select("*")
        .order("n", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ rows: data || [] })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}