import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useFilters } from '../../context/FilterContext'
import { Skeleton } from '../ui/Skeleton'
import { Sparkles, TrendingUp, AlertCircle, Target, Brain } from 'lucide-react'

interface AIInsight {
  id: string
  type: 'opportunity' | 'alert' | 'trend' | 'recommendation'
  title: string
  description: string
  impact: string
  confidence: number
  action?: string
}

const insightIcons = {
  opportunity: <Target className="w-5 h-5 text-green-600" />,
  alert: <AlertCircle className="w-5 h-5 text-red-600" />,
  trend: <TrendingUp className="w-5 h-5 text-blue-600" />,
  recommendation: <Brain className="w-5 h-5 text-purple-600" />,
}

const insightColors = {
  opportunity: 'bg-green-50 border-green-200',
  alert: 'bg-red-50 border-red-200',
  trend: 'bg-blue-50 border-blue-200',
  recommendation: 'bg-purple-50 border-purple-200',
}

export const AIInsightsPanel: React.FC = () => {
  const { filters } = useFilters()
  const [selectedType, setSelectedType] = useState<string>('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights', filters],
    queryFn: async () => {
      // In a real implementation, this would call an AI service
      // For now, returning contextual demo insights
      const insights: AIInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'High-Growth Potential in Region III',
          description: 'Bulacan province shows 23% unmet demand for beverages category based on population density analysis.',
          impact: '₱2.3M potential monthly revenue',
          confidence: 0.87,
          action: 'Consider expanding distribution to 5 identified barangays',
        },
        {
          id: '2',
          type: 'alert',
          title: 'Inventory Risk Detected',
          description: 'Tobacco products showing 45% slower movement in Metro Manila stores. Overstock risk identified.',
          impact: '₱450K tied in slow-moving inventory',
          confidence: 0.92,
          action: 'Implement promotional campaign or redistribute stock',
        },
        {
          id: '3',
          type: 'trend',
          title: 'Shift to Premium Brands Accelerating',
          description: 'Premium beverage brands growing 3x faster than value brands across all regions.',
          impact: '+18% margin opportunity',
          confidence: 0.79,
          action: 'Adjust product mix to favor premium SKUs',
        },
        {
          id: '4',
          type: 'recommendation',
          title: 'Optimize Delivery Routes',
          description: 'AI routing analysis suggests 15% efficiency gain by consolidating Tuesday/Thursday deliveries.',
          impact: 'Save ₱180K monthly in logistics',
          confidence: 0.83,
          action: 'Pilot new routing in Cavite province',
        },
        {
          id: '5',
          type: 'opportunity',
          title: 'Cross-Sell Opportunity Identified',
          description: '73% of stores buying Coca-Cola don\'t carry C2. Strong correlation suggests bundling potential.',
          impact: '₱890K additional revenue',
          confidence: 0.76,
          action: 'Create beverage bundle promotions',
        },
      ]

      // Filter by selected type
      return selectedType === 'all' 
        ? insights 
        : insights.filter(i => i.type === selectedType)
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  if (isLoading) {
    return (
      <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  const insights = data || []

  return (
    <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">AI Insights</h3>
        </div>
        <button 
          onClick={() => refetch()}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap ${
            selectedType === 'all' 
              ? 'bg-primary/10 text-primary' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({insights.length})
        </button>
        {['opportunity', 'alert', 'trend', 'recommendation'].map(type => {
          const count = (data || []).filter(i => i.type === type).length
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap capitalize ${
                selectedType === type 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type} ({count})
            </button>
          )
        })}
      </div>

      {/* Insights List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
              insightColors[insight.type]
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{insightIcons[insight.type]}</div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-900">Impact: {insight.impact}</span>
                  <span className="text-gray-600">
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </span>
                </div>

                {insight.action && (
                  <div className="mt-3 p-2 bg-white/50 rounded text-sm">
                    <span className="font-medium">Recommended Action: </span>
                    {insight.action}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Insights</p>
            <p className="text-2xl font-bold text-primary">{insights.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Confidence</p>
            <p className="text-2xl font-bold text-primary">
              {Math.round((insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) * 100)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}