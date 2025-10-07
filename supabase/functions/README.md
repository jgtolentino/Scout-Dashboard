# Supabase Edge Functions

This directory contains Edge Functions for the TBWA Enterprise Platform. These serverless functions run on Deno Deploy and provide various API endpoints for the application.

## Available Functions

### 1. 🌍 Hello World (`hello-world`)
A simple starter function demonstrating basic patterns.

**Endpoints:**
- `GET /functions/v1/hello-world?name=YourName`
- `POST /functions/v1/hello-world` with JSON body

**Use Cases:**
- Testing edge function deployment
- Health checks
- Simple API endpoint template

### 2. 📊 User Activity Tracker (`user-activity`)
Tracks and analyzes user interactions across the platform.

**Endpoints:**
- `POST /functions/v1/user-activity` - Track an activity
- `GET /functions/v1/user-activity?limit=10&offset=0` - Get user's activities

**Features:**
- Real-time activity tracking
- Session management
- Activity analytics
- User behavior insights

**Required Auth:** Yes (Bearer token)

### 3. 🧾 Expense OCR Processor (`expense-ocr`)
Processes receipt images and extracts expense data using OCR.

**Endpoints:**
- `POST /functions/v1/expense-ocr` - Process receipt image

**Features:**
- Receipt image upload
- OCR text extraction
- Auto-categorization
- Expense record creation
- Receipt storage

**Required Auth:** Yes (Bearer token)

## Quick Start

### 1. Prerequisites
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Install Deno (optional, for local development)
brew install deno
```

### 2. Deploy All Functions
```bash
./deploy.sh
```

### 3. Test Functions
```bash
# Set your environment variables
export SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key"

# Run tests
./test-functions.sh
```

## Development

### Local Development
```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test locally
curl http://localhost:54321/functions/v1/hello-world
```

### Creating a New Function
```bash
# Create new function
supabase functions new my-function

# Edit the function
code functions/my-function/index.ts

# Test locally
supabase functions serve my-function

# Deploy
supabase functions deploy my-function
```

## API Documentation

### Hello World Function

#### GET Request
```bash
curl -X GET \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/hello-world?name=TBWA' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Response:**
```json
{
  "message": "Hello TBWA!",
  "timestamp": "2024-01-22T10:30:00Z",
  "method": "GET",
  "environment": "production"
}
```

#### POST Request
```bash
curl -X POST \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/hello-world' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "TBWA",
    "data": {"department": "IT"}
  }'
```

**Response:**
```json
{
  "message": "Hello TBWA!",
  "timestamp": "2024-01-22T10:30:00Z",
  "method": "POST",
  "receivedData": {"department": "IT"},
  "processedAt": "2024-01-22T10:30:00Z"
}
```

### User Activity Function

#### Track Activity
```bash
curl -X POST \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/user-activity' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventType": "button_click",
    "eventData": {
      "button": "submit_expense",
      "page": "/expenses/new"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "activityId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Activity tracked successfully"
}
```

#### Get Activities
```bash
curl -X GET \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/user-activity?limit=5' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

**Response:**
```json
{
  "activities": [...],
  "summary": {
    "total_activities": 150,
    "page_views": 80,
    "button_clicks": 50,
    "form_submits": 20
  },
  "pagination": {
    "limit": 5,
    "offset": 0,
    "total": 150
  }
}
```

### Expense OCR Function

#### Process Receipt
```bash
# With base64 image
curl -X POST \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/expense-ocr' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "image": "base64_encoded_image_data",
    "fileName": "receipt.jpg"
  }'

# With form data
curl -X POST \
  'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/expense-ocr' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -F 'file=@/path/to/receipt.jpg'
```

**Response:**
```json
{
  "success": true,
  "expenseId": "123e4567-e89b-12d3-a456-426614174000",
  "receiptUrl": "https://...",
  "ocrResult": {
    "merchantName": "Starbucks Coffee",
    "amount": 245.00,
    "date": "2024-01-22",
    "currency": "PHP",
    "items": [...],
    "confidence": 0.92
  },
  "message": "Receipt processed successfully"
}
```

## Error Handling

All functions return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": "Additional context (optional)"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Security

### Authentication
All functions (except hello-world GET) require authentication:
```
Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN
```

### CORS
All functions include proper CORS headers for cross-origin requests.

### Rate Limiting
Consider implementing rate limiting for production use.

## Environment Variables

Create `.env.local` for each function:

```env
# Required
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
ENVIRONMENT=production
OCR_SERVICE_URL=https://ocr-api.example.com
OCR_API_KEY=your_ocr_api_key
```

## Monitoring

### View Logs
```bash
# View logs for a specific function
supabase functions logs hello-world --tail

# View logs with filter
supabase functions logs user-activity --filter "error"
```

### Metrics
Monitor function performance in the Supabase Dashboard:
- Invocations
- Errors
- Duration
- Memory usage

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure OPTIONS method is handled
   - Check Access-Control headers

2. **Authentication Errors**
   - Verify token is valid
   - Check Authorization header format
   - Ensure user has necessary permissions

3. **Database Errors**
   - Run migrations first
   - Check RLS policies
   - Verify service role key

4. **Deployment Fails**
   - Check function syntax with `deno check`
   - Ensure all imports are valid
   - Check for TypeScript errors

### Debug Tips

1. Add console.log statements (visible in function logs)
2. Use try-catch blocks extensively
3. Return detailed error messages in development
4. Test locally first with `supabase functions serve`

## Best Practices

1. **Error Handling**: Always wrap main logic in try-catch
2. **Validation**: Validate all inputs
3. **Security**: Never expose sensitive data
4. **Performance**: Keep functions lightweight
5. **CORS**: Handle preflight requests properly
6. **Logging**: Log important events for debugging

## Contributing

1. Create new function in `functions/` directory
2. Follow existing patterns and structure
3. Add comprehensive error handling
4. Document endpoints in this README
5. Test locally before deploying
6. Update deployment script if needed

## Support

For issues or questions:
- Check function logs first
- Review error messages
- Consult Supabase documentation
- Contact TBWA Platform team