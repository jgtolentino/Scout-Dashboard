# MCP Render Configuration

Automated environment variable management for Render deployments.

## Quick Start

1. **Set up credentials**:
   ```bash
   export RENDER_SERVICE_ID=srv-xxxxx  # From Render dashboard
   export RENDER_API_KEY=rnd_xxxxx     # From https://dashboard.render.com/account/api-keys
   ```

2. **Create .env file**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **One-line sync via Pulser**:
   ```bash
   :doer render_full_sync
   # OR shortcut:
   :doer renv
   ```

## Manual Usage

1. **Parse .env to JSON**:
   ```bash
   python parse_env.py > render_env.json
   ```

2. **Upload to Render**:
   ```bash
   python ../doer/tasks/render_env_uploader.py
   ```

## Files

- `render.yaml` - Render Blueprint configuration
- `parse_env.py` - Convert .env to JSON
- `.env.example` - Example environment variables
- `../doer/tasks/render_env_uploader.py` - Render API uploader

## Pulser Integration

The `.pulserrc` file includes:
- `parse_env` task - Convert .env to JSON
- `sync_render_env` task - Upload to Render
- `render_full_sync` task - Combined workflow
- `renv` shortcut - Quick access

## Security Notes

- Never commit `.env` files
- Store API keys securely
- Use Render's environment groups for shared secrets