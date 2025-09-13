import { useState, useEffect } from 'react'
import './App.css'

interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  avgBasketSize: number
  topBrand: string
}

function App() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalTransactions: 0,
    avgBasketSize: 0,
    topBrand: 'Loading...'
  })

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setData({
        totalRevenue: 125430.50,
        totalTransactions: 342,
        avgBasketSize: 366.76,
        topBrand: 'Alaska Milk'
      })
    }, 1000)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>📊 Retail Analytics Dashboard</h1>
        <p>Philippine Market Insights</p>
      </header>

      <main className="dashboard">
        <div className="kpi-grid">
          <div className="kpi-card">
            <h3>Total Revenue</h3>
            <p className="kpi-value">₱{data.totalRevenue.toLocaleString('en-PH')}</p>
            <span className="kpi-change positive">+12.5%</span>
          </div>

          <div className="kpi-card">
            <h3>Transactions</h3>
            <p className="kpi-value">{data.totalTransactions}</p>
            <span className="kpi-change positive">+8.3%</span>
          </div>

          <div className="kpi-card">
            <h3>Avg Basket Size</h3>
            <p className="kpi-value">₱{data.avgBasketSize.toFixed(2)}</p>
            <span className="kpi-change positive">+3.7%</span>
          </div>

          <div className="kpi-card">
            <h3>Top Brand</h3>
            <p className="kpi-value">{data.topBrand}</p>
            <span className="kpi-badge">TBWA Client</span>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Top 5 Brands</h3>
            <div className="simple-bars">
              <div className="bar-item">
                <span>Alaska Milk</span>
                <div className="bar" style={{width: '90%'}}>₱45.2K</div>
              </div>
              <div className="bar-item">
                <span>Oishi</span>
                <div className="bar" style={{width: '75%'}}>₱37.8K</div>
              </div>
              <div className="bar-item">
                <span>Del Monte</span>
                <div className="bar" style={{width: '60%'}}>₱30.1K</div>
              </div>
              <div className="bar-item">
                <span>Lucky Me!</span>
                <div className="bar competitor" style={{width: '50%'}}>₱25.0K</div>
              </div>
              <div className="bar-item">
                <span>Coca-Cola</span>
                <div className="bar competitor" style={{width: '45%'}}>₱22.5K</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Regional Performance</h3>
            <div className="region-list">
              <div className="region-item">
                <span>Metro Manila</span>
                <span className="region-value">₱52.3K</span>
              </div>
              <div className="region-item">
                <span>Cebu</span>
                <span className="region-value">₱28.7K</span>
              </div>
              <div className="region-item">
                <span>Davao</span>
                <span className="region-value">₱19.4K</span>
              </div>
              <div className="region-item">
                <span>Pampanga</span>
                <span className="region-value">₱15.2K</span>
              </div>
              <div className="region-item">
                <span>Batangas</span>
                <span className="region-value">₱9.8K</span>
              </div>
            </div>
          </div>
        </div>

        <div className="recent-section">
          <h3>Recent Transactions</h3>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Store</th>
                <th>Amount</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>10:34 AM</td>
                <td>SM Megamall</td>
                <td>₱1,234.50</td>
                <td>8 items</td>
              </tr>
              <tr>
                <td>10:28 AM</td>
                <td>Robinsons Galleria</td>
                <td>₱567.25</td>
                <td>4 items</td>
              </tr>
              <tr>
                <td>10:15 AM</td>
                <td>Puregold Cubao</td>
                <td>₱892.00</td>
                <td>6 items</td>
              </tr>
              <tr>
                <td>10:02 AM</td>
                <td>SaveMore Makati</td>
                <td>₱445.75</td>
                <td>3 items</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default App
