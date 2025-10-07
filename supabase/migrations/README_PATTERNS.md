# Supabase Migration Best Practices

## 1️⃣ Robust Enum Creation

```sql
DO $$
BEGIN
  -- Check if enum already exists
  IF NOT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'      -- change if using another schema
        AND t.typname  = 'payment_method_enum') THEN

    EXECUTE $ct$
      CREATE TYPE public.payment_method_enum
        AS ENUM ('cash','gcash','maya','credit_card','debit_card','bank_transfer','other');
    $ct$;

    RAISE NOTICE '✅ payment_method_enum created';
  ELSE
    RAISE NOTICE 'ℹ️ payment_method_enum already exists – skipped';
  END IF;
END$$;
```

## 2️⃣ Idempotent RLS Policy Creation

```sql
DO $$
DECLARE
  _exists bool;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'gold'
      AND tablename  = 'sales_summary'
      AND policyname = 'gold_ro')
  INTO _exists;

  IF _exists THEN
    RAISE NOTICE 'ℹ️ Policy gold_ro already exists – skipped';
  ELSE
    EXECUTE $pol$
      CREATE POLICY gold_ro
      ON gold.sales_summary
      FOR SELECT
      TO authenticated, service_role
      USING (true);
    $pol$;

    RAISE NOTICE '✅ Policy gold_ro created';
  END IF;
END$$;
```

## 3️⃣ Safer GiST Index on Geometry

```sql
DO $$
DECLARE
  _coltype text;
BEGIN
  /* Make sure the column exists */
  SELECT atttypid::regtype::text
  INTO  _coltype
  FROM  pg_attribute
  WHERE attrelid = 'public.gadm_boundaries'::regclass
    AND attname  = 'geometry'
    AND NOT attisdropped;

  IF _coltype IS NULL THEN
    RAISE WARNING '⚠️ Column public.gadm_boundaries.geometry not found – GiST index skipped';
    RETURN;
  END IF;

  /* Optional: sanity-check it really is geometry-like */
  IF _coltype NOT IN ('geometry','USER-DEFINED') THEN
    RAISE WARNING '⚠️ Column type % is not geometry – GiST index skipped', _coltype;
    RETURN;
  END IF;

  /* Now build the index if it doesn't exist */
  PERFORM 1 FROM pg_indexes
   WHERE schemaname = 'public'
     AND tablename  = 'gadm_boundaries'
     AND indexname  = 'idx_gadm_geom_gist';

  IF NOT FOUND THEN
    EXECUTE
      'CREATE INDEX idx_gadm_geom_gist
         ON public.gadm_boundaries
       USING GIST (geometry);';

    RAISE NOTICE '✅ GiST index created on public.gadm_boundaries.geometry';
  ELSE
    RAISE NOTICE 'ℹ️ GiST index already exists – skipped';
  END IF;
END$$;
```

## 4️⃣ Migration Best Practices

### Order of Operations
1. **Extensions** (PostGIS, pgcrypto, etc.)
2. **Types/Enums** 
3. **Tables**
4. **Indexes**
5. **RLS Policies**
6. **Cron Jobs**
7. **Data Inserts/Backfills**

### Testing Workflow
```bash
# Test locally
supabase db reset      # Runs full migration list

# Deploy when green
supabase db push       # Deploys to production
```

### Tips
- Keep each `DO $$ ... $$;` block short to avoid timeouts
- Use `RAISE NOTICE` for migration feedback
- Always check existence before creating objects
- Monitor Database → Logs for any issues

## Common Patterns

### Check if Schema Exists
```sql
CREATE SCHEMA IF NOT EXISTS bronze;
```

### Check if Table Exists
```sql
IF EXISTS (SELECT 1 FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name = 'my_table') THEN
    -- Do something with the table
END IF;
```

### Check if Column Exists
```sql
IF EXISTS (SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'my_table' 
           AND column_name = 'my_column') THEN
    -- Do something with the column
END IF;
```

### Safe Foreign Key Addition
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'my_fk_constraint') THEN
        ALTER TABLE my_table 
        ADD CONSTRAINT my_fk_constraint 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END$$;
```

---

✅ **Result**: Zero "duplicate_object" errors on re-runs, safe for all environments!