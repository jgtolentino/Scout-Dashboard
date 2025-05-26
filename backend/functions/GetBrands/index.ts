import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { query } from '../shared/database'
import { requireAuth } from '../shared/auth'
import { validateRequest, dateRangeSchema, paginationSchema } from '../shared/validation'

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
    // Authenticate user
    const user = requireAuth(request)
    
    // Parse and validate query parameters
    const params = Object.fromEntries(request.query.entries())
    const validated = validateRequest<BrandQuery>(params, 
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

    const result = await query(sqlQuery, {
      startDate: validated.startDate,
      endDate: validated.endDate,
      offset,
      limit: validated.limit,
    })

    const brands = result.recordset
    const totalCount = brands[0]?.totalCount || 0

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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
    
    return {
      status: error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    }
  }
}

app.http('GetBrands', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: GetBrands,
})