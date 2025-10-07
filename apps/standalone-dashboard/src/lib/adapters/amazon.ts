export type Story = "purchase_overview"|"demographics"|"competition"|"geography";

/**
 * Maps stable Scout RPC payloads to Amazon-skinned component props.
 * NOTE: Emits dual keys so existing config paths continue to work:
 *  - kpi & kpis   ; trend & trends
 */
export function adapt(story: Story, rpcOut: any) {
  switch (story) {
    case "purchase_overview": {
      const kpis = [
        { label: "Revenue",    value: rpcOut?.kpi?.revenue },
        { label: "Avg Ticket", value: rpcOut?.kpi?.avgTicket },
        { label: "Orders",     value: rpcOut?.kpi?.orders },
        { label: "MoM",        value: Math.round(100 * (rpcOut?.kpi?.mom ?? 0)) }
      ];
      const trend = rpcOut?.trends || [];
      return { kpis, trend, kpi: rpcOut?.kpi, trends: trend };
    }
    case "demographics": {
      return {
        personas: rpcOut?.personas || [],
        behavior: rpcOut?.behavior || []
      };
    }
    case "competition": {
      return {
        brandShare:   rpcOut?.brandShare || [],
        substitution: rpcOut?.substitution || []
      };
    }
    case "geography": {
      return {
        regions: rpcOut?.regions || [],
        heat:    rpcOut?.heat    || []
      };
    }
    default:
      return rpcOut ?? {};
  }
}