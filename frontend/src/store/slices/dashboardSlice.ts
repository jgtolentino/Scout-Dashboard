import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface DashboardState {
  selectedDashboard: string
  timeRange: {
    start: Date | null
    end: Date | null
  }
  refreshInterval: number | null
  selectedMetrics: string[]
}

const initialState: DashboardState = {
  selectedDashboard: 'overview',
  timeRange: {
    start: null,
    end: null,
  },
  refreshInterval: null,
  selectedMetrics: ['revenue', 'transactions', 'customers', 'products'],
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedDashboard: (state, action: PayloadAction<string>) => {
      state.selectedDashboard = action.payload
    },
    setTimeRange: (state, action: PayloadAction<{ start: Date | null; end: Date | null }>) => {
      state.timeRange = action.payload
    },
    setRefreshInterval: (state, action: PayloadAction<number | null>) => {
      state.refreshInterval = action.payload
    },
    toggleMetric: (state, action: PayloadAction<string>) => {
      const index = state.selectedMetrics.indexOf(action.payload)
      if (index > -1) {
        state.selectedMetrics.splice(index, 1)
      } else {
        state.selectedMetrics.push(action.payload)
      }
    },
  },
})

export const { setSelectedDashboard, setTimeRange, setRefreshInterval, toggleMetric } = dashboardSlice.actions
export default dashboardSlice.reducer