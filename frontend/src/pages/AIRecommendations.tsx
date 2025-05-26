import { Box, Typography, Paper, Grid, Alert } from '@mui/material'
import { InsightCard } from '../components/ai/InsightCard'
import { PredictiveAnalytics } from '../components/ai/PredictiveAnalytics'
import { AnomalyDetection } from '../components/ai/AnomalyDetection'
import { OptimizationSuggestions } from '../components/ai/OptimizationSuggestions'

export function AIRecommendations() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        AI Insights & Recommendations
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        AI-powered insights are generated based on your historical data patterns and current market trends.
      </Alert>

      <Grid container spacing={3}>
        {/* Key Insights */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Key Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <InsightCard
                title="Revenue Opportunity"
                description="Increase weekend promotions in Metro Manila stores"
                impact="+15% potential revenue"
                confidence={85}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <InsightCard
                title="Inventory Optimization"
                description="Reduce Nestle product stock in Davao region"
                impact="₱50K cost savings"
                confidence={78}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <InsightCard
                title="Customer Behavior"
                description="Peak buying hours shifted to 6-8 PM"
                impact="Optimize staff scheduling"
                confidence={92}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Predictive Analytics */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sales Prediction (Next 30 Days)
            </Typography>
            <PredictiveAnalytics />
          </Paper>
        </Grid>

        {/* Anomaly Detection */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Anomaly Detection
            </Typography>
            <AnomalyDetection />
          </Paper>
        </Grid>

        {/* Optimization Suggestions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Suggestions
            </Typography>
            <OptimizationSuggestions />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}