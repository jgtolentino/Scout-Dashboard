# Supabase Edge Functions Deployment Guide

This guide explains how to deploy edge functions to Supabase using the MCP (Model Context Protocol).

## Available Edge Functions

### 1. Hello World Function
- **Path**: `/supabase/functions/hello-world`
- **Purpose**: Basic edge function template for testing
- **Methods**: GET, POST
- **Features**: CORS handling, error handling, environment variables

### 2. User Activity Tracker
- **Path**: `/supabase/functions/user-activity`
- **Purpose**: Track and analyze user activities across the platform
- **Methods**: GET, POST
- **Features**: 
  - Real-time activity tracking
  - User authentication required
  - Activity analytics and summaries
  - Database integration

### 3. Expense OCR Processor
- **Path**: `/supabase/functions/expense-ocr`
- **Purpose**: Process receipt images and extract expense data
- **Methods**: POST
- **Features**:
  - Receipt image OCR processing
  - Auto-categorization of expenses
  - Storage integration
  - Confidence scoring

## Deployment Methods

### Method 1: Using Supabase MCP (Recommended)

If MCP is properly configured, you can deploy directly:

```typescript
// Deploy hello-world function
await mcp__supabase__deploy_edge_function({
  name: "hello-world",
  entrypoint_path: "index.ts",
  files: [{
    name: "index.ts",
    content: /* function content */
  }]
});
```

### Method 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref cxzllzyxwpyptfretryc

# Deploy a single function
supabase functions deploy hello-world

# Deploy all functions
supabase functions deploy

# Deploy with environment variables
supabase functions deploy hello-world --env-file .env.local
```

### Method 3: Manual Deployment via Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/project/cxzllzyxwpyptfretryc/functions)
2. Click "New Function"
3. Name your function
4. Paste the function code
5. Click "Deploy"

## Environment Variables

Create `.env.local` for local development:

```env
# Required for all functions
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
ENVIRONMENT=development
OCR_API_KEY=your_ocr_service_key
```

## Testing Edge Functions

### Local Testing

```bash
# Serve functions locally
supabase functions serve

# Test hello-world function
curl -i --location --request GET \
  'http://localhost:54321/functions/v1/hello-world?name=TBWA' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'

# Test POST request
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"TBWA","data":{"test":true}}'
```

### Production Testing

```bash
# Test deployed function
curl -i --location --request GET \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/hello-world?name=TBWA' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

## Database Schema Requirements

For the edge functions to work properly, ensure these tables exist:

### User Activity Table
```sql
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE analytics.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id UUID,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_user_activity_user_id ON analytics.user_activity(user_id);
CREATE INDEX idx_user_activity_timestamp ON analytics.user_activity(timestamp DESC);
```

### Expense Table
```sql
CREATE SCHEMA IF NOT EXISTS expense;

CREATE TABLE expense.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  merchant_name TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'PHP',
  expense_date DATE,
  receipt_url TEXT,
  ocr_data JSONB,
  ocr_confidence DECIMAL(3,2),
  category TEXT,
  subcategory TEXT,
  auto_categorized BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending_review',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_expenses_user_id ON expense.expenses(user_id);
CREATE INDEX idx_expenses_date ON expense.expenses(expense_date DESC);
```

### Storage Bucket
```sql
-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);
```

## Security Considerations

1. **Authentication**: All functions require valid Supabase auth tokens
2. **CORS**: Properly configured for cross-origin requests
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Input Validation**: All inputs are validated before processing
5. **Error Handling**: Comprehensive error handling with proper status codes

## Monitoring and Logs

View function logs in the Supabase Dashboard:
1. Go to Functions section
2. Click on your function
3. View "Logs" tab

Or use the CLI:
```bash
supabase functions logs hello-world --tail
```

## Common Issues and Solutions

### CORS Errors
- Ensure OPTIONS method is handled
- Check Access-Control headers are set

### Authentication Errors
- Verify Authorization header is included
- Check token validity
- Ensure anon key is correct

### Database Connection Errors
- Verify service role key has proper permissions
- Check table names and schemas exist
- Ensure RLS policies allow access

## Next Steps

1. Deploy the functions using one of the methods above
2. Test each function endpoint
3. Monitor logs for any errors
4. Integrate with your frontend application
5. Set up monitoring and alerts

## Example Frontend Integration

```typescript
// Call hello-world function
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'TBWA', data: { source: 'web' } }
});

// Track user activity
const { data, error } = await supabase.functions.invoke('user-activity', {
  body: {
    eventType: 'button_click',
    eventData: {
      button: 'submit_expense',
      page: '/expenses/new'
    }
  }
});

// Process receipt
const file = document.getElementById('receipt-file').files[0];
const base64 = await convertToBase64(file);

const { data, error } = await supabase.functions.invoke('expense-ocr', {
  body: {
    image: base64,
    fileName: file.name
  }
});
```