# 🏪 Sari-Sari Expert Bot Setup Guide

## Overview
The Sari-Sari Expert Bot is a Groq-powered AI assistant specialized in Philippine retail analytics, designed to provide real-time insights on sari-sari store operations, TBWA brand performance, and market trends.

## Features
- **Ultra-fast inference** using Groq's optimized hardware
- **Real-time transaction analysis** with customizable filters
- **Philippine retail expertise** (tingi culture, utang system, regional preferences)
- **TBWA brand focus** with competitor comparison
- **Streaming responses** for better UX

## Setup Instructions

### 1. Deploy the Edge Function

```bash
# Run the deployment script
./deploy_sari_sari_expert.sh
```

### 2. Set up Groq API Key

Get your API key from [Groq Console](https://console.groq.com/keys) and set it:

```bash
supabase secrets set GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Test the Function

#### Using cURL:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/sari-sari-expert \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the top selling TBWA products?",
    "filters": {
      "region": ["NCR"],
      "store_type": ["sari-sari"]
    }
  }'
```

#### Using the HTML Demo:
1. Open `sari_sari_expert_demo.html` in a browser
2. Enter your Supabase URL and Anon Key
3. Start chatting!

#### Using the React Component:
```tsx
import { SariSariExpertChat } from './sari_sari_expert_client'

function App() {
  return <SariSariExpertChat />
}
```

### 4. Run Tests

```bash
# Install dependencies
npm install @supabase/supabase-js

# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your_anon_key

# Run tests
npx tsx test_sari_sari_expert.ts
```

## API Reference

### Request Format
```typescript
interface SariSariExpertRequest {
  query: string                // User's question
  filters?: {                  // Optional data filters
    store_type?: string[]      // ["sari-sari", "convenience", "supermarket"]
    region?: string[]          // ["NCR", "Region IV-A", etc.]
    date_range?: {
      start: string           // "2024-01-01"
      end: string            // "2024-12-31"
    }
    brands?: string[]        // Filter by specific brands
    min_amount?: number      // Minimum transaction amount
    max_amount?: number      // Maximum transaction amount
  }
  include_data?: boolean     // Include raw data context
  stream?: boolean          // Enable streaming response
}
```

### Response Format
```typescript
interface SariSariExpertResponse {
  success: boolean
  answer: string              // AI-generated response
  context: {
    transactions_analyzed: number
    insights: {
      topProducts: Array<{brand: string, units_sold: number}>
      paymentTrends: Record<string, number>
      storeInsights: Array<{store_type: string, avg_transaction: string}>
    }
    filters_applied: any
  }
  usage: {                   // Groq API usage stats
    prompt_tokens: number
    completion_tokens: number
    total_time: number
  }
}
```

## Example Queries

### Basic Queries
- "What are the top-selling TBWA products in sari-sari stores?"
- "Show me GCash adoption trends"
- "What's the average basket size for tingi purchases?"

### Filtered Queries
```javascript
// Regional comparison
{
  query: "Compare sales between NCR and Visayas",
  filters: {
    region: ["NCR", "Region VII"]
  }
}

// Brand performance
{
  query: "How does Alaska perform against Bear Brand?",
  filters: {
    brands: ["Alaska", "Bear Brand"],
    date_range: {
      start: "2024-06-01",
      end: "2024-07-31"
    }
  }
}

// Payment analysis
{
  query: "Analyze utang patterns in rural stores",
  filters: {
    store_type: ["sari-sari"],
    payment_method: ["utang"]
  }
}
```

## Monitoring

Check query logs:
```sql
SELECT 
  query,
  response_time_ms,
  transaction_count,
  created_at
FROM sari_sari_queries
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Function not responding
1. Check if GROQ_API_KEY is set: `supabase secrets list`
2. Check function logs: `supabase functions logs sari-sari-expert`

### Slow responses
- Groq typically responds in <500ms
- Check if you're hitting rate limits
- Consider using the streaming endpoint

### No data in responses
- Verify scout_transactions table has data
- Check RLS policies on tables
- Ensure service_role key is used in Edge Function

## Cost Optimization
- Groq pricing is usage-based
- Use filters to reduce data processing
- Cache common queries in your app
- Monitor usage in Groq Console

## Next Steps
1. Integrate into your Scout Dashboard
2. Add custom prompts for your use case
3. Set up automated insights generation
4. Create scheduled reports using the expert system