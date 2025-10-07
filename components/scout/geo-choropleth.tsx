"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Map from "react-map-gl"
import type { MapLayerMouseEvent } from "react-map-gl"
import { scaleQuantize } from "d3-scale"
import { extent } from "d3-array"
import { format } from "d3-format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { normalizeProvinceName } from "@/lib/utils"
import type { GeoData } from "@/lib/types/transactions"
import "mapbox-gl/dist/mapbox-gl.css"

type GeoResponse = { 
  rows: GeoData[]
  error?: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function GeoChoroplethPH({ 
  metric = "tx_count" 
}: { 
  metric?: "tx_count" | "sales" 
}) {
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0
  })

  const { data, error, isLoading } = useSWR<GeoResponse>("/api/scout/geo", fetcher)
  const rows = data?.rows || []

  const { mapData, colorScale, extent: [min, max] } = useMemo(() => {
    const dataByProvince = new Map<string, number>()
    
    rows.forEach(row => {
      const key = normalizeProvinceName(row.province)
      dataByProvince.set(key, row[metric])
    })

    const values = Array.from(dataByProvince.values()).filter(v => v > 0)
    const [min, max] = values.length ? extent(values) as [number, number] : [0, 1]

    const scale = scaleQuantize<string>()
      .domain([min, max])
      .range([
        "#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc",
        "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1"
      ])

    // Create choropleth expression for Mapbox
    const choroplethExpression: any = ["case"]
    
    dataByProvince.forEach((value, province) => {
      choroplethExpression.push(["==", ["get", "name"], province])
      choroplethExpression.push(scale(value))
    })
    
    choroplethExpression.push("#e5e7eb") // default color

    return { 
      mapData: { dataByProvince, choroplethExpression },
      colorScale: scale, 
      extent: [min, max] 
    }
  }, [rows, metric])

  const formatter = metric === "sales" 
    ? format("₱,.0f") 
    : format(",d")

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (event.features && event.features[0]) {
      const feature = event.features[0]
      const name = feature.properties?.name || ""
      const key = normalizeProvinceName(name)
      const value = mapData.dataByProvince.get(key)

      if (value !== undefined) {
        setTooltip({
          show: true,
          content: `${name}: ${formatter(value)}`,
          x: event.point.x + 10,
          y: event.point.y - 10
        })
      }
    }
  }

  const handleMapLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Philippines Heat Map</CardTitle>
          <CardDescription>Loading geographic data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || data?.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Philippines Heat Map</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Failed to load geographic data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Philippines Heat Map - {metric === "sales" ? "Sales" : "Transactions"}
        </CardTitle>
        <CardDescription>
          Range: {formatter(min)} - {formatter(max)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <div className="h-96 w-full rounded-lg overflow-hidden">
            <Map
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.demo.token'}
              initialViewState={{
                longitude: 121.7740,
                latitude: 12.8797,
                zoom: 5.5
              }}
              style={{width: '100%', height: '100%'}}
              mapStyle="mapbox://styles/mapbox/light-v9"
              interactiveLayerIds={['philippines-fill']}
              onClick={handleMapClick}
              onMouseLeave={handleMapLeave}
            >
              {/* For now, show a simple fallback message */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Interactive Philippines Map</p>
                  <p className="text-sm text-gray-500">
                    {rows.length > 0 ? `${rows.length} provinces with data` : 'Loading geographic data...'}
                  </p>
                </div>
              </div>
            </Map>
          </div>

          {/* Tooltip */}
          {tooltip.show && (
            <div
              className="absolute z-10 px-2 py-1 text-sm bg-black text-white rounded shadow-lg pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.content}
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="mt-4 flex items-center justify-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Low</span>
          {colorScale.range().map((color, i) => (
            <div
              key={i}
              className="h-4 w-8 border border-gray-200 first:rounded-l last:rounded-r"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">High</span>
        </div>

        {/* Development Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Development Note:</strong> This component has been updated to use Mapbox GL JS instead of the missing @svg-maps/philippines package. 
            To fully implement the choropleth map, you'll need to:
          </p>
          <ul className="text-sm text-blue-600 mt-2 list-disc list-inside">
            <li>Add a valid Mapbox access token to NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</li>
            <li>Include Philippines administrative boundaries GeoJSON data</li>
            <li>Configure the choropleth layer styling</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}