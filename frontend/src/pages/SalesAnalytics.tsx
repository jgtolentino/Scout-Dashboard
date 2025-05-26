import { useState } from 'react'
import { Box, Typography, Paper, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { DateRangePicker } from '../components/common/DateRangePicker'
import { SalesMetricsGrid } from '../components/sales/SalesMetricsGrid'
import { SalesTrendChart } from '../components/sales/SalesTrendChart'
import { SalesByCategory } from '../components/sales/SalesByCategory'
import { TopSellingProducts } from '../components/sales/TopSellingProducts'

export function SalesAnalytics() {
  const [view, setView] = useState('daily')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  })

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: string) => {
    if (newView !== null) {
      setView(newView)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sales Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={setDateRange}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Metrics Overview */}
        <Grid item xs={12}>
          <SalesMetricsGrid />
        </Grid>

        {/* Sales Trend */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sales Trend
            </Typography>
            <SalesTrendChart view={view} />
          </Paper>
        </Grid>

        {/* Sales by Category */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sales by Category
            </Typography>
            <SalesByCategory />
          </Paper>
        </Grid>

        {/* Top Selling Products */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Selling Products
            </Typography>
            <TopSellingProducts />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}