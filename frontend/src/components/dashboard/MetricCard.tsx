import { Card, CardContent, Typography, Box } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
}

export function MetricCard({ title, value, change, icon, color }: MetricCardProps) {
  const isPositive = change > 0

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              color: color,
              p: 1,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
          ) : (
            <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
          )}
          <Typography
            variant="body2"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
              fontWeight: 500,
            }}
          >
            {Math.abs(change)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}