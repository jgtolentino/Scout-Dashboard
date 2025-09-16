import { NextRequest, NextResponse } from "next/server"
import AnalyticsService from "@/lib/services/analytics"
import { TransactionFilters } from "@/lib/dal/transactions"
import { validateTransactionFilters, validatePagination } from "@/lib/utils/validation"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse and validate query parameters
    const rawFilters = {
      dateFrom: searchParams.get("from"),
      dateTo: searchParams.get("to"),
      regions: searchParams.get("regions"),
      provinces: searchParams.get("provinces"),
      stores: searchParams.get("stores"),
      brands: searchParams.get("brands"),
      categories: searchParams.get("categories")
    }
    
    const rawPagination = {
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset")
    }

    // Validate input parameters
    const filterValidation = validateTransactionFilters(rawFilters)
    const paginationValidation = validatePagination(rawPagination)
    
    if (!filterValidation.isValid) {
      return NextResponse.json({ 
        error: "Invalid filter parameters", 
        details: filterValidation.errors 
      }, { status: 400 })
    }
    
    if (!paginationValidation.isValid) {
      return NextResponse.json({ 
        error: "Invalid pagination parameters", 
        details: paginationValidation.errors 
      }, { status: 400 })
    }

    // Apply defaults for missing filters
    const filters: TransactionFilters = {
      dateFrom: "2024-01-01",
      dateTo: "2025-12-31",
      ...filterValidation.sanitized
    }

    const analyticsService = new AnalyticsService()
    const result = await analyticsService.getDashboardData("transaction-trends", filters, false)

    if (result.error) {
      console.error("Analytics service error:", result.error)
      return NextResponse.json({ 
        error: "Failed to fetch trends data", 
        message: result.error 
      }, { status: 500 })
    }

    const trendsData = result.data?.trends || []
    const { limit = 100, offset = 0 } = paginationValidation.sanitized
    const paginatedData = trendsData.slice(offset, offset + limit)

    // Return trends data in expected format with enhanced metadata
    return NextResponse.json({ 
      rows: paginatedData,
      meta: {
        filters_applied: Object.keys(filters).filter(key => 
          filters[key as keyof TransactionFilters] !== undefined && 
          filters[key as keyof TransactionFilters] !== null
        ),
        total_records: trendsData.length,
        returned_records: paginatedData.length,
        pagination: {
          limit,
          offset,
          has_more: offset + limit < trendsData.length
        },
        generated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ 
      error: "Internal server error",
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}