// Server action to fetch ETL KPIs for dashboard
export async function fetchKpis() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/analytics.v_etl_last_24h?order=h.desc";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const r = await fetch(url, {
    headers: { 
      apikey: key, 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    // Add cache control for fresh data
    next: { revalidate: 60 } // Revalidate every minute
  });
  
  if (!r.ok) {
    throw new Error(`Failed to fetch KPIs: ${r.status} ${await r.text()}`);
  }
  
  return r.json() as Promise<{
    h: string; 
    linked: number; 
    extracted: number; 
    runs: number; 
    all_ok: boolean;
  }[]>;
}

// Fetch recent ETL run details
export async function fetchEtlRuns(limit: number = 10) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + `/rest/v1/analytics_snap.etl_runs?order=run_id.desc&limit=${limit}`;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const r = await fetch(url, {
    headers: { 
      apikey: key, 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    next: { revalidate: 30 }
  });
  
  if (!r.ok) {
    throw new Error(`Failed to fetch ETL runs: ${r.status} ${await r.text()}`);
  }
  
  return r.json() as Promise<{
    run_id: number;
    ran_at: string;
    window_secs: number;
    linked: number;
    extracted: number;
    ok: boolean;
    err?: string;
  }[]>;
}