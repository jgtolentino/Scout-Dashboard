# Scout Analytics Dashboard
## Comprehensive Product Requirements Document v3.1
**Date:** 20250628  
**Owner:** TBWA\SMAP  
**Version:** 3.1 (MySQL + Docker + Render + Vercel)

---

## Table of Contents

**Core Specifications**
1. Executive Summary
2. YAML Specification
3. Component Architecture
4. Backend Implementation

**Implementation**
5. Database Schema
6. Testing Scenarios
7. CI/CD Pipeline
8. Wireframes & Design

**Advanced Features**
9. Transaction Trends
10. AI Integration
11. Dependencies
12. Deployment Guide

---

## 1. Executive Summary

### Project Overview
Scout Analytics Dashboard is a comprehensive real-time analytics solution for retail businesses, providing insights into sales, product mix, consumer behavior, and AI-driven recommendations. With robust hierarchical filters and drill-down capabilities, it transforms complex data into actionable intelligence.

### Key Capabilities
• Real-time sales analytics  
• Product performance tracking  
• Consumer behavior analysis  
• AI-powered insights  
• Geographic visualization  
• Multi-tier filtering system  

### Technical Architecture
**Frontend:** React 18 + TypeScript  
**Backend:** Node.js + Express  
**Database:** MySQL 8.0  
**AI Services:** OpenAI API  
**Frontend Hosting:** Vercel  
**Backend Hosting:** Render  
**Containerization:** Docker  

---

## 2. Complete YAML Specification

```yaml
# scout-analytics-config.yaml
application:
  name: scout-analytics-dashboard
  version: 3.1.0
  owner: TBWA\SMAP
  environment:
    - local
    - staging
    - production

architecture:
  frontend:
    framework: React 18 + TypeScript
    state_management: Zustand
    ui_library: Shadcn/UI + Tailwind CSS
    testing: Playwright + Cypress + Vitest
    build_tool: Vite
    hosting: Vercel
    
  backend:
    runtime: Node.js 18+
    framework: Express + TypeScript
    database: MySQL 8.0
    ai_service: OpenAI API
    caching: Redis
    hosting: Render
    containerization: Docker
    
  infrastructure:
    cdn: Vercel Edge Network
    monitoring: Render Metrics
    authentication: None (Public App)

filters:
  geography:
    hierarchy: [region, city_municipality, barangay]
    schema:
      region: VARCHAR(100)
      city_municipality: VARCHAR(100)
      barangay: VARCHAR(100)
      latitude: DECIMAL(10,8)
      longitude: DECIMAL(11,8)
      
  organization:
    hierarchy: [client, category, brand, sku]
    schema:
      client: VARCHAR(100)
      category: VARCHAR(100)
      brand: VARCHAR(100)
      sku: VARCHAR(150)
      
  time:
    hierarchy: [year, month, week, day_of_week, hour, minute, second]
    schema:
      datetime: TIMESTAMP
      year: INTEGER
      month: INTEGER
      week: INTEGER
      day_of_week: VARCHAR(20)
      hour: INTEGER
      minute: INTEGER
      second: INTEGER

  global_persistent_filters:
    cascading_behavior: true
    filter_memory: persistent_across_pages
    drill_down_enabled: true
    high_dimensional_support: true
    total_filter_combinations: calculated_dynamically

database:
  type: MySQL 8.0
  tables:
    geography:
      columns:
        - id: VARCHAR(36) PRIMARY KEY
        - region: VARCHAR(100) NOT NULL
        - city_municipality: VARCHAR(100) NOT NULL
        - barangay: VARCHAR(100) NOT NULL
        - latitude: DECIMAL(10,8) NOT NULL
        - longitude: DECIMAL(11,8) NOT NULL
        - polygon_bounds: JSON
        - population: INTEGER
        - area_sqkm: DECIMAL(10,2)
        - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      indexes:
        - idx_geography_region
        - idx_geography_city_municipality
        - idx_geography_barangay
        - idx_geography_coordinates
        - idx_geography_hierarchy
        
    organization:
      columns:
        - id: VARCHAR(36) PRIMARY KEY
        - client: VARCHAR(100) NOT NULL
        - category: VARCHAR(100) NOT NULL
        - brand: VARCHAR(100) NOT NULL
        - sku: VARCHAR(150) NOT NULL
        - sku_description: TEXT
        - unit_price: DECIMAL(10,2)
        - margin_percent: DECIMAL(5,2)
        - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      indexes:
        - idx_organization_client
        - idx_organization_category
        - idx_organization_brand
        - idx_organization_sku
        - idx_organization_hierarchy
        
    transactions:
      columns:
        - id: VARCHAR(36) PRIMARY KEY
        - datetime: TIMESTAMP NOT NULL
        - geography_id: VARCHAR(36)
        - organization_id: VARCHAR(36)
        - total_amount: DECIMAL(15,2)
        - quantity: INTEGER
        - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      indexes:
        - idx_transactions_datetime
        - idx_transactions_geography
        - idx_transactions_organization
      foreign_keys:
        - geography_id REFERENCES geography(id)
        - organization_id REFERENCES organization(id)

api:
  base_url: /api/v1
  authentication: None (Public API)
  rate_limiting: 100 requests/minute per IP
  endpoints:
    filters:
      - GET /filters/geography/options
      - GET /filters/organization/options
      - GET /filters/counts
    analytics:
      - GET /analytics/overview
      - GET /analytics/transactions
      - GET /analytics/product-mix
      - GET /analytics/consumer-behavior
    ai:
      - POST /ai/insights
      - POST /ai/chat
      
monitoring:
  metrics:
    - response_time_p95: <500ms
    - error_rate: <1%
    - uptime: >99.9%
    - database_connection_pool: <80%
```

---

## 3. Component Architecture

### Frontend Components

**Core Components**
• CascadingFilters.tsx  
• KPICards.tsx  
• RegionalMap.tsx  
• RetailBot.tsx  

**Pages**
• Overview.tsx  
• TransactionTrends.tsx  
• ProductMix.tsx  
• ConsumerBehavior.tsx  

**State Management**
• filterStore.ts (Zustand)  
• dataStore.ts (Zustand)  

### Backend Services

**API Routes**
• /routes/filters.ts  
• /routes/analytics.ts  
• /routes/ai.ts  

**Services**
• database.ts  
• openai.ts  

**Middleware**
• validation.ts  
• errorHandler.ts  
• cors.ts  

### Cascading Filters Implementation

