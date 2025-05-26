import { Box, Typography, Paper, Grid } from '@mui/material'
import { StoreMap } from '../components/stores/StoreMap'
import { StorePerformanceGrid } from '../components/stores/StorePerformanceGrid'
import { StoreRankingTable } from '../components/stores/StoreRankingTable'
import { StoreGrowthChart } from '../components/stores/StoreGrowthChart'

export function StoreMetrics() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Store Metrics
      </Typography>

      <Grid container spacing={3}>
        {/* Store Performance Grid */}
        <Grid item xs={12}>
          <StorePerformanceGrid />
        </Grid>

        {/* Store Map */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom>
              Store Locations & Performance
            </Typography>
            <StoreMap />
          </Paper>
        </Grid>

        {/* Store Growth Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom>
              Store Growth Trend
            </Typography>
            <StoreGrowthChart />
          </Paper>
        </Grid>

        {/* Store Ranking Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Stores
            </Typography>
            <StoreRankingTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}