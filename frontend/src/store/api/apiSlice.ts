import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Sales', 'Brands', 'Products', 'Stores', 'Analytics'],
  endpoints: (builder) => ({
    // Sales Data
    getSalesMetrics: builder.query({
      query: (params) => ({
        url: '/metrics/sales',
        params,
      }),
      providesTags: ['Sales'],
    }),
    
    // Brand Performance
    getBrandPerformance: builder.query({
      query: (params) => ({
        url: '/brands/performance',
        params,
      }),
      providesTags: ['Brands'],
    }),
    
    // Product Analytics
    getProductAnalytics: builder.query({
      query: (params) => ({
        url: '/products/analytics',
        params,
      }),
      providesTags: ['Products'],
    }),
    
    // Store Performance
    getStorePerformance: builder.query({
      query: (params) => ({
        url: '/stores/performance',
        params,
      }),
      providesTags: ['Stores'],
    }),
    
    // AI Insights
    getAIInsights: builder.query({
      query: (params) => ({
        url: '/analytics/insights',
        params,
      }),
      providesTags: ['Analytics'],
    }),
  }),
})

export const {
  useGetSalesMetricsQuery,
  useGetBrandPerformanceQuery,
  useGetProductAnalyticsQuery,
  useGetStorePerformanceQuery,
  useGetAIInsightsQuery,
} = apiSlice