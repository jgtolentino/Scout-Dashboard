-- TBWA HRIS Backend Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE leave_type AS ENUM ('vacation', 'sick', 'personal', 'bereavement', 'maternity', 'paternity', 'other');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'reimbursed');
CREATE TYPE expense_category AS ENUM ('meals', 'travel', 'accommodation', 'supplies', 'other');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE workflow_status AS ENUM ('started', 'in_progress', 'completed', 'failed', 'cancelled');

-- Chat conversations table
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    referenced_documents TEXT[] DEFAULT '{}',
    workflow_action JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat conversations
CREATE INDEX idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_created ON chat_conversations(created_at DESC);

-- Documents table with vector embeddings
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT,
    embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for documents
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10
) RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    similarity FLOAT
) LANGUAGE SQL STABLE AS $$
    SELECT
        d.id,
        d.title,
        d.content,
        d.type,
        d.url,
        d.metadata,
        d.created_at,
        d.updated_at,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM documents d
    WHERE 1 - (d.embedding <=> query_embedding) > similarity_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    intent_patterns TEXT[] DEFAULT '{}',
    function_schema JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    user_id TEXT NOT NULL,
    session_id TEXT,
    conversation_id UUID REFERENCES chat_conversations(id),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status workflow_status DEFAULT 'started',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create indexes for workflow executions
CREATE INDEX idx_workflow_executions_user ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_session ON workflow_executions(session_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created ON workflow_executions(created_at DESC);

-- Expenses table (enhanced from existing schema)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    category expense_category NOT NULL,
    expense_date DATE NOT NULL,
    merchant TEXT,
    receipt_url TEXT,
    notes TEXT,
    status expense_status DEFAULT 'pending',
    approver_id TEXT,
    approval_date TIMESTAMPTZ,
    reimbursement_date TIMESTAMPTZ,
    department TEXT,
    project_code TEXT,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for expenses
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_created ON expenses(created_at DESC);
CREATE INDEX idx_expenses_approver ON expenses(approver_id);

-- Receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    ocr_text TEXT,
    ocr_confidence FLOAT,
    extracted_amount DECIMAL(10,2),
    extracted_merchant TEXT,
    extracted_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for receipts
CREATE INDEX idx_receipts_expense ON receipts(expense_id);
CREATE INDEX idx_receipts_user ON receipts(user_id);

-- Leave requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    half_day BOOLEAN DEFAULT FALSE,
    days_requested DECIMAL(3,1) NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approver_id TEXT,
    approval_date TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for leave requests
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_submitted ON leave_requests(submitted_at DESC);

-- Leave balances table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    vacation_days_total INTEGER DEFAULT 0,
    vacation_days_used INTEGER DEFAULT 0,
    vacation_days_remaining INTEGER DEFAULT 0,
    sick_days_total INTEGER DEFAULT 0,
    sick_days_used INTEGER DEFAULT 0,
    sick_days_remaining INTEGER DEFAULT 0,
    personal_days_total INTEGER DEFAULT 0,
    personal_days_used INTEGER DEFAULT 0,
    personal_days_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, year)
);

-- Time corrections table
CREATE TABLE time_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    correction_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_worked DECIMAL(4,2),
    reason TEXT NOT NULL,
    project_code TEXT,
    status leave_status DEFAULT 'pending',
    approver_id TEXT,
    approval_date TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for time corrections
CREATE INDEX idx_time_corrections_user ON time_corrections(user_id);
CREATE INDEX idx_time_corrections_date ON time_corrections(correction_date DESC);
CREATE INDEX idx_time_corrections_status ON time_corrections(status);

-- IT tickets table
CREATE TABLE it_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    priority ticket_priority DEFAULT 'medium',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    status ticket_status DEFAULT 'open',
    assigned_to TEXT,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    
    -- Add constraint to ensure ticket numbers are properly formatted
    CONSTRAINT ticket_number_format CHECK (ticket_number ~ '^IT[0-9]{8}[0-9]{3}$')
);

-- Create indexes for IT tickets
CREATE INDEX idx_it_tickets_user ON it_tickets(user_id);
CREATE INDEX idx_it_tickets_status ON it_tickets(status);
CREATE INDEX idx_it_tickets_priority ON it_tickets(priority);
CREATE INDEX idx_it_tickets_created ON it_tickets(created_at DESC);
CREATE INDEX idx_it_tickets_number ON it_tickets(ticket_number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_it_tickets_updated_at BEFORE UPDATE ON it_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workflows
INSERT INTO workflows (name, description, intent_patterns, function_schema) VALUES
('expense_submission', 'Submit expense reports', ARRAY['expense', 'receipt', 'reimbursement'], '{"type": "object", "properties": {"description": {"type": "string"}, "amount": {"type": "number"}}}'),
('time_correction', 'Correct time entries', ARRAY['time', 'timesheet', 'hours'], '{"type": "object", "properties": {"date": {"type": "string"}, "reason": {"type": "string"}}}'),
('leave_request', 'Request time off', ARRAY['vacation', 'leave', 'time off'], '{"type": "object", "properties": {"startDate": {"type": "string"}, "endDate": {"type": "string"}}}'),
('it_support', 'IT support tickets', ARRAY['it', 'support', 'technical'], '{"type": "object", "properties": {"category": {"type": "string"}, "description": {"type": "string"}}}');

-- Insert sample policy documents
INSERT INTO documents (title, content, type, url) VALUES
('Expense Policy', 'TBWA expense policy covers business-related expenses including meals, travel, and supplies. All expenses over $25 require receipts. Meals are limited to $50 per person per meal. International travel requires pre-approval.', 'policy', '/policies/expenses'),
('Time Tracking Policy', 'All employees must accurately track their time using the company timesheet system. Time corrections must be submitted within 48 hours with proper justification.', 'policy', '/policies/time-tracking'),
('Leave Policy', 'TBWA provides 20 vacation days, 10 sick days, and 3 personal days annually. Leave requests should be submitted at least 2 weeks in advance when possible.', 'policy', '/policies/leave'),
('IT Support Guidelines', 'For technical issues, contact IT support through the helpdesk system. Common issues include password resets, software installation, and hardware problems.', 'policy', '/policies/it-support');

-- Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own chat conversations" ON chat_conversations
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own chat conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Similar policies for other tables...
CREATE POLICY "Users can view own receipts" ON receipts
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own receipts" ON receipts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Documents are readable by all authenticated users
CREATE POLICY "All users can view documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_embedding_cosine ON documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Comments for documentation
COMMENT ON TABLE chat_conversations IS 'Stores AI chat conversations with workflow actions';
COMMENT ON TABLE documents IS 'Company policy documents with vector embeddings for semantic search';
COMMENT ON TABLE workflows IS 'Available workflow definitions and patterns';
COMMENT ON TABLE workflow_executions IS 'Log of executed workflows and their results';
COMMENT ON TABLE expenses IS 'Employee expense reports and reimbursements';
COMMENT ON TABLE receipts IS 'Receipt attachments for expenses with OCR data';
COMMENT ON TABLE leave_requests IS 'Employee leave and vacation requests';
COMMENT ON TABLE time_corrections IS 'Time entry corrections and adjustments';
COMMENT ON TABLE it_tickets IS 'IT support tickets and technical issues';

-- Final message
SELECT 'TBWA HRIS Backend database schema created successfully!' as status;