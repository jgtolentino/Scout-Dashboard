import { CrosstabTile } from "@/components/scout/crosstab-tile"

export default function CrosstabDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Scout Analytics Cross-Tabs</h1>
          <p className="text-muted-foreground">
            Comprehensive cross-tabulation analysis of transaction data across multiple dimensions
          </p>
        </div>
        <a 
          href="/" 
          className="text-sm bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
        >
          ← Main Dashboard
        </a>
      </div>

      <div className="grid gap-6">
        {/* Time & Product Analysis */}
        <CrosstabTile
          title="Daypart vs Category Sales"
          description="Sales performance across different times of day and product categories"
          rows="daypart"
          cols="category" 
          metric="sales"
        />

        <CrosstabTile
          title="Day of Week vs Brand Performance"
          description="Brand sales patterns throughout the week"
          rows="dow"
          cols="brand"
          metric="sales"
        />

        {/* Customer Demographics */}
        <CrosstabTile
          title="Age Bracket vs Gender Purchasing"
          description="Transaction volume by demographic segments"
          rows="age_bracket"
          cols="gender"
          metric="baskets"
        />

        <CrosstabTile
          title="Customer Type vs Payment Method"
          description="Payment preferences across customer segments"
          rows="customer_type"
          cols="payment_method"
          metric="baskets"
        />

        {/* Product & Basket Analysis */}
        <CrosstabTile
          title="Category vs Basket Size"
          description="Product categories by transaction size patterns"
          rows="category"
          cols="basket_band"
          metric="avg_basket_value"
        />

        <CrosstabTile
          title="Brand vs Pack Size Distribution"
          description="Brand preference by package size"
          rows="brand"
          cols="pack_size"
          metric="lines"
        />

        {/* Temporal Trends */}
        <CrosstabTile
          title="Monthly Sales by Daypart"
          description="Seasonal patterns in daypart performance"
          rows="month"
          cols="daypart"
          metric="sales"
        />

        <CrosstabTile
          title="Weekend vs Weekday by Category"
          description="Category performance comparison between weekends and weekdays"
          rows="is_weekend"
          cols="category"
          metric="avg_basket_value"
        />
      </div>

      {/* Technical Info */}
      <div className="mt-8 p-4 bg-muted/25 rounded-lg text-sm text-muted-foreground">
        <h3 className="font-medium text-foreground mb-2">Analytics Engine Details</h3>
        <div className="grid gap-1">
          <p>• Data Source: Scout v7 Edge + Legacy transactions (175,344 records)</p>
          <p>• Time Range: April 2025 - August 2025</p>
          <p>• Refresh Frequency: Every 10 minutes via pg_cron</p>
          <p>• Available Dimensions: daypart, category, brand, age_bracket, gender, payment_method, customer_type, basket_band, store_id</p>
          <p>• Available Metrics: sales (₱), baskets (count), lines (count), avg_basket_value (₱)</p>
        </div>
      </div>
    </div>
  )
}