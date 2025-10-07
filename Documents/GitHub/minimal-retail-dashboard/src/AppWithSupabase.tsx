import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './lib/supabase'

interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  avgBasketSize: number
  topBrand: string
  loading: boolean
  error: string | null
}

function AppWithSupabase() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalTransactions: 0,
    avgBasketSize: 0,
    topBrand: 'Loading...',
    loading: true,
    error: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
      
      if (transError) throw transError

      // Calculate KPIs
      if (transactions && transactions.length > 0) {
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_value || 0), 0)
        const totalTransactions = transactions.length
        const avgBasketSize = totalRevenue / totalTransactions

        // Fetch top brand
        const { data: items } = await supabase
          .from('transaction_items')
          .select(`
            quantity,
            price,
            skus (
              brand_id,
              brands (
                brand_name
              )
            )
          `)
          .limit(100)

        // Calculate brand revenues
        const brandRevenues: Record<string, number> = {}
        items?.forEach(item => {
          const brandName = item.skus?.brands?.brand_name
          if (brandName) {
            brandRevenues[brandName] = (brandRevenues[brandName] || 0) + (item.price * item.quantity)
          }
        })

        const topBrand = Object.entries(brandRevenues)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

        setData({
          totalRevenue,
          totalTransactions,
          avgBasketSize,
          topBrand,
          loading: false,
          error: null
        })
      } else {
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'No data found'
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data'
      }))
    }
  }

  if (data.loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>📊 Retail Analytics Dashboard</h1>
          <p>Loading data...</p>
        </header>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="app">
        <header className="header">
          <h1>📊 Retail Analytics Dashboard</h1>
          <p>Error: {data.error}</p>
        </header>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📊 Retail Analytics Dashboard</h1>
        <p>Philippine Market Insights - Live Data</p>
      </header>

      <main className="dashboard">
        <div className="kpi-grid">
          <div className="kpi-card">
            <h3>Total Revenue</h3>
            <p className="kpi-value">₱{data.totalRevenue.toLocaleString('en-PH')}</p>
            <span className="kpi-change positive">Live</span>
          </div>

          <div className="kpi-card">
            <h3>Transactions</h3>
            <p className="kpi-value">{data.totalTransactions}</p>
            <span className="kpi-change positive">Live</span>
          </div>

          <div className="kpi-card">
            <h3>Avg Basket Size</h3>
            <p className="kpi-value">₱{data.avgBasketSize.toFixed(2)}</p>
            <span className="kpi-change positive">Live</span>
          </div>

          <div className="kpi-card">
            <h3>Top Brand</h3>
            <p className="kpi-value">{data.topBrand}</p>
            <span className="kpi-badge">From Database</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppWithSupabase