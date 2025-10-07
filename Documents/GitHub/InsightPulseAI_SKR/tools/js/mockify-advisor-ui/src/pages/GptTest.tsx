import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrainCircuitIcon, InfoIcon } from "lucide-react";
import { InsightData } from '@/types/advisor';
import { AssistantPanel } from '@/components/advisor/AssistantPanel';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Sample insights for testing
const testInsights: InsightData[] = [
  {
    id: "insight-001",
    title: "Increasing churn among premium subscribers",
    summary: "Premium subscriber churn has increased by 12% over the last month, with most cancellations occurring within 3 days of renewal notices.",
    details: "Further analysis shows that the majority of churned customers were on 6-month subscriptions and had used the product less than twice in the 30 days prior to cancellation. Exit surveys indicate price sensitivity and lack of new features as the top reasons for cancellation.",
    confidence: 89,
    category: "customers",
    date: "2025-05-14",
    recommendations: [
      "Implement a win-back campaign targeting recently churned premium users",
      "Review pricing structure for 6-month subscription tiers",
      "Develop engagement campaigns for low-activity premium users"
    ]
  },
  {
    id: "insight-002",
    title: "Potential stockout risk for high-demand items",
    summary: "Inventory analysis shows 5 top-selling SKUs at risk of stockout in the next 14 days based on current sell-through rates.",
    confidence: 93,
    category: "inventory",
    date: "2025-05-15",
    recommendations: [
      "Expedite replenishment orders for identified SKUs",
      "Implement temporary purchase limits on at-risk products",
      "Update safety stock levels for high-velocity items"
    ]
  },
  {
    id: "insight-003",
    title: "Revenue opportunity in underserved customer segment",
    summary: "Data analysis reveals significant untapped revenue potential in the 25-34 year demographic, particularly in urban markets.",
    confidence: 78,
    category: "revenue",
    date: "2025-05-13",
    recommendations: [
      "Develop targeted marketing campaigns for the 25-34 urban demographic",
      "Adjust product mix in urban locations to better serve this segment",
      "Consider partnerships with brands popular within this demographic"
    ]
  }
];

export default function GptTest() {
  return (
    <Page>
      <PageHeader 
        title="GPT Action Plans Test" 
        description="Test the enhanced AssistantPanel with GPT action plans."
        icon={<BrainCircuitIcon className="h-6 w-6" />}
      />
      
      <div className="p-4 border rounded-lg mb-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Test Page Information</h3>
            <p className="text-sm text-muted-foreground">
              This page allows you to test the GPT action plan functionality. Click the "Get Action Plan" button on any insight card to see the assistant generate a customized action plan based on the insight data.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6">
        {testInsights.map((insight) => (
          <Card key={insight.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">{insight.title}</CardTitle>
                <Badge variant={
                  insight.category === 'revenue' ? 'default' : 
                  insight.category === 'inventory' ? 'destructive' : 
                  'secondary'
                }>
                  {insight.category}
                </Badge>
              </div>
              <CardDescription>Confidence: {insight.confidence}% • {insight.date}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="mb-4">{insight.summary}</p>
              
              {insight.details && (
                <div className="mb-4 text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 py-1">
                  {insight.details}
                </div>
              )}
              
              {insight.recommendations && insight.recommendations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {insight.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div className="flex justify-end">
                <AssistantPanel 
                  insightId={insight.id.toString()}
                  insightTitle={insight.title}
                  insight={insight}
                >
                  <Button className="flex items-center gap-1">
                    <BrainCircuitIcon className="h-4 w-4" />
                    Get Action Plan
                  </Button>
                </AssistantPanel>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}