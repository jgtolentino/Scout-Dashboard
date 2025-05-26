import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '@mui/material/styles'

// Mock data - replace with real data
const data = [
  { name: 'Jan', sales: 4000, target: 3800 },
  { name: 'Feb', sales: 3000, target: 3200 },
  { name: 'Mar', sales: 5000, target: 4500 },
  { name: 'Apr', sales: 4500, target: 4200 },
  { name: 'May', sales: 6000, target: 5500 },
  { name: 'Jun', sales: 5500, target: 5800 },
]

export function SalesChart() {
  const theme = useTheme()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
        <YAxis stroke={theme.palette.text.secondary} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="sales"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}