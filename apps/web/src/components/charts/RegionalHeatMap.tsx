import React, { useState, useId, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGeographicInsights } from '../../services/gold'
import { useFilters } from '../../context/FilterContext'
import { Skeleton } from '../ui/Skeleton'
import { Info } from 'lucide-react'

interface RegionData {
  region: string
  location: string
  revenue: number
  transactions: number
  customers: number
  basketSize: number
  category: string
  lat: number
  lng: number
}

// Color scale for heat map
const getHeatColor = (value: number, max: number) => {
  const intensity = value / max
  if (intensity > 0.8) return '#7C3AED' // Purple - highest
  if (intensity > 0.6) return '#6366F1' // Indigo
  if (intensity > 0.4) return '#3B82F6' // Blue
  if (intensity > 0.2) return '#10B981' // Green
  return '#F59E0B' // Amber - lowest
}

export const RegionalHeatMap: React.FC = () => {
  const { filters } = useFilters()
  const [viewMode, setViewMode] = useState<'revenue' | 'transactions' | 'customers'>('revenue')
  const chartId = useId()

  const { data, isLoading, error } = useQuery({
    queryKey: ['geographic-insights', filters],
    queryFn: async () => {
      const geoData = await getGeographicInsights({
        region: filters.region,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })

      return geoData.map(item => ({
        region: item.region_name,
        location: item.location_name,
        revenue: item.total_revenue || 0,
        transactions: item.transaction_count || 0,
        customers: item.unique_customers || 0,
        basketSize: item.average_basket_size || 0,
        category: item.top_category || 'N/A',
        lat: item.latitude,
        lng: item.longitude,
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return (
      <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
        <div className="text-center text-red-600">
          <p className="font-medium">Failed to load geographic data</p>
          <p className="text-sm mt-1">Please check your connection and try again</p>
        </div>
      </div>
    )
  }

  const mapData = data || []

  const maxValue = mapData.length > 0 ? Math.max(...mapData.map(d => 
    viewMode === 'revenue' ? d.revenue : 
    viewMode === 'transactions' ? d.transactions : 
    d.customers
  )) : 1

  // Group by region for visualization
  const regionGroups = mapData.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = []
    }
    acc[item.region].push(item)
    return acc
  }, {} as Record<string, RegionData[]>)

  // Generate accessibility summary
  const chartSummary = useMemo(() => {
    if (!mapData?.length) return 'No regional performance data available.'
    const totalRegions = Object.keys(regionGroups).length
    const totalLocations = mapData.length
    const currentMetric = viewMode === 'revenue' ? 'revenue' : viewMode === 'transactions' ? 'transactions' : 'customers'
    const totalValue = mapData.reduce((sum, d) => 
      sum + (viewMode === 'revenue' ? d.revenue : viewMode === 'transactions' ? d.transactions : d.customers), 0
    )
    const topLocation = mapData.reduce((max, d) => {
      const value = viewMode === 'revenue' ? d.revenue : viewMode === 'transactions' ? d.transactions : d.customers
      const maxValue = viewMode === 'revenue' ? max.revenue : viewMode === 'transactions' ? max.transactions : max.customers
      return value > maxValue ? d : max
    })
    return `Regional heat map showing ${currentMetric} across ${totalRegions} regions and ${totalLocations} locations. Total ${currentMetric}: ${totalValue.toLocaleString()}. Top performing location: ${topLocation?.location} in ${topLocation?.region}.`
  }, [mapData, regionGroups, viewMode])

  return (
    <figure className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl" aria-labelledby={`${chartId}-title`} aria-describedby={`${chartId}-desc`}>
      <div className="flex justify-between items-center mb-6">
        <h3 id={`${chartId}-title`} className="text-xl font-semibold">Regional Performance Heat Map</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('revenue')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'revenue' 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Revenue
          </button>
          <button 
            onClick={() => setViewMode('transactions')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'transactions' 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Transactions
          </button>
          <button 
            onClick={() => setViewMode('customers')}
            className={`px-3 py-1 text-sm rounded-lg ${
              viewMode === 'customers' 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Customers
          </button>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div 
        className="space-y-4 focus-visible-ring" 
        tabIndex={0}
        role="img"
        aria-label={`Regional heat map showing ${viewMode} data by location`}
      >
        <p id={`${chartId}-desc`} className="sr-only">{chartSummary}</p>
        {Object.entries(regionGroups).map(([region, provinces]) => (
          <div key={region}>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{region}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {provinces.map((location) => {
                const value = viewMode === 'revenue' ? location.revenue : 
                             viewMode === 'transactions' ? location.transactions : 
                             location.customers
                const color = getHeatColor(Math.abs(value), maxValue)
                
                return (
                  <div
                    key={location.location}
                    className="relative p-4 rounded-lg transition-all hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: color + '20', borderColor: color, borderWidth: '2px' }}
                    title={`Top Category: ${location.category}\nAvg Basket: ₱${location.basketSize.toFixed(2)}\nLat/Lng: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                  >
                    <p className="font-medium text-sm mb-1">{location.location}</p>
                    <p className="text-lg font-bold" style={{ color }}>
                      {viewMode === 'revenue' ? `₱${(value / 1000000).toFixed(1)}M` :
                       viewMode === 'transactions' ? value.toLocaleString() :
                       value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {viewMode === 'revenue' ? `${location.transactions.toLocaleString()} txns` :
                       viewMode === 'transactions' ? `${location.customers.toLocaleString()} customers` :
                       `₱${location.basketSize.toFixed(0)} avg basket`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Color intensity represents {viewMode === 'revenue' ? 'total revenue' : 
                                          viewMode === 'transactions' ? 'transaction count' : 
                                          'unique customers'}
            </span>
          </div>
          <div className="flex gap-1">
            {['#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#7C3AED'].map((color, i) => (
              <div
                key={color}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: color }}
                title={i === 0 ? 'Low' : i === 4 ? 'High' : ''}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="font-semibold">₱{(mapData.reduce((sum, d) => sum + d.revenue, 0) / 1000000).toFixed(1)}M</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="font-semibold">{mapData.reduce((sum, d) => sum + d.transactions, 0).toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="font-semibold">{mapData.reduce((sum, d) => sum + d.customers, 0).toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Avg Basket Size</p>
          <p className="font-semibold">
            ₱{mapData.length > 0 ? (mapData.reduce((sum, d) => sum + d.basketSize, 0) / mapData.length).toFixed(0) : '0'}
          </p>
        </div>
      </div>
    </figure>
  )
}