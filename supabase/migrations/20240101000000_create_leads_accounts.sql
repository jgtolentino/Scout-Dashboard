-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_accounts junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.lead_accounts (
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lead_id, account_id)
);

-- Create indexes for better performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_accounts_owner_id ON public.accounts(owner_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can view all leads" ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert leads" ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update leads" ON public.leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create RLS policies for accounts
CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own accounts" ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own accounts" ON public.accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create RLS policies for lead_accounts
CREATE POLICY "Users can view lead-account relationships for their accounts" ON public.lead_accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = lead_accounts.account_id
      AND accounts.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage lead-account relationships for their accounts" ON public.lead_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = lead_accounts.account_id
      AND accounts.owner_id = auth.uid()
    )
  );

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions to authenticated users
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.lead_accounts TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.accounts TO service_role;
GRANT ALL ON public.lead_accounts TO service_role;