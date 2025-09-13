-- MCP Audit Logging Schema
-- Tracks all operations performed through MCP servers for security and compliance

-- Create audit schema if not exists
CREATE SCHEMA IF NOT EXISTS audit;

-- MCP audit logs table
CREATE TABLE IF NOT EXISTS audit.mcp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mcp_server_name TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DDL', 'FUNCTION')),
  schema_name TEXT,
  table_name TEXT,
  user_context TEXT NOT NULL,
  role TEXT NOT NULL,
  query TEXT,
  affected_rows INTEGER,
  error TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_mcp_audit_server_time (mcp_server_name, created_at DESC),
  INDEX idx_mcp_audit_operation (operation_type, created_at DESC),
  INDEX idx_mcp_audit_user_context (user_context, created_at DESC),
  INDEX idx_mcp_audit_schema_table (schema_name, table_name, created_at DESC)
);

-- Enable RLS
ALTER TABLE audit.mcp_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs
CREATE POLICY "Service role read access" ON audit.mcp_audit_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Security alerts table
CREATE TABLE IF NOT EXISTS audit.mcp_security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  details JSONB NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_security_alerts_severity (severity, created_at DESC),
  INDEX idx_security_alerts_resolved (resolved, created_at DESC)
);

-- Enable RLS
ALTER TABLE audit.mcp_security_alerts ENABLE ROW LEVEL SECURITY;

-- Only service role and executives can access
CREATE POLICY "Security alert access" ON audit.mcp_security_alerts
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'executive'
  );

-- Rate limit violations table
CREATE TABLE IF NOT EXISTS audit.mcp_rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mcp_server_name TEXT NOT NULL,
  user_context TEXT NOT NULL,
  operation_count INTEGER NOT NULL,
  limit_threshold INTEGER NOT NULL,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_rate_limit_server (mcp_server_name, created_at DESC),
  INDEX idx_rate_limit_context (user_context, created_at DESC)
);

-- Enable RLS
ALTER TABLE audit.mcp_rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Rate limit access" ON audit.mcp_rate_limit_violations
  FOR ALL
  TO service_role
  USING (true);

-- Audit summary view for dashboards
CREATE OR REPLACE VIEW audit.mcp_audit_summary AS
WITH hourly_stats AS (
  SELECT 
    mcp_server_name,
    DATE_TRUNC('hour', created_at) as hour,
    operation_type,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_context) as unique_users,
    SUM(COALESCE(affected_rows, 0)) as total_affected_rows
  FROM audit.mcp_audit_logs
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY mcp_server_name, DATE_TRUNC('hour', created_at), operation_type
)
SELECT 
  mcp_server_name,
  hour,
  JSONB_OBJECT_AGG(operation_type, operation_count) as operations,
  SUM(operation_count) as total_operations,
  MAX(unique_users) as unique_users,
  SUM(total_affected_rows) as total_affected_rows
FROM hourly_stats
GROUP BY mcp_server_name, hour
ORDER BY hour DESC, mcp_server_name;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION audit.get_mcp_audit_stats(
  p_mcp_server TEXT DEFAULT NULL,
  p_time_range INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS TABLE (
  mcp_server_name TEXT,
  total_operations BIGINT,
  unique_users BIGINT,
  operation_breakdown JSONB,
  suspicious_operations BIGINT,
  rate_limit_violations BIGINT,
  most_active_user TEXT,
  most_common_operation TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      al.mcp_server_name,
      COUNT(*) as total_ops,
      COUNT(DISTINCT al.user_context) as unique_users,
      JSONB_OBJECT_AGG(
        al.operation_type, 
        COUNT(*) 
        ORDER BY al.operation_type
      ) as op_breakdown,
      COUNT(*) FILTER (
        WHERE al.query ~* 'DROP|TRUNCATE|DELETE.*WHERE.*1.*=.*1|UPDATE.*WHERE.*1.*=.*1'
      ) as suspicious_ops,
      MODE() WITHIN GROUP (ORDER BY al.user_context) as most_active_user,
      MODE() WITHIN GROUP (ORDER BY al.operation_type) as most_common_op
    FROM audit.mcp_audit_logs al
    WHERE 
      al.created_at > NOW() - p_time_range
      AND (p_mcp_server IS NULL OR al.mcp_server_name = p_mcp_server)
    GROUP BY al.mcp_server_name
  ),
  violations AS (
    SELECT 
      mcp_server_name,
      COUNT(*) as violation_count
    FROM audit.mcp_rate_limit_violations
    WHERE 
      created_at > NOW() - p_time_range
      AND (p_mcp_server IS NULL OR mcp_server_name = p_mcp_server)
    GROUP BY mcp_server_name
  )
  SELECT 
    s.mcp_server_name,
    s.total_ops,
    s.unique_users,
    s.op_breakdown,
    s.suspicious_ops,
    COALESCE(v.violation_count, 0),
    s.most_active_user,
    s.most_common_op
  FROM stats s
  LEFT JOIN violations v ON s.mcp_server_name = v.mcp_server_name
  ORDER BY s.total_ops DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_audit_created_at ON audit.mcp_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_security_alerts_created_at ON audit.mcp_security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_rate_limit_created_at ON audit.mcp_rate_limit_violations(created_at DESC);

-- Grant execute permission on the stats function
GRANT EXECUTE ON FUNCTION audit.get_mcp_audit_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE audit.mcp_audit_logs IS 'Comprehensive audit log for all MCP server operations';
COMMENT ON TABLE audit.mcp_security_alerts IS 'Security alerts triggered by suspicious MCP operations';
COMMENT ON TABLE audit.mcp_rate_limit_violations IS 'Rate limit violations by MCP servers';
COMMENT ON FUNCTION audit.get_mcp_audit_stats IS 'Get aggregated statistics for MCP audit logs';