```tsx
// GlobalFilterStore.tsx - Enhanced Hierarchical Filtering
import React, { useEffect, useState } from 'react'
import { useFilterStore } from '@/stores/filterStore'

interface FilterOption {
  value: string
  label: string
  count: number
  children?: FilterOption[]
}

const GlobalCascadingFilters: React.FC = () => {
  const { filters, setFilter, clearFilters, getTotalCombinations } = useFilterStore()
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption[]>>({})
  const [totalCombinations, setTotalCombinations] = useState(0)
  
  // Hierarchical filter definitions
  const geographyHierarchy = ['region', 'city_municipality', 'barangay']
  const organizationHierarchy = ['client', 'category', 'brand', 'sku']
  const timeHierarchy = ['year', 'month', 'week', 'day_of_week', 'hour', 'minute', 'second']
  
  // Calculate total filter combinations for high-dimensional analysis
  useEffect(() => {
    const calculateCombinations = async () => {
      const total = await getTotalCombinations(filters)
      setTotalCombinations(total)
    }
    calculateCombinations()
  }, [filters])
  
  // Enhanced filter change handler with drill-down capability
  const handleFilterChange = (hierarchy: string[], level: string, value: string) => {
    setFilter(level, value)
    
    // Clear downstream filters in the same hierarchy
    const levelIndex = hierarchy.indexOf(level)
    const downstreamLevels = hierarchy.slice(levelIndex + 1)
    downstreamLevels.forEach(downLevel => setFilter(downLevel, ''))
    
    // Trigger global filter update event
    window.dispatchEvent(new CustomEvent('globalFiltersChanged', { 
      detail: { filters, changedLevel: level, totalCombinations } 
    }))
  }
  
  // Render hierarchical filter dropdown
  const renderFilterDropdown = (hierarchy: string[], level: string, label: string) => (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={filters[level] || ''}
        onChange={(e) => handleFilterChange(hierarchy, level, e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All {label}</option>
        {filterOptions[level]?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </div>
  )
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Global Persistent Filters</h3>
        <div className="text-sm text-gray-500">
          {totalCombinations.toLocaleString()} filter combinations available
        </div>
      </div>
      
      {/* Geography Filters */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-sm font-medium text-gray-600 col-span-3">📍 Geographic Hierarchy</div>
        {renderFilterDropdown(geographyHierarchy, 'region', 'Region')}
        {renderFilterDropdown(geographyHierarchy, 'city_municipality', 'City/Municipality')}
        {renderFilterDropdown(geographyHierarchy, 'barangay', 'Barangay')}
      </div>
      
      {/* Organization Filters */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-sm font-medium text-gray-600 col-span-4">🏢 Organization Hierarchy</div>
        {renderFilterDropdown(organizationHierarchy, 'client', 'Client')}
        {renderFilterDropdown(organizationHierarchy, 'category', 'Category')}
        {renderFilterDropdown(organizationHierarchy, 'brand', 'Brand')}
        {renderFilterDropdown(organizationHierarchy, 'sku', 'SKU')}
      </div>
      
      {/* Time Filters */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        <div className="text-sm font-medium text-gray-600 col-span-7">⏰ Time Hierarchy</div>
        {renderFilterDropdown(timeHierarchy, 'year', 'Year')}
        {renderFilterDropdown(timeHierarchy, 'month', 'Month')}
        {renderFilterDropdown(timeHierarchy, 'week', 'Week')}
        {renderFilterDropdown(timeHierarchy, 'day_of_week', 'Day')}
        {renderFilterDropdown(timeHierarchy, 'hour', 'Hour')}
        {renderFilterDropdown(timeHierarchy, 'minute', 'Minute')}
        {renderFilterDropdown(timeHierarchy, 'second', 'Second')}
      </div>
      
      {/* Filter Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Clear All Filters
        </button>
        <div className="text-xs text-gray-500">
          Filters persist across all dashboard pages
        </div>
      </div>
    </div>
  )
}

// GeospatialMap.tsx - Advanced Mapping Component
import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polygon, useMap } from 'react-leaflet'
import { useFilterStore } from '@/stores/filterStore'
import 'leaflet/dist/leaflet.css'

interface MapData {
  region: string
  city_municipality?: string
  barangay?: string
  latitude: number
  longitude: number
  total_sales: number
  transaction_count: number
  population?: number
  polygon_bounds?: any[]
}

type MapVisualization = 'bubble' | 'choropleth' | 'hybrid'

const GeospatialMap: React.FC = () => {
  const { filters } = useFilterStore()
  const [mapData, setMapData] = useState<MapData[]>([])
  const [visualization, setVisualization] = useState<MapVisualization>('bubble')
  const [loading, setLoading] = useState(false)
  
  // Dynamic zoom level based on filter hierarchy
  const getZoomLevel = () => {
    if (filters.barangay) return 14
    if (filters.city_municipality) return 11
    if (filters.region) return 9
    return 6 // Philippines overview
  }
  
  // Get map center based on current filters
  const getMapCenter = (): [number, number] => {
    if (mapData.length > 0) {
      const avgLat = mapData.reduce((sum, item) => sum + item.latitude, 0) / mapData.length
      const avgLng = mapData.reduce((sum, item) => sum + item.longitude, 0) / mapData.length
      return [avgLat, avgLng]
    }
    return [12.8797, 121.7740] // Philippines center
  }
  
  // Calculate bubble size based on sales volume
  const getBubbleSize = (sales: number, maxSales: number) => {
    const minSize = 5
    const maxSize = 50
    return minSize + (sales / maxSales) * (maxSize - minSize)
  }
  
  // Get color based on performance metrics
  const getPerformanceColor = (value: number, max: number) => {
    const intensity = value / max
    if (intensity > 0.8) return '#1f77b4' // High performance - Blue
    if (intensity > 0.6) return '#2ca02c' // Good performance - Green
    if (intensity > 0.4) return '#ff7f0e' // Average performance - Orange
    if (intensity > 0.2) return '#d62728' // Low performance - Red
    return '#9467bd' // Very low performance - Purple
  }
  
  // Render bubble map visualization
  const renderBubbleMap = () => {
    const maxSales = Math.max(...mapData.map(item => item.total_sales))
    
    return mapData.map((item, index) => (
      <CircleMarker
        key={index}
        center={[item.latitude, item.longitude]}
        radius={getBubbleSize(item.total_sales, maxSales)}
        fillColor={getPerformanceColor(item.total_sales, maxSales)}
        color="white"
        weight={2}
        opacity={0.8}
        fillOpacity={0.6}
      >
        <Popup>
          <div className="p-2">
            <h4 className="font-semibold">{item.barangay || item.city_municipality || item.region}</h4>
            <p>Sales: ₱{item.total_sales.toLocaleString()}</p>
            <p>Transactions: {item.transaction_count.toLocaleString()}</p>
            {item.population && <p>Population: {item.population.toLocaleString()}</p>}
          </div>
        </Popup>
      </CircleMarker>
    ))
  }
  
  // Render choropleth map visualization
  const renderChoroplethMap = () => {
    const maxSales = Math.max(...mapData.map(item => item.total_sales))
    
    return mapData.map((item, index) => {
      if (!item.polygon_bounds) return null
      
      return (
        <Polygon
          key={index}
          positions={item.polygon_bounds}
          fillColor={getPerformanceColor(item.total_sales, maxSales)}
          fillOpacity={0.7}
          color="white"
          weight={2}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold">{item.barangay || item.city_municipality || item.region}</h4>
              <p>Sales: ₱{item.total_sales.toLocaleString()}</p>
              <p>Transactions: {item.transaction_count.toLocaleString()}</p>
              {item.population && <p>Sales per Capita: ₱{(item.total_sales / item.population).toFixed(2)}</p>}
            </div>
          </Popup>
        </Polygon>
      )
    }).filter(Boolean)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Geospatial Analytics</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setVisualization('bubble')}
              className={`px-3 py-1 text-sm rounded ${
                visualization === 'bubble' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Bubble Map
            </button>
            <button
              onClick={() => setVisualization('choropleth')}
              className={`px-3 py-1 text-sm rounded ${
                visualization === 'choropleth' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Choropleth
            </button>
            <button
              onClick={() => setVisualization('hybrid')}
              className={`px-3 py-1 text-sm rounded ${
                visualization === 'hybrid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Hybrid View
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-96">
        <MapContainer
          center={getMapCenter()}
          zoom={getZoomLevel()}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {(visualization === 'bubble' || visualization === 'hybrid') && renderBubbleMap()}
          {(visualization === 'choropleth' || visualization === 'hybrid') && renderChoroplethMap()}
        </MapContainer>
      </div>
      
      {/* Map Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>High Performance</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>Good Performance</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Average Performance</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>Low Performance</span>
            </div>
          </div>
          <div className="text-gray-600">
            Showing {mapData.length} locations
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Backend Implementation

### Express Server Setup

```typescript
// server/src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { validateFilters } from './middleware/validation'
import filtersRouter from './routes/filters'
import analyticsRouter from './routes/analytics'
import aiRouter from './routes/ai'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: false
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' }
})
app.use('/api', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Validation middleware
app.use('/api', validateFilters)

// Routes
app.use('/api/v1/filters', filtersRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/ai', aiRouter)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.1.0'
  })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
```

### Enhanced Database Service for Hierarchical Filtering

```typescript
// server/src/services/DatabaseService.ts
import { pool } from '../config/database'

export class DatabaseService {
  // Get hierarchical filter options with counts
  static async getHierarchicalFilterOptions(filterType: string, parentFilters: any = {}) {
    const connection = await pool.getConnection()
    try {
      let query = ''
      let params: any[] = []
      
      // Geography hierarchy queries
      if (filterType === 'region') {
        query = `
          SELECT 
            g.region as value,
            g.region as label,
            COUNT(DISTINCT t.id) as count
          FROM geography g
          LEFT JOIN transactions t ON g.id = t.geography_id
          GROUP BY g.region
          ORDER BY count DESC, g.region
        `
      } else if (filterType === 'city_municipality') {
        query = `
          SELECT 
            g.city_municipality as value,
            g.city_municipality as label,
            COUNT(DISTINCT t.id) as count
          FROM geography g
          LEFT JOIN transactions t ON g.id = t.geography_id
          WHERE g.region = ?
          GROUP BY g.city_municipality
          ORDER BY count DESC, g.city_municipality
        `
        params = [parentFilters.region]
      } else if (filterType === 'barangay') {
        query = `
          SELECT 
            g.barangay as value,
            g.barangay as label,
            COUNT(DISTINCT t.id) as count
          FROM geography g
          LEFT JOIN transactions t ON g.id = t.geography_id
          WHERE g.region = ? AND g.city_municipality = ?
          GROUP BY g.barangay
          ORDER BY count DESC, g.barangay
        `
        params = [parentFilters.region, parentFilters.city_municipality]
      }
      
      // Organization hierarchy queries
      else if (filterType === 'client') {
        query = `
          SELECT 
            o.client as value,
            o.client as label,
            COUNT(DISTINCT t.id) as count
          FROM organization o
          LEFT JOIN transactions t ON o.id = t.organization_id
          GROUP BY o.client
          ORDER BY count DESC, o.client
        `
      } else if (filterType === 'category') {
        query = `
          SELECT 
            o.category as value,
            o.category as label,
            COUNT(DISTINCT t.id) as count
          FROM organization o
          LEFT JOIN transactions t ON o.id = t.organization_id
          WHERE o.client = ?
          GROUP BY o.category
          ORDER BY count DESC, o.category
        `
        params = [parentFilters.client]
      } else if (filterType === 'brand') {
        query = `
          SELECT 
            o.brand as value,
            o.brand as label,
            COUNT(DISTINCT t.id) as count
          FROM organization o
          LEFT JOIN transactions t ON o.id = t.organization_id
          WHERE o.client = ? AND o.category = ?
          GROUP BY o.brand
          ORDER BY count DESC, o.brand
        `
        params = [parentFilters.client, parentFilters.category]
      } else if (filterType === 'sku') {
        query = `
          SELECT 
            o.sku as value,
            CONCAT(o.sku, ' - ', COALESCE(o.sku_description, '')) as label,
            COUNT(DISTINCT t.id) as count
          FROM organization o
          LEFT JOIN transactions t ON o.id = t.organization_id
          WHERE o.client = ? AND o.category = ? AND o.brand = ?
          GROUP BY o.sku, o.sku_description
          ORDER BY count DESC, o.sku
        `
        params = [parentFilters.client, parentFilters.category, parentFilters.brand]
      }
      
      // Time hierarchy queries
      else if (filterType === 'year') {
        query = `
          SELECT 
            td.year as value,
            td.year as label,
            COUNT(DISTINCT t.id) as count
          FROM time_dimension td
          LEFT JOIN transactions t ON td.id = t.time_dimension_id
          GROUP BY td.year
          ORDER BY td.year DESC
        `
      } else if (filterType === 'month') {
        query = `
          SELECT 
            td.month as value,
            MONTHNAME(STR_TO_DATE(td.month, '%m')) as label,
            COUNT(DISTINCT t.id) as count
          FROM time_dimension td
          LEFT JOIN transactions t ON td.id = t.time_dimension_id
          WHERE td.year = ?
          GROUP BY td.month
          ORDER BY td.month
        `
        params = [parentFilters.year]
      }
      
      const [rows] = await connection.execute(query, params)
      return rows
    } finally {
      connection.release()
    }
  }
  
  // Get total filter combinations count for high-dimensional analysis
  static async getTotalFilterCombinations(filters: any = {}) {
    const connection = await pool.getConnection()
    try {
      let whereClause = '1=1'
      const params: any[] = []
      
      // Build dynamic WHERE clause
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (key === 'region' || key === 'city_municipality' || key === 'barangay') {
            whereClause += ` AND g.${key} = ?`
            params.push(value)
          } else if (key === 'client' || key === 'category' || key === 'brand' || key === 'sku') {
            whereClause += ` AND o.${key} = ?`
            params.push(value)
          } else if (['year', 'month', 'week', 'day_of_week', 'hour'].includes(key)) {
            whereClause += ` AND td.${key} = ?`
            params.push(value)
          }
        }
      })
      
      const query = `
        SELECT COUNT(*) as total_combinations
        FROM geography g
        CROSS JOIN organization o
        CROSS JOIN time_dimension td
        WHERE ${whereClause}
      `
      
      const [rows] = await connection.execute(query, params)
      return rows[0]?.total_combinations || 0
    } finally {
      connection.release()
    }
  }
  
  // Get geospatial data for mapping
  static async getGeospatialData(filters: any = {}, aggregationLevel: string = 'barangay') {
    const connection = await pool.getConnection()
    try {
      let selectFields = ''
      let groupByFields = ''
      
      if (aggregationLevel === 'region') {
        selectFields = 'g.region, AVG(g.latitude) as latitude, AVG(g.longitude) as longitude'
        groupByFields = 'g.region'
      } else if (aggregationLevel === 'city_municipality') {
        selectFields = 'g.region, g.city_municipality, AVG(g.latitude) as latitude, AVG(g.longitude) as longitude'
        groupByFields = 'g.region, g.city_municipality'
      } else {
        selectFields = 'g.region, g.city_municipality, g.barangay, g.latitude, g.longitude, g.population, g.polygon_bounds'
        groupByFields = 'g.region, g.city_municipality, g.barangay, g.latitude, g.longitude, g.population, g.polygon_bounds'
      }
      
      let whereClause = '1=1'
      const params: any[] = []
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (key === 'region' || key === 'city_municipality' || key === 'barangay') {
            whereClause += ` AND g.${key} = ?`
            params.push(value)
          } else if (key === 'client' || key === 'category' || key === 'brand' || key === 'sku') {
            whereClause += ` AND o.${key} = ?`
            params.push(value)
          }
        }
      })
      
      const query = `
        SELECT 
          ${selectFields},
          SUM(t.total_amount) as total_sales,
          COUNT(t.id) as transaction_count,
          AVG(t.total_amount) as avg_transaction_value,
          SUM(t.quantity) as total_quantity
        FROM geography g
        LEFT JOIN transactions t ON g.id = t.geography_id
        LEFT JOIN organization o ON t.organization_id = o.id
        LEFT JOIN time_dimension td ON t.time_dimension_id = td.id
        WHERE ${whereClause}
        GROUP BY ${groupByFields}
        HAVING total_sales > 0
        ORDER BY total_sales DESC
        LIMIT 1000
      `
      
      const [rows] = await connection.execute(query, params)
      return rows
    } finally {
      connection.release()
    }
  }
  
  // Get drill-down analytics data
  static async getDrillDownAnalytics(filters: any = {}, drillDownLevel: string) {
    const connection = await pool.getConnection()
    try {
      let groupByField = ''
      let selectField = ''
      
      // Determine drill-down field based on current filters
      if (!filters.region && drillDownLevel === 'geography') {
        groupByField = 'g.region'
        selectField = 'g.region as dimension'
      } else if (filters.region && !filters.city_municipality) {
        groupByField = 'g.city_municipality'
        selectField = 'g.city_municipality as dimension'
      } else if (filters.city_municipality && !filters.barangay) {
        groupByField = 'g.barangay'
        selectField = 'g.barangay as dimension'
      } else if (!filters.client && drillDownLevel === 'organization') {
        groupByField = 'o.client'
        selectField = 'o.client as dimension'
      } else if (filters.client && !filters.category) {
        groupByField = 'o.category'
        selectField = 'o.category as dimension'
      } else if (filters.category && !filters.brand) {
        groupByField = 'o.brand'
        selectField = 'o.brand as dimension'
      } else if (filters.brand && !filters.sku) {
        groupByField = 'o.sku'
        selectField = 'o.sku as dimension'
      }
      
      if (!groupByField) {
        throw new Error('No valid drill-down level available')
      }
      
      let whereClause = '1=1'
      const params: any[] = []
      
      // Apply existing filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (['region', 'city_municipality', 'barangay'].includes(key)) {
            whereClause += ` AND g.${key} = ?`
            params.push(value)
          } else if (['client', 'category', 'brand', 'sku'].includes(key)) {
            whereClause += ` AND o.${key} = ?`
            params.push(value)
          }
        }
      })
      
      const query = `
        SELECT 
          ${selectField},
          SUM(t.total_amount) as total_sales,
          COUNT(t.id) as transaction_count,
          AVG(t.total_amount) as avg_transaction_value,
          SUM(t.quantity) as total_quantity,
          COUNT(DISTINCT t.geography_id) as unique_locations,
          COUNT(DISTINCT DATE(t.datetime)) as active_days
        FROM geography g
        JOIN transactions t ON g.id = t.geography_id
        JOIN organization o ON t.organization_id = o.id
        WHERE ${whereClause}
        GROUP BY ${groupByField}
        ORDER BY total_sales DESC
        LIMIT 50
      `
      
      const [rows] = await connection.execute(query, params)
      return rows
    } finally {
      connection.release()
    }
  }
}

// API Route for hierarchical filters
// server/src/routes/filters.ts
import express from 'express'
import { DatabaseService } from '../services/DatabaseService'

const router = express.Router()

// Get filter options for specific hierarchy level
router.get('/options/:filterType', async (req, res) => {
  try {
    const { filterType } = req.params
    const parentFilters = req.query
    
    const options = await DatabaseService.getHierarchicalFilterOptions(filterType, parentFilters)
    
    res.json({
      success: true,
      data: options,
      total: options.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    })
  }
})

// Get total filter combinations
router.get('/combinations/count', async (req, res) => {
  try {
    const filters = req.query
    const totalCombinations = await DatabaseService.getTotalFilterCombinations(filters)
    
    res.json({
      success: true,
      data: {
        total_combinations: totalCombinations,
        filters_applied: Object.keys(filters).filter(key => filters[key] && filters[key] !== '').length
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate filter combinations',
      error: error.message
    })
  }
})

// Get geospatial data for mapping
router.get('/geospatial', async (req, res) => {
  try {
    const filters = req.query
    const aggregationLevel = req.query.aggregation_level || 'barangay'
    
    const geoData = await DatabaseService.getGeospatialData(filters, aggregationLevel)
    
    res.json({
      success: true,
      data: geoData,
      aggregation_level: aggregationLevel,
      total_locations: geoData.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geospatial data',
      error: error.message
    })
  }
})

// Get drill-down analytics
router.get('/drilldown/:level', async (req, res) => {
  try {
    const { level } = req.params
    const filters = req.query
    
    const drillDownData = await DatabaseService.getDrillDownAnalytics(filters, level)
    
    res.json({
      success: true,
      data: drillDownData,
      drill_down_level: level,
      total_items: drillDownData.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drill-down data',
      error: error.message
    })
  }
})

export default router
```

---

## 5. Database Schema

## 5. Database Schema & Seed Data

### MySQL Schema

```sql
-- Complete MySQL Database Schema (config/database.sql)

-- Geography table with Philippine structure
CREATE TABLE geography (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  region VARCHAR(100) NOT NULL,
  city_municipality VARCHAR(100) NOT NULL,
  barangay VARCHAR(100) NOT NULL,
  store_name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  polygon_bounds JSON,
  population INTEGER,
  area_sqkm DECIMAL(10,2),
  store_type VARCHAR(50) DEFAULT 'Sari-Sari Store',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Organization table with FMCG brands and competitors
CREATE TABLE organization (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  sku VARCHAR(150) NOT NULL,
  sku_description TEXT,
  unit_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  margin_percent DECIMAL(5,2),
  package_size VARCHAR(50),
  is_competitor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Time dimension table for advanced analytics
CREATE TABLE time_dimension (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  datetime TIMESTAMP NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  week INTEGER NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  second INTEGER NOT NULL,
  is_weekend BOOLEAN NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  quarter INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  day_of_year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced transactions table
CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  datetime TIMESTAMP NOT NULL,
  geography_id VARCHAR(36) NOT NULL,
  organization_id VARCHAR(36) NOT NULL,
  time_dimension_id VARCHAR(36) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  customer_type VARCHAR(50),
  transaction_type VARCHAR(50) DEFAULT 'Sale',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (geography_id) REFERENCES geography(id),
  FOREIGN KEY (organization_id) REFERENCES organization(id),
  FOREIGN KEY (time_dimension_id) REFERENCES time_dimension(id)
);

-- Filter combinations tracking for high-dimensional analysis
CREATE TABLE filter_combinations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  combination_hash VARCHAR(64) UNIQUE NOT NULL,
  region VARCHAR(100),
  city_municipality VARCHAR(100),
  barangay VARCHAR(100),
  client VARCHAR(100),
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(150),
  year INTEGER,
  month INTEGER,
  week INTEGER,
  day_of_week VARCHAR(20),
  hour INTEGER,
  total_records INTEGER DEFAULT 0,
  total_sales DECIMAL(15,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for hierarchical filtering
CREATE INDEX idx_geography_region ON geography(region);
CREATE INDEX idx_geography_city_municipality ON geography(city_municipality);
CREATE INDEX idx_geography_barangay ON geography(barangay);
CREATE INDEX idx_geography_coordinates ON geography(latitude, longitude);
CREATE INDEX idx_geography_hierarchy ON geography(region, city_municipality, barangay);

CREATE INDEX idx_organization_client ON organization(client);
CREATE INDEX idx_organization_category ON organization(category);
CREATE INDEX idx_organization_brand ON organization(brand);
CREATE INDEX idx_organization_sku ON organization(sku);
CREATE INDEX idx_organization_hierarchy ON organization(client, category, brand, sku);
CREATE INDEX idx_organization_competitor ON organization(is_competitor);

CREATE INDEX idx_time_dimension_datetime ON time_dimension(datetime);
CREATE INDEX idx_time_dimension_year_month ON time_dimension(year, month);
CREATE INDEX idx_time_dimension_hierarchy ON time_dimension(year, month, week, day_of_week, hour);

CREATE INDEX idx_transactions_datetime ON transactions(datetime);
CREATE INDEX idx_transactions_geography ON transactions(geography_id);
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_time ON transactions(time_dimension_id);
CREATE INDEX idx_transactions_amount ON transactions(total_amount);
CREATE INDEX idx_transactions_composite ON transactions(datetime, geography_id, organization_id);

CREATE INDEX idx_filter_combinations_hash ON filter_combinations(combination_hash);
CREATE INDEX idx_filter_combinations_updated ON filter_combinations(last_updated);
```

### Comprehensive Seed Data Migration

```sql
-- SEED DATA MIGRATION SCRIPT
-- Date Range: June 30, 2024 to June 30, 2025 (1 Year Historical Data)

-- 1. GEOGRAPHY SEED DATA (Philippine Locations)
INSERT INTO geography (region, city_municipality, barangay, store_name, latitude, longitude, population, area_sqkm) VALUES

-- NCR (National Capital Region)
('NCR', 'Manila', 'Tondo', 'Tondo Market Sari-Sari', 14.6042, 120.9822, 628903, 42.88),
('NCR', 'Manila', 'Tondo', 'Tondo Central Store', 14.6055, 120.9835, 628903, 42.88),
('NCR', 'Manila', 'Tondo', 'Market Corner Grocery', 14.6038, 120.9828, 628903, 42.88),
('NCR', 'Manila', 'Quiapo', 'Quiapo Quick-Stop', 14.5995, 120.9842, 24886, 0.84),
('NCR', 'Manila', 'Quiapo', 'Central Quiapo Mart', 14.5992, 120.9845, 24886, 0.84),
('NCR', 'Manila', 'San Andres', 'Andres Grocery', 14.5691, 120.9890, 25687, 1.26),
('NCR', 'Manila', 'San Andres', 'San Andres Corner Store', 14.5688, 120.9893, 25687, 1.26),

('NCR', 'Quezon City', 'Bagumbayan', 'Bagumbayan MiniMart', 14.6760, 121.0437, 45312, 1.85),
('NCR', 'Quezon City', 'Bagumbayan', 'Bagumbayan Express', 14.6765, 121.0440, 45312, 1.85),
('NCR', 'Quezon City', 'Bayanihan', 'Bayanihan Store #7', 14.6892, 121.0234, 38945, 2.12),
('NCR', 'Quezon City', 'Bayanihan', 'United Bayanihan Grocery', 14.6889, 121.0237, 38945, 2.12),
('NCR', 'Quezon City', 'Commonwealth', 'Commonwealth Corner', 14.7258, 121.0853, 67123, 3.45),
('NCR', 'Quezon City', 'Commonwealth', 'Commonwealth Central Mart', 14.7255, 121.0856, 67123, 3.45),

('NCR', 'Caloocan', 'Grace Park', 'Grace Park Sari-Sari', 14.6577, 120.9664, 89456, 2.78),
('NCR', 'Caloocan', 'Grace Park', 'Grace Park Plaza Store', 14.6580, 120.9667, 89456, 2.78),
('NCR', 'Caloocan', 'Camarin', 'Camarin Convenience', 14.7389, 121.0175, 156789, 8.92),
('NCR', 'Caloocan', 'Camarin', 'Camarin Market Store', 14.7392, 121.0178, 156789, 8.92),
('NCR', 'Caloocan', 'Bagong Silangan', 'Silangan Grocer', 14.6892, 121.0567, 234567, 12.45),
('NCR', 'Caloocan', 'Bagong Silangan', 'New Silangan Mart', 14.6895, 121.0570, 234567, 12.45),

-- Region III (Central Luzon)
('Region III', 'Angeles City', 'Belen', 'Belen Sari-Sari', 15.1450, 120.5930, 45678, 3.21),
('Region III', 'Angeles City', 'Belen', 'Belen Market Store', 15.1453, 120.5933, 45678, 3.21),
('Region III', 'Angeles City', 'Balibago', 'Balibago Express', 15.1611, 120.5864, 67890, 4.56),
('Region III', 'Angeles City', 'Balibago', 'Balibago Central Grocery', 15.1614, 120.5867, 67890, 4.56),
('Region III', 'Angeles City', 'Pampang', 'Pampang Pantry', 15.1342, 120.6021, 34567, 2.78),
('Region III', 'Angeles City', 'Pampang', 'Pampang Corner Store', 15.1345, 120.6024, 34567, 2.78),

('Region III', 'San Fernando', 'Del Pilar', 'Del Pilar Mart', 15.0359, 120.6897, 56789, 3.89),
('Region III', 'San Fernando', 'Del Pilar', 'Del Pilar Express Store', 15.0362, 120.6900, 56789, 3.89),
('Region III', 'San Fernando', 'Bulaon', 'Bulaon Buds Store', 15.0289, 120.6756, 23456, 1.98),
('Region III', 'San Fernando', 'Bulaon', 'Bulaon Market Grocery', 15.0292, 120.6759, 23456, 1.98),
('Region III', 'San Fernando', 'Malino', 'Malino Sari-Sari', 15.0445, 120.7012, 34567, 2.67),
('Region III', 'San Fernando', 'Malino', 'Malino Central Store', 15.0448, 120.7015, 34567, 2.67),

('Region III', 'Mabalacat', 'Batong Malake', 'Batong Malake Grocer', 15.2214, 120.5789, 45678, 4.12),
('Region III', 'Mabalacat', 'Batong Malake', 'Malake Express Mart', 15.2217, 120.5792, 45678, 4.12),
('Region III', 'Mabalacat', 'San Nicolas', 'San Nicolas Sari-Sari', 15.2156, 120.5634, 34567, 3.45),
('Region III', 'Mabalacat', 'San Nicolas', 'Nicolas Corner Store', 15.2159, 120.5637, 34567, 3.45),
('Region III', 'Mabalacat', 'Magalang', 'Magalang Mini Store', 15.2089, 120.5923, 23456, 2.78),
('Region III', 'Mabalacat', 'Magalang', 'Magalang Market Grocery', 15.2092, 120.5926, 23456, 2.78),

-- Region IV-A (CALABARZON)
('Region IV-A', 'Biñan', 'Zapote', 'Zapote Sari-Sari', 14.3322, 121.0789, 56789, 3.45),
('Region IV-A', 'Biñan', 'Zapote', 'Zapote Central Store', 14.3325, 121.0792, 56789, 3.45),
('Region IV-A', 'Biñan', 'Langgam', 'Langgam Lane', 14.3267, 121.0823, 34567, 2.67),
('Region IV-A', 'Biñan', 'Langgam', 'Langgam Express Mart', 14.3270, 121.0826, 34567, 2.67),
('Region IV-A', 'Biñan', 'Sto. Niño', 'Niño Mini Mart', 14.3445, 121.0756, 45678, 3.89),
('Region IV-A', 'Biñan', 'Sto. Niño', 'Santo Niño Grocery', 14.3448, 121.0759, 45678, 3.89),

('Region IV-A', 'Cavite City', 'Gil Puyat', 'Gil Puyat Grocery', 14.4791, 120.8978, 67890, 4.56),
('Region IV-A', 'Cavite City', 'Gil Puyat', 'Puyat Market Store', 14.4794, 120.8981, 67890, 4.56),
('Region IV-A', 'Cavite City', 'San Roque', 'San Roque Store', 14.4856, 120.9012, 45678, 3.21),
('Region IV-A', 'Cavite City', 'San Roque', 'Roque Central Mart', 14.4859, 120.9015, 45678, 3.21),
('Region IV-A', 'Cavite City', 'Caridad', 'Caridad Corner', 14.4723, 120.8934, 34567, 2.78),
('Region IV-A', 'Cavite City', 'Caridad', 'Caridad Express Store', 14.4726, 120.8937, 34567, 2.78),

('Region IV-A', 'Tagaytay', 'Silang Crossing', 'Crossing Sari-Sari', 14.1048, 120.9601, 23456, 2.34),
('Region IV-A', 'Tagaytay', 'Silang Crossing', 'Crossing Market Store', 14.1051, 120.9604, 23456, 2.34),
('Region IV-A', 'Tagaytay', 'Tolentino West', 'Tolentino Treats', 14.1156, 120.9523, 34567, 3.12),
('Region IV-A', 'Tagaytay', 'Tolentino West', 'West Tolentino Grocery', 14.1159, 120.9526, 34567, 3.12),
('Region IV-A', 'Tagaytay', 'Maharlika East', 'Maharlika Mart', 14.0989, 120.9678, 45678, 3.89),
('Region IV-A', 'Tagaytay', 'Maharlika East', 'East Maharlika Store', 14.0992, 120.9681, 45678, 3.89),

-- Region VI (Western Visayas)
('Region VI', 'Iloilo City', 'Jaro', 'Jaro Sari-Sari', 10.7569, 122.5661, 89123, 5.67),
('Region VI', 'Iloilo City', 'Jaro', 'Jaro Central Mart', 10.7572, 122.5664, 89123, 5.67),
('Region VI', 'Iloilo City', 'La Paz', 'La Paz Pantry', 10.7202, 122.5434, 67890, 4.23),
('Region VI', 'Iloilo City', 'La Paz', 'La Paz Market Store', 10.7205, 122.5437, 67890, 4.23),
('Region VI', 'Iloilo City', 'Molo', 'Molo Mart', 10.6969, 122.5354, 56789, 3.78),
('Region VI', 'Iloilo City', 'Molo', 'Molo Express Grocery', 10.6972, 122.5357, 56789, 3.78),

('Region VI', 'Bacolod City', 'Singcang-airport', 'Airport Grocer', 10.6767, 122.9503, 78901, 4.89),
('Region VI', 'Bacolod City', 'Singcang-airport', 'Airport Central Store', 10.6770, 122.9506, 78901, 4.89),
('Region VI', 'Bacolod City', 'Alijis', 'Alijis Mart', 10.7089, 122.9234, 45678, 3.56),
('Region VI', 'Bacolod City', 'Alijis', 'Alijis Express Store', 10.7092, 122.9237, 45678, 3.56),
('Region VI', 'Bacolod City', 'Sum-ag', 'Sum-ag Sari-Sari', 10.6445, 122.9678, 34567, 2.89),
('Region VI', 'Bacolod City', 'Sum-ag', 'Sum-ag Market Grocery', 10.6448, 122.9681, 34567, 2.89),

('Region VI', 'Passi City', 'Umingan', 'Umingan Mini-Mart', 11.1089, 122.6434, 23456, 2.45),
('Region VI', 'Passi City', 'Umingan', 'Umingan Central Store', 11.1092, 122.6437, 23456, 2.45),
('Region VI', 'Passi City', 'Poblacion', 'Passi Poblacion Store', 11.1134, 122.6389, 34567, 3.12),
('Region VI', 'Passi City', 'Poblacion', 'Poblacion Express Mart', 11.1137, 122.6392, 34567, 3.12),
('Region VI', 'Passi City', 'San Juan', 'San Juan Grocery', 11.1201, 122.6523, 45678, 3.78),
('Region VI', 'Passi City', 'San Juan', 'San Juan Market Store', 11.1204, 122.6526, 45678, 3.78),

-- Region VII (Central Visayas)
('Region VII', 'Cebu City', 'Lahug', 'Lahug Sari-Sari', 10.3312, 123.9078, 89123, 5.89),
('Region VII', 'Cebu City', 'Lahug', 'Lahug Central Mart', 10.3315, 123.9081, 89123, 5.89),
('Region VII', 'Cebu City', 'Cebu IT Park', 'IT Park Pantry', 10.3267, 123.9034, 45678, 2.34),
('Region VII', 'Cebu City', 'Cebu IT Park', 'IT Park Express Store', 10.3270, 123.9037, 45678, 2.34),
('Region VII', 'Cebu City', 'Sambag II', 'Sambag Stop', 10.3156, 123.8967, 67890, 4.12),
('Region VII', 'Cebu City', 'Sambag II', 'Sambag Central Grocery', 10.3159, 123.8970, 67890, 4.12),

('Region VII', 'Mandaue City', 'Tipolo', 'Tipolo Treats', 10.3534, 123.9456, 56789, 3.67),
('Region VII', 'Mandaue City', 'Tipolo', 'Tipolo Market Store', 10.3537, 123.9459, 56789, 3.67),
('Region VII', 'Mandaue City', 'Canjulao', 'Canjulao Convenience', 10.3445, 123.9389, 34567, 2.89),
('Region VII', 'Mandaue City', 'Canjulao', 'Canjulao Express Mart', 10.3448, 123.9392, 34567, 2.89),
('Region VII', 'Mandaue City', 'Looc', 'Looc Grocer', 10.3612, 123.9523, 45678, 3.45),
('Region VII', 'Mandaue City', 'Looc', 'Looc Central Store', 10.3615, 123.9526, 45678, 3.45),

('Region VII', 'Lapu-Lapu City', 'Pajo', 'Pajo Pantry', 10.3089, 123.9634, 67890, 4.23),
('Region VII', 'Lapu-Lapu City', 'Pajo', 'Pajo Market Grocery', 10.3092, 123.9637, 67890, 4.23),
('Region VII', 'Lapu-Lapu City', 'Punta Engaño', 'Engaño Mart', 10.2867, 124.0123, 23456, 2.56),
('Region VII', 'Lapu-Lapu City', 'Punta Engaño', 'Punta Engaño Store', 10.2870, 124.0126, 23456, 2.56),
('Region VII', 'Lapu-Lapu City', 'Basak-Marigondon', 'Basak-Marigondon Stop', 10.2934, 123.9789, 34567, 3.12),
('Region VII', 'Lapu-Lapu City', 'Basak-Marigondon', 'Basak Express Mart', 10.2937, 123.9792, 34567, 3.12),

-- Region XI (Davao Region)
('Region XI', 'Davao City', 'Bangkal', 'Bangkal Sari-Sari', 7.0733, 125.6128, 78901, 4.67),
('Region XI', 'Davao City', 'Bangkal', 'Bangkal Central Store', 7.0736, 125.6131, 78901, 4.67),
('Region XI', 'Davao City', 'Catalunan Grande', 'Catalunan Mart', 7.1089, 125.6234, 89123, 5.23),
('Region XI', 'Davao City', 'Catalunan Grande', 'Grande Catalunan Grocery', 7.1092, 125.6237, 89123, 5.23),
('Region XI', 'Davao City', 'Talomo', 'Talomo Mini-Mart', 7.0456, 125.5967, 56789, 3.89),
('Region XI', 'Davao City', 'Talomo', 'Talomo Express Store', 7.0459, 125.5970, 56789, 3.89),

('Region XI', 'Panabo City', 'Panabo Proper', 'Panabo Proper Pantry', 7.3045, 125.6834, 45678, 3.45),
('Region XI', 'Panabo City', 'Panabo Proper', 'Proper Panabo Mart', 7.3048, 125.6837, 45678, 3.45),
('Region XI', 'Panabo City', 'San Vicente', 'SV Convenience', 7.2967, 125.6756, 34567, 2.78),
('Region XI', 'Panabo City', 'San Vicente', 'San Vicente Central Store', 7.2970, 125.6759, 34567, 2.78),
('Region XI', 'Panabo City', 'Poblacion West', 'Pob-West Grocer', 7.3123, 125.6912, 23456, 2.34),
('Region XI', 'Panabo City', 'Poblacion West', 'West Poblacion Mart', 7.3126, 125.6915, 23456, 2.34),

('Region XI', 'Tagum City', 'Magugpo South', 'Magugpo Market', 7.4467, 125.8078, 67890, 4.12),
('Region XI', 'Tagum City', 'Magugpo South', 'South Magugpo Store', 7.4470, 125.8081, 67890, 4.12),
('Region XI', 'Tagum City', 'Carriedo', 'Carriedo Corner', 7.4389, 125.8023, 45678, 3.56),
('Region XI', 'Tagum City', 'Carriedo', 'Carriedo Express Mart', 7.4392, 125.8026, 45678, 3.56),
('Region XI', 'Tagum City', 'Mabini', 'Mabini Mini-Mart', 7.4534, 125.8134, 34567, 2.89),
('Region XI', 'Tagum City', 'Mabini', 'Mabini Central Grocery', 7.4537, 125.8137, 34567, 2.89);

-- 2. ORGANIZATION SEED DATA (FMCG Brands & Competitors)
INSERT INTO organization (client, category, brand, sku, sku_description, unit_price, cost_price, margin_percent, package_size, is_competitor) VALUES

-- TBWA Client Brands
('Adidas', 'Beverages', 'Powerade', 'Powerade 500ml Blue', 'Sports Drink Blue Flavor', 25.00, 18.00, 28.0, '500ml', FALSE),
('Adidas', 'Beverages', 'Powerade', 'Powerade 500ml Red', 'Sports Drink Red Flavor', 25.00, 18.00, 28.0, '500ml', FALSE),
('Adidas', 'Beverages', 'Powerade', 'Powerade 1L Blue', 'Sports Drink Blue Flavor Large', 45.00, 33.00, 26.7, '1L', FALSE),
('Adidas', 'Beverages', 'Powerade', 'Powerade 1L Red', 'Sports Drink Red Flavor Large', 45.00, 33.00, 26.7, '1L', FALSE),

-- Alaska Milk Corporation (Competitor)
('Alaska Milk Corporation', 'Dairy', 'Alaska', 'Alaska Evaporated Milk 410ml', 'Premium Evaporated Milk', 35.00, 28.00, 20.0, '410ml', TRUE),
('Alaska Milk Corporation', 'Dairy', 'Alaska', 'Alaska Condensed Milk 300ml', 'Sweet Condensed Milk', 45.00, 36.00, 20.0, '300ml', TRUE),
('Alaska Milk Corporation', 'Dairy', 'Alaska', 'Alaska Powdered Milk 900g', 'Full Cream Powdered Milk', 285.00, 228.00, 20.0, '900g', TRUE),
('Alaska Milk Corporation', 'Dairy', 'Krem-Top', 'Krem-Top Coffee Creamer 200g', 'Coffee Creamer Powder', 85.00, 68.00, 20.0, '200g', TRUE),
('Alaska Milk Corporation', 'Dairy', 'Alpine', 'Alpine Evaporated Milk 410ml', 'Premium Alpine Evaporated Milk', 32.00, 25.60, 20.0, '410ml', TRUE),
('Alaska Milk Corporation', 'Dairy', 'Alpine', 'Alpine Condensed Milk 300ml', 'Alpine Sweet Condensed Milk', 42.00, 33.60, 20.0, '300ml', TRUE),
('Alaska Milk Corporation', 'Dairy', 'Cow Bell', 'Cow Bell Powdered Milk 400g', 'Full Cream Powdered Milk', 165.00, 132.00, 20.0, '400g', TRUE),

-- Oishi (Liwayway Marketing Corporation) - Competitor
('Liwayway Marketing', 'Snacks', 'Oishi', 'Oishi Prawn Crackers 60g', 'Prawn Flavored Crackers', 12.00, 8.40, 30.0, '60g', TRUE),
('Liwayway Marketing', 'Snacks', 'Oishi', 'Oishi Pillows Chocolate 38g', 'Chocolate Filled Pillows', 15.00, 10.50, 30.0, '38g', TRUE),
('Liwayway Marketing', 'Snacks', 'Oishi', 'Oishi Martys Cracklin 90g', 'Cracklin Snacks', 18.00, 12.60, 30.0, '90g', TRUE),
('Liwayway Marketing', 'Snacks', 'Oishi', 'Oishi Ridges 85g', 'Potato Ridges Snacks', 22.00, 15.40, 30.0, '85g', TRUE),
('Liwayway Marketing', 'Snacks', 'Oishi', 'Oishi Bread Pan 42g', 'Bread Pan Snacks', 8.00, 5.60, 30.0, '42g', TRUE),
('Liwayway Marketing', 'Snacks', 'Gourmet Picks', 'Gourmet Picks Potato Chips 40g', 'Premium Potato Chips', 25.00, 17.50, 30.0, '40g', TRUE),
('Liwayway Marketing', 'Snacks', 'Crispy Patata', 'Crispy Patata 30g', 'Potato Snacks', 8.00, 5.60, 30.0, '30g', TRUE),
('Liwayway Marketing', 'Beverages', 'Smart C+', 'Smart C+ Orange 200ml', 'Vitamin C Drink Orange', 15.00, 10.50, 30.0, '200ml', TRUE),
('Liwayway Marketing', 'Snacks', 'Oaties', 'Oaties Oat Cookies 32g', 'Oat Cookies', 12.00, 8.40, 30.0, '32g', TRUE),
('Liwayway Marketing', 'Snacks', 'Hi-Ho', 'Hi-Ho Crackers 200g', 'Sandwich Crackers', 28.00, 19.60, 30.0, '200g', TRUE),
('Liwayway Marketing', 'Snacks', 'Rinbee', 'Rinbee Cheese Rings 20g', 'Cheese Ring Snacks', 8.00, 5.60, 30.0, '20g', TRUE),
('Liwayway Marketing', 'Snacks', 'Deli Mex', 'Deli Mex Tortilla Chips 50g', 'Tortilla Chips', 18.00, 12.60, 30.0, '50g', TRUE),

-- Peerless Products Manufacturing Corporation - Competitor
('Peerless Products', 'Home Care', 'Champion', 'Champion Detergent Powder 1kg', 'Laundry Detergent Powder', 65.00, 45.50, 30.0, '1kg', TRUE),
('Peerless Products', 'Home Care', 'Champion', 'Champion Fabric Conditioner 1L', 'Fabric Softener', 45.00, 31.50, 30.0, '1L', TRUE),
('Peerless Products', 'Personal Care', 'Calla', 'Calla Shampoo 200ml', 'Hair Shampoo', 35.00, 24.50, 30.0, '200ml', TRUE),
('Peerless Products', 'Personal Care', 'Hana', 'Hana Shampoo 350ml', 'Premium Hair Shampoo', 55.00, 38.50, 30.0, '350ml', TRUE),
('Peerless Products', 'Personal Care', 'Hana', 'Hana Conditioner 350ml', 'Hair Conditioner', 55.00, 38.50, 30.0, '350ml', TRUE),
('Peerless Products', 'Home Care', 'Cyclone', 'Cyclone Bleach 1L', 'Liquid Bleach', 32.00, 22.40, 30.0, '1L', TRUE),
('Peerless Products', 'Home Care', 'Pride', 'Pride Dishwashing Liquid 500ml', 'Dishwashing Liquid', 28.00, 19.60, 30.0, '500ml', TRUE),
('Peerless Products', 'Personal Care', 'Care Plus', 'Care Plus Alcohol 500ml', 'Rubbing Alcohol', 25.00, 17.50, 30.0, '500ml', TRUE),
('Peerless Products', 'Personal Care', 'Care Plus', 'Care Plus Hand Sanitizer 250ml', 'Hand Sanitizer Gel', 35.00, 24.50, 30.0, '250ml', TRUE),

-- Del Monte Philippines - Competitor
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Pineapple Juice 1L', 'Pineapple Juice', 68.00, 47.60, 30.0, '1L', TRUE),
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Pineapple Chunks 836g', 'Canned Pineapple Chunks', 95.00, 66.50, 30.0, '836g', TRUE),
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Pineapple Slices 836g', 'Canned Pineapple Slices', 95.00, 66.50, 30.0, '836g', TRUE),
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Tomato Sauce 250g', 'Tomato Sauce', 18.00, 12.60, 30.0, '250g', TRUE),
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Ketchup 320g', 'Tomato Ketchup', 45.00, 31.50, 30.0, '320g', TRUE),
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Spaghetti Sauce 250g', 'Italian Style Spaghetti Sauce', 28.00, 19.60, 30.0, '250g', TRUE),
('Del Monte Philippines', 'Food', 'Del Monte', 'Del Monte Fruit Cocktail 836g', 'Mixed Fruit Cocktail', 85.00, 59.50, 30.0, '836g', TRUE),
('Del Monte Philippines', 'Food', 'S&W', 'S&W Premium Corn 425g', 'Premium Whole Kernel Corn', 55.00, 38.50, 30.0, '425g', TRUE),
('Del Monte Philippines', 'Food', 'Todays', 'Todays Corned Beef 150g', 'Budget Corned Beef', 28.00, 19.60, 30.0, '150g', TRUE),
('Del Monte Philippines', 'Beverages', 'Fit n Right', 'Fit n Right Apple 200ml', 'Fiber Juice Drink Apple', 22.00, 15.40, 30.0, '200ml', TRUE),
('Del Monte Philippines', 'Beverages', 'Fit n Right', 'Fit n Right Orange 200ml', 'Fiber Juice Drink Orange', 22.00, 15.40, 30.0, '200ml', TRUE),

-- Japan Tobacco International (JTI) - Competitor
('Japan Tobacco Intl', 'Tobacco', 'Winston', 'Winston Red 20s', 'Full Flavor Cigarettes', 165.00, 115.50, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'Winston', 'Winston Blue 20s', 'Light Cigarettes', 165.00, 115.50, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'Camel', 'Camel Filters 20s', 'Premium Cigarettes', 180.00, 126.00, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'Mevius', 'Mevius Gold 20s', 'Premium Light Cigarettes', 195.00, 136.50, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'LD', 'LD Blue 20s', 'Value Cigarettes', 145.00, 101.50, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'Mighty', 'Mighty Red 20s', 'Strong Cigarettes', 155.00, 108.50, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'Caster', 'Caster White 20s', 'Mild Cigarettes', 175.00, 122.50, 30.0, '20 sticks', TRUE),
('Japan Tobacco Intl', 'Tobacco', 'Glamour', 'Glamour Super Slims 20s', 'Women Cigarettes', 185.00, 129.50, 30.0, '20 sticks', TRUE),

-- Additional Major Competitor Brands
('Nestlé Philippines', 'Beverages', 'Nescafé', 'Nescafé Original 200g', 'Instant Coffee', 195.00, 136.50, 30.0, '200g', TRUE),
('Nestlé Philippines', 'Dairy', 'Bear Brand', 'Bear Brand Sterilized Milk 300ml', 'Sterilized Milk', 28.00, 19.60, 30.0, '300ml', TRUE),
('Nestlé Philippines', 'Snacks', 'KitKat', 'KitKat 4-Finger 41.5g', 'Chocolate Wafer Bar', 35.00, 24.50, 30.0, '41.5g', TRUE),
('Nestlé Philippines', 'Food', 'Maggi', 'Maggi Magic Sarap 50g', 'All-in-One Seasoning', 25.00, 17.50, 30.0, '50g', TRUE),

('Unilever Philippines', 'Personal Care', 'Dove', 'Dove Beauty Bar 135g', 'Moisturizing Beauty Bar', 55.00, 38.50, 30.0, '135g', TRUE),
('Unilever Philippines', 'Personal Care', 'Closeup', 'Closeup Red Hot 160g', 'Toothpaste', 75.00, 52.50, 30.0, '160g', TRUE),
('Unilever Philippines', 'Home Care', 'Surf', 'Surf Powder 1kg', 'Laundry Detergent', 85.00, 59.50, 30.0, '1kg', TRUE),
('Unilever Philippines', 'Food', 'Knorr', 'Knorr Chicken Cubes 60g', 'Chicken Bouillon Cubes', 18.00, 12.60, 30.0, '60g', TRUE),

('Procter & Gamble', 'Personal Care', 'Head & Shoulders', 'Head & Shoulders 340ml', 'Anti-Dandruff Shampoo', 165.00, 115.50, 30.0, '340ml', TRUE),
('Procter & Gamble', 'Personal Care', 'Olay', 'Olay Regenerist Cream 50g', 'Face Cream', 1250.00, 875.00, 30.0, '50g', TRUE),
('Procter & Gamble', 'Home Care', 'Ariel', 'Ariel Powder 1kg', 'Laundry Detergent Powder', 125.00, 87.50, 30.0, '1kg', TRUE),
('Procter & Gamble', 'Personal Care', 'Safeguard', 'Safeguard Classic 135g', 'Antibacterial Soap', 28.00, 19.60, 30.0, '135g', TRUE),

('Mondelez International', 'Snacks', 'Oreo', 'Oreo Original 137g', 'Chocolate Sandwich Cookies', 55.00, 38.50, 30.0, '137g', TRUE),
('Mondelez International', 'Snacks', 'Chips Ahoy', 'Chips Ahoy Original 95g', 'Chocolate Chip Cookies', 45.00, 31.50, 30.0, '95g', TRUE),
('Mondelez International', 'Snacks', 'Toblerone', 'Toblerone Milk 100g', 'Swiss Chocolate', 195.00, 136.50, 30.0, '100g', TRUE),

('Coca-Cola Company', 'Beverages', 'Coca-Cola', 'Coca-Cola 355ml', 'Cola Soft Drink', 18.00, 12.60, 30.0, '355ml', TRUE),
('Coca-Cola Company', 'Beverages', 'Sprite', 'Sprite 355ml', 'Lemon-Lime Soft Drink', 18.00, 12.60, 30.0, '355ml', TRUE),
('Coca-Cola Company', 'Beverages', 'Royal', 'Royal True Orange 355ml', 'Orange Soft Drink', 18.00, 12.60, 30.0, '355ml', TRUE),
('Coca-Cola Company', 'Beverages', 'Minute Maid', 'Minute Maid Orange 355ml', 'Orange Juice Drink', 22.00, 15.40, 30.0, '355ml', TRUE),

('PepsiCo', 'Beverages', 'Pepsi', 'Pepsi 355ml', 'Cola Soft Drink', 18.00, 12.60, 30.0, '355ml', TRUE),
('PepsiCo', 'Beverages', '7UP', '7UP 355ml', 'Lemon-Lime Soft Drink', 18.00, 12.60, 30.0, '355ml', TRUE),
('PepsiCo', 'Beverages', 'Mountain Dew', 'Mountain Dew 355ml', 'Citrus Soft Drink', 20.00, 14.00, 30.0, '355ml', TRUE),
('PepsiCo', 'Snacks', 'Lays', 'Lays Classic 60g', 'Potato Chips', 28.00, 19.60, 30.0, '60g', TRUE);

-- 3. POPULATE TIME DIMENSION TABLE (June 2024 - June 2025)
-- Generate time records for every hour of the year
INSERT INTO time_dimension (datetime, year, month, week, day_of_week, hour, minute, second, is_weekend, quarter, day_of_month, day_of_year)
SELECT
    dt.datetime,
    YEAR(dt.datetime) as year,
    MONTH(dt.datetime) as month,
    WEEK(dt.datetime) as week,
    DAYNAME(dt.datetime) as day_of_week,
    HOUR(dt.datetime) as hour,
    MINUTE(dt.datetime) as minute,
    SECOND(dt.datetime) as second,
    CASE WHEN DAYOFWEEK(dt.datetime) IN (1, 7) THEN TRUE ELSE FALSE END as is_weekend,
    QUARTER(dt.datetime) as quarter,
    DAY(dt.datetime) as day_of_month,
    DAYOFYEAR(dt.datetime) as day_of_year
FROM (
    SELECT 
        DATE_ADD('2024-06-01 00:00:00', INTERVAL hour_offset HOUR) as datetime
    FROM (
        SELECT 
            (thousands.digit * 1000 + hundreds.digit * 100 + tens.digit * 10 + ones.digit) as hour_offset
        FROM 
            (SELECT 0 as digit UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
            (SELECT 0 as digit UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
            (SELECT 0 as digit UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
            (SELECT 0 as digit UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    ) numbers
    WHERE hour_offset <= 8760  -- 365 days * 24 hours
) dt
WHERE dt.datetime <= '2025-06-30 23:59:59';

-- 4. GENERATE TRANSACTION SEED DATA (Realistic Philippine Retail Patterns)
-- This stored procedure generates realistic transaction data
DELIMITER //
CREATE PROCEDURE GenerateTransactionData()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE geo_id VARCHAR(36);
    DECLARE org_id VARCHAR(36);
    DECLARE time_id VARCHAR(36);
    DECLARE trans_datetime TIMESTAMP;
    DECLARE base_amount DECIMAL(15,2);
    DECLARE quantity INT;
    DECLARE final_amount DECIMAL(15,2);
    DECLARE hour_modifier DECIMAL(3,2);
    DECLARE day_modifier DECIMAL(3,2);
    DECLARE region_modifier DECIMAL(3,2);
    DECLARE category_modifier DECIMAL(3,2);
    DECLARE counter INT DEFAULT 0;
    DECLARE max_transactions INT DEFAULT 500000; -- Generate 500K transactions
    
    -- Cursor for random geography selection
    DECLARE geo_cursor CURSOR FOR 
        SELECT id FROM geography ORDER BY RAND() LIMIT 1;
    
    -- Cursor for random organization selection  
    DECLARE org_cursor CURSOR FOR 
        SELECT id FROM organization ORDER BY RAND() LIMIT 1;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    WHILE counter < max_transactions DO
        SET done = FALSE;
        
        -- Select random geography
        OPEN geo_cursor;
        FETCH geo_cursor INTO geo_id;
        CLOSE geo_cursor;
        
        -- Select random organization
        OPEN org_cursor;
        FETCH org_cursor INTO org_id;
        CLOSE org_cursor;
        
        -- Generate random timestamp between June 2024 and June 2025
        SET trans_datetime = DATE_ADD('2024-06-01 00:00:00', 
            INTERVAL FLOOR(RAND() * 8760) HOUR);
        SET trans_datetime = DATE_ADD(trans_datetime, 
            INTERVAL FLOOR(RAND() * 60) MINUTE);
        SET trans_datetime = DATE_ADD(trans_datetime, 
            INTERVAL FLOOR(RAND() * 60) SECOND);
        
        -- Get corresponding time dimension
        SELECT id INTO time_id FROM time_dimension 
        WHERE datetime = DATE_FORMAT(trans_datetime, '%Y-%m-%d %H:00:00') 
        LIMIT 1;
        
        -- Generate base transaction amount (₱10 - ₱500)
        SET base_amount = 10 + (RAND() * 490);
        
        -- Generate quantity (1-5 items)
        SET quantity = 1 + FLOOR(RAND() * 5);
        
        -- Apply realistic modifiers based on time patterns
        -- Peak hours: 11AM-1PM (lunch), 6PM-8PM (dinner)
        SET hour_modifier = CASE 
            WHEN HOUR(trans_datetime) BETWEEN 11 AND 13 THEN 1.4
            WHEN HOUR(trans_datetime) BETWEEN 18 AND 20 THEN 1.3
            WHEN HOUR(trans_datetime) BETWEEN 7 AND 9 THEN 1.2
            WHEN HOUR(trans_datetime) BETWEEN 15 AND 17 THEN 1.1
            WHEN HOUR(trans_datetime) BETWEEN 21 AND 23 THEN 0.9
            WHEN HOUR(trans_datetime) BETWEEN 0 AND 6 THEN 0.3
            ELSE 1.0
        END;
        
        -- Weekend modifier (higher sales)
        SET day_modifier = CASE 
            WHEN DAYOFWEEK(trans_datetime) IN (1, 7) THEN 1.2
            ELSE 1.0
        END;
        
        -- Regional economic modifiers
        SET region_modifier = CASE
            WHEN geo_id IN (SELECT id FROM geography WHERE region = 'NCR') THEN 1.3
            WHEN geo_id IN (SELECT id FROM geography WHERE region = 'Region VII') THEN 1.2
            WHEN geo_id IN (SELECT id FROM geography WHERE region = 'Region III') THEN 1.1
            WHEN geo_id IN (SELECT id FROM geography WHERE region = 'Region IV-A') THEN 1.1
            ELSE 1.0
        END;
        
        -- Category preference modifiers
        SET category_modifier = CASE
            WHEN org_id IN (SELECT id FROM organization WHERE category = 'Beverages') THEN 1.3
            WHEN org_id IN (SELECT id FROM organization WHERE category = 'Snacks') THEN 1.2
            WHEN org_id IN (SELECT id FROM organization WHERE category = 'Personal Care') THEN 1.1
            WHEN org_id IN (SELECT id FROM organization WHERE category = 'Food') THEN 1.2
            ELSE 1.0
        END;
        
        -- Calculate final amount with all modifiers
        SET final_amount = base_amount * hour_modifier * day_modifier * 
                          region_modifier * category_modifier * quantity;
        
        -- Insert transaction
        INSERT INTO transactions (
            datetime, geography_id, organization_id, time_dimension_id,
            total_amount, quantity, unit_price, payment_method, customer_type
        ) VALUES (
            trans_datetime, geo_id, org_id, time_id,
            final_amount, quantity, final_amount / quantity,
            CASE FLOOR(RAND() * 3)
                WHEN 0 THEN 'Cash'
                WHEN 1 THEN 'GCash'
                WHEN 2 THEN 'Credit Card'
            END,
            CASE FLOOR(RAND() * 4)
                WHEN 0 THEN 'Regular'
                WHEN 1 THEN 'Student'
                WHEN 2 THEN 'Senior'
                WHEN 3 THEN 'Employee'
            END
        );
        
        SET counter = counter + 1;
        
        -- Progress indicator
        IF counter % 10000 = 0 THEN
            SELECT CONCAT('Generated ', counter, ' transactions...') as Progress;
        END IF;
        
    END WHILE;
    
    SELECT CONCAT('Successfully generated ', counter, ' transactions!') as Result;
END //
DELIMITER ;

-- Execute the stored procedure to generate transaction data
CALL GenerateTransactionData();

-- 5. UPDATE FILTER COMBINATIONS TABLE
INSERT INTO filter_combinations (
    combination_hash, region, city_municipality, barangay, client, category, brand, sku,
    year, month, week, day_of_week, hour, total_records, total_sales
)
SELECT 
    MD5(CONCAT(
        COALESCE(g.region, ''), '|',
        COALESCE(g.city_municipality, ''), '|', 
        COALESCE(g.barangay, ''), '|',
        COALESCE(o.client, ''), '|',
        COALESCE(o.category, ''), '|',
        COALESCE(o.brand, ''), '|',
        COALESCE(o.sku, ''), '|',
        COALESCE(td.year, ''), '|',
        COALESCE(td.month, ''), '|',
        COALESCE(td.week, ''), '|',
        COALESCE(td.day_of_week, ''), '|',
        COALESCE(td.hour, '')
    )) as combination_hash,
    g.region,
    g.city_municipality,
    g.barangay,
    o.client,
    o.category,
    o.brand,
    o.sku,
    td.year,
    td.month,
    td.week,
    td.day_of_week,
    td.hour,
    COUNT(*) as total_records,
    SUM(t.total_amount) as total_sales
FROM transactions t
JOIN geography g ON t.geography_id = g.id
JOIN organization o ON t.organization_id = o.id
JOIN time_dimension td ON t.time_dimension_id = td.id
GROUP BY 
    g.region, g.city_municipality, g.barangay,
    o.client, o.category, o.brand, o.sku,
    td.year, td.month, td.week, td.day_of_week, td.hour;

-- 6. CREATE SUMMARY VIEWS FOR PERFORMANCE
CREATE VIEW v_daily_sales_summary AS
SELECT 
    DATE(t.datetime) as sales_date,
    g.region,
    g.city_municipality,
    o.category,
    o.brand,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    SUM(t.quantity) as total_quantity
FROM transactions t
JOIN geography g ON t.geography_id = g.id
JOIN organization o ON t.organization_id = o.id
GROUP BY DATE(t.datetime), g.region, g.city_municipality, o.category, o.brand;

CREATE VIEW v_monthly_performance AS
SELECT 
    YEAR(t.datetime) as year,
    MONTH(t.datetime) as month,
    g.region,
    o.category,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.geography_id) as unique_locations
FROM transactions t
JOIN geography g ON t.geography_id = g.id
JOIN organization o ON t.organization_id = o.id
GROUP BY YEAR(t.datetime), MONTH(t.datetime), g.region, o.category;

-- 7. ADD INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX idx_transactions_year_month ON transactions(YEAR(datetime), MONTH(datetime));
CREATE INDEX idx_transactions_date ON transactions(DATE(datetime));
CREATE INDEX idx_transactions_hour ON transactions(HOUR(datetime));
CREATE INDEX idx_geography_region_city ON geography(region, city_municipality);
CREATE INDEX idx_organization_category_brand ON organization(category, brand);
CREATE INDEX idx_time_dimension_year_month_week ON time_dimension(year, month, week);
```

### Seed Data Summary

**Geographic Coverage:**
- **7 Regions:** NCR, Region III, Region IV-A, Region VI, Region VII, Region XI
- **20 Cities/Municipalities:** Major urban centers across Philippines
- **60 Barangays:** 3 barangays per city/municipality
- **120 Stores:** 2 Sari-Sari stores per barangay

**Product Portfolio:**
- **TBWA Client Brands:** Adidas/Powerade (4 SKUs)
- **Alaska Milk Corporation:** 7 SKUs across dairy products
- **Liwayway Marketing (Oishi):** 12 SKUs across snacks and beverages  
- **Peerless Products:** 9 SKUs across home care and personal care
- **Del Monte Philippines:** 11 SKUs across food and beverages
- **Japan Tobacco International:** 8 SKUs across tobacco products
- **Other Major Competitors:** Nestlé, Unilever, P&G, Mondelez, Coca-Cola, PepsiCo (24 SKUs)

**Transaction Volume:**
- **500,000 transactions** generated across 1-year period
- **Realistic patterns:** Peak hours, weekend effects, regional variations
- **Full date range:** June 30, 2024 backwards to June 30, 2025
- **Seasonal variations:** Holiday effects, school calendar impacts

**Data Characteristics:**
- **Geographic distribution:** Higher volumes in NCR and major cities
- **Temporal patterns:** Peak sales during lunch (11AM-1PM) and dinner (6PM-8PM) hours
- **Category preferences:** Beverages highest volume, followed by snacks and food
- **Price ranges:** ₱8-₱1,250 covering full FMCG spectrum
- **Payment methods:** Cash, GCash, Credit Card distribution
- **Customer types:** Regular, Student, Senior, Employee segments

-- Performance indexes for hierarchical filtering
CREATE INDEX idx_geography_region ON geography(region);
CREATE INDEX idx_geography_city_municipality ON geography(city_municipality);
CREATE INDEX idx_geography_barangay ON geography(barangay);
CREATE INDEX idx_geography_coordinates ON geography(latitude, longitude);
CREATE INDEX idx_geography_hierarchy ON geography(region, city_municipality, barangay);

CREATE INDEX idx_organization_client ON organization(client);
CREATE INDEX idx_organization_category ON organization(category);
CREATE INDEX idx_organization_brand ON organization(brand);
CREATE INDEX idx_organization_sku ON organization(sku);
CREATE INDEX idx_organization_hierarchy ON organization(client, category, brand, sku);

CREATE INDEX idx_time_dimension_datetime ON time_dimension(datetime);
CREATE INDEX idx_time_dimension_year_month ON time_dimension(year, month);
CREATE INDEX idx_time_dimension_hierarchy ON time_dimension(year, month, week, day_of_week, hour);

CREATE INDEX idx_transactions_datetime ON transactions(datetime);
CREATE INDEX idx_transactions_geography ON transactions(geography_id);
CREATE INDEX idx_transactions_organization ON transactions(organization_id);
CREATE INDEX idx_transactions_time ON transactions(time_dimension_id);
CREATE INDEX idx_transactions_amount ON transactions(total_amount);
CREATE INDEX idx_transactions_composite ON transactions(datetime, geography_id, organization_id);

CREATE INDEX idx_filter_combinations_hash ON filter_combinations(combination_hash);
CREATE INDEX idx_filter_combinations_updated ON filter_combinations(last_updated);

-- Geospatial aggregation views for mapping
CREATE VIEW v_region_aggregates AS
SELECT
  g.region,
  AVG(g.latitude) as center_lat,
  AVG(g.longitude) as center_lng,
  COUNT(DISTINCT g.city_municipality) as city_count,
  COUNT(DISTINCT g.barangay) as barangay_count,
  SUM(t.total_amount) as total_sales,
  COUNT(t.id) as transaction_count,
  AVG(t.total_amount) as avg_transaction_value
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.region;

CREATE VIEW v_city_aggregates AS
SELECT
  g.region,
  g.city_municipality,
  AVG(g.latitude) as center_lat,
  AVG(g.longitude) as center_lng,
  COUNT(DISTINCT g.barangay) as barangay_count,
  SUM(t.total_amount) as total_sales,
  COUNT(t.id) as transaction_count,
  AVG(t.total_amount) as avg_transaction_value
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.region, g.city_municipality;

CREATE VIEW v_barangay_aggregates AS
SELECT
  g.region,
  g.city_municipality,
  g.barangay,
  g.latitude,
  g.longitude,
  g.population,
  g.area_sqkm,
  SUM(t.total_amount) as total_sales,
  COUNT(t.id) as transaction_count,
  AVG(t.total_amount) as avg_transaction_value,
  SUM(t.total_amount) / NULLIF(g.population, 0) as sales_per_capita
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.id, g.region, g.city_municipality, g.barangay, g.latitude, g.longitude, g.population, g.area_sqkm;
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: scout_analytics
      MYSQL_USER: app_user
      MYSQL_PASSWORD: app_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./config/database.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USER=app_user
      - DB_PASSWORD=app_password
      - DB_NAME=scout_analytics
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

volumes:
  mysql_data:
```

---

## 6. User Acceptance Testing Scenarios

### Executive UAT Scenarios

**UAT001: High-level KPI Drill-down**
Goal: Executive views overview and drills into underperforming regions

1. Executive sees overview dashboard
2. Clicks on underperforming region (Mindanao)
3. Verifies region filter is applied
4. City dropdown enabled and populated
5. Drills down to specific city (Davao)
6. Data updates reflect the filter

**UAT002: Multi-level Filtering**
Goal: Analyst explores transaction peaks with complex filters

1. Navigate to Transaction Trends
2. Apply cascading filters: NCR → Manila → Beverages → Coca-Cola
3. Verify filters cascade correctly
4. Chart updates with filtered data
5. Click peak hour bar for drill-down
6. Navigation retains context

### AI & Performance UAT

**UAT003: AI Contextual Chat**
Goal: Marketer uses RetailBot with contextual filters

1. Set filter context (Cebu → Cebu City → Snacks)
2. Navigate to RetailBot
3. Verify context is retained in chat
4. Use quick action "Top SKUs in location"
5. AI response includes contextual data
6. Test custom query with context

**UAT004: Performance Validation**
Goal: Validate system performance under load

1. Measure initial load time (<3s)
2. Test rapid filter changes
3. Verify smooth transitions
4. Data refresh performance (<1s)
5. No errors or warnings
6. Graceful error recovery

---

## 7. CI/CD Pipeline

### Pipeline Stages

```
🔍 Lint & Format → ⚡ Unit Tests → ⚙ Build → ☁ Deploy
```

```yaml
# .github/workflows/ci-cd.yml
name: Scout Analytics CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Check formatting
        run: npm run format:check

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint-and-format
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit -- --coverage --reporter=junit
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: unit-test-results
          path: test-results/

  build-frontend:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build frontend
        run: npm run build
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: dist/

  build-backend:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          docker build -t scout-analytics-backend ./server
          docker save scout-analytics-backend > backend-image.tar
          
      - name: Upload Docker image
        uses: actions/upload-artifact@v3
        with:
          name: backend-image
          path: backend-image.tar

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: build-frontend
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: frontend-build
          path: dist/
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    needs: build-backend
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Render
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": "clear"}' \
            "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys"
```

---

## 8. Complete Wireframes, Navigation & UI/UX Design

### Site Map & Navigation Structure

```
📊 SCOUT ANALYTICS DASHBOARD
├── 🏠 Overview (Landing Page)
├── 📈 Transaction Analysis
│   ├── Time Patterns
│   ├── Value Distribution  
│   ├── Peak Analysis
│   └── Transaction Flow
├── 📦 Product Analysis
│   ├── Category Performance
│   ├── Brand Comparison
│   ├── SKU Deep Dive
│   └── Product Mix
├── 👥 Consumer Insights
│   ├── Behavior Patterns
│   ├── Geographic Preferences
│   ├── Seasonal Trends
│   └── Customer Segments
├── 🗺️ Geographic Analytics
│   ├── Regional Performance
│   ├── City Comparison
│   ├── Barangay Analysis
│   └── Location Intelligence
├── ⏰ Time Analytics
│   ├── Hourly Trends
│   ├── Daily Patterns
│   ├── Weekly Cycles
│   └── Seasonal Analysis
├── 🤖 AI Assistant
│   ├── Retail Bot Chat
│   ├── Insights Generator
│   ├── Anomaly Detection
│   └── Predictive Analytics
├── 📋 Reports
│   ├── Executive Summary
│   ├── Detailed Reports
│   ├── Custom Reports
│   └── Export Center
└── ⚙️ Settings
    ├── Data Sources
    ├── User Preferences
    ├── Filter Presets
    └── System Status
```

### Detailed Page Wireframes & Components

#### **PAGE 1: Overview Dashboard (Landing Page)**
**Components: 12 | Charts: 6 | Interactive Elements: 15**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🏠 Scout Analytics - Overview                        👤 User   ⚙️  │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 Global Persistent Filters (Component 1)                         │
│ Region [All▾] City [All▾] Barangay [All▾] Client [All▾] [Clear]    │
│ Category [All▾] Brand [All▾] Year [2024▾] Month [All▾] [Apply]     │
├─────────────────────────────────────────────────────────────────────┤
│ 📈 KPI Cards Row (Component 2-5)                                   │
│ ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐             │
│ │ ₱1.2M   ││ 3,456   ││ ₱347    ││ 14.7%   ││ 127     │             │
│ │ Sales   ││ Trans   ││ Basket  ││ Growth  ││ Outlets │ → Click     │
│ │ 📊      ││ 📝      ││ 🛒      ││ 📈      ││ 🏪      │   Navigation│
│ └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘             │
├─────────────────────────────────────────────────────────────────────┤
│ Main Content Grid (3 Columns)                                      │
│ ┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐│
│ │ 🗺️ Geographic Map   ││ 📊 Sales Trends     ││ 🤖 AI Insights      ││
│ │ (Component 6)       ││ (Component 7)       ││ (Component 8)       ││
│ │ • Bubble/Choropleth ││ • Line Chart        ││ • Smart Suggestions ││
│ │ • Interactive Zoom  ││ • 30-day trend      ││ • Quick Actions     ││
│ │ • Click to drill    ││ • Hover details     ││ • Chat Interface    ││
│ │   down              ││ • Click for details ││ • Context aware     ││
│ └─────────────────────┘└─────────────────────┘└─────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│ Secondary Content Grid (2 Columns)                                 │
│ ┌─────────────────────┐┌─────────────────────┐                      │
│ │ 📦 Top Products     ││ 🏆 Performance      │                      │
│ │ (Component 9)       ││ (Component 10)      │                      │
│ │ • Bar Chart         ││ • Ranking Table     │                      │
│ │ • Top 10 SKUs       ││ • Regional Leaders  │                      │
│ │ • Click to analyze  ││ • Growth indicators │                      │
│ └─────────────────────┘└─────────────────────┘                      │
├─────────────────────────────────────────────────────────────────────┤
│ Bottom Actions (Component 11-12)                                   │
│ [📈 Deep Analytics] [📋 Generate Report] [🔍 Advanced Search]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation Targets from Overview:**
- KPI Cards → Detailed analysis pages
- Geographic Map → Geographic Analytics page
- Sales Trends → Transaction Analysis page
- AI Insights → AI Assistant page
- Top Products → Product Analysis page
- Performance → Consumer Insights page

---

#### **PAGE 2: Transaction Analysis**
**Components: 10 | Charts: 8 | Interactive Elements: 18**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📈 Transaction Analysis                    🏠 Home | 🔙 Back        │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 Global Filters (Persistent) + Time Range Selector (Component 1) │
│ [Last 7 Days▾] [Custom Range] [Quick: Today|Week|Month|Quarter]    │
├─────────────────────────────────────────────────────────────────────┤
│ Sub-Navigation Tabs (Component 2)                                  │
│ [📊 Time Patterns*] [💰 Value Distribution] [⏰ Peak Analysis]      │
│ [🌊 Transaction Flow]                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Main Chart Area (Component 3)                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📈 Transaction Volume Over Time (Interactive Line/Bar Chart)   │ │
│ │ • Drill-down: Year→Month→Week→Day→Hour                         │ │
│ │ • Hover tooltips with details                                  │ │
│ │ • Click points for drill-down                                  │ │
│ │ • Brush selector for time range                                │ │
│ │ • Multiple metrics toggle (Volume/Value/Count)                 │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Analytics Grid (2x2) (Components 4-7)                             │
│ ┌─────────────────────┐┌─────────────────────┐                      │
│ │ 📊 Daily Patterns   ││ 🕐 Hourly Heatmap   │                      │
│ │ • Bar chart         ││ • Calendar heatmap  │                      │
│ │ • Mon-Sun breakdown ││ • 24h x 7 days grid │                      │
│ │ • Peak day highlight││ • Color intensity   │                      │
│ └─────────────────────┘└─────────────────────┘                      │
│ ┌─────────────────────┐┌─────────────────────┐                      │
│ │ 💰 Value Distribution││ 📏 Transaction Size │                      │
│ │ • Histogram         ││ • Box plot          │                      │
│ │ • Price ranges      ││ • Quartile analysis │                      │
│ │ • Click to filter   ││ • Outlier detection │                      │
│ └─────────────────────┘└─────────────────────┘                      │
├─────────────────────────────────────────────────────────────────────┤
│ Insights Panel (Component 8)                                       │
│ 🤖 AI Insights: "Peak sales occur Tuesday 2-4PM. Consider staff+"  │
│ [📋 Export Data] [📊 Custom Chart] [🔍 Drill Down] [📈 Forecast]  │
├─────────────────────────────────────────────────────────────────────┤
│ Quick Actions (Component 9-10)                                     │
│ [📦 Analyze Products] [🗺️ By Location] [👥 Customer Analysis]     │
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation Targets:**
- Sub-tabs → Within transaction analysis features
- Drill-down points → Filtered views with new time ranges
- Quick Actions → Product Analysis, Geographic Analytics, Consumer Insights
- Export → Reports page

---

#### **PAGE 3: Product Analysis**
**Components: 11 | Charts: 7 | Interactive Elements: 20**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📦 Product Analysis                        🏠 Home | 🔙 Back        │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 Global Filters + Product Hierarchy (Component 1)                │
│ Client [All▾] → Category [All▾] → Brand [All▾] → SKU [All▾]       │
├─────────────────────────────────────────────────────────────────────┤
│ Sub-Navigation (Component 2)                                       │
│ [📊 Category Performance*] [🏷️ Brand Comparison] [📋 SKU Deep Dive] │
│ [🎯 Product Mix]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Drill-Down Breadcrumb (Component 3)                               │
│ 🏢 All Clients > 📦 Beverages > 🥤 Coca-Cola > [Select SKU]       │
├─────────────────────────────────────────────────────────────────────┤
│ Performance Overview (Component 4)                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Product Performance Hierarchy (Treemap/Sunburst Chart)      │ │
│ │ • Click segments to drill down                                 │ │
│ │ • Size = Sales Volume, Color = Profitability                   │ │
│ │ • Hover for details                                            │ │
│ │ • Breadcrumb navigation                                        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Comparative Analysis Grid (Components 5-8)                        │
│ ┌─────────────────────┐┌─────────────────────┐                      │
│ │ 📈 Sales Trends     ││ 💰 Revenue Analysis │                      │
│ │ • Multi-line chart  ││ • Stacked bar chart │                      │
│ │ • Compare products  ││ • Revenue breakdown │                      │
│ │ • YoY comparison    ││ • Margin analysis   │                      │
│ └─────────────────────┘└─────────────────────┘                      │
│ ┌─────────────────────┐┌─────────────────────┐                      │
│ │ 🗺️ Geographic Spread││ ⭐ Top Performers   │                      │
│ │ • Bubble map        ││ • Ranking table     │                      │
│ │ • Regional sales    ││ • Growth metrics    │                      │
│ │ • Click to analyze  ││ • Click for details │                      │
│ └─────────────────────┘└─────────────────────┘                      │
├─────────────────────────────────────────────────────────────────────┤
│ Product Intelligence (Component 9)                                 │
│ 🤖 AI Insights: "Coca-Cola sales peak in Metro Manila during       │
│    weekends. Consider promotional bundles with snacks."             │
├─────────────────────────────────────────────────────────────────────┤
│ Action Panel (Component 10-11)                                     │
│ [🔍 Deep Dive Analysis] [📊 Custom Comparison] [📋 Product Report] │
│ [🗺️ Geographic Analysis] [👥 Customer Segments] [📈 Forecasting]  │
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation Targets:**
- Treemap/Sunburst → Drill down to next product hierarchy level
- Geographic Spread → Geographic Analytics page with product filter
- Top Performers → Detailed product pages
- Action buttons → Respective analysis pages with pre-applied filters

---

#### **PAGE 4: Geographic Analytics**
**Components: 9 | Charts: 5 | Interactive Elements: 16**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🗺️ Geographic Analytics                   🏠 Home | 🔙 Back        │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 Global Filters + Geographic Controls (Component 1)              │
│ Region [All▾] City [All▾] Barangay [All▾] | Map Type: [Bubble▾]   │
│ [📍 Auto-locate] [🎯 Fit to Data] [📱 Mobile View]                 │
├─────────────────────────────────────────────────────────────────────┤
│ Sub-Navigation (Component 2)                                       │
│ [🏛️ Regional Performance*] [🏙️ City Comparison] [🏘️ Barangay Analysis] │
│ [🧠 Location Intelligence]                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Main Map Interface (Component 3)                                   │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🗺️ Interactive Philippines Map                                 │ │
│ │ ┌─────────────────┐  Map Controls:                             │ │
│ │ │ 🕹️ Map Controls │  • [🔍 Zoom In/Out]                        │ │
│ │ │ [Bubble Map*]   │  • [📍 Reset View]                         │ │
│ │ │ [Choropleth]    │  • [📱 Mobile Mode]                        │ │
│ │ │ [Hybrid View]   │  • [🎨 Color Scheme]                       │ │
│ │ │ [Satellite]     │  • [📏 Distance Tool]                      │ │
│ │ └─────────────────┘  • [📊 Data Layers]                        │ │
│ │                                                                │ │
│ │ Interactive Features:                                          │ │
│ │ • Click regions → Drill down to cities                        │ │
│ │ • Click cities → Drill down to barangays                      │ │
│ │ • Hover → Show tooltip with metrics                           │ │
│ │ • Draw selection → Analyze custom areas                       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Map Analytics Panel (Components 4-6)                              │
│ ┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐│
│ │ 📊 Selected Area    ││ 📈 Performance      ││ 🎯 Insights         ││
│ │ Region: NCR         ││ • Sales: ₱850K      ││ 🤖 "High density in ││
│ │ Cities: 16          ││ • Growth: +12.5%    ││    business areas.  ││
│ │ Barangays: 1,706    ││ • Rank: #1          ││    Consider mobile  ││
│ │ Population: 13.5M   ││ • Avg: ₱247/trans   ││    expansion."      ││
│ │ [📊 Analyze]        ││ [📊 Compare]        ││ [🔍 Deep Dive]      ││
│ └─────────────────────┘└─────────────────────┘└─────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│ Geographic Comparison (Component 7)                                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Multi-Region Comparison Chart                               │ │
│ │ • Bar/Line chart comparing selected regions                    │ │
│ │ • Metrics: Sales, Growth, Density, Penetration                │ │
│ │ • Click bars to focus on specific regions                     │ │
│ │ • Add/Remove regions for comparison                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Location Actions (Component 8-9)                                  │
│ [🎯 Market Penetration] [📍 Site Selection] [🚚 Distribution]     │
│ [👥 Demographics] [🏪 Competitor Analysis] [📋 Location Report]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation Targets:**
- Map clicks → Drill down with geographic filters applied
- Analyze buttons → Consumer Insights or Product Analysis with location filter
- Action buttons → Specialized analysis pages with geographic context

---

#### **PAGE 5: AI Assistant**
**Components: 8 | Charts: 0 | Interactive Elements: 12**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                           🏠 Home | 🔙 Back        │
├─────────────────────────────────────────────────────────────────────┤
│ Context Banner (Component 1)                                       │
│ 📊 Current Context: NCR > Manila > Beverages > Coca-Cola           │
│ [🔄 Use Current Filters] [❌ Clear Context] [⚙️ Set Custom Context] │
├─────────────────────────────────────────────────────────────────────┤
│ Sub-Navigation (Component 2)                                       │
│ [💬 Retail Bot Chat*] [🔍 Insights Generator] [⚠️ Anomaly Detection] │
│ [🔮 Predictive Analytics]                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Chat Interface (Component 3)                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 💬 Conversation Area (Scrollable)                              │ │
│ │                                                                │ │
│ │ 🤖 AI: Hello! I can help analyze your retail data. Current    │ │
│ │     context: Coca-Cola sales in Manila. What would you like   │ │
│ │     to explore?                                                │ │
│ │                                                                │ │
│ │ 👤 You: Show me peak sales hours                              │ │
│ │                                                                │ │
│ │ 🤖 AI: Based on Manila Coca-Cola data, peak sales occur:      │ │
│ │     • 2-4 PM (₱45K avg)                                       │ │
│ │     • 6-8 PM (₱38K avg)                                       │ │
│ │     [📊 View Chart] [📋 Detailed Report]                      │ │
│ │                                                                │ │
│ │ [Type your question here...                              Send] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Quick Actions Panel (Component 4)                                  │
│ ┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐│
│ │ 🚀 Quick Insights   ││ 📊 Common Queries   ││ 🎯 Suggestions      ││
│ │ [Top SKUs here]     ││ [Sales trends]      ││ [Optimize inventory]││
│ │ [Peak hours]        ││ [Best locations]    ││ [Expand to new area]││
│ │ [Growth analysis]   ││ [Price analysis]    ││ [Bundle products]   ││
│ │ [Competition]       ││ [Seasonal patterns] ││ [Staff optimization]││
│ └─────────────────────┘└─────────────────────┘└─────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│ AI Capabilities Panel (Component 5)                                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔮 What I Can Do:                                              │ │
│ │ ✅ Analyze sales patterns and trends                           │ │
│ │ ✅ Identify top-performing products and locations              │ │
│ │ ✅ Detect anomalies and unusual patterns                       │ │
│ │ ✅ Generate forecasts and predictions                          │ │
│ │ ✅ Suggest optimization strategies                             │ │
│ │ ✅ Create custom reports and visualizations                    │ │
│ │ ✅ Compare performance across dimensions                       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ AI Actions (Component 6-8)                                        │
│ [🔍 Generate Insights] [📊 Create Chart] [📋 Custom Report]       │
│ [⚠️ Find Anomalies] [🔮 Forecast Trends] [💡 Optimization Tips]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation Targets:**
- Quick Actions → Generate specific analysis and navigate to relevant pages
- Chart/Report buttons → Create visualizations and navigate to Reports page
- Insight buttons → Navigate to specific analysis pages with AI-suggested filters

---

#### **PAGE 6: Reports Dashboard**
**Components: 9 | Charts: 3 | Interactive Elements: 14**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 Reports Dashboard                       🏠 Home | 🔙 Back        │
├─────────────────────────────────────────────────────────────────────┤
│ Report Controls (Component 1)                                      │
│ 📊 Template: [Executive Summary▾] Period: [Last Month▾]            │
│ Format: [PDF▾] [Excel] [PowerPoint] [📧 Email] [🕐 Schedule]       │
├─────────────────────────────────────────────────────────────────────┤
│ Sub-Navigation (Component 2)                                       │
│ [📊 Executive Summary*] [📈 Detailed Reports] [🎨 Custom Reports]   │
│ [📤 Export Center]                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Report Preview (Component 3)                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📑 Executive Summary Report - March 2024                       │ │
│ │                                                                │ │
│ │ 📊 Key Metrics Overview                                        │ │
│ │ • Total Sales: ₱2.4M (+15.2% vs last month)                   │ │
│ │ • Transactions: 8,547 (+8.7%)                                 │ │
│ │ • Top Region: NCR (₱850K, 35.4% share)                        │ │
│ │ • Best Product: Coca-Cola 355ml (₱180K sales)                 │ │
│ │                                                                │ │
│ │ 🗺️ [Geographic Performance Chart]                              │ │
│ │ 📦 [Product Performance Chart]                                 │ │
│ │ 📈 [Sales Trend Chart]                                         │ │
│ │                                                                │ │
│ │ [📄 View Full Report] [⬇️ Download PDF] [📧 Share]             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Quick Reports Grid (Components 4-6)                               │
│ ┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐│
│ │ 📊 Sales Summary    ││ 🏆 Top Performers   ││ 📈 Growth Analysis  ││
│ │ • Current month     ││ • Products & regions││ • YoY comparison    ││
│ │ • KPI dashboard     ││ • Ranking tables    ││ • Trend analysis    ││
│ │ [Generate Now]      ││ [Generate Now]      ││ [Generate Now]      ││
│ └─────────────────────┘└─────────────────────┘└─────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│ Recent Reports (Component 7)                                       │
│ 📋 Recent Reports                              [🗑️ Manage Reports] │
│ • Executive Summary - March 2024 (PDF) [📥 Download] [👁️ Preview]  │
│ • Product Analysis - Beverages (Excel) [📥 Download] [👁️ Preview] │
│ • Geographic Performance - NCR (PPT) [📥 Download] [👁️ Preview]   │
│ • Custom Report - Q1 Summary (PDF) [📥 Download] [👁️ Preview]     │
├─────────────────────────────────────────────────────────────────────┤
│ Scheduled Reports (Component 8)                                    │
│ 🕐 Scheduled Reports                           [➕ Add Schedule]     │
│ • Weekly Summary (Mondays, 9 AM) [✏️ Edit] [⏸️ Pause]             │
│ • Monthly Executive Report (1st of month) [✏️ Edit] [⏸️ Pause]     │
├─────────────────────────────────────────────────────────────────────┤
│ Report Actions (Component 9)                                       │
│ [🎨 Custom Report Builder] [📧 Email Reports] [🕐 Schedule Reports] │
│ [📊 Interactive Dashboard] [📤 Bulk Export] [⚙️ Report Settings]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation Targets:**
- Generate buttons → Create reports and return to preview
- Custom Report Builder → Advanced report creation interface
- Interactive Dashboard → Return to main analytics pages
- View/Preview → Full-screen report viewer

---

### Cross-Navigation Matrix

| From Page | To Page | Navigation Method | Context Preservation |
|-----------|---------|------------------|-------------------|
| Overview | Transaction Analysis | KPI Cards, Charts | ✅ Filters maintained |
| Overview | Product Analysis | Product charts, AI suggestions | ✅ Filters maintained |
| Overview | Geographic Analytics | Map clicks, regional data | ✅ Filters + location |
| Overview | AI Assistant | AI insights panel | ✅ Full context |
| Transaction | Product Analysis | Product performance in transactions | ✅ Time + product filters |
| Transaction | Geographic Analytics | Location-based transaction analysis | ✅ Time + geo filters |
| Product | Geographic Analytics | Product performance by location | ✅ Product + geo filters |
| Product | Consumer Insights | Customer behavior for products | ✅ Product + behavior filters |
| Geographic | Consumer Insights | Regional customer behavior | ✅ Geographic + behavior |
| Any Page | AI Assistant | AI button, insights panel | ✅ Complete context |
| Any Page | Reports | Export/report buttons | ✅ Current filters applied |
| AI Assistant | Any Analysis Page | AI recommendations, chart links | ✅ AI-suggested filters |
| Reports | Any Analysis Page | Interactive report elements | ✅ Report filters applied |

### Interactive Elements Breakdown

#### **Global Elements (Present on all pages):**
1. **Global Filter Bar** - Persistent across all pages
2. **Main Navigation Menu** - 8 primary sections
3. **User Profile Menu** - Settings, logout, preferences
4. **Breadcrumb Navigation** - Current location tracking
5. **Search Bar** - Global search functionality

#### **Page-Specific Interactive Elements:**

**Overview Page (15 elements):**
- 5 KPI cards (clickable)
- 3 filter dropdowns in global bar
- Interactive map with zoom/click
- Trend chart with hover/click
- AI chat interface
- Top products list (clickable items)
- Performance table (sortable)
- 2 action buttons

**Transaction Analysis (18 elements):**
- 4 sub-navigation tabs
- Time range selector
- Main chart with brush selection
- 4 secondary charts (all interactive)
- 6 quick action buttons
- Data export controls

**Product Analysis (20 elements):**
- Product hierarchy selectors (4 levels)
- 4 sub-navigation tabs
- Interactive treemap/sunburst
- 4 comparison charts
- Product comparison checkboxes
- 6 action buttons

**Geographic Analytics (16 elements):**
- Map type selectors
- 4 sub-navigation tabs
- Interactive map with multiple layers
- Map drawing tools
- 3 analytics panels
- 6 action buttons

**AI Assistant (12 elements):**
- Chat input interface
- 4 sub-navigation tabs
- 12 quick action buttons
- Context controls
- File upload for custom analysis

**Reports (14 elements):**
- Report template selector
- Format options
- 4 sub-navigation tabs
- 3 quick report generators
- Report management controls
- Scheduling interface

### Responsive Design Breakpoints

```
📱 Mobile (320px - 768px):
- Collapsible navigation
- Stacked charts
- Simplified filters
- Touch-optimized controls

💻 Tablet (768px - 1024px):
- Side navigation
- 2-column layouts
- Condensed charts
- Gesture support

🖥️ Desktop (1024px+):
- Full navigation
- Multi-column layouts
- Full chart features
- Keyboard shortcuts
```

### Accessibility Features

- **Screen Reader Support:** ARIA labels on all interactive elements
- **Keyboard Navigation:** Tab order for all controls
- **Color Accessibility:** High contrast mode available
- **Text Scaling:** Support for 200% zoom
- **Alternative Formats:** Audio descriptions for charts

This complete wireframe structure ensures:
- ✅ No dead-end pages
- ✅ All tabs are clickable and functional
- ✅ Comprehensive cross-navigation
- ✅ Context preservation across pages
- ✅ Clear user journey paths
- ✅ Detailed component and chart specifications

---

## 9. Enhanced Transaction Trends Dashboard

### Key Requirements Implementation

**Data Included**
• Transactions by time & location
• Peso value distribution
• Transaction duration
• Units per transaction
• Brand and category analysis

**Toggles/Filters**
• Time of day
• Barangay / Region
• Category selection
• Week vs weekend
• Location filtering

**Visualizations**
• Time series chart
• Box plot analysis
• Geographic heatmap
• Violin plot distribution
• Radar charts

**AI Features**
• Contextual recommendations
• Anomaly detection
• Pattern recognition
• Predictive insights
• Natural language queries

### Sample AI Recommendations

```
📊 Staff Optimization
Increase staff during 2-4 PM peak by 30%

🛍️ Product Bundling  
Bundle Coca-Cola with Lays - 28% co-purchase rate

💰 Promotional Strategy
Target high-margin SKUs in low-value areas
```

---

## 10. AI Integration & Chatbot

### AI Architecture
- **AI Service:** OpenAI API
- **Model:** GPT-4 Turbo
- **Context Awareness:** Filter-based
- **Data Integration:** Real-time + Historical

### Chat Features
- **Natural Language Queries:** "Show me top products in NCR this month"
- **Contextual Responses:** Automatically includes current filter context
- **Quick Actions:** Pre-built queries for common analysis
- **Data Export:** Generate reports from chat responses

### Sample Chat Implementation

```tsx
// RetailBot Component Implementation
import { useChat } from 'ai/react';
import { useFilterStore } from '@/stores/filterStore';

const RetailBot = () => {
  const { filters } = useFilterStore();
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/v1/ai/chat',
    body: { context: filters },
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <i className="fas fa-robot mr-2 text-blue-600"></i>
          Retail Analytics Assistant
        </h3>
      </div>
      
      <div className="h-96 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`p-3 rounded-lg ${
            message.role === 'user' ? 'bg-blue-50 ml-12' : 'bg-gray-50 mr-12'
          }`}>
            <div className="font-medium mb-1">
              {message.role === 'user' ? 'You' : 'AI Assistant'}
            </div>
            <div className="text-sm">{message.content}</div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about sales trends, product performance..."
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Send
        </button>
      </form>
    </div>
  );
};
```

---

## 11. Dependencies & Technology Stack

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "zustand": "^4.4.1",
    "@radix-ui/react-select": "^1.2.2",
    "@radix-ui/react-dialog": "^1.0.4",
    "lucide-react": "^0.263.1",
    "recharts": "^2.7.2",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "axios": "^1.4.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0",
    "ai": "^4.3.16",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "playwright": "^1.36.0",
    "cypress": "^12.17.0",
    "vitest": "^0.34.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "tailwindcss": "^3.3.3"
  }
}
```

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.1",
    "joi": "^17.9.2",
    "mysql2": "^3.6.0",
    "redis": "^4.6.7",
    "openai": "^4.0.0",
    "dotenv": "^16.3.1",
    "winston": "^3.10.0",
    "compression": "^1.7.4",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/uuid": "^9.0.2",
    "eslint": "^8.45.0",
    "tsx": "^3.12.7",
    "typescript": "^5.0.2",
    "vitest": "^0.34.0"
  }
}
```

### Installation Commands

```bash
# Clone repository
git clone https://github.com/your-org/scout-analytics-dashboard.git
cd scout-analytics-dashboard

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install

# Setup environment
cp .env.example .env
# Edit .env with your configurations

# Start development with Docker
docker-compose up -d

# Start development servers (alternative)
npm run dev     # Frontend (http://localhost:3000)
npm run server  # Backend (http://localhost:3001)
```

---

## 12. Deployment Guide

### Platform Overview
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Database:** MySQL (Render or PlanetScale)
- **Containerization:** Docker
- **CI/CD:** GitHub Actions

### Environment Setup
- **Development:** Local + Docker
- **Staging:** Render Preview + Vercel Preview
- **Production:** Render + Vercel

### Environment Variables

```env
# .env Configuration

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://scout-analytics.vercel.app

# Database
DB_HOST=your-mysql-host.render.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=scout_analytics
DB_SSL=true

# Redis (Optional)
REDIS_HOST=your-redis-host.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://scout-analytics.vercel.app,https://scout-analytics-git-*.vercel.app
```

### Deployment Steps

#### Vercel Frontend Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Render Backend Deployment

1. **Connect GitHub Repository:**
   - Go to Render Dashboard
   - Click "New Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   ```
   Build Command: npm run build
   Start Command: npm start
   Environment: Docker
   ```

3. **Set Environment Variables:**
   - Add all required environment variables
   - Configure database connection

### Docker Production Setup

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN npm run build

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

USER node

CMD ["npm", "start"]
```

### Database Migration

```sql
-- Production database setup
CREATE DATABASE scout_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Run migration scripts
SOURCE /path/to/database.sql;

-- Create indexes for performance
CREATE INDEX idx_composite_geography ON geography(region, city);
CREATE INDEX idx_composite_organization ON organization(client, category, brand);
CREATE INDEX idx_transactions_date_range ON transactions(datetime, total_amount);
```

## 13. High-Dimensional Data Analytics & Drill-Down Functions

### Multi-Dimensional Analysis Framework

The Scout Analytics Dashboard supports high-dimensional data analysis with comprehensive drill-down capabilities across three primary hierarchies:

**Geographic Hierarchy (3 levels):**
- Region → City/Municipality → Barangay

**Organizational Hierarchy (4 levels):**
- Client → Category → Brand → SKU

**Temporal Hierarchy (7 levels):**
- Year → Month → Week → Day of Week → Hour → Minute → Second

### Drill-Down Implementation

```tsx
// DrillDownAnalytics.tsx - High-Dimensional Analysis Component
import React, { useState, useEffect } from 'react'
import { useFilterStore } from '@/stores/filterStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DrillDownData {
  dimension: string
  total_sales: number
  transaction_count: number
  avg_transaction_value: number
  growth_rate?: number
  market_share?: number
}

const DrillDownAnalytics: React.FC = () => {
  const { filters, setFilter } = useFilterStore()
  const [drillDownData, setDrillDownData] = useState<DrillDownData[]>([])
  const [currentDimension, setCurrentDimension] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Determine next drill-down level based on current filters
  const getNextDrillDownLevel = () => {
    // Geographic drill-down logic
    if (!filters.region) return { type: 'geography', level: 'region', label: 'Regions' }
    if (!filters.city_municipality) return { type: 'geography', level: 'city_municipality', label: 'Cities/Municipalities' }
    if (!filters.barangay) return { type: 'geography', level: 'barangay', label: 'Barangays' }
    
    // Organizational drill-down logic
    if (!filters.client) return { type: 'organization', level: 'client', label: 'Clients' }
    if (!filters.category) return { type: 'organization', level: 'category', label: 'Categories' }
    if (!filters.brand) return { type: 'organization', level: 'brand', label: 'Brands' }
    if (!filters.sku) return { type: 'organization', level: 'sku', label: 'SKUs' }
    
    // Temporal drill-down logic
    if (!filters.year) return { type: 'time', level: 'year', label: 'Years' }
    if (!filters.month) return { type: 'time', level: 'month', label: 'Months' }
    if (!filters.hour) return { type: 'time', level: 'hour', label: 'Hours' }
    
    return null
  }
  
  // Handle drill-down selection
  const handleDrillDown = (selectedValue: string) => {
    const nextLevel = getNextDrillDownLevel()
    if (nextLevel) {
      setFilter(nextLevel.level, selectedValue)
      // Trigger data refresh
      window.dispatchEvent(new CustomEvent('drillDownSelected', { 
        detail: { level: nextLevel.level, value: selectedValue } 
      }))
    }
  }
  
  // Calculate market share for current dimension
  const calculateMarketShare = (data: DrillDownData[]) => {
    const totalSales = data.reduce((sum, item) => sum + item.total_sales, 0)
    return data.map(item => ({
      ...item,
      market_share: (item.total_sales / totalSales) * 100
    }))
  }
  
  // Render drill-down chart
  const renderDrillDownChart = () => {
    const nextLevel = getNextDrillDownLevel()
    if (!nextLevel || drillDownData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Maximum drill-down level reached or no data available
        </div>
      )
    }
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={drillDownData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="dimension" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              name === 'total_sales' ? `₱${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
              name === 'total_sales' ? 'Total Sales' : 
              name === 'transaction_count' ? 'Transactions' : 'Avg Transaction'
            ]}
          />
          <Bar 
            dataKey="total_sales" 
            fill="#3B82F6" 
            cursor="pointer"
            onClick={(data) => handleDrillDown(data.dimension)}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">High-Dimensional Drill-Down Analysis</h3>
          <div className="text-sm text-gray-600">
            {getNextDrillDownLevel()?.label || 'Maximum depth reached'}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {renderDrillDownChart()}
      </div>
      
      {/* Drill-down breadcrumb */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">Current Path:</span>
          {filters.region && <span className="bg-blue-100 px-2 py-1 rounded">📍 {filters.region}</span>}
          {filters.city_municipality && <span className="bg-blue-100 px-2 py-1 rounded">🏘️ {filters.city_municipality}</span>}
          {filters.barangay && <span className="bg-blue-100 px-2 py-1 rounded">🏠 {filters.barangay}</span>}
          {filters.client && <span className="bg-green-100 px-2 py-1 rounded">🏢 {filters.client}</span>}
          {filters.category && <span className="bg-green-100 px-2 py-1 rounded">📦 {filters.category}</span>}
          {filters.brand && <span className="bg-green-100 px-2 py-1 rounded">🏷️ {filters.brand}</span>}
          {filters.sku && <span className="bg-green-100 px-2 py-1 rounded">📋 {filters.sku}</span>}
          {filters.year && <span className="bg-purple-100 px-2 py-1 rounded">📅 {filters.year}</span>}
          {filters.month && <span className="bg-purple-100 px-2 py-1 rounded">🗓️ Month {filters.month}</span>}
          {filters.hour && <span className="bg-purple-100 px-2 py-1 rounded">🕐 {filters.hour}:00</span>}
        </div>
      </div>
    </div>
  )
}

// FilterMetrics.tsx - Display total filter combinations
const FilterMetrics: React.FC = () => {
  const { filters } = useFilterStore()
  const [metrics, setMetrics] = useState({
    total_combinations: 0,
    current_combinations: 0,
    filter_efficiency: 0
  })
  
  useEffect(() => {
    // Calculate filter metrics
    const calculateMetrics = async () => {
      const response = await fetch('/api/v1/filters/combinations/count?' + new URLSearchParams(filters))
      const data = await response.json()
      
      setMetrics({
        total_combinations: data.data.total_combinations,
        current_combinations: data.data.current_combinations || 0,
        filter_efficiency: data.data.total_combinations > 0 ? 
          ((data.data.current_combinations || 0) / data.data.total_combinations * 100) : 0
      })
    }
    
    calculateMetrics()
  }, [filters])
  
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-blue-600">
          {metrics.total_combinations.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Total Filter Combinations</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-green-600">
          {metrics.current_combinations.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Current Filtered Results</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-purple-600">
          {metrics.filter_efficiency.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">Filter Efficiency</div>
      </div>
    </div>
  )
}
```

### Advanced Geospatial Features

#### Bubble Map Implementation
- **Size Encoding:** Transaction volume
- **Color Encoding:** Performance metrics
- **Interactive Hover:** Detailed location statistics
- **Dynamic Zoom:** Automatic zoom based on filter hierarchy

#### Choropleth Map Implementation
- **Polygon Boundaries:** Administrative boundaries for regions, cities, and barangays
- **Color Intensity:** Sales density and performance
- **Population Normalization:** Sales per capita calculations
- **Comparative Analysis:** Side-by-side regional comparisons

#### Hybrid Visualization
- **Combined View:** Overlay bubble and choropleth visualizations
- **Multi-Metric Display:** Show multiple KPIs simultaneously
- **Interactive Switching:** Toggle between visualization modes
- **Performance Optimization:** Efficient rendering for large datasets

### Technical Implementation Notes

**Database Optimization:**
- Spatial indexes for geographic queries
- Hierarchical indexes for drill-down performance
- Materialized views for common aggregations
- Query result caching for repeated filter combinations

**Frontend Performance:**
- Lazy loading for deep drill-down levels
- Virtual scrolling for large result sets
- Debounced filter updates
- Progressive data loading

**Scalability Considerations:**
- Pagination for large datasets
- Server-side filtering and aggregation
- CDN caching for static geographic boundaries
- Background processing for complex calculations

**Scout Analytics Dashboard v3.1** is now configured for:

✅ **MySQL Database** with optimized schema  
✅ **Docker Containerization** for consistent deployments  
✅ **Render Backend Hosting** with auto-scaling  
✅ **Vercel Frontend Hosting** with global CDN  
✅ **Public Access** with no authentication required  
✅ **OpenAI Integration** for AI-powered insights  
✅ **Real-time Analytics** with responsive design  
✅ **Enterprise Performance** with monitoring  

The application is production-ready with comprehensive CI/CD pipelines, performance optimization, and scalable architecture suitable for retail analytics workloads.

---

**© 2025 TBWA\SMAP. All rights reserved. | Version 3.1.0 | Last Updated: June 28, 2025**