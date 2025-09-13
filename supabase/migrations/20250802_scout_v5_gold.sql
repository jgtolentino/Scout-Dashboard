-- ===========================================
-- Scout v5 Gold Service (base: public.scout_transactions)
-- Views + RPCs + RLS policies (SECURITY INVOKER)
-- ===========================================

SET search_path = public;

-- ---------- GOLD VIEWS ----------
CREATE OR REPLACE VIEW public.gold_recent_transactions AS
SELECT
  t.id                  AS txn_id,
  t."timestamp"         AS txn_ts,
  t.store_id            AS store_id,
  COALESCE(t.location_region, r.name) AS region,
  t.brand_name          AS brand,
  t.sku                 AS sku,
  t.units_per_transaction::numeric AS qty,
  t.peso_value::numeric AS amount,
  t.brand_id,
  t.region_id,
  t.sku_id
FROM public.scout_transactions t
LEFT JOIN public.master_geographic_hierarchy r
       ON r.id = t.region_id AND r.level_type = 'region';

CREATE OR REPLACE VIEW public.gold_kpi_overview AS
SELECT
  date_trunc('day', txn_ts) AS d,
  SUM(amount)               AS revenue,
  COUNT(DISTINCT txn_id)    AS transactions,
  COUNT(DISTINCT store_id)  AS stores
FROM public.gold_recent_transactions
GROUP BY 1;

CREATE OR REPLACE VIEW public.gold_brand_performance AS
SELECT
  brand_id,
  brand,
  date_trunc('day', txn_ts) AS d,
  SUM(amount)               AS revenue,
  SUM(qty)                  AS units,
  COUNT(DISTINCT txn_id)    AS transactions
FROM public.gold_recent_transactions
GROUP BY 1,2,3;

-- ---------- RLS ON BASE TABLES ----------
-- Enforce at base (do NOT ENABLE RLS on views)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='scout_transactions'
  ) THEN
    RAISE EXCEPTION 'Base table public.scout_transactions not found';
  END IF;
END$$;

ALTER TABLE public.scout_transactions ENABLE ROW LEVEL SECURITY;

-- Region-scope via JWT claim region_ids="uuid,uuid,..."
DROP POLICY IF EXISTS st_region_scope ON public.scout_transactions;
CREATE POLICY st_region_scope ON public.scout_transactions
FOR SELECT USING (
  (current_setting('request.jwt.claims', true)::jsonb ? 'region_ids')
  AND (region_id::text = ANY (
      string_to_array( (current_setting('request.jwt.claims', true)::jsonb ->> 'region_ids'), ',')
  ))
);

-- Brand-scope via JWT claim brand_ids="uuid,uuid,..."
DROP POLICY IF EXISTS st_brand_scope ON public.scout_transactions;
CREATE POLICY st_brand_scope ON public.scout_transactions
FOR SELECT USING (
  (current_setting('request.jwt.claims', true)::jsonb ? 'brand_ids')
  AND (brand_id::text = ANY (
      string_to_array( (current_setting('request.jwt.claims', true)::jsonb ->> 'brand_ids'), ',')
  ))
);

-- ---------- RPCs (SECURITY INVOKER) ----------
-- list recent transactions
CREATE OR REPLACE FUNCTION public.get_gold_recent_transactions_scout(
  limit integer DEFAULT 100,
  offset integer DEFAULT 0,
  sort text DEFAULT 'txn_ts:desc',
  filters_json jsonb DEFAULT '{}'
) RETURNS SETOF public.gold_recent_transactions
LANGUAGE plpgsql AS $$
DECLARE
  sql text := 'SELECT * FROM public.gold_recent_transactions WHERE true';
  sort_clause text := ' ORDER BY txn_ts DESC';
BEGIN
  IF (filters_json ? 'region') THEN
    sql := sql || ' AND region = ' || quote_literal(filters_json->>'region');
  END IF;
  IF (filters_json ? 'brand') THEN
    sql := sql || ' AND brand = ' || quote_literal(filters_json->>'brand');
  END IF;

  IF sort = 'amount:desc' THEN sort_clause := ' ORDER BY amount DESC';
  ELSIF sort = 'amount:asc' THEN sort_clause := ' ORDER BY amount ASC';
  ELSIF sort = 'txn_ts:desc' THEN sort_clause := ' ORDER BY txn_ts DESC';
  END IF;

  sql := sql || sort_clause || format(' LIMIT %s OFFSET %s', limit, offset);
  RETURN QUERY EXECUTE sql;
END $$;

-- pagination count
CREATE OR REPLACE FUNCTION public.get_gold_recent_transactions_count_scout(
  filters_json jsonb DEFAULT '{}'
) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE sql text; c bigint;
BEGIN
  sql := 'SELECT COUNT(*) FROM public.gold_recent_transactions WHERE true';
  IF (filters_json ? 'region') THEN
    sql := sql || ' AND region = ' || quote_literal(filters_json->>'region');
  END IF;
  IF (filters_json ? 'brand') THEN
    sql := sql || ' AND brand = ' || quote_literal(filters_json->>'brand');
  END IF;
  EXECUTE sql INTO c;
  RETURN c;
END $$;

-- brand performance
CREATE OR REPLACE FUNCTION public.get_gold_brand_performance_scout(
  filters_json jsonb DEFAULT '{}'
) RETURNS TABLE(
  brand_id uuid, brand text, d timestamp with time zone,
  revenue numeric, units numeric, transactions bigint
)
LANGUAGE plpgsql AS $$
DECLARE
  sql text := $Q$
    SELECT brand_id, brand, date_trunc('day', txn_ts) AS d,
           SUM(amount) AS revenue, SUM(qty) AS units, COUNT(DISTINCT txn_id) AS transactions
    FROM public.gold_recent_transactions
    WHERE true
  $Q$;
