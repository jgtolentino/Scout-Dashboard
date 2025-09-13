import { useRef, useEffect, useState } from 'react'
import Chart from 'chart.js/auto'
import { useDataStore } from '../store/dataStore'

function ChartGrid() {
  const { data, filters, setFilter, dataSource, isLoading } = useDataStore()
  
  // Chart refs
  const salesByRegionRef = useRef(null)
  const salesByCategoryRef = useRef(null)
  const salesTrendRef = useRef(null)
  
  // Chart instances
  const chartsRef = useRef({
    salesByRegion: null,
    salesByCategory: null,
    salesTrend: null
  })
  
  // TBWA Colors
  const colors = {
    yellow: '#FFCF00',
    yellowLight: 'rgba(255, 207, 0, 0.2)',
    black: '#000000',
    gray: '#9CA3AF',
    lightGray: '#F3F4F6'
  }
  
  // Track window width for responsive chart adjustments
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  
  // Handle window resize for responsive legend positioning
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      
      // Update existing charts when window size changes
      if (chartsRef.current.salesByCategory) {
        chartsRef.current.salesByCategory.options.plugins.legend.position = 
          window.innerWidth <= 640 ? 'bottom' : 'right'
        chartsRef.current.salesByCategory.update()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Trigger when data source or data changes
  useEffect(() => {
    // Skip if data is still loading or not available
    if (isLoading || !data) return
    
    // Initialize or update charts with data
    createOrUpdateCharts()
    
    // Add source indicator to console
    console.log(`Rendering charts with ${dataSource} data source`)
    
    // Cleanup function
    return () => {
      Object.values(chartsRef.current).forEach(chart => {
        if (chart) chart.destroy()
      })
    }
  }, [data, windowWidth, dataSource, isLoading])
  
  const createOrUpdateCharts = () => {
    // Sales by Region chart
    if (data?.salesByRegion && salesByRegionRef.current) {
      if (chartsRef.current.salesByRegion) {
        chartsRef.current.salesByRegion.destroy()
      }
      
      const ctx = salesByRegionRef.current.getContext('2d')
      chartsRef.current.salesByRegion = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.salesByRegion.map(item => item.region),
          datasets: [{
            label: 'Sales by Region',
            data: data.salesByRegion.map(item => item.value),
            backgroundColor: colors.yellow,
            borderColor: colors.yellow,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: colors.black,
              titleColor: '#FFF',
              bodyColor: '#FFF',
              cornerRadius: 4,
              padding: 10
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: colors.lightGray
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      })
    }
    
    // Sales by Category chart
    if (data?.salesByCategory && salesByCategoryRef.current) {
      if (chartsRef.current.salesByCategory) {
        chartsRef.current.salesByCategory.destroy()
      }
      
      const ctx = salesByCategoryRef.current.getContext('2d')
      chartsRef.current.salesByCategory = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.salesByCategory.map(item => item.category),
          datasets: [{
            data: data.salesByCategory.map(item => item.value),
            backgroundColor: [
              colors.yellow,
              colors.yellowLight,
              colors.gray,
              colors.lightGray
            ],
            borderColor: '#FFF',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: window.innerWidth <= 640 ? 'bottom' : 'right',
              labels: {
                boxWidth: 15,
                padding: 15
              }
            },
            tooltip: {
              backgroundColor: colors.black,
              titleColor: '#FFF',
              bodyColor: '#FFF',
              cornerRadius: 4,
              padding: 10
            }
          },
          cutout: '70%'
        }
      })
    }
    
    // Sales Trend chart
    if (data?.salesTrend && salesTrendRef.current) {
      if (chartsRef.current.salesTrend) {
        chartsRef.current.salesTrend.destroy()
      }
      
      const ctx = salesTrendRef.current.getContext('2d')
      chartsRef.current.salesTrend = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.salesTrend.map(item => item.month),
          datasets: [{
            label: 'Monthly Sales',
            data: data.salesTrend.map(item => item.value),
            backgroundColor: colors.yellowLight,
            borderColor: colors.yellow,
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: colors.yellow,
            pointBorderColor: '#FFF',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: colors.black,
              titleColor: '#FFF',
              bodyColor: '#FFF',
              cornerRadius: 4,
              padding: 10
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: colors.lightGray
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      })
    }
  }
  
  // Show loading state or no data message
  if (!data) {
    return null
  }
  
  // Add data source indicator visual cue
  const dataSourceIndicator = dataSource === 'realtime' ? (
    <div className="fixed top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
      Live Data
    </div>
  ) : null
  
  // Format numbers
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  const formatPercent = (num) => {
    return `${num}%`
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dataSourceIndicator}
      {/* KPI Cards */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Total Sales</h3>
        </div>
        <div className="chart-card-body flex flex-col items-center justify-center h-32">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.kpis.totalSales)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Year to Date
          </div>
        </div>
      </div>
      
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Average Order</h3>
        </div>
        <div className="chart-card-body flex flex-col items-center justify-center h-32">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.kpis.averageOrder)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Per Transaction
          </div>
        </div>
      </div>
      
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Customer Count</h3>
        </div>
        <div className="chart-card-body flex flex-col items-center justify-center h-32">
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.kpis.customerCount)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Active Customers
          </div>
        </div>
      </div>
      
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Conversion Rate</h3>
        </div>
        <div className="chart-card-body flex flex-col items-center justify-center h-32">
          <div className="text-3xl font-bold text-gray-900">
            {formatPercent(data.kpis.conversionRate)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            From Visitors
          </div>
        </div>
      </div>
      
      {/* Chart: Sales by Region */}
      <div className="chart-card md:col-span-2">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Sales by Region</h3>
          <div className="filter-dropdown">
            <select 
              onChange={(e) => setFilter('region', e.target.value)}
              value={filters.region}
              className="appearance-none bg-transparent border-none w-full py-0 px-0 pr-7 focus:outline-none text-xs"
            >
              <option value="all">All Regions</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="chart-card-body h-64">
          <canvas ref={salesByRegionRef}></canvas>
        </div>
      </div>
      
      {/* Chart: Sales by Category */}
      <div className="chart-card md:col-span-2">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Sales by Category</h3>
          <div className="filter-dropdown">
            <select 
              onChange={(e) => setFilter('category', e.target.value)}
              value={filters.category}
              className="appearance-none bg-transparent border-none w-full py-0 px-0 pr-7 focus:outline-none text-xs"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food</option>
              <option value="home">Home</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="chart-card-body h-64">
          <canvas ref={salesByCategoryRef}></canvas>
        </div>
      </div>
      
      {/* Chart: Sales Trend */}
      <div className="chart-card md:col-span-4">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Monthly Sales Trend</h3>
          <div className="filter-dropdown">
            <select 
              onChange={(e) => setFilter('date', e.target.value)}
              value={filters.date}
              className="appearance-none bg-transparent border-none w-full py-0 px-0 pr-7 focus:outline-none text-xs"
            >
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="chart-card-body h-64">
          <canvas ref={salesTrendRef}></canvas>
        </div>
      </div>
    </div>
  )
}

export default ChartGrid
