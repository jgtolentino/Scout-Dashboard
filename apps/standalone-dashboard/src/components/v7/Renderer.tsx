import React, { useState, useEffect } from 'react';
import * as R from "@/src/components/widgets";
import { WIDGETS } from "@/src/components/widgets";
import { lintConfig, lintRuntime } from "@/src/lib/design/design-lint";
import DesignCoach from "@/src/components/dev/DesignCoach";
import { adapt } from "@/src/lib/adapters/amazon";

function Grid({ children }: any){ return <div className="grid grid-cols-12 gap-4">{children}</div>; }
function Cell({ w, h, children }: any){ return <div className={`col-span-${Math.min(12,Math.max(1,w))}`} style={{minHeight: h*90}}>{children}</div>; }

// Mock RPC call for demo purposes
async function callRPC(rpcName: string, params: any) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock data based on RPC name
  switch (rpcName) {
    case 'scout_ai_executive':
      return {
        kpi: { revenue: 125000, avgTicket: 85.50, orders: 1463, mom: 0.12 },
        trends: [
          { date: '2024-01', value: 95000 },
          { date: '2024-02', value: 110000 },
          { date: '2024-03', value: 125000 }
        ]
      };
    default:
      return { message: `Mock data for ${rpcName}` };
  }
}

// Mock FilterBus for demo purposes  
const FilterBus = {
  get: (key: string) => {
    switch (key) {
      case 'region': return 'all';
      case 'dateRange': return '30d';
      default: return null;
    }
  }
};

export default function V7Renderer({ pageId }: { pageId: string }) {
  const [cfg, setCfg] = useState<any>(null);
  const [data, setData] = useState<any>({});
  const [issues, setIssues] = useState<any[]>([]);

  // Load config
  useEffect(() => {
    fetch('/config/scout-v7.json')
      .then(res => res.json())
      .then(config => {
        setCfg(config);
        setIssues(lintConfig(config));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!cfg) return;
    const page = cfg.pages[pageId];
    if (!page) return;
    // fetch RPC blocks in parallel, then optionally adapt for story
    (async () => {
      const blocks = page.layout.filter((b: any) => b.data?.rpc);
      const results = await Promise.all(blocks.map(async (b: any, i: number) => {
        const params = { region: FilterBus.get("region"), dateRange: FilterBus.get("dateRange") };
        const out = await callRPC(b.data!.rpc!, params);
        return [i, out] as const;
      }));
      const map: any = {};
      results.forEach(([i, out]) => { map[i] = out; });

      // If the page declares a "story", apply Amazon adapter.
      // (Non-destructive; keeps original keys used by existing paths.)
      const story: any = (page as any).story || null;
      if (story) {
        const uniq = new Set<number>(Object.keys(map).map(n => Number(n)));
        uniq.forEach((i) => {
          try {
            map[i] = adapt(story, map[i]);
          } catch { /* no-op */ }
        });
      }

      setData(map);
      // runtime lint after data load
      setIssues(prev => [...prev.filter(x => x.level==="error"), ...lintRuntime(page, map)]);
    })();
  }, [cfg, pageId, FilterBus.get("region"), FilterBus.get("dateRange")]);

  if (!cfg) return <div className="p-8">Loading configuration...</div>;
  
  const page = cfg.pages[pageId];
  if (!page) return <div className="p-8">Page '{pageId}' not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{page.title}</h1>
      <Grid>
        {page.layout.map((block: any, i: number) => {
          const Widget = (WIDGETS as any)[block.widget];
          if (!Widget) {
            return (
              <Cell key={i} w={block.w} h={block.h}>
                <div className="p-4 border border-red-200 rounded bg-red-50">
                  Unknown widget: {block.widget}
                </div>
              </Cell>
            );
          }
          
          let blockData = null;
          if (block.data?.rpc && data[i]) {
            const path = block.data.path;
            blockData = path ? data[i][path] : data[i];
          }
          
          return (
            <Cell key={i} w={block.w} h={block.h}>
              <Widget props={block.props} data={blockData} />
            </Cell>
          );
        })}
      </Grid>
      
      <DesignCoach issues={issues} />
    </div>
  );
}