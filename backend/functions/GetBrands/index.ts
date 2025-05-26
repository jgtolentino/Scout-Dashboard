import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { query } from '../shared/database'
import { requireAuth } from '../shared/auth'
import { validateRequest, dateRangeSchema, paginationSchema } from '../shared/validation'
import {
  getSecurityHeaders,
  getCorsHeaders,
  checkRateLimit,
  sanitizeInput,
  createErrorResponse,
  logRequest,
  withTimeout
} from '../shared/middleware'

interface BrandQuery {
  startDate: string
  endDate: string
  page: number
  limit: number
}

export async function GetBrands(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Log request
    logRequest(request, context)
    
    // Check rate limit
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(clientId)) {
      return createErrorResponse(429, 'Too many requests')
    }
    
    // Authenticate user
    const user = requireAuth(request)
    
    // Parse and validate query parameters
    const params = Object.fromEntries(request.query.entries())
    const sanitizedParams = sanitizeInput(params)
    const validated = validateRequest<BrandQuery>(sanitizedParams, 
      dateRangeSchema.concat(paginationSchema)
    )

    // Calculate pagination
    const offset = (validated.page - 1) * validated.limit

    // Get brand performance data
    const sqlQuery = `
      WITH BrandMetrics AS (
        SELECT 
          b.BrandID,
          b.BrandName,
          b.Category,
          COUNT(DISTINCT si.InteractionID) as transactions,
          SUM(ti.Quantity * ti.UnitPrice) as revenue,
          SUM(ti.Quantity) as unitsSold,
          COUNT(DISTINCT si.StoreID) as storeCount
        FROM Brands b
        INNER JOIN SalesInteractionBrands sib ON b.BrandID = sib.BrandID
        INNER JOIN SalesInteractions si ON sib.InteractionID = si.InteractionID
        INNER JOIN TransactionItems ti ON si.InteractionID = ti.InteractionID
        WHERE si.TransactionDate BETWEEN @startDate AND @endDate
        GROUP BY b.BrandID, b.BrandName, b.Category
      )
      SELECT 
        *,
        (SELECT COUNT(*) FROM BrandMetrics) as totalCount
      FROM BrandMetrics
      ORDER BY revenue DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `

    const result = await withTimeout(
      query(sqlQuery, {
        startDate: validated.startDate,
        endDate: validated.endDate,
        offset,
        limit: validated.limit,
      }),
      30000 // 30 second timeout
    )

    const brands = result.recordset
    const totalCount = brands[0]?.totalCount || 0

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin'))
      },
      body: JSON.stringify({
        success: true,
        data: brands.map(brand => ({
          brandId: brand.BrandID,
          brandName: brand.BrandName,
          category: brand.Category,
          metrics: {
            transactions: brand.transactions,
            revenue: brand.revenue,
            unitsSold: brand.unitsSold,
            storeCount: brand.storeCount,
          },
        })),
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validated.limit),
        },
      }),
    }
  } catch (error) {
    context.error('Error in GetBrands:', error)
    
    const status = error.message === 'Unauthorized' ? 401 : 
                   error.message === 'Forbidden: Insufficient permissions' ? 403 :
                   error.message === 'Request timeout' ? 504 : 500
    
    return createErrorResponse(
      status,
      error.message || 'Internal server error',
      error
    )
  }
}

app.http('GetBrands', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: GetBrands,
})