import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Legacy endpoint for MockifyCreator compatibility
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('gold_brand_performance')
      .select('brand_name, market_share, growth_rate, revenue_mtd as revenue')
      .order('performance_score', { ascending: false })
      .limit(10);
    
    if (error) throw error;

    res.status(200).json({
      success: true,
      brands: data || getLegacyMockData(),
      legacy: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Legacy Brands Error:', error);
    
    res.status(200).json({
      success: true,
      brands: getLegacyMockData(),
      legacy: true,
      timestamp: new Date().toISOString(),
      cache: 'fallback'
    });
  }
}

function getLegacyMockData() {
  return [
    {
      brand_name: 'Lucky Me',
      market_share: 42.5,
      growth_rate: 8.3,
      revenue: 1250000
    },
    {
      brand_name: 'San Miguel',
      market_share: 38.2,
      growth_rate: 5.7,
      revenue: 980000
    },
    {
      brand_name: 'Jack n Jill',
      market_share: 28.9,
      growth_rate: 12.1,
      revenue: 750000
    }
  ];
}