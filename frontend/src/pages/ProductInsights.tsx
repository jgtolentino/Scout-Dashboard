import { Box, Typography, Paper, Grid } from '@mui/material'
import { ProductCategories } from '../components/products/ProductCategories'
import { ProductPerformanceMatrix } from '../components/products/ProductPerformanceMatrix'
import { ProductInventoryStatus } from '../components/products/ProductInventoryStatus'
import { ProductRecommendations } from '../components/products/ProductRecommendations'

export function ProductInsights() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Product Insights
      </Typography>

      <Grid container spacing={3}>
        {/* Product Categories */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Product Categories Performance
            </Typography>
            <ProductCategories />
          </Paper>
        </Grid>

        {/* Product Performance Matrix */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Product Performance Matrix
            </Typography>
            <ProductPerformanceMatrix />
          </Paper>
        </Grid>

        {/* Inventory Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inventory Status
            </Typography>
            <ProductInventoryStatus />
          </Paper>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI-Powered Product Recommendations
            </Typography>
            <ProductRecommendations />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}