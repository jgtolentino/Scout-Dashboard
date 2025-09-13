-- Migration for Edge Functions Support Tables
-- This creates the necessary tables for user-activity and expense-ocr functions

-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- User Activity Tracking Table
CREATE TABLE IF NOT EXISTS analytics.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'button_click', 'form_submit', 'api_call')),
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON analytics.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON analytics.user_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_event_type ON analytics.user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON analytics.user_activity(session_id);

-- RLS Policies for user_activity
ALTER TABLE analytics.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activity
CREATE POLICY "Users can view own activity" ON analytics.user_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert activity (for edge function)
CREATE POLICY "Service role can insert activity" ON analytics.user_activity
  FOR INSERT WITH CHECK (true);

-- Create expense schema if not exists
CREATE SCHEMA IF NOT EXISTS expense;

-- Expense table with OCR data
CREATE TABLE IF NOT EXISTS expense.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT,
  amount DECIMAL(10,2) CHECK (amount >= 0),
  currency TEXT DEFAULT 'PHP',
  expense_date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  ocr_data JSONB,
  ocr_confidence DECIMAL(3,2) CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
  category TEXT,
  subcategory TEXT,
  auto_categorized BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'reimbursed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expense.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expense.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expense.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expense.expenses(category);

-- RLS Policies for expenses
ALTER TABLE expense.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view their own expenses
CREATE POLICY "Users can view own expenses" ON expense.expenses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own expenses
CREATE POLICY "Users can create own expenses" ON expense.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending expenses
CREATE POLICY "Users can update own pending expenses" ON expense.expenses
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_review');

-- Function to get activity summary
CREATE OR REPLACE FUNCTION get_activity_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_activities', COUNT(*),
    'page_views', COUNT(*) FILTER (WHERE event_type = 'page_view'),
    'button_clicks', COUNT(*) FILTER (WHERE event_type = 'button_click'),
    'form_submits', COUNT(*) FILTER (WHERE event_type = 'form_submit'),
    'api_calls', COUNT(*) FILTER (WHERE event_type = 'api_call'),
    'last_activity', MAX(timestamp),
    'unique_sessions', COUNT(DISTINCT session_id),
    'most_active_hour', EXTRACT(HOUR FROM timestamp) AS hour
  ) INTO result
  FROM analytics.user_activity
  WHERE user_id = p_user_id
  GROUP BY EXTRACT(HOUR FROM timestamp)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expense.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expense.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for receipts if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 
  'receipts', 
  false,  -- Private bucket
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts bucket
CREATE POLICY "Users can upload own receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA analytics TO authenticated;
GRANT USAGE ON SCHEMA expense TO authenticated;
GRANT SELECT ON analytics.user_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE ON expense.expenses TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_summary(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE analytics.user_activity IS 'Tracks all user activities for analytics and monitoring';
COMMENT ON TABLE expense.expenses IS 'Stores expense records with OCR data from receipt processing';
COMMENT ON FUNCTION get_activity_summary IS 'Returns activity statistics for a given user';