import { Box, Typography } from '@mui/material'

// Mock data - replace with real data
const heatmapData = [
  { region: 'Manila', performance: 85, stores: 45 },
  { region: 'Cebu', performance: 72, stores: 32 },
  { region: 'Davao', performance: 68, stores: 28 },
  { region: 'Quezon City', performance: 90, stores: 52 },
  { region: 'Makati', performance: 88, stores: 38 },
  { region: 'Pasig', performance: 75, stores: 30 },
  { region: 'Taguig', performance: 82, stores: 35 },
  { region: 'Caloocan', performance: 65, stores: 25 },
]

function getColorIntensity(value: number) {
  const intensity = value / 100
  return `rgba(33, 150, 243, ${intensity})`
}

export function StoreHeatmap() {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 1,
        }}
      >
        {heatmapData.map((item, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              borderRadius: 1,
              backgroundColor: getColorIntensity(item.performance),
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 2,
              },
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {item.region}
            </Typography>
            <Typography variant="h6">
              {item.performance}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.stores} stores
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}