BEGIN
  IF (filters_json ? 'region') THEN
    sql := sql || ' AND region = ' || quote_literal(filters_json->>'region');
  END IF;
  sql := sql || ' GROUP BY 1,2,3 ORDER BY 3 DESC';
  RETURN QUERY EXECUTE sql;
END $$;

-- ---------- SARI IQ PARITY RPCs ----------
-- 1) Price bands (use unit price proxy from transactions)
CREATE OR REPLACE FUNCTION public.get_gold_price_bands_scout(
  filters_json jsonb DEFAULT '{}'
) RETURNS TABLE(
  price_band text,
  units numeric,
  revenue numeric
)
LANGUAGE plpgsql AS $$
DECLARE
  sql text := $Q$
    WITH base AS (
      SELECT
        CASE
          WHEN units_per_transaction IS NULL OR units_per_transaction = 0 THEN NULL
          ELSE (peso_value::numeric / NULLIF(units_per_transaction,0))
        END AS unit_price,
        units_per_transaction::numeric AS qty,
        peso_value::numeric AS amount,
        brand_name, location_region
      FROM public.scout_transactions
    )
    SELECT
      CASE
        WHEN unit_price IS NULL THEN 'unknown'
        WHEN unit_price <= 10 THEN '<=10'
        WHEN unit_price <= 20 THEN '10-20'
        WHEN unit_price <= 50 THEN '20-50'
        ELSE '50+'
      END AS price_band,
      SUM(qty)    AS units,
      SUM(amount) AS revenue
    FROM base
    WHERE unit_price IS NOT NULL
  $Q$;
BEGIN
  IF (filters_json ? 'region') THEN
    sql := sql || ' AND location_region = ' || quote_literal(filters_json->>'region');
  END IF;
  IF (filters_json ? 'brand') THEN
    sql := sql || ' AND brand_name = ' || quote_literal(filters_json->>'brand');
  END IF;
  sql := sql || ' GROUP BY 1 ORDER BY 1';
  RETURN QUERY EXECUTE sql;
END $$;

-- 2) Promo heatmap (campaign_influenced by region x day)
CREATE OR REPLACE FUNCTION public.get_gold_promo_heatmap_scout(
  filters_json jsonb DEFAULT '{}'
) RETURNS TABLE(
  d date,
  region text,
  influenced bigint,
  total bigint,
  pct numeric
)
LANGUAGE plpgsql AS $$
DECLARE
  sql text := $Q$
    SELECT
      date_trunc('day', "timestamp")::date AS d,
      COALESCE(location_region,'unknown')  AS region,
      SUM( CASE WHEN campaign_influenced THEN 1 ELSE 0 END ) AS influenced,
      COUNT(*) AS total,
      CASE WHEN COUNT(*)=0 THEN 0 ELSE (SUM(CASE WHEN campaign_influenced THEN 1 ELSE 0 END)::numeric / COUNT(*)) END AS pct
    FROM public.scout_transactions
    WHERE true
  $Q$;
BEGIN
  IF (filters_json ? 'region') THEN
    sql := sql || ' AND location_region = ' || quote_literal(filters_json->>'region');
  END IF;
  IF (filters_json ? 'brand') THEN
    sql := sql || ' AND brand_name = ' || quote_literal(filters_json->>'brand');
  END IF;
  sql := sql || ' GROUP BY 1,2 ORDER BY 1 DESC, 2';
  RETURN QUERY EXECUTE sql;
END $$;

-- 3) OOS table (stockout proxy via substitution flags)
CREATE OR REPLACE FUNCTION public.get_gold_oos_scout(
  filters_json jsonb DEFAULT '{}'
) RETURNS TABLE(
  region text,
  brand text,
  oos_events bigint,
  txns bigint,
  oos_rate numeric
)
LANGUAGE plpgsql AS $$
DECLARE
  sql text := $Q$
    SELECT
      COALESCE(location_region,'unknown') AS region,
      brand_name AS brand,
      SUM( CASE
              WHEN substitution_occurred = true
                   AND (substitution_reason = 'stockout' OR substitution_reason IS NULL)
              THEN 1 ELSE 0
          END ) AS oos_events,
      COUNT(*) AS txns,
      CASE WHEN COUNT(*)=0 THEN 0 ELSE
        (SUM(CASE WHEN substitution_occurred = true
                     AND (substitution_reason = 'stockout' OR substitution_reason IS NULL)
                  THEN 1 ELSE 0 END)::numeric / COUNT(*))
      END AS oos_rate
    FROM public.scout_transactions
    WHERE true
  $Q$;
BEGIN
  IF (filters_json ? 'region') THEN
    sql := sql || ' AND location_region = ' || quote_literal(filters_json->>'region');
  END IF;
  IF (filters_json ? 'brand') THEN
    sql := sql || ' AND brand_name = ' || quote_literal(filters_json->>'brand');
  END IF;
  sql := sql || ' GROUP BY 1,2 ORDER BY oos_rate DESC NULLS LAST';
  RETURN QUERY EXECUTE sql;
END $$;

-- ---------- TEST HOOK (manual) ----------
-- To simulate a JWT and validate RLS, run:
-- SELECT set_config('request.jwt.claims','{"region_ids":"<uuid1>,<uuid2>","brand_ids":"<uuidA>,<uuidB>"}',true);
-- SELECT * FROM public.get_gold_recent_transactions(limit:=5);