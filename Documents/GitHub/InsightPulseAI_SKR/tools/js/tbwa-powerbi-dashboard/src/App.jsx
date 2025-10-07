import { useState, useEffect } from 'react'
import DashboardHeader from './components/DashboardHeader'
import PowerBIDashboard from './components/PowerBIDashboard'
import { usePowerBIDataStore } from './store/powerBIDataStore'
import './styles/powerbi-styles.css'

function App() {
  const { dataSource, isLoading } = usePowerBIDataStore()
  const [isPowerBIMode, setIsPowerBIMode] = useState(false)

  // Check if Power BI mode is enabled via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const powerBIParam = urlParams.get('powerbi')
    if (powerBIParam === 'true') {
      setIsPowerBIMode(true)
    }
  }, [])

  // Toggle between standard and Power BI modes
  const togglePowerBIMode = () => {
    setIsPowerBIMode(!isPowerBIMode)
    
    // Update URL
    const url = new URL(window.location)
    if (!isPowerBIMode) {
      url.searchParams.set('powerbi', 'true')
    } else {
      url.searchParams.delete('powerbi')
    }
    window.history.pushState({}, '', url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Mode toggle */}
      <div className="fixed right-4 top-20 z-50">
        <button
          className="px-3 py-2 text-sm font-medium bg-white text-gray-800 shadow-md rounded-md border border-gray-200 hover:bg-gray-50"
          onClick={togglePowerBIMode}
        >
          {isPowerBIMode ? 'Switch to Standard View' : 'Switch to Power BI View'}
        </button>
      </div>
      
      {isPowerBIMode ? (
        <PowerBIDashboard />
      ) : (
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">TBWA Retail Advisor Dashboard</h1>
            <div className="flex gap-4 items-center">
              {/* DataToggle and ExportButton would be here from original dashboard */}
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tbwa-yellow"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Original dashboard content would be here */}
            </div>
          )}
        </main>
      )}
      
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-sm text-gray-500">
          <p>Data source: {dataSource === 'simulated' ? 'Simulated Data' : dataSource === 'powerbi' ? 'Power BI Dataset' : 'Real-time API'}</p>
          <p>© 2025 TBWA\Retail. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App