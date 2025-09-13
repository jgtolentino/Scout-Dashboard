-- Complete platform setup
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('executive', 'hr_manager', 'finance_manager', 'employee');

CREATE TABLE IF NOT EXISTS public.scout_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data
INSERT INTO public.user_roles (user_id, role) VALUES 
  (gen_random_uuid(), 'hr_manager'),
  (gen_random_uuid(), 'finance_manager'),
  (gen_random_uuid(), 'executive');
