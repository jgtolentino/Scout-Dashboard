import { GeoChoroplethPH } from "@/components/scout/geo-choropleth"
import { TrendsPanel } from "@/components/scout/trends-panel"
import { ProductMixPanel } from "@/components/scout/product-mix-panel"
import { BehaviorPanel } from "@/components/scout/behavior-panel"
import { ProfilingPanel } from "@/components/scout/profiling-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ScoutDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Scout Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Real-time retail transaction analytics and consumer insights
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="/dashboard/crosstabs" 
                className="text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Cross-Tab Analytics
              </a>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="text-sm font-medium">{new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 space-y-8">
        {/* Overview Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Transaction Overview</h2>
            <p className="text-muted-foreground">
              Key metrics and trends for retail transaction performance
            </p>
          </div>
          <TrendsPanel />
        </section>

        {/* Geographic Analysis */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Geographic Distribution</h2>
            <p className="text-muted-foreground">
              Transaction and sales distribution across Philippines provinces
            </p>
          </div>
          
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="transactions">Transaction Volume</TabsTrigger>
              <TabsTrigger value="sales">Sales Value</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions" className="mt-6">
              <GeoChoroplethPH metric="tx_count" />
            </TabsContent>
            <TabsContent value="sales" className="mt-6">
              <GeoChoroplethPH metric="sales" />
            </TabsContent>
          </Tabs>
        </section>

        {/* Product & Brand Analysis */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Product Mix Analysis</h2>
            <p className="text-muted-foreground">
              Category performance and brand distribution insights
            </p>
          </div>
          <ProductMixPanel />
        </section>

        {/* Consumer Insights */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Consumer Behavior */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Consumer Behavior</h2>
              <p className="text-muted-foreground">
                How consumers interact and make purchase decisions
              </p>
            </div>
            <BehaviorPanel />
          </section>

          {/* Consumer Profiling */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Consumer Profiling</h2>
              <p className="text-muted-foreground">
                Demographic analysis and spending patterns
              </p>
            </div>
            <ProfilingPanel />
          </section>
        </div>

        {/* Insights & Recommendations */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
              <CardDescription>
                AI-powered insights based on current transaction data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🎯 Market Focus</h4>
                  <p className="text-sm text-blue-800">
                    Focus on top-performing provinces and high-value customer segments for maximum ROI.
                  </p>
                </div>
                
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="font-semibold text-green-900 mb-2">📈 Growth Opportunity</h4>
                  <p className="text-sm text-green-800">
                    Branded requests show higher acceptance rates. Invest in brand awareness campaigns.
                  </p>
                </div>
                
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">⏰ Timing Strategy</h4>
                  <p className="text-sm text-orange-800">
                    Peak transaction times vary by region. Optimize inventory and staffing accordingly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}