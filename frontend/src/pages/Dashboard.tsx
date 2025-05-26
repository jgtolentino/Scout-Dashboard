import { Grid, Paper, Typography, Box } from '@mui/material'
import { MetricCard } from '../components/dashboard/MetricCard'
import { SalesChart } from '../components/charts/SalesChart'
import { BrandPerformanceChart } from '../components/charts/BrandPerformanceChart'
import { StoreHeatmap } from '../components/charts/StoreHeatmap'
import { RecentTransactions } from '../components/dashboard/RecentTransactions'
import { TrendingUp, Store, ShoppingCart, People } from '@mui/icons-material'

export function Dashboard() {
  // TODO: Replace with real data from API
  const metrics = [
    {
      title: 'Total Revenue',
      value: '₱1,234,567',
      change: 12.5,
      icon: <TrendingUp />,
      color: '#4caf50',
    },
    {
      title: 'Active Stores',
      value: '342',
      change: 5.2,
      icon: <Store />,
      color: '#2196f3',
    },
    {
      title: 'Products Sold',
      value: '8,432',
      change: -2.1,
      icon: <ShoppingCart />,
      color: '#ff9800',
    },
    {
      title: 'Unique Customers',
      value: '2,156',
      change: 8.7,
      icon: <People />,
      color: '#9c27b0',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Sales Trend
            </Typography>
            <SalesChart />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Brands
            </Typography>
            <BrandPerformanceChart />
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Store Performance Heatmap
            </Typography>
            <StoreHeatmap />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Transactions
            </Typography>
            <RecentTransactions />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}