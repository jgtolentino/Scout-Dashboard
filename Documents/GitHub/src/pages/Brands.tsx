import { useDashboardMetrics, useBrandPerformance, useTopBrand } from '@/hooks/useDashboard';
import { useGlobalFilters } from '@/contexts/GlobalFilterContext';
import { GlobalFilterBar } from '@/components/GlobalFilterBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Target, TrendingUp, BarChart3, AlertCircle, DollarSign, ShoppingCart, Package } from 'lucide-react';

export default function Brands() {
  const { getFilteredQuery } = useGlobalFilters();
  const filters = getFilteredQuery();

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(filters);
  const { data: brandData, isLoading: brandLoading } = useBrandPerformance(filters);
  const { data: topBrand, isLoading: topBrandLoading } = useTopBrand();

  if (metricsLoading || brandLoading || topBrandLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive brand performance analysis and competitive insights
            </p>
          </div>

          {/* Global Filters */}
          <GlobalFilterBar />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₱{metrics?.totalRevenue?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground mt-1">Filtered period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{metrics?.totalTransactions?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground mt-1">Filtered period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">₱{metrics?.avgTransaction?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground mt-1">Filtered period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Top Brand</p>
                <p className="text-2xl font-bold truncate">{topBrand?.name || 'No data'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ₱{topBrand?.revenue?.toLocaleString() || '0'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limited Data Alert */}
        {brandData && brandData.length === 10 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Showing top 10 brands by revenue. 
                  Full dataset contains {metrics?.totalTransactions?.toLocaleString() || 0} transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Brand Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Brand</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                    <th className="text-right py-3 px-4">Transactions</th>
                    <th className="text-right py-3 px-4">Avg. Transaction</th>
                    <th className="text-right py-3 px-4">Market Share</th>
                  </tr>
                </thead>
                <tbody>
                  {brandData?.map((brand) => (
                    <tr key={brand.brand_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{brand.brand_name}</div>
                        <div className="text-sm text-gray-500">{brand.category}</div>
                      </td>
                      <td className="text-right py-3 px-4">
                        ₱{brand.total_revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        {brand.transaction_count.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        ₱{brand.avg_transaction.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        {brand.market_share.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skeleton loader component
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
); 