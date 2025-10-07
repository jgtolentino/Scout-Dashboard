-- Seed data for development and testing

-- Create test users (if using Supabase Auth)
-- Note: In production, users would sign up through your app

-- Insert sample leads
INSERT INTO public.leads (name, email, status) VALUES
  ('John Doe', 'john.doe@example.com', 'new'),
  ('Jane Smith', 'jane.smith@example.com', 'contacted'),
  ('Bob Johnson', 'bob.johnson@example.com', 'qualified'),
  ('Alice Williams', 'alice.williams@example.com', 'converted'),
  ('Charlie Brown', 'charlie.brown@example.com', 'new'),
  ('Diana Prince', 'diana.prince@example.com', 'contacted'),
  ('Eve Adams', 'eve.adams@example.com', 'qualified'),
  ('Frank Miller', 'frank.miller@example.com', 'lost'),
  ('Grace Hopper', 'grace.hopper@example.com', 'new'),
  ('Henry Ford', 'henry.ford@example.com', 'contacted');

-- Insert sample accounts
-- Note: In a real scenario, owner_id would reference actual auth.users
-- For testing, we'll use a placeholder UUID
DO $$
DECLARE
  test_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  -- Insert test accounts
  INSERT INTO public.accounts (name, owner_id) VALUES
    ('Acme Corporation', test_user_id),
    ('TechStart Inc', test_user_id),
    ('Global Innovations', test_user_id),
    ('Digital Solutions Ltd', test_user_id),
    ('Future Enterprises', test_user_id);
END $$;

-- Create relationships between leads and accounts
INSERT INTO public.lead_accounts (lead_id, account_id)
SELECT 
  l.id,
  a.id
FROM 
  public.leads l
  CROSS JOIN public.accounts a
WHERE 
  -- Create some sample relationships
  (l.email = 'john.doe@example.com' AND a.name = 'Acme Corporation')
  OR (l.email = 'jane.smith@example.com' AND a.name = 'TechStart Inc')
  OR (l.email = 'bob.johnson@example.com' AND a.name = 'Global Innovations')
  OR (l.email = 'alice.williams@example.com' AND a.name = 'Digital Solutions Ltd')
  OR (l.email = 'charlie.brown@example.com' AND a.name = 'Future Enterprises')
  OR (l.email = 'diana.prince@example.com' AND a.name = 'Acme Corporation')
  OR (l.email = 'eve.adams@example.com' AND a.name = 'TechStart Inc');

-- Add some leads to multiple accounts
INSERT INTO public.lead_accounts (lead_id, account_id)
SELECT 
  l.id,
  a.id
FROM 
  public.leads l
  CROSS JOIN public.accounts a
WHERE 
  (l.email = 'grace.hopper@example.com' AND a.name IN ('Global Innovations', 'Digital Solutions Ltd'))
  OR (l.email = 'henry.ford@example.com' AND a.name IN ('Future Enterprises', 'Acme Corporation'));