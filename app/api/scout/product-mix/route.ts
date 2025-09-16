import { NextRequest, NextResponse } from "next/server"
import AnalyticsService from "@/lib/services/analytics"
import { TransactionFilters } from "@/lib/dal/transactions"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse query parameters
    const filters: TransactionFilters = {
      dateFrom: searchParams.get("from") || "2024-01-01",
      dateTo: searchParams.get("to") || "2025-12-31",
      regions: searchParams.get("regions")?.split(",").filter(Boolean),
      provinces: searchParams.get("provinces")?.split(",").filter(Boolean),
      stores: searchParams.get("stores")?.split(",").filter(Boolean),
      brands: searchParams.get("brands")?.split(",").filter(Boolean),
      categories: searchParams.get("categories")?.split(",").filter(Boolean)
    }
    
    const group = searchParams.get("group") || "category"
    
    const analyticsService = new AnalyticsService()
    const result = await analyticsService.getDashboardData("product-mix", filters, false)

    if (result.error) {
      console.error("Analytics service error:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    let processedData = result.data?.productMix || []
    
    // Process data based on grouping preference
    if (group === "category") {
      // Aggregate by product category
      const aggregated = processedData.reduce((acc: any[], curr: any) => {
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
      processedData = aggregated.filter(item => item.product_category !== "unknown")
        .sort((a, b) => b.n - a.n)
        .slice(0, 20)
        
    } else if (group === "brand") {
      // Aggregate by brand
      const aggregated = processedData.reduce((acc: any[], curr: any) => {
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
      processedData = aggregated.filter(item => item.brand_name !== "unknown")
        .sort((a, b) => b.n - a.n)
        .slice(0, 20)
    } else {
      // Return raw data, limited
      processedData = processedData.sort((a: any, b: any) => (b.n || 0) - (a.n || 0))
        .slice(0, 50)
    }

    // Return product mix data in expected format
    return NextResponse.json({ 
      rows: processedData,
      meta: {
        group,
        filters_applied: Object.keys(filters).filter(key => filters[key as keyof TransactionFilters]),
        total_records: processedData.length
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}