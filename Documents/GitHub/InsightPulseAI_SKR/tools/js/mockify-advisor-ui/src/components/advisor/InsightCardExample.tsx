import React from 'react';
import { InsightCard } from './InsightCard';

export function InsightCardExample() {
  // Sample data
  const sampleInsight = {
    id: "insight-12345",
    title: "Significant increase in product return rate",
    summary: "There has been a 27% increase in product returns for the 'Premium Tech' category over the last month, primarily affecting the latest smartphone models.",
    details: "The return rate for Premium Tech products has spiked from an average of 5% to 27% in the past 30 days. This is significantly above the expected threshold and primarily impacts the XS2000 and Pro Max smartphone models. Initial customer feedback suggests issues with battery life and overheating problems.",
    confidence: 85,
    date: "May 10, 2025",
    category: "Critical",
    impact: "This trend could result in approximately $450,000 in additional processing costs and potential inventory issues if not addressed promptly. Customer satisfaction scores in the mobile category have already decreased by 12 points.",
    recommendations: [
      "Initiate quality control investigation for affected smartphone models",
      "Prepare customer service teams with better troubleshooting guides for battery issues",
      "Consider temporary adjustment to return policy for affected products",
      "Schedule urgent meeting with the product supplier to address manufacturing quality"
    ],
    dataPoints: [
      { label: "Affected Category", value: "Premium Tech (Smartphones)" },
      { label: "Return Rate Change", value: "5% → 27% (↑ 22%)" },
      { label: "Primary Products", value: "XS2000, Pro Max Series" },
      { label: "Common Issues", value: "Battery life (64%), Overheating (27%), Other (9%)" },
      { label: "Data Source", value: "RetailOS Return Management System" }
    ]
  };

  const sampleInsight2 = {
    id: "insight-45678",
    title: "Emerging brand preference shift in Gen Z demographic",
    summary: "Data indicates a significant shift in brand preferences among Gen Z customers, with locally-sourced brands gaining market share from established national brands.",
    details: "Our analysis shows a 17% increase in purchases of locally-sourced brands by Gen Z customers (18-24) compared to the previous quarter. This trend is most prominent in the food and beverage category but is beginning to appear in apparel and personal care as well.",
    confidence: 72,
    date: "May 12, 2025",
    category: "Opportunity",
    impact: "This shift represents a potential opportunity to reallocate shelf space and marketing focus to capitalize on changing preferences. Early adaptation could result in capturing market share ahead of competitors.",
    recommendations: [
      "Increase procurement from trending local brands in key categories",
      "Develop targeted marketing highlighting locally-sourced products",
      "Create dedicated store sections for 'Local Favorites'",
      "Engage with social media influencers who align with this trend"
    ],
    dataPoints: [
      { label: "Customer Segment", value: "Generation Z (18-24 years)" },
      { label: "Primary Categories", value: "Food & Beverage, Apparel, Personal Care" },
      { label: "Sales Growth", value: "Local brands: +17%, National brands: -8%" },
      { label: "Social Sentiment", value: "76% positive mentions for local brands" },
      { label: "Data Source", value: "POS Data + Social Media Analysis" }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Insight Card Examples</h2>
      <p className="text-muted-foreground">Click on a card to view full details in a modal</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightCard {...sampleInsight} />
        <InsightCard {...sampleInsight2} />
      </div>
    </div>
  );
}