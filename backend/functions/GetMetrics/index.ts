import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { query } from '../shared/database'
import { requireAuth } from '../shared/auth'
import { validateRequest, dateRangeSchema, filterSchema } from '../shared/validation'

interface MetricsQuery {
  startDate: string
  endDate: string
  brands?: string[]
  stores?: string[]
}

export async function GetMetrics(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate user
    const user = requireAuth(request)
    
    // Parse and validate query parameters
    const params = Object.fromEntries(request.query.entries())
    const validated = validateRequest<MetricsQuery>(params, 
      dateRangeSchema.concat(filterSchema)
    )

    // Build SQL query
    let sqlQuery = `
      SELECT 
        COUNT(DISTINCT si.InteractionID) as totalTransactions,
        SUM(ti.Quantity * ti.UnitPrice) as totalRevenue,
        COUNT(DISTINCT si.StoreID) as activeStores,
        COUNT(DISTINCT si.FacialID) as uniqueCustomers,
        AVG(ti.Quantity * ti.UnitPrice) as avgTransactionValue
      FROM SalesInteractions si
      INNER JOIN TransactionItems ti ON si.InteractionID = ti.InteractionID
      WHERE si.TransactionDate BETWEEN @startDate AND @endDate
    `

    const queryParams: Record<string, any> = {
      startDate: validated.startDate,
      endDate: validated.endDate,
    }

    // Add optional filters
    if (validated.brands?.length) {
      sqlQuery += ` AND EXISTS (
        SELECT 1 FROM SalesInteractionBrands sib 
        INNER JOIN Brands b ON sib.BrandID = b.BrandID
        WHERE sib.InteractionID = si.InteractionID 
        AND b.BrandName IN (${validated.brands.map((_, i) => `@brand${i}`).join(',')})
      )`
      validated.brands.forEach((brand, i) => {
        queryParams[`brand${i}`] = brand
      })
    }

    if (validated.stores?.length) {
      sqlQuery += ` AND si.StoreID IN (${validated.stores.map((_, i) => `@store${i}`).join(',')})`
      validated.stores.forEach((store, i) => {
        queryParams[`store${i}`] = store
      })
    }

    // Execute query
    const result = await query(sqlQuery, queryParams)
    const metrics = result.recordset[0]

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: {
          totalTransactions: metrics.totalTransactions || 0,
          totalRevenue: metrics.totalRevenue || 0,
          activeStores: metrics.activeStores || 0,
          uniqueCustomers: metrics.uniqueCustomers || 0,
          avgTransactionValue: metrics.avgTransactionValue || 0,
          period: {
            start: validated.startDate,
            end: validated.endDate,
          },
        },
      }),
    }
  } catch (error) {
    context.error('Error in GetMetrics:', error)
    
    return {
      status: error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    }
  }
}

app.http('GetMetrics', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: GetMetrics,
})