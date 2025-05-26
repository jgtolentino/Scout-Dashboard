import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import dashboardReducer from '../store/slices/dashboardSlice'
import authReducer from '../store/slices/authSlice'
import filterReducer from '../store/slices/filterSlice'
import uiReducer from '../store/slices/uiSlice'
import { apiSlice } from '../store/api/apiSlice'

// Mock the API slice
vi.mock('../store/api/apiSlice', () => ({
  apiSlice: {
    reducer: (state = {}) => state,
    middleware: () => (next: any) => (action: any) => next(action),
    reducerPath: 'api',
    endpoints: {
      getMetrics: {
        useQuery: () => ({
          data: {
            totalSales: 125000,
            totalOrders: 450,
            averageOrderValue: 277.78,
            conversionRate: 3.2
          },
          isLoading: false,
          error: null
        })
      },
      getBrands: {
        useQuery: () => ({
          data: [
            { id: '1', name: 'Brand A', sales: 50000 },
            { id: '2', name: 'Brand B', sales: 45000 },
            { id: '3', name: 'Brand C', sales: 30000 }
          ],
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

// Mock chart components to avoid D3/Recharts issues in tests
vi.mock('../components/charts/SalesChart', () => ({
  default: () => <div data-testid="sales-chart">Sales Chart</div>
}))

vi.mock('../components/charts/BrandPerformanceChart', () => ({
  default: () => <div data-testid="brand-performance-chart">Brand Performance Chart</div>
}))

vi.mock('../components/charts/StoreHeatmap', () => ({
  default: () => <div data-testid="store-heatmap">Store Heatmap</div>
}))

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
      auth: authReducer,
      filter: filterReducer,
      ui: uiReducer,
      api: apiSlice.reducer
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'test_token'
      },
      dashboard: {
        metrics: null,
        loading: false,
        error: null
      },
      filter: {
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        selectedBrands: [],
        selectedStores: []
      },
      ui: {
        sidebarOpen: true,
        theme: 'light'
      },
      ...initialState
    }
  })
}

const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </Provider>
  )
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard title', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('displays metric cards with correct values', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Sales')).toBeInTheDocument()
      expect(screen.getByText('$125,000')).toBeInTheDocument()
      expect(screen.getByText('Total Orders')).toBeInTheDocument()
      expect(screen.getByText('450')).toBeInTheDocument()
      expect(screen.getByText('Average Order Value')).toBeInTheDocument()
      expect(screen.getByText('$277.78')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      expect(screen.getByText('3.2%')).toBeInTheDocument()
    })
  })

  it('renders all chart components', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByTestId('sales-chart')).toBeInTheDocument()
    expect(screen.getByTestId('brand-performance-chart')).toBeInTheDocument()
    expect(screen.getByTestId('store-heatmap')).toBeInTheDocument()
  })

  it('displays loading state when metrics are loading', () => {
    const store = createMockStore({
      dashboard: {
        metrics: null,
        loading: true,
        error: null
      }
    })
    
    renderWithProviders(<Dashboard />, store)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays error message when there is an error', () => {
    const store = createMockStore({
      dashboard: {
        metrics: null,
        loading: false,
        error: 'Failed to load dashboard data'
      }
    })
    
    renderWithProviders(<Dashboard />, store)
    
    expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument()
  })

  it('renders date range picker', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument()
  })

  it('shows recent transactions section', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(/Recent Transactions/i)).toBeInTheDocument()
  })

  it('displays top brands section', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Top Brands/i)).toBeInTheDocument()
      expect(screen.getByText('Brand A')).toBeInTheDocument()
      expect(screen.getByText('Brand B')).toBeInTheDocument()
      expect(screen.getByText('Brand C')).toBeInTheDocument()
    })
  })
})