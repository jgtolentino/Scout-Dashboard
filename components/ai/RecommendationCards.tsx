'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Target,
  Zap,
  Shield,
  DollarSign,
  TestTube
} from 'lucide-react'
import { Recommendation, RecoTier, RecoStatus } from '@/types/recommendation'

interface RecommendationCardsProps {
  tier?: RecoTier
  status?: RecoStatus
  limit?: number
  className?: string
}

const tierConfig = {
  operational: { 
    icon: Clock, 
    color: 'bg-blue-500', 
    label: 'Operational',
    description: 'Hours to 7 days'
  },
  tactical: { 
    icon: TrendingUp, 
    color: 'bg-green-500', 
    label: 'Tactical',
    description: '2-12 weeks'
  },
  strategic: { 
    icon: Target, 
    color: 'bg-purple-500', 
    label: 'Strategic',
    description: '1-4 quarters'
  },
  transformational: { 
    icon: Zap, 
    color: 'bg-orange-500', 
    label: 'Transformational',
    description: '1-3 years'
  },
  governance: { 
    icon: Shield, 
    color: 'bg-red-500', 
    label: 'Governance',
    description: 'Continuous'
  },
  financial: { 
    icon: DollarSign, 
    color: 'bg-yellow-500', 
    label: 'Financial',
    description: '1-12 months'
  },
  experiment: { 
    icon: TestTube, 
    color: 'bg-cyan-500', 
    label: 'Experiment',
    description: '2-10 weeks'
  }
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-green-600', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', label: 'Rejected' },
  implemented: { icon: CheckCircle, color: 'text-blue-600', label: 'Implemented' }
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  critical: { color: 'bg-red-100 text-red-700', label: 'Critical' }
}

export default function RecommendationCards({ 
  tier, 
  status, 
  limit = 10, 
  className 
}: RecommendationCardsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [tier, status, limit])

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (tier) params.append('tier', tier)
      if (status) params.append('status', status)
      params.append('limit', limit.toString())

      const response = await fetch(`/api/ai/recommendations?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateRecommendationStatus = async (id: string, newStatus: RecoStatus) => {
    try {
      const response = await fetch(`/api/ai/recommendations?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === id ? { ...rec, status: newStatus } : rec
          )
        )
      }
    } catch (error) {
      console.error('Error updating recommendation:', error)
    }
  }

  const formatTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null

    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()

    if (diffMs < 0) return 'Expired'

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d remaining`
    if (hours > 0) return `${hours}h remaining`
    return 'Expiring soon'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading recommendations</p>
            <p className="text-sm">{error}</p>
            <Button onClick={fetchRecommendations} className="mt-2" variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations found</p>
            <p className="text-sm">
              {tier ? `No ${tierConfig[tier].label.toLowerCase()} recommendations` : 'Try adjusting your filters'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>AI Recommendations</span>
          <Badge variant="outline">{recommendations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-3 p-6 pt-0">
            {recommendations.map((recommendation) => {
              const tierInfo = tierConfig[recommendation.tier]
              const statusInfo = statusConfig[recommendation.status]
              const priorityInfo = priorityConfig[recommendation.priority]
              const TierIcon = tierInfo.icon
              const StatusIcon = statusInfo.icon
              const timeRemaining = formatTimeRemaining(recommendation.expires_at)

              return (
                <Card key={recommendation.id} className="border-l-4" style={{ borderLeftColor: tierInfo.color.replace('bg-', '#') }}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${tierInfo.color} text-white`}>
                          <TierIcon className="h-3 w-3" />
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {tierInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            {tierInfo.description}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Title and Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{recommendation.title}</h4>
                        <Badge className={`text-xs ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {recommendation.description}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                        <span>{statusInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {recommendation.confidence_score && (
                          <span>
                            {Math.round(recommendation.confidence_score * 100)}% confidence
                          </span>
                        )}
                        {timeRemaining && (
                          <span className={timeRemaining === 'Expired' ? 'text-red-600' : ''}>
                            {timeRemaining}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {recommendation.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => updateRecommendationStatus(recommendation.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => updateRecommendationStatus(recommendation.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Reasoning (expandable) */}
                    {recommendation.reasoning && (
                      <>
                        <Separator />
                        <details className="group">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View reasoning
                          </summary>
                          <p className="text-xs mt-2 text-muted-foreground">
                            {recommendation.reasoning}
                          </p>
                        </details>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}