import type { Meta, StoryObj } from '@storybook/react'
import { ScoreCard } from './ui/ScoreCard'

const meta = {
  title: 'MockifyCreator/Integration',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Dashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scout Dashboard v5.0</h1>
          <p className="text-gray-600 mt-2">Powered by MockifyCreator UI Kit</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ScoreCard
            title="Total Revenue"
            value="₱3.5M"
            delta={12.5}
            hint="MTD Performance"
          />
          <ScoreCard
            title="Active Stores"
            value="2,847"
            delta={3.2}
            hint="vs Last Month"
          />
          <ScoreCard
            title="Market Share"
            value="18.7%"
            delta={-1.2}
            hint="Category Leader"
          />
          <ScoreCard
            title="AI Insights"
            value="24"
            delta={0}
            hint="New This Week"
          />
        </div>

        {/* Glass-morphic Card Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Performance */}
          <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Sales Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Achievement</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary rounded-full h-2" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>

          {/* Brand Mix */}
          <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Brand Mix</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Premium Brands</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Core Brands</span>
                <span className="font-medium">35%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Value Brands</span>
                <span className="font-medium">20%</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">AI Insights</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  🔍 Opportunity detected in Region III
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚡ Inventory optimization needed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Components: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">MockifyCreator Components</h2>
        
        {/* Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Buttons</h3>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              Primary Button
            </button>
            <button className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Secondary Button
            </button>
            <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Outline Button
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Card Styles</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h4 className="font-medium mb-2">Standard Card</h4>
              <p className="text-sm text-gray-600">Basic card with subtle shadow</p>
            </div>
            <div className="p-6 backdrop-blur-lg bg-white/80 border border-gray-200 rounded-xl shadow-xl">
              <h4 className="font-medium mb-2">Glass Card</h4>
              <p className="text-sm text-gray-600">Glass-morphic effect</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium mb-2">Gradient Card</h4>
              <p className="text-sm text-gray-600">Subtle gradient background</p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Typography</h3>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-base">Body text with normal weight</p>
            <p className="text-sm text-gray-600">Small text for captions</p>
          </div>
        </div>
      </section>
    </div>
  ),
}