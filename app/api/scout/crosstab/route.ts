import { NextResponse } from 'next/server';
import { Client } from 'pg';

// Node runtime (needs native TCP to Postgres)
export const runtime = 'nodejs';

// Allowed dimensions -> SQL expressions
const DIM: Record<string, string> = {
  daypart: 'daypart',
  category: 'category',
  brand: 'brand',
  age_bracket: 'age_bracket',
  gender: 'gender',
  pack_size: 'pack_size',
  payment_method: 'payment_method',
  customer_type: 'customer_type',
  is_weekend: 'is_weekend::text',
  dow: 'dow::text',
  d: 'd::text',
  basket_band: 'basket_band',
  store_id: 'store_id',
  year: 'year::text',
  month: 'month::text'
} as const;

const METRIC: Record<string, string> = {
  sales: 'sum(line_value) as value',
  lines: 'sum(line_count) as value', 
  baskets: 'count(distinct transaction_id) as value',
  avg_basket_value: 'avg(basket_value) as value'
} as const;

// Build SQL safely with whitelisted dims
function buildSQL(row: string, col: string, metric: string) {
  if (!DIM[row] || !DIM[col]) throw new Error('Invalid rows/cols');
  if (!METRIC[metric]) throw new Error('Invalid metric');

  // Aggregate per transaction first to dedupe basket_value
  const rowExpr = DIM[row];
  const colExpr = DIM[col];

  return `
    select ${rowExpr} as row, ${colExpr} as col, ${METRIC[metric]}
    from scout.mv_facts
    where d between $1 and $2
    /* {{FILTERS}} */
    group by ${rowExpr}, ${colExpr}
    order by ${rowExpr}, ${colExpr}
  `;
}

// Convert simple filters (?category=Snacks&brand=Coke,Pepsi&is_weekend=true)
function buildFilters(search: URLSearchParams, params: any[]) {
  const clauses: string[] = [];
  const addIn = (field: string, key: string) => {
    if (!search.has(key)) return;
    const vals = search.getAll(key).flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean);
    if (vals.length === 0) return;
    const placeholders = vals.map((_, i) => `$${params.length + i + 1}`);
    params.push(...vals);
    clauses.push(`${field} = any(array[${placeholders.join(',')}])`);
  };
  addIn('category', 'category');
  addIn('brand', 'brand');
  addIn('age_bracket', 'age_bracket');
  addIn('gender', 'gender');
  addIn('pack_size', 'pack_size');
  addIn('payment_method', 'payment_method');
  addIn('customer_type', 'customer_type');

  if (search.has('is_weekend')) {
    params.push(search.get('is_weekend') === 'true');
    clauses.push(`is_weekend = $${params.length}`);
  }
  if (search.has('dow')) {
    const dows = search.getAll('dow').flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean);
    const placeholders = dows.map((_, i) => `$${params.length + i + 1}`);
    params.push(...dows.map(Number));
    clauses.push(`dow = any(array[${placeholders.join(',')}])`);
  }
  return clauses.length ? ' and ' + clauses.join(' and ') : '';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams;

  const rows = (search.get('rows') || '').toLowerCase();
  const cols = (search.get('cols') || '').toLowerCase();
  const metric = (search.get('metric') || 'sales').toLowerCase();

  const from = search.get('from') || '2024-01-01';
  const to   = search.get('to')   || new Date().toISOString().slice(0,10);

  if (!rows || !cols) {
    return NextResponse.json({ 
      error: 'rows and cols are required', 
      allowedRows: Object.keys(DIM), 
      allowedMetrics: Object.keys(METRIC) 
    }, { status: 400 });
  }

  const params: any[] = [from, to];
  const sql = buildSQL(rows, cols, metric).replace('/* {{FILTERS}} */', buildFilters(search, params));

  const conn = process.env.SUPABASE_DB_URL;
  if (!conn) {
    return NextResponse.json({ 
      error: 'Server misconfigured: missing SUPABASE_DB_URL' 
    }, { status: 500 });
  }

  const client = new Client({ connectionString: conn, statement_timeout: 15000 });
  try {
    await client.connect();
    // Ensure scout schema available
    await client.query(`set search_path to public, scout`);
    const { rows: data } = await client.query(sql, params);
    return NextResponse.json({ 
      rows, 
      cols, 
      metric, 
      from, 
      to, 
      data,
      total_records: data.length 
    });
  } catch (e: any) {
    console.error('Cross-tab query error:', e);
    return NextResponse.json({ 
      error: e.message,
      sql: sql.substring(0, 500) + '...' // First 500 chars for debugging
    }, { status: 500 });
  } finally {
    await client.end();
  }
}