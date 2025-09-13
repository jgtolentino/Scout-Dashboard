'use client'

import { useKpiMetrics } from '@/hooks/useKpiMetrics'
import { 
  KPICardGrid, 
  ExpenseKPICard, 
  TicketsKPICard, 
  RTOLKPICard, 
  ViolationsKPICard 
} from '@/components/analytics/KPICard'
import { ExpenseCategoryPie } from '@/components/analytics/ExpenseCategoryPie'
import { CashAdvanceBar } from '@/components/analytics/CashAdvanceBar'
import { PolicyViolationTable } from '@/components/analytics/PolicyViolationTable'
import { RTOLHeatmap } from '@/components/analytics/RTOLHeatmap'
import { ApprovalTimeline } from '@/components/analytics/ApprovalTimeline'
import { FileProgressDonut } from '@/components/analytics/FileProgressDonut'
import { DrilldownFlyout } from '@/components/analytics/DrilldownFlyout'
import { AgentTipsSidebar } from '@/components/analytics/AgentTipsSidebar'
import { TicketTrendChart, TicketCategoryBreakdown } from '@/components/analytics/TicketAnalytics'
import { useState } from 'react'

export default function DashboardPage() {
  const { data: kpiData, isLoading: kpiLoading } = useKpiMetrics()
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [showDrilldown, setShowDrilldown] = useState(false)

  const handleKPIClick = (metric: string) => {
    setSelectedMetric(metric)
    setShowDrilldown(true)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-tbwa-black dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-tbwa-gray-600 dark:text-tbwa-gray-400 mt-1">
          Real-time insights across your organization
        </p>
      </div>

      {/* KPI Cards */}
      <KPICardGrid>
        <ExpenseKPICard 
          loading={kpiLoading} 
          data={kpiData?.expenses}
          onClick={() => handleKPIClick('expenses')}
        />
        <TicketsKPICard 
          loading={kpiLoading} 
          data={kpiData?.tickets}
          onClick={() => handleKPIClick('tickets')}
        />
        <RTOLKPICard 
          loading={kpiLoading} 
          data={kpiData?.rtol}
          onClick={() => handleKPIClick('rtol')}
        />
        <ViolationsKPICard 
          loading={kpiLoading} 
          data={kpiData?.violations}
          onClick={() => handleKPIClick('violations')}
        />
      </KPICardGrid>

      {/* Main analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Expense Category Distribution */}
        <div className="chart-container">
          <h2 className="chart-title">Expense Categories</h2>
          <ExpenseCategoryPie />
        </div>

        {/* Cash Advance vs Liquidation */}
        <div className="chart-container">
          <h2 className="chart-title">Cash Advances</h2>
          <CashAdvanceBar />
        </div>

        {/* Policy Violations */}
        <div className="chart-container lg:col-span-2 xl:col-span-1">
          <h2 className="chart-title">Policy Violations</h2>
          <PolicyViolationTable />
        </div>

        {/* RTOL Heatmap */}
        <div className="chart-container lg:col-span-2">
          <h2 className="chart-title">Office Attendance Heatmap</h2>
          <RTOLHeatmap />
        </div>

        {/* Approval Timeline */}
        <div className="chart-container">
          <h2 className="chart-title">Approval Times</h2>
          <ApprovalTimeline />
        </div>

        {/* 201 File Completeness */}
        <div className="chart-container">
          <h2 className="chart-title">201 File Status</h2>
          <FileProgressDonut />
        </div>

        {/* Ticket Trends */}
        <div className="chart-container lg:col-span-2">
          <h2 className="chart-title">Ticket Trends</h2>
          <TicketTrendChart />
        </div>

        {/* Ticket Category Breakdown */}
        <div className="chart-container">
          <h2 className="chart-title">Tickets by Category</h2>
          <TicketCategoryBreakdown />
        </div>
      </div>

      {/* Drilldown Flyout */}
      <DrilldownFlyout
        open={showDrilldown}
        onClose={() => {
          setShowDrilldown(false)
          setSelectedMetric(null)
        }}
        metric={selectedMetric}
      />

      {/* AI Agent Tips Sidebar */}
      <AgentTipsSidebar />
    </div>
  )
}