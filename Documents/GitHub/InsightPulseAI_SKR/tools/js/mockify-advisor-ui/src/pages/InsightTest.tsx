import React from 'react';
import { InsightCard } from '@/components/advisor/InsightCard';

const testInsights = [
  {
    id: "insight-1",
    title: "Revenue Growth Opportunity",
    summary: "Potential to increase revenue by targeting high-value customer segments with targeted campaigns.",
    details: "Analysis of transaction patterns reveals that customers aged 25-34 from urban regions spend 37% more per order. Increasing marketing spend to this demographic could yield 12-15% additional revenue. We recommend reallocating 20% of your current marketing budget to specifically target this segment through social media and personalized email campaigns.",
    confidence: 86,
    date: "2025-05-15",
    category: "revenue",
    recommendations: [
      "Reallocate 20% of marketing budget to the 25-34 demographic",
      "Deploy personalized email campaigns highlighting premium products",
      "Increase social media ad spend for this segment by 30%",
      "Track conversion rates specifically for this demographic"
    ],
    relatedMetrics: [
      { name: "Avg. Order Value (25-34)", value: 87.50, trend: "up", trendValue: "12.3%" },
      { name: "Customer Acquisition Cost", value: 28.75, trend: "down", trendValue: "8.2%" },
      { name: "Campaign ROI", value: 3.2, trend: "up", trendValue: "15.5%" },
      { name: "Conversion Rate", value: 4.8, trend: "up", trendValue: "0.7%" }
    ]
  },
  {
    id: "insight-2",
    title: "Inventory Optimization Alert",
    summary: "Current inventory levels for top products projected to run out before restocking",
    details: "SKUs #4582, #6723, and #8901 are trending at 128% of expected sales velocity. At current pace, stock will be depleted 9 days before scheduled replenishment. Recommend expedited order processing and potential adjustment to safety stock levels for these high-performing items.",
    confidence: 92,
    date: "2025-05-14",
    category: "inventory",
    recommendations: [
      "Expedite replenishment orders for SKUs #4582, #6723, and #8901",
      "Increase safety stock by 20% for these high-velocity items",
      "Review sales forecasting model to improve accuracy",
      "Establish alert thresholds at 40% of stock remaining"
    ],
    relatedMetrics: [
      { name: "Stock Depletion Rate", value: 12.8, trend: "up", trendValue: "28%" },
      { name: "Days Until Stockout", value: 9, trend: "down", trendValue: "4 days" },
      { name: "Reorder Lead Time", value: 14, trend: "flat", trendValue: "0%" },
      { name: "Lost Sales Potential", value: 45600, trend: "up", trendValue: "52%" }
    ]
  },
  {
    id: "insight-3",
    title: "Customer Retention Risk",
    summary: "Significant increase in churn detected in premium customer segment",
    details: "Premium tier customers showed a 14% increase in churn rate over the past 30 days, concentrated in the Southwest region. Exit surveys indicate 68% cited competitor pricing as primary reason for switching. Recommend immediate review of pricing structure and potential loyalty incentives for this high-value segment.",
    confidence: 79,
    date: "2025-05-12",
    category: "customers",
    recommendations: [
      "Review premium tier pricing strategy against competitors",
      "Implement targeted loyalty program for at-risk customers",
      "Develop win-back campaign for recently churned customers",
      "Increase customer service touchpoints for premium subscribers"
    ],
    relatedMetrics: [
      { name: "Premium Churn Rate", value: 4.2, trend: "up", trendValue: "14%" },
      { name: "Customer Lifetime Value", value: 1250, trend: "down", trendValue: "8.5%" },
      { name: "Competitor Price Diff", value: 15, trend: "up", trendValue: "5%" },
      { name: "Satisfaction Score", value: 7.2, trend: "down", trendValue: "0.8 pts" }
    ]
  }
];

const InsightTest = () => {
  return (
    <div className="bg-[#f5f5f5] min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Insight Drilldown Demo</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the InsightCard component with drilldown modal functionality. 
            Click on any card to open the detailed view of the insight.
          </p>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-700">Test Insights</h2>
          </div>
          
          <div className="space-y-4">
            {testInsights.map(insight => (
              <InsightCard
                key={insight.id}
                id={insight.id}
                title={insight.title}
                summary={insight.summary}
                details={insight.details}
                confidence={insight.confidence}
                date={insight.date}
                category={insight.category}
              />
            ))}
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
        </div>
      </div>
    </div>
  );
};

export default InsightTest;