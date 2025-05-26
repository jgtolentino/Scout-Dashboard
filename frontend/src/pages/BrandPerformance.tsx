import { Box, Typography, Paper, Grid } from '@mui/material'
import { BrandMetricsTable } from '../components/brands/BrandMetricsTable'
import { BrandComparisonChart } from '../components/brands/BrandComparisonChart'
import { BrandTrendAnalysis } from '../components/brands/BrandTrendAnalysis'
import { BrandMarketShare } from '../components/brands/BrandMarketShare'

export function BrandPerformance() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Brand Performance
      </Typography>

      <Grid container spacing={3}>
        {/* Brand Market Share */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Market Share
            </Typography>
            <BrandMarketShare />
          </Paper>
        </Grid>

        {/* Brand Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Brand Comparison
            </Typography>
            <BrandComparisonChart />
          </Paper>
        </Grid>

        {/* Brand Trend Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Trend Analysis
            </Typography>
            <BrandTrendAnalysis />
          </Paper>
        </Grid>

        {/* Brand Metrics Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Brand Performance Metrics
            </Typography>
            <BrandMetricsTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}