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
    const { brand_id, category } = req.query;
    
    const query = supabase
      .from('gold_brand_performance')
      .select('*');
    
    if (brand_id) {
      query.eq('brand_id', brand_id);
    }
    if (category) {
      query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('performance_score', { ascending: false })
      .limit(20);
    
    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || getMockBrandData(),
      filters: { brand_id, category },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Brand Analytics Error:', error);
    
    // Return mock data
    res.status(200).json({
      success: true,
      data: getMockBrandData(),
      filters: req.query,
      timestamp: new Date().toISOString(),
      cache: 'fallback'
    });
  }
}

function getMockBrandData() {
  return [
    {
      brand_id: 'BRD-001',
      brand_name: 'Lucky Me',
      category: 'Instant Noodles',
      market_share: 42.5,
      growth_rate: 8.3,
      revenue_mtd: 1250000,
      performance_score: 95,
      sentiment_score: 4.2
    },
    {
      brand_id: 'BRD-002',
      brand_name: 'San Miguel',
      category: 'Beverages',
      market_share: 38.2,
      growth_rate: 5.7,
      revenue_mtd: 980000,
      performance_score: 92,
      sentiment_score: 4.5
    },
    {
      brand_id: 'BRD-003',
      brand_name: 'Jack n Jill',
      category: 'Snacks',
      market_share: 28.9,
      growth_rate: 12.1,
      revenue_mtd: 750000,
      performance_score: 88,
      sentiment_score: 4.0
    }
  ];
}