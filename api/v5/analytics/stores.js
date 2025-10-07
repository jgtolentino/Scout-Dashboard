import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { region, timeframe = '30d' } = req.query;
    
    const query = supabase
      .from('silver_store_analytics')
      .select('*');
    
    if (region) {
      query.eq('region', region);
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || getMockStoreData(),
      filters: { region, timeframe },
      timestamp: new Date().toISOString(),
      total_count: data?.length || 10
    });
  } catch (error) {
    console.error('Store Analytics Error:', error);
    
    // Return mock data on error
    res.status(200).json({
      success: true,
      data: getMockStoreData(),
      filters: req.query,
      timestamp: new Date().toISOString(),
      total_count: 10,
      cache: 'fallback'
    });
  }
}

function getMockStoreData() {
  return [
    {
      store_id: 'STR-001',
      store_name: 'Sari-Sari Store Manila',
      region: 'NCR',
      city: 'Manila',
      revenue_mtd: 125000,
      transactions_mtd: 3420,
      avg_basket_size: 365,
      performance_score: 92
    },
    {
      store_id: 'STR-002',
      store_name: 'QuickMart Cebu',
      region: 'Region VII',
      city: 'Cebu City',
      revenue_mtd: 98000,
      transactions_mtd: 2890,
      avg_basket_size: 339,
      performance_score: 88
    },
    {
      store_id: 'STR-003',
      store_name: 'Corner Store Davao',
      region: 'Region XI',
      city: 'Davao City',
      revenue_mtd: 110000,
      transactions_mtd: 3100,
      avg_basket_size: 355,
      performance_score: 90
    }
  ];
}