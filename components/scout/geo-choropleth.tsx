"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { SVGMap } from "react-svg-map"
import philippines from "@svg-maps/philippines"
import { scaleQuantize } from "d3-scale"
import { extent } from "d3-array"
import { format } from "d3-format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { normalizeProvinceName } from "@/lib/utils"
import type { GeoData } from "@/lib/types/transactions"
import "react-svg-map/lib/index.css"

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

  const { colorScale, dataByProvince, extent: [min, max] } = useMemo(() => {
    const map = new Map<string, number>()
    
    rows.forEach(row => {
      const key = normalizeProvinceName(row.province)
      map.set(key, row[metric])
    })

    const values = Array.from(map.values()).filter(v => v > 0)
    const [min, max] = values.length ? extent(values) as [number, number] : [0, 1]

    const scale = scaleQuantize<string>()
      .domain([min, max])
      .range([
        "#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc",
        "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1"
      ])

    return { 
      colorScale: scale, 
      dataByProvince: map, 
      extent: [min, max] 
    }
  }, [rows, metric])

  const formatter = metric === "sales" 
    ? format("₱,.0f") 
    : format(",d")

  const handleMouseMove = (event: React.MouseEvent) => {
    const target = event.target as SVGElement
    const name = target.getAttribute("name") || ""
    const key = normalizeProvinceName(name)
    const value = dataByProvince.get(key)

    if (value !== undefined) {
      setTooltip({
        show: true,
        content: `${name}: ${formatter(value)}`,
        x: event.clientX + 10,
        y: event.clientY - 10
      })
    }
  }

  const handleMouseLeave = () => {
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
          <div className="aspect-[4/3] w-full">
            <SVGMap
              map={philippines}
              className="h-full w-full"
              locationClassName={(location) => {
                const name = location?.getAttribute("name") || ""
                const key = normalizeProvinceName(name)
                const value = dataByProvince.get(key)
                
                return `transition-all duration-200 ${
                  value !== undefined ? 'cursor-pointer hover:stroke-2' : 'opacity-40'
                }`
              }}
              onLocationMouseOver={(event) => {
                const target = event.target as SVGElement
                const name = target.getAttribute("name") || ""
                const key = normalizeProvinceName(name)
                const value = dataByProvince.get(key)
                
                if (value !== undefined) {
                  target.style.fill = colorScale(value)
                } else {
                  target.style.fill = "#e5e7eb"
                }
                
                handleMouseMove(event as any)
              }}
              onLocationMouseOut={(event) => {
                const target = event.target as SVGElement
                const name = target.getAttribute("name") || ""
                const key = normalizeProvinceName(name)
                const value = dataByProvince.get(key)
                
                if (value !== undefined) {
                  target.style.fill = colorScale(value)
                } else {
                  target.style.fill = "#e5e7eb"
                }
                
                handleMouseLeave()
              }}
            />
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
      </CardContent>
    </Card>
  )
}