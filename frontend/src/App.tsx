import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'

import { RootState } from './store'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'

// Pages
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/Dashboard'
import { SalesAnalytics } from './pages/SalesAnalytics'
import { BrandPerformance } from './pages/BrandPerformance'
import { StoreMetrics } from './pages/StoreMetrics'
import { ProductInsights } from './pages/ProductInsights'
import { AIRecommendations } from './pages/AIRecommendations'
import { Settings } from './pages/Settings'

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  return (
    <Box sx={{ height: '100%' }}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesAnalytics />} />
          <Route path="/brands" element={<BrandPerformance />} />
          <Route path="/stores" element={<StoreMetrics />} />
          <Route path="/products" element={<ProductInsights />} />
          <Route path="/ai-insights" element={<AIRecommendations />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}

export default App