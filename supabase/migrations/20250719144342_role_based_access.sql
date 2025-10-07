-- Create role-based access for TBWA Unified Platform
BEGIN;

-- Create user roles enum
CREATE TYPE IF NOT EXISTS user_role AS ENUM (
  'executive',
  'hr_manager',
  'finance_manager',
  'department_head',
  'project_manager',
  'creative_director',
  'employee'
);

-- Create role assignments table
CREATE TABLE IF NOT EXISTS public.scout_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  department TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- HR Manager Access Policy
CREATE POLICY "hr_managers_full_access" ON hr_admin.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('hr_manager', 'executive')
    )
  );

CREATE POLICY "hr_managers_view_analytics" ON analytics.employee_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('hr_manager', 'executive')
    )
  );

-- Finance Manager Access Policy
CREATE POLICY "finance_managers_full_access" ON expense.expense_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('finance_manager', 'executive')
    )
  );

CREATE POLICY "finance_managers_approve" ON approval.approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('finance_manager', 'executive')
    )
  );

-- Executive Full Access
CREATE POLICY "executives_read_all" ON scout_dash.campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'executive'
    )
  );

-- Enable RLS on all tables
ALTER TABLE hr_admin.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.employee_metrics ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

COMMIT;
