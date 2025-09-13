-- Enable RLS on all Scout tables
ALTER TABLE scout.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout.brands ENABLE ROW LEVEL SECURITY;

-- Create roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scout_viewer') THEN
    CREATE ROLE scout_viewer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scout_analyst') THEN
    CREATE ROLE scout_analyst;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scout_admin') THEN
    CREATE ROLE scout_admin;
  END IF;
END$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA scout TO scout_viewer, scout_analyst, scout_admin;

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA scout TO scout_viewer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA scout TO scout_analyst;
GRANT ALL ON ALL TABLES IN SCHEMA scout TO scout_admin;

-- Campaigns table policies
CREATE POLICY "All authenticated users can view campaigns"
  ON scout.campaigns FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Analysts can manage campaigns"
  ON scout.campaigns FOR ALL
  USING (auth.jwt() ->> 'role' IN ('scout_analyst', 'scout_admin'));

-- Stores table policies
CREATE POLICY "All authenticated users can view stores"
  ON scout.stores FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Admins can manage stores"
  ON scout.stores FOR ALL
  USING (auth.jwt() ->> 'role' = 'scout_admin');

-- Transactions table policies
CREATE POLICY "Viewers can see aggregated transactions"
  ON scout.transactions FOR SELECT
  USING (
    auth.role() IN ('authenticated') AND
    -- Only allow access to transactions older than 24 hours
    transaction_date < CURRENT_DATE - INTERVAL '1 day'
  );

CREATE POLICY "Analysts can view all transactions"
  ON scout.transactions FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('scout_analyst', 'scout_admin'));

CREATE POLICY "Analysts can insert transactions"
  ON scout.transactions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('scout_analyst', 'scout_admin'));

-- Products table policies
CREATE POLICY "All authenticated users can view products"
  ON scout.products FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Admins can manage products"
  ON scout.products FOR ALL
  USING (auth.jwt() ->> 'role' = 'scout_admin');

-- Brands table policies
CREATE POLICY "All authenticated users can view brands"
  ON scout.brands FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Admins can manage brands"
  ON scout.brands FOR ALL
  USING (auth.jwt() ->> 'role' = 'scout_admin');

-- Create helper functions for role checks
CREATE OR REPLACE FUNCTION scout.user_has_role_scout(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = required_role OR 
         auth.jwt() ->> 'role' = 'scout_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table
CREATE TABLE IF NOT EXISTS scout.scout_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE scout.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON scout.audit_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'scout_admin');

-- Create audit trigger function
CREATE OR REPLACE FUNCTION scout.audit_trigger_scout()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO scout.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON scout.campaigns
  FOR EACH ROW EXECUTE FUNCTION scout.audit_trigger();

CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON scout.transactions
  FOR EACH ROW EXECUTE FUNCTION scout.audit_trigger();