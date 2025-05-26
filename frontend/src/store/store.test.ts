import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import store from './index'
import authReducer, { login, logout, setUser } from './slices/authSlice'
import dashboardReducer, { setMetrics, setLoading, setError } from './slices/dashboardSlice'
import filterReducer, { setDateRange, setBrandFilter, setStoreFilter } from './slices/filterSlice'
import uiReducer, { toggleSidebar, setTheme } from './slices/uiSlice'

describe('Redux Store', () => {
  it('has the correct initial state', () => {
    const state = store.getState()
    
    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('dashboard')
    expect(state).toHaveProperty('filter')
    expect(state).toHaveProperty('ui')
    expect(state).toHaveProperty('api')
  })

  describe('Auth Slice', () => {
    it('handles login action', () => {
      const testStore = configureStore({ reducer: { auth: authReducer } })
      const user = { id: '1', name: 'John Doe', email: 'john@example.com' }
      const token = 'test_token'
      
      testStore.dispatch(login({ user, token }))
      
      const state = testStore.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(user)
      expect(state.token).toBe(token)
    })

    it('handles logout action', () => {
      const testStore = configureStore({ reducer: { auth: authReducer } })
      testStore.dispatch(login({ user: { id: '1', name: 'John' }, token: 'token' }))
      
      testStore.dispatch(logout())
      
      const state = testStore.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    it('handles setUser action', () => {
      const testStore = configureStore({ reducer: { auth: authReducer } })
      const user = { id: '2', name: 'Jane Doe', email: 'jane@example.com' }
      
      testStore.dispatch(setUser(user))
      
      const state = testStore.getState().auth
      expect(state.user).toEqual(user)
    })
  })

  describe('Dashboard Slice', () => {
    it('handles setMetrics action', () => {
      const testStore = configureStore({ reducer: { dashboard: dashboardReducer } })
      const metrics = {
        totalSales: 150000,
        totalOrders: 450,
        averageOrderValue: 333.33,
        topProducts: []
      }
      
      testStore.dispatch(setMetrics(metrics))
      
      const state = testStore.getState().dashboard
      expect(state.metrics).toEqual(metrics)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('handles setLoading action', () => {
      const testStore = configureStore({ reducer: { dashboard: dashboardReducer } })
      
      testStore.dispatch(setLoading(true))
      expect(testStore.getState().dashboard.loading).toBe(true)
      
      testStore.dispatch(setLoading(false))
      expect(testStore.getState().dashboard.loading).toBe(false)
    })

    it('handles setError action', () => {
      const testStore = configureStore({ reducer: { dashboard: dashboardReducer } })
      const error = 'Failed to fetch metrics'
      
      testStore.dispatch(setError(error))
      
      const state = testStore.getState().dashboard
      expect(state.error).toBe(error)
      expect(state.loading).toBe(false)
    })
  })

  describe('Filter Slice', () => {
    it('handles setDateRange action', () => {
      const testStore = configureStore({ reducer: { filter: filterReducer } })
      const dateRange = { start: '2024-01-01', end: '2024-01-31' }
      
      testStore.dispatch(setDateRange(dateRange))
      
      expect(testStore.getState().filter.dateRange).toEqual(dateRange)
    })

    it('handles setBrandFilter action', () => {
      const testStore = configureStore({ reducer: { filter: filterReducer } })
      const brands = ['Brand A', 'Brand B']
      
      testStore.dispatch(setBrandFilter(brands))
      
      expect(testStore.getState().filter.selectedBrands).toEqual(brands)
    })

    it('handles setStoreFilter action', () => {
      const testStore = configureStore({ reducer: { filter: filterReducer } })
      const stores = ['Store 1', 'Store 2']
      
      testStore.dispatch(setStoreFilter(stores))
      
      expect(testStore.getState().filter.selectedStores).toEqual(stores)
    })
  })

  describe('UI Slice', () => {
    it('handles toggleSidebar action', () => {
      const testStore = configureStore({ reducer: { ui: uiReducer } })
      const initialState = testStore.getState().ui.sidebarOpen
      
      testStore.dispatch(toggleSidebar())
      expect(testStore.getState().ui.sidebarOpen).toBe(!initialState)
      
      testStore.dispatch(toggleSidebar())
      expect(testStore.getState().ui.sidebarOpen).toBe(initialState)
    })

    it('handles setTheme action', () => {
      const testStore = configureStore({ reducer: { ui: uiReducer } })
      
      testStore.dispatch(setTheme('dark'))
      expect(testStore.getState().ui.theme).toBe('dark')
      
      testStore.dispatch(setTheme('light'))
      expect(testStore.getState().ui.theme).toBe('light')
    })
  })
})