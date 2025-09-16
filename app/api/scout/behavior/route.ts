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
      stores: searchParams.get("stores")?.split(",").filter(Boolean)
    }

    const analyticsService = new AnalyticsService()
    const result = await analyticsService.getDashboardData("consumer-behavior", filters, false)

    if (result.error) {
      console.error("Analytics service error:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Return behavior data in expected format
    return NextResponse.json({ 
      rows: result.data?.behavior || [],
      meta: {
        filters_applied: Object.keys(filters).filter(key => filters[key as keyof TransactionFilters]),
        total_records: result.data?.behavior?.length || 0
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}