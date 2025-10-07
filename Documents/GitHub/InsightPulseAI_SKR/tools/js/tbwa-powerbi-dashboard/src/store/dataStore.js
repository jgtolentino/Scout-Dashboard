import { create } from 'zustand'

export const useDataStore = create((set, get) => ({
  // State
  dataSource: 'simulated', // 'simulated' or 'realtime'
  isLoading: false,
  data: null,
  error: null,
  apiUrl: import.meta.env.VITE_REALTIME_API || 'https://api.example.com/data',
  filters: {
    date: 'last30days',
    region: 'all',
    category: 'all',
  },
  
  // Actions
  setDataSource: (source) => {
    set({ dataSource: source, isLoading: true })
    
    // Fetch data based on source
    if (source === 'simulated') {
      // Use timeout for simulated data to mimic network delay
      setTimeout(() => {
        set({ 
          data: generateSimulatedData(),
          isLoading: false,
          error: null
        })
      }, 800)
    } else {
      // Fetch from real API endpoint
      fetch(get().apiUrl)
        .then(res => {
          if (!res.ok) {
            throw new Error(`API responded with status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          // Process and adapt API data if needed
          console.log('Fetched real-time data:', data)
          set({ 
            data: data, 
            isLoading: false, 
            error: null 
          })
        })
        .catch(error => {
          console.error('API fetch error:', error)
          set({ 
            error: error.message, 
            isLoading: false 
          })
          // Fallback to simulated data on error
          alert(`Failed to fetch real-time data: ${error.message}. Falling back to simulated data.`)
          set({ 
            dataSource: 'simulated',
            data: generateSimulatedData(),
            isLoading: false
          })
        })
    }
  },
  
  setFilter: (filterType, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [filterType]: value
      },
      isLoading: true
    }))
    
    const state = get()
    
    // Reload data with new filters
    if (state.dataSource === 'simulated') {
      // Use simulated data for filter changes
      setTimeout(() => {
        set({
          data: generateSimulatedData(state.filters),
          isLoading: false
        })
      }, 400)
    } else {
      // Build query params for API
      const queryParams = new URLSearchParams()
      Object.entries(state.filters).forEach(([key, value]) => {
        queryParams.append(key, value)
      })
      
      // Fetch from real API with filters
      fetch(`${state.apiUrl}?${queryParams.toString()}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`API responded with status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          set({ 
            data: data, 
            isLoading: false, 
            error: null 
          })
        })
        .catch(error => {
          console.error('API filter error:', error)
          set({ 
            error: error.message, 
            isLoading: false 
          })
          // Don't fallback to simulated here to preserve mode
        })
    }
  },
  
  exportData: (format = 'csv') => {
    const state = useDataStore.getState()
    const { data } = state
    
    if (!data) return
    
    if (format === 'csv') {
      const csvContent = convertToCSV(data)
      downloadFile(csvContent, 'tbwa-dashboard-data.csv', 'text/csv')
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(data, null, 2)
      downloadFile(jsonContent, 'tbwa-dashboard-data.json', 'application/json')
    } else if (format === 'excel') {
      // In a real app, you'd use a library like xlsx to generate Excel files
      alert('Excel export would be implemented here with xlsx library')
    }
  }
}))

// Initialize data on store creation
useDataStore.getState().setDataSource('simulated')

// Helper functions
function generateSimulatedData(filters = {}) {
  // This would be a more complex function in a real app
  return {
    salesByRegion: [
      { region: 'North', value: Math.floor(Math.random() * 5000) + 2000 },
      { region: 'South', value: Math.floor(Math.random() * 4000) + 1000 },
      { region: 'East', value: Math.floor(Math.random() * 6000) + 3000 },
      { region: 'West', value: Math.floor(Math.random() * 7000) + 4000 },
    ],
    salesByCategory: [
      { category: 'Electronics', value: Math.floor(Math.random() * 8000) + 5000 },
      { category: 'Clothing', value: Math.floor(Math.random() * 6000) + 3000 },
      { category: 'Food', value: Math.floor(Math.random() * 4000) + 2000 },
      { category: 'Home', value: Math.floor(Math.random() * 5000) + 1000 },
    ],
    salesTrend: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
      value: Math.floor(Math.random() * 10000) + 5000
    })),
    kpis: {
      totalSales: Math.floor(Math.random() * 1000000) + 500000,
      averageOrder: Math.floor(Math.random() * 200) + 50,
      customerCount: Math.floor(Math.random() * 50000) + 10000,
      conversionRate: (Math.random() * 10 + 2).toFixed(2)
    }
  }
}

function convertToCSV(data) {
  // Simple CSV conversion
  let csv = ''
  
  // KPIs
  csv += 'KPI,Value\n'
  for (const [key, value] of Object.entries(data.kpis)) {
    csv += `${key},${value}\n`
  }
  csv += '\n'
  
  // Sales by Region
  csv += 'Region,Sales\n'
  data.salesByRegion.forEach(item => {
    csv += `${item.region},${item.value}\n`
  })
  csv += '\n'
  
  // Sales by Category
  csv += 'Category,Sales\n'
  data.salesByCategory.forEach(item => {
    csv += `${item.category},${item.value}\n`
  })
  csv += '\n'
  
  // Sales Trend
  csv += 'Month,Sales\n'
  data.salesTrend.forEach(item => {
    csv += `${item.month},${item.value}\n`
  })
  
  return csv
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
