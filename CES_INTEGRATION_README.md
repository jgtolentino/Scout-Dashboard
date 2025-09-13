# Ask CES Integration with Palette Forge Model

This integration powers the Ask CES system with the tbwa-lions-palette-forge model for real-time creative intelligence and color palette analysis.

## Architecture Overview

```
Claude/ChatGPT/Pulser → CES Gateway → Palette Service → Supabase/pgvector
```

## Quick Start

### 1. Fork and Setup Repository

```bash
# Fork the palette forge repo
gh repo fork jgtolentino/tbwa-lions-palette-forge --clone --remote upstream
cd tbwa-lions-palette-forge
git switch -c service-wrap

# Copy service wrapper files
cp -r /path/to/service/* .
git add .
git commit -m "feat: add FastAPI service wrapper for palette forge"
git push origin service-wrap
```

### 2. Deploy to Render

1. Connect your GitHub account to Render
2. Create new services from `render.yaml`:
   - `palette-svc` - The ML model service
   - `ces-gw` - The gateway orchestrator

### 3. Configure Secrets in KeyKey/Doppler

```
PALETTE_SUPA_URL  → Your Supabase project URL
PALETTE_SUPA_KEY  → Your Supabase anon key  
PALETTE_PGV_URL   → PostgreSQL connection string
CES_API_TOKEN     → Generate secure token
```

### 4. Run Supabase Migration

```bash
cd supabase
supabase db push
```

### 5. Test Integration

```bash
./scripts/test-ces-integration.sh
```

## Usage Examples

### Pulser CLI
```bash
:ces "Which 2024 TikTok spots match Pantone Peach Fuzz?"
:ces "Show me warm-toned automotive ads from Q3"
:ces "Top 3 pink-dominant ads"
```

### ChatGPT
Upload `ces-gateway/openapi.yaml` to your custom GPT configuration.

### Claude Desktop
Add to MCP tools configuration:
```json
{
  "ces": {
    "url": "https://ces-gw.onrender.com",
    "headers": { "Authorization": "Bearer ${CES_API_TOKEN}" }
  }
}
```

## API Endpoints

### CES Gateway

- `GET /health` - Service health check
- `POST /ask` - Main query endpoint
  ```json
  {
    "prompt": "your creative intelligence query",
    "limit": 10,
    "include_embeddings": false
  }
  ```
- `POST /score` - Direct palette scoring

### Palette Service

- `GET /health` - Model health check
- `POST /score` - Score image palette
  ```json
  {
    "image_url": "https://...",
    "campaign_id": "uuid (optional)"
  }
  ```
- `POST /similar` - Find similar assets

## Development

### Local Testing

```bash
# Start palette service
cd service
uvicorn app:app --reload --port 8000

# Start CES gateway
cd ces-gateway
uvicorn app:app --reload --port 8001
```

### Adding New Features

1. Extend the palette service for new ML capabilities
2. Update CES gateway orchestration logic
3. Add corresponding Supabase schema if needed
4. Update Pulser agent configuration

## Monitoring

- Render dashboard for service health
- Supabase dashboard for database metrics
- Application logs in Render

## Troubleshooting

### Service Won't Start
- Check Render logs for missing environment variables
- Verify Docker build succeeded
- Ensure model files are included in image

### No Results from Queries  
- Verify Supabase has data in creative_ops.assets
- Check pgvector extension is enabled
- Confirm embeddings are being generated

### Authentication Errors
- Verify CES_API_TOKEN matches across services
- Check Bearer token format in requests
- Ensure KeyKey is syncing properly

## Next Steps

1. **GPU Acceleration**: Upgrade Render plan for faster inference
2. **Auto-Embedding**: Supabase trigger on new uploads
3. **Enhanced RAG**: Integrate WARC case studies
4. **Real-time Updates**: WebSocket support for live results