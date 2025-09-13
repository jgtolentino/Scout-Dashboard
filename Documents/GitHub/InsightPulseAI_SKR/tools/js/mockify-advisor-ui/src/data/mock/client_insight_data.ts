import { InsightData } from '@/types/advisor';

// Client-facing insights (filtered for client consumption)
const clientInsightData: InsightData[] = [
  {
    id: "insight-1",
    title: 'Revenue Growth Opportunity',
    summary: 'Potential to increase revenue by targeting high-value customer segments',
    details: 'Analysis of transaction patterns reveals that customers aged 25-34 from urban regions spend 37% more per order. Increasing marketing spend to this demographic could yield 12-15% additional revenue.',
    confidence: 86,
    category: 'revenue',
    date: '2025-05-15',
    region: 'Northeast',
    recommendations: [
      "Reallocate 20% of marketing budget to the 25-34 demographic",
      "Deploy personalized email campaigns highlighting premium products",
      "Increase social media ad spend for this segment by 30%"
    ],
    relatedMetrics: [
      { name: "Avg. Order Value (25-34)", value: 87.50, trend: "up", trendValue: "12.3%" },
      { name: "Customer Acquisition Cost", value: 28.75, trend: "down", trendValue: "8.2%" },
      { name: "Campaign ROI", value: 3.2, trend: "up", trendValue: "15.5%" }
    ],
    scopedFor: 'client'
  },
  {
    id: "insight-5",
    title: 'Product Bundle Opportunity',
    summary: 'Strong correlation identified between product categories suggests bundle potential',
    details: 'Purchase pattern analysis reveals that customers who buy products in category A have a 78% likelihood of purchasing from category C within 30 days. Creating bundles that combine these categories could increase average order value by an estimated 25-30%.',
    confidence: 81,
    category: 'product',
    date: '2025-05-08',
    region: 'All',
    recommendations: [
      "Create 3-5 product bundles combining categories A and C",
      "Offer 10-15% discount on bundles to incentivize purchases",
      "Feature bundles prominently on product pages and in recommendations"
    ],
    relatedMetrics: [
      { name: "Co-purchase Rate", value: 78, trend: "up", trendValue: "12%" },
      { name: "Projected AOV Lift", value: 27.5, trend: "up", trendValue: "N/A" },
      { name: "Bundle Margin", value: 42, trend: "flat", trendValue: "0%" }
    ],
    scopedFor: 'client'
  }
];

export default clientInsightData;