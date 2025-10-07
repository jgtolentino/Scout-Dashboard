'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Package, 
  Users, 
  MapPin, 
  AlertTriangle,
  Activity,
  CheckCircle,
  Clock,
  BarChart3,
  Zap
} from 'lucide-react'
import { AgentInsight, AgentType } from '@/types/recommendation'

interface AgentInsightPanelProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

const agentConfig = {
  sales_performance: {
    icon: TrendingUp,
    label: 'Sales Performance',
    color: 'bg-blue-500',
    description: 'Monitor sales trends and KPI performance'
  },
  inventory_optimization: {
    icon: Package,
    label: 'Inventory',
    color: 'bg-green-500',
    description: 'Track stock levels and replenishment needs'
  },
  customer_behavior: {
    icon: Users,
    label: 'Customer Behavior',
    color: 'bg-purple-500',
    description: 'Analyze purchase patterns and segmentation'
  },
  geographic_analysis: {
    icon: MapPin,
    label: 'Geographic',
    color: 'bg-orange-500',
    description: 'Regional performance and market analysis'
  },
  anomaly_detection: {
    icon: AlertTriangle,
    label: 'Anomaly Detection',
    color: 'bg-red-500',
    description: 'Real-time issue identification and alerts'
  }
}

const severityConfig = {
  info: { color: 'bg-blue-100 text-blue-700', icon: Activity },
  warning: { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  success: { color: 'bg-green-100 text-green-700', icon: CheckCircle }
}

export default function AgentInsightPanel({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: AgentInsightPanelProps) {
  const [insights, setInsights] = useState<AgentInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAgent, setActiveAgent] = useState<AgentType | 'all'>('all')
  const [agentHealth, setAgentHealth] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchInsights()
    checkAgentHealth()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchInsights()
        checkAgentHealth()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [activeAgent, autoRefresh, refreshInterval])

  const fetchInsights = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (activeAgent !== 'all') {
        params.append('agent', activeAgent)
      }
      params.append('limit', '20')

      const response = await fetch(`/api/ai/insights?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      setInsights(data.insights || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const checkAgentHealth = async () => {
    try {
      const response = await fetch('/api/ai/insights', { method: 'HEAD' })
      const data = await response.json()
      
      const healthMap = data.agents?.reduce((acc: Record<string, boolean>, agent: any) => {
        acc[agent.agent] = agent.healthy
        return acc
      }, {}) || {}
      
      setAgentHealth(healthMap)
    } catch (error) {
      console.error('Error checking agent health:', error)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const getInsightsByAgent = (agentType: AgentType) => {
    return insights.filter(insight => insight.agent_type === agentType)
  }

  const AgentTab = ({ agentType }: { agentType: AgentType }) => {
    const config = agentConfig[agentType]
    const agentInsights = getInsightsByAgent(agentType)
    const isHealthy = agentHealth[agentType] !== false
    const Icon = config.icon

    return (
      <div className="space-y-3">
        {/* Agent Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${config.color} text-white`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium">{config.label}</h4>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isHealthy ? "default" : "destructive"}
              className="text-xs"
            >
              {isHealthy ? 'Active' : 'Inactive'}
            </Badge>
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>

        {/* Insights */}
        {agentInsights.length > 0 ? (
          <div className="space-y-2">
            {agentInsights.map((insight) => {
              const severityInfo = severityConfig[insight.severity]
              const SeverityIcon = severityInfo.icon

              return (
                <Card key={insight.id} className="border-l-4" 
                      style={{ borderLeftColor: config.color.replace('bg-', '#') }}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <SeverityIcon className={`h-3 w-3 ${severityInfo.color.split(' ')[1]}`} />
                        <Badge className={`text-xs ${severityInfo.color}`}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(insight.created_at)}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm">{insight.title}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {insight.description}
                      </p>
                    </div>

                    {/* Metrics */}
                    {insight.metrics && Object.keys(insight.metrics).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(insight.metrics).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                            <BarChart3 className="h-3 w-3" />
                            <span className="font-medium">{key}:</span>
                            <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Recommendations:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {insight.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent insights</p>
            <p className="text-sm">This agent will generate insights as it analyzes data</p>
          </div>
        )}
      </div>
    )
  }

  if (isLoading && insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 p-3 border rounded">
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Agent Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {insights.length} insights
            </Badge>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${Object.values(agentHealth).some(h => h) ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {Object.values(agentHealth).filter(h => h).length}/{Object.keys(agentConfig).length} agents active
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeAgent} onValueChange={(value) => setActiveAgent(value as AgentType | 'all')}>
          <div className="px-6 pb-3">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              {Object.entries(agentConfig).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {config.label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="h-96">
            <div className="px-6 pb-6">
              <TabsContent value="all" className="mt-0">
                <div className="space-y-4">
                  {Object.entries(agentConfig).map(([agentType, config]) => {
                    const agentInsights = getInsightsByAgent(agentType as AgentType)
                    if (agentInsights.length === 0) return null

                    return (
                      <div key={agentType}>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                          <Badge variant="outline" className="text-xs">
                            {agentInsights.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2">
                          {agentInsights.slice(0, 2).map((insight) => (
                            <Card key={insight.id} className="border-l-4" 
                                  style={{ borderLeftColor: config.color.replace('bg-', '#') }}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-1">
                                  <Badge className={`text-xs ${severityConfig[insight.severity].color}`}>
                                    {insight.severity}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(insight.created_at)}
                                  </span>
                                </div>
                                <h5 className="font-medium text-sm">{insight.title}</h5>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {insight.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {insights.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No insights available</p>
                      <p className="text-sm">AI agents will generate insights as they analyze your data</p>
                      <Button onClick={fetchInsights} variant="outline" size="sm" className="mt-2">
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {Object.keys(agentConfig).map((agentType) => (
                <TabsContent key={agentType} value={agentType} className="mt-0">
                  <AgentTab agentType={agentType as AgentType} />
                </TabsContent>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}