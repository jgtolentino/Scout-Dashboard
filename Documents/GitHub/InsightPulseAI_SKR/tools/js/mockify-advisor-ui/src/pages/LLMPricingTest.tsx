import React, { useState } from 'react';
import { Page } from '@/components/layout/Page';
import { PageHeader } from '@/components/layout/PageHeader';
import { LLMPricingPanel } from '@/components/advisor/LLMPricingPanel';
import { LLMPricingTester } from '@/components/advisor/LLMPricingTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSignIcon, BarChart4Icon, CoinsIcon, InfoIcon, FlaskConicalIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LLMPricingTest() {
  return (
    <Page>
      <PageHeader 
        title="LLM Pricing Calculator" 
        description="Token-based pricing calculator and optimizer for GPT and Anthropic models"
        icon={<DollarSignIcon className="h-6 w-6" />}
      />
      
      <div className="p-4 border rounded-lg mb-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Pulser Runtime Profiler</h3>
            <p className="text-sm text-muted-foreground">
              This calculator helps optimize costs when using LLMs like GPT-4.1, GPT-4o mini, and Anthropic's models. 
              It provides real-time cost estimates, model comparisons, and optimization suggestions based on 
              your token usage patterns.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <BarChart4Icon className="h-5 w-5 text-primary mr-2" />
          LLM Model Pricing Summary (per 1K tokens)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden border">
            <thead className="bg-muted">
              <tr>
                <th className="py-2 px-4 text-left">Model</th>
                <th className="py-2 px-4 text-right">Input</th>
                <th className="py-2 px-4 text-right">Output</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium">GPT-4.1</td>
                <td className="py-2 px-4 text-right">$2.00</td>
                <td className="py-2 px-4 text-right">$8.00</td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="py-2 px-4 font-medium">GPT-4.1 nano</td>
                <td className="py-2 px-4 text-right">$0.10</td>
                <td className="py-2 px-4 text-right">$0.40</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium">GPT-4o mini</td>
                <td className="py-2 px-4 text-right">$0.15</td>
                <td className="py-2 px-4 text-right">$0.60</td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="py-2 px-4 font-medium">GPT-3.5 Turbo</td>
                <td className="py-2 px-4 text-right">$0.50</td>
                <td className="py-2 px-4 text-right">$1.50</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium">Claude-3 Opus</td>
                <td className="py-2 px-4 text-right">$15.00</td>
                <td className="py-2 px-4 text-right">$75.00</td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="py-2 px-4 font-medium">Claude-3 Sonnet</td>
                <td className="py-2 px-4 text-right">$3.00</td>
                <td className="py-2 px-4 text-right">$15.00</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium">Claude-3 Haiku</td>
                <td className="py-2 px-4 text-right">$0.25</td>
                <td className="py-2 px-4 text-right">$1.25</td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="py-2 px-4 font-medium">o-series (reasoning)</td>
                <td className="py-2 px-4 text-right">$1.10</td>
                <td className="py-2 px-4 text-right">$60.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <Tabs defaultValue="calculator" className="mb-6">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="calculator">
            <DollarSignIcon className="h-4 w-4 mr-2" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="tester">
            <FlaskConicalIcon className="h-4 w-4 mr-2" />
            Test Suite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <LLMPricingPanel />
          </div>
        </TabsContent>

        <TabsContent value="tester" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <LLMPricingTester />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <CoinsIcon className="h-5 w-5 text-primary mr-2" />
          Cost-Saving Features in Pulser
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Prompt Caching</h3>
              <p className="text-sm text-muted-foreground">
                GPT-4.1 supports caching similar requests, providing up to 75% cost savings on repeat calls with similar inputs.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Batch API Processing</h3>
              <p className="text-sm text-muted-foreground">
                Submit multiple requests in a single batch operation to receive a 50% discount on processing costs.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Long Context Handling</h3>
              <p className="text-sm text-muted-foreground">
                GPT-4.1 supports up to 128K tokens with no additional surcharge, ideal for maintaining full session memory.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Implementation Tips</h3>
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">Shared Context:</span> When possible, reuse context across multiple calls instead of including the same information repeatedly.
              </p>
              <p className="text-sm">
                <span className="font-medium">Intelligent Tier Selection:</span> Use GPT-4.1 nano for simpler tasks and reserve GPT-4.1 for complex reasoning.
              </p>
              <p className="text-sm">
                <span className="font-medium">Token Optimization:</span> Compress prompts by removing unnecessary text and using more concise instructions.
              </p>
              <p className="text-sm">
                <span className="font-medium">Cache Aggressively:</span> Store and reuse responses for frequently asked questions or common processing tasks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Separator className="my-8" />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Pulser Runtime Profiler • Prices current as of May 2025</p>
      </div>
    </Page>
  );
}