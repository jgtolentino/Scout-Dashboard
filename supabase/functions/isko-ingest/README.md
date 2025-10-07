# Isko Ingest - Supabase Edge Function

A lightweight, LLM-free Edge Function for ingesting SKU data into Supabase.

## Features

- ✅ No LLM required - Pure deterministic data ingestion
- 🚀 Deployed as Supabase Edge Function
- 🔒 Service role authentication for secure writes
- 📊 Automatic logging to scraping history
- 🌐 CORS-enabled for browser requests

## Deployment

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Deploy the Function

```bash
# From project root
supabase functions deploy isko-ingest
```

### Test Locally

```bash
# Start local Supabase
supabase start

# Serve the function
supabase functions serve isko-ingest --env-file supabase/functions/isko-ingest/.env
```

## API Usage

### Endpoint
```
POST https://<project-ref>.functions.supabase.co/isko-ingest
```

### Request Body
```json
{
  "sku_id": "ABC123",
  "brand_name": "Oishi",
  "sku_name": "Oishi Prawn Crackers 90g",
  "pack_size": 90,
  "pack_unit": "g",
  "category": "Snacks",
  "msrp": 25.50,
  "source_url": "https://example.com/product/123",
  "metadata": {
    "scraped_at": "2024-01-15T10:30:00Z"
  }
}
```

### Response
```json
{
  "status": "success",
  "message": "SKU ingested successfully",
  "sku_id": "ABC123"
}
```

## Testing

### Using cURL
```bash
curl -X POST https://<project>.functions.supabase.co/isko-ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "sku_id": "TEST123",
    "sku_name": "Test Product",
    "category": "Test"
  }'
```

### Using Python
```python
import requests

url = "https://<project>.functions.supabase.co/isko-ingest"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
}
data = {
    "sku_id": "PYTHON123",
    "sku_name": "Python Test Product",
    "brand_name": "TestBrand",
    "category": "Testing"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

## Environment Variables

The function uses these Supabase environment variables (automatically available):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database writes

## Database Schema

Ensure these tables exist in your Supabase project:

```sql
-- SKU Catalog
CREATE TABLE sku_catalog (
    sku_id VARCHAR(100) PRIMARY KEY,
    brand_name VARCHAR(200),
    sku_name VARCHAR(500) NOT NULL,
    pack_size DECIMAL(10,2),
    pack_unit VARCHAR(50),
    category VARCHAR(100),
    msrp DECIMAL(10,2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraping History
CREATE TABLE isko_scraping_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100),
    url TEXT,
    items_found INTEGER,
    items_new INTEGER,
    items_updated INTEGER,
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration with Isko Agent

The Python scraper can push data to this endpoint:

```python
# In your Isko scraper
def push_to_supabase(sku_data):
    response = requests.post(
        "https://your-project.functions.supabase.co/isko-ingest",
        json=sku_data,
        headers={"Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
    )
    return response.json()
```

## Monitoring

View function logs:
```bash
supabase functions logs isko-ingest
```

Check ingestion stats:
```sql
SELECT * FROM isko_scraping_history 
ORDER BY created_at DESC 
LIMIT 10;
```