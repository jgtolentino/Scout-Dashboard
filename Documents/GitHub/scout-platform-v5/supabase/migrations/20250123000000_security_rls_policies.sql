-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create roles enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to users if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer';

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all users"
    ON public.users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Campaigns table policies
CREATE POLICY "Viewers can read campaigns"
    ON public.campaigns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Analysts and above can create campaigns"
    ON public.campaigns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'analyst')
        )
    );

CREATE POLICY "Managers and above can update campaigns"
    ON public.campaigns FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete campaigns"
    ON public.campaigns FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Analytics table policies
CREATE POLICY "All authenticated users can view analytics"
    ON public.analytics FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert analytics"
    ON public.analytics FOR INSERT
    WITH CHECK (true); -- Analytics are inserted by backend services

CREATE POLICY "No one can update analytics"
    ON public.analytics FOR UPDATE
    USING (false);

CREATE POLICY "Admins can delete old analytics"
    ON public.analytics FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
        AND created_at < NOW() - INTERVAL '90 days'
    );

-- Reports table policies
CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Managers can view team reports"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own reports"
    ON public.reports FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own reports"
    ON public.reports FOR DELETE
    USING (created_by = auth.uid());

-- Audit logs table policies
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true); -- Audit logs are inserted by backend services

CREATE POLICY "No one can update audit logs"
    ON public.audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "No one can delete audit logs"
    ON public.audit_logs FOR DELETE
    USING (false);

-- Create audit log function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        record_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
            ELSE NULL
        END,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_campaigns_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create secure views
CREATE OR REPLACE VIEW public.user_activity AS
SELECT
    u.id,
    u.email,
    u.full_name,
    COUNT(DISTINCT c.id) as campaigns_count,
    COUNT(DISTINCT r.id) as reports_count,
    MAX(al.created_at) as last_activity
FROM public.users u
LEFT JOIN public.campaigns c ON c.created_by = u.id
LEFT JOIN public.reports r ON r.created_by = u.id
LEFT JOIN public.audit_logs al ON al.user_id = u.id
WHERE u.id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
)
GROUP BY u.id, u.email, u.full_name;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;