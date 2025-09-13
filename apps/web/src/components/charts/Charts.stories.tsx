import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterProvider } from '../../context/FilterContext'
import { TransactionTrends } from './TransactionTrends'
import { ProductMixChart } from './ProductMixChart'
import { BrandPerformance } from './BrandPerformance'
import { RegionalHeatMap } from './RegionalHeatMap'
import { AIInsightsPanel } from './AIInsightsPanel'
import { TimeHeatMap } from './TimeHeatMap'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const withProviders = (Story: any) => (
  <QueryClientProvider client={queryClient}>
    <FilterProvider>
      <Story />
    </FilterProvider>
  </QueryClientProvider>
)

const meta = {
  title: 'Charts/All Charts',
  decorators: [withProviders],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'light',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const TransactionTrendsChart: Story = {
  render: () => <TransactionTrends />,
}

export const ProductMixPieChart: Story = {
  render: () => <ProductMixChart />,
}

export const BrandPerformanceBarChart: Story = {
  render: () => <BrandPerformance />,
}

export const RegionalHeatMapChart: Story = {
  render: () => <RegionalHeatMap />,
}

export const AIInsightsPanelComponent: Story = {
  render: () => <AIInsightsPanel />,
}

export const TimeHeatMapChart: Story = {
  render: () => <TimeHeatMap />,
}

export const FullDashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">Scout Dashboard v5.0 - All Charts</h1>
        
        {/* First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionTrends />
          <ProductMixChart />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BrandPerformance />
          <RegionalHeatMap />
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimeHeatMap />
          </div>
          <div className="lg:col-span-1">
            <AIInsightsPanel />
          </div>
        </div>
      </div>
    </div>
  ),
}