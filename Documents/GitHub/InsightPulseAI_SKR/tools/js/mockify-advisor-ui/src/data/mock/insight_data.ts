import { InsightData } from '@/types/advisor';

// Full insight data set (internal view)
const insightData: InsightData[] = [
  {
    id: "insight-1",
    title: 'Revenue Growth Opportunity',
    summary: 'Potential to increase revenue by targeting high-value customer segments',
    details: 'Analysis of transaction patterns reveals that customers aged 25-34 from urban regions spend 37% more per order. Increasing marketing spend to this demographic could yield 12-15% additional revenue. We recommend reallocating 20% of your current marketing budget to specifically target this segment through social media and personalized email campaigns.',
    confidence: 86,
    category: 'revenue',
    date: '2025-05-15',
    region: 'Northeast',
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
    ],
    scopedFor: 'both',
    sensitivity: 'public'
  },
  {
    id: "insight-2",
    title: 'Inventory Optimization Alert',
    summary: 'Current inventory levels for top products projected to run out before restocking',
    details: 'SKUs #4582, #6723, and #8901 are trending at 128% of expected sales velocity. At current pace, stock will be depleted 9 days before scheduled replenishment. Recommend expedited order processing and potential adjustment to safety stock levels for these high-performing items.',
    confidence: 92,
    category: 'inventory',
    date: '2025-05-14',
    region: 'All',
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
    ],
    scopedFor: 'internal',
    sensitivity: 'confidential'
  },
  {
    id: "insight-3",
    title: 'Customer Retention Risk',
    summary: 'Significant increase in churn detected in premium customer segment',
    details: 'Premium tier customers showed a 14% increase in churn rate over the past 30 days, concentrated in the Southwest region. Exit surveys indicate 68% cited competitor pricing as primary reason for switching. Recommend immediate review of pricing structure and potential loyalty incentives for this high-value segment.',
    confidence: 79,
    category: 'customers',
    date: '2025-05-12',
    region: 'Southwest',
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
    ],
    scopedFor: 'internal',
    sensitivity: 'internal'
  },
  {
    id: "insight-4",
    title: 'Marketing Campaign Effectiveness',
    summary: 'Social media campaigns significantly outperforming email for acquisition',
    details: 'Analysis of Q1 marketing performance shows social media campaigns generating 3.2x higher ROI compared to email campaigns for new customer acquisition. Social leads have 28% higher conversion rates and 15% higher initial order values than email leads.',
    confidence: 84,
    category: 'marketing',
    date: '2025-05-10',
    region: 'All',
    recommendations: [
      "Increase social media marketing budget allocation by 30%",
      "Shift email focus to retention rather than acquisition",
      "Test expanded social channels (TikTok, Reddit) based on demographic data",
      "Implement cross-channel attribution model for better tracking"
    ],
    relatedMetrics: [
      { name: "Social CAC", value: 23.15, trend: "down", trendValue: "18.3%" },
      { name: "Email CAC", value: 41.75, trend: "up", trendValue: "5.2%" },
      { name: "Social Conversion", value: 4.3, trend: "up", trendValue: "1.1%" },
      { name: "Email Conversion", value: 1.8, trend: "down", trendValue: "0.4%" }
    ],
    scopedFor: 'internal',
    sensitivity: 'confidential'
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
      "Feature bundles prominently on product pages and in recommendations",
      "Implement A/B testing to optimize bundle configurations"
    ],
    relatedMetrics: [
      { name: "Co-purchase Rate", value: 78, trend: "up", trendValue: "12%" },
      { name: "Projected AOV Lift", value: 27.5, trend: "up", trendValue: "N/A" },
      { name: "Bundle Margin", value: 42, trend: "flat", trendValue: "0%" },
      { name: "Category C Attach Rate", value: 0.78, trend: "up", trendValue: "0.08" }
    ],
    scopedFor: 'both',
    sensitivity: 'public'
  },
  {
    id: "insight-6",
    title: 'Competitor Pricing Analysis',
    summary: 'Analysis of competitor price moves indicates potential market share threats',
    details: 'Main competitor has implemented dynamic pricing algorithm that is undercutting our prices by 5-12% during peak shopping hours. This has resulted in 8% market share loss in the last 45 days for categories X, Y and Z. Recommend immediate pricing strategy review.',
    confidence: 88,
    category: 'competitive',
    date: '2025-05-04',
    region: 'All',
    recommendations: [
      "Review and update pricing strategy for categories X, Y, and Z",
      "Consider implementing similar dynamic pricing approach",
      "Add value-add services to differentiate from price-focused competitors",
      "Commission deeper competitive intelligence report on main competitor"
    ],
    relatedMetrics: [
      { name: "Price Gap %", value: 8.5, trend: "up", trendValue: "3.2%" },
      { name: "Market Share", value: 32, trend: "down", trendValue: "8%" },
      { name: "Competitor Conversions", value: 5.2, trend: "up", trendValue: "1.4%" }
    ],
    scopedFor: 'internal',
    sensitivity: 'internal'
  }
];

export default insightData;