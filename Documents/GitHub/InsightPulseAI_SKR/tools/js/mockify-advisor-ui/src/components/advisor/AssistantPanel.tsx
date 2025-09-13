import React, { useState, useRef, useId } from 'react';
import { ariaAttributes } from '@/utils/keyboard-a11y';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuitIcon, CheckCircleIcon, ClipboardIcon, FileIcon, MailIcon, MessageSquareIcon, CalendarIcon, UserIcon, TargetIcon, ListChecksIcon, BoxesIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from "@/components/ui/input";
import { ActionPlan, generatePlanFromInsight } from '@/utils/gpt-actions';
import { InsightData } from '@/types/advisor';
import { useReactToPrint } from 'react-to-print';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AssistantPanelProps {
  insightId: string;
  insightTitle: string;
  insight?: InsightData;
  children: React.ReactNode;
}

export function AssistantPanel({
  insightId,
  insightTitle,
  insight,
  children,
}: AssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Function to generate a plan using the gpt-actions utility
  const generatePlan = async () => {
    setLoading(true);
    
    try {
      // If we have a full insight object, use it. Otherwise, create a minimal one from ID and title
      const insightData: InsightData = insight || {
        id: insightId,
        title: insightTitle,
        summary: insightTitle,
        confidence: 75,
        category: 'general'
      };
      
      // Call the GPT action utility to generate a plan
      const plan = await generatePlanFromInsight(insightData);
      setActionPlan(plan);
    } catch (error) {
      console.error('Error generating action plan:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Copy to clipboard function - formats the plan as text
  const copyToClipboard = () => {
    if (actionPlan) {
      const planText = `# Action Plan: ${insightTitle}

## Summary
${actionPlan.summary}

## Recommended Actions
${actionPlan.actions.map((action, i) => (
`${i+1}. **${action.title}** (${action.priority} priority, ${action.timeline})
   ${action.description}
`)).join('\n')}

## Resources Required
${actionPlan.resources.map(res => `- ${res.type}: ${res.description}`).join('\n')}

## Expected Timeline
${actionPlan.timeline.map(phase => (
`- ${phase.phase} (${phase.duration}):
  ${phase.tasks.map(task => `  - ${task}`).join('\n')}
`)).join('\n')}

## Success Metrics
${actionPlan.kpis.map(kpi => `- ${kpi.metric}: ${kpi.target} (${kpi.timeframe})`).join('\n')}`;      
      
      navigator.clipboard.writeText(planText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Handle PDF printing
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Action Plan - ${insightTitle}`,
    onAfterPrint: () => console.log('Print complete')
  });

  // Generate unique IDs for accessibility
  const dialogId = useId();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px]"
        {...ariaAttributes.dialog(dialogId)}
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center gap-2"
            {...ariaAttributes.dialogTitle(dialogId)}
          >
            <BrainCircuitIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            AI Assistant
          </DialogTitle>
          <DialogDescription
            {...ariaAttributes.dialogDesc(dialogId)}
          >
            Generate actionable plans based on this insight.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="generate" className="mt-4">
          <TabsList 
            className="grid w-full grid-cols-3"
            {...ariaAttributes.tabList}
          >
            <TabsTrigger 
              value="generate"
              {...ariaAttributes.tab('generate', true)}
            >
              Generate Plan
            </TabsTrigger>
            <TabsTrigger 
              value="share"
              {...ariaAttributes.tab('share', false)}
            >
              Share
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              {...ariaAttributes.tab('history', false)}
            >
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent 
            value="generate" 
            className="space-y-4 py-4"
            {...ariaAttributes.tabPanel('generate', true)}
          >
            {!actionPlan ? (
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg border-dashed">
                <BrainCircuitIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Generate an AI-powered action plan based on this insight to help your team take immediate action.
                </p>
                <Button 
                  onClick={generatePlan} 
                  disabled={loading}
                  aria-busy={loading}
                  className="hover-button focus-ring"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" aria-hidden="true" />
                      Generating...
                    </>
                  ) : "Generate Action Plan"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Printable content area */}
                <div ref={printRef} className="p-6 rounded-lg bg-white print:shadow-none print-content">
                  <div className="print:text-black">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BrainCircuitIcon className="h-5 w-5 text-primary print:text-black" aria-hidden="true" />
                      Action Plan: {insightTitle}
                    </h2>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Summary</h3>
                      <p className="text-sm text-muted-foreground print:text-black">{actionPlan.summary}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <ListChecksIcon className="h-4 w-4 text-primary print:text-black" aria-hidden="true" />
                        Recommended Actions
                      </h3>
                      <div className="space-y-3">
                        {actionPlan.actions.map((action, index) => (
                          <Card key={index} className="p-3 border-l-4" style={{ borderLeftColor: action.priority === 'high' ? 'var(--red-500)' : action.priority === 'medium' ? 'var(--amber-500)' : 'var(--blue-500)' }}>
                            <div className="flex justify-between mb-1">
                              <h4 className="font-medium">{action.title}</h4>
                              <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                                {action.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground print:text-black mb-1">{action.description}</p>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                              <span>Timeline: {action.timeline}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <BoxesIcon className="h-4 w-4 text-primary print:text-black" aria-hidden="true" />
                          Resources Required
                        </h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground print:text-black">
                          {actionPlan.resources.map((resource, index) => (
                            <li key={index}>
                              <span className="font-medium">{resource.type}:</span> {resource.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <TargetIcon className="h-4 w-4 text-primary print:text-black" aria-hidden="true" />
                          Success Metrics
                        </h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground print:text-black">
                          {actionPlan.kpis.map((kpi, index) => (
                            <li key={index}>
                              <span className="font-medium">{kpi.metric}:</span> {kpi.target} ({kpi.timeframe})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary print:text-black" aria-hidden="true" />
                        Implementation Timeline
                      </h3>
                      <div className="space-y-4">
                        {actionPlan.timeline.map((phase, phaseIndex) => (
                          <div key={phaseIndex} className="border-l-2 border-primary/30 pl-4 py-1">
                            <h4 className="font-medium">{phase.phase} <span className="text-sm font-normal text-muted-foreground print:text-black">({phase.duration})</span></h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground print:text-black pl-2 mt-1">
                              {phase.tasks.map((task, taskIndex) => (
                                <li key={taskIndex}>{task}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground print:text-black mt-8 pt-4 border-t">
                      <p>Generated with AI Assistant • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 hover-button focus-ring"
                    aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
                    title={copied ? "Copied to clipboard" : "Copy to clipboard"}
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 hover-button focus-ring"
                    onClick={handlePrint}
                    aria-label="Save as PDF"
                    title="Save as PDF"
                  >
                    <FileIcon className="h-4 w-4" aria-hidden="true" />
                    <span>Save as PDF</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent 
            value="share" 
            className="space-y-4 py-4"
            {...ariaAttributes.tabPanel('share', false)}
          >
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="justify-start">
                <MailIcon className="h-4 w-4 mr-2" />
                Share via Email
              </Button>
              <Button variant="outline" className="justify-start">
                <MessageSquareIcon className="h-4 w-4 mr-2" />
                Share to Teams Channel
              </Button>
              <Separator />
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">Copy shareable link:</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`https://advisor.insightpulse.ai/insights/${insightId}`}
                    className="text-xs"
                  />
                  <Button variant="secondary" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`https://advisor.insightpulse.ai/insights/${insightId}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent 
            value="history" 
            className="py-4"
            {...ariaAttributes.tabPanel('history', false)}
          >
            <div className="text-center p-6 text-muted-foreground">
              <p>No previously generated plans found.</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}