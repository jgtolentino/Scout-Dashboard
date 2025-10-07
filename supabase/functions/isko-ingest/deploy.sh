#!/bin/bash
# Deploy Isko Ingest Edge Function

set -e

echo "🚀 Deploying Isko Ingest Edge Function"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Get project ref from user or environment
PROJECT_REF=${SUPABASE_PROJECT_REF:-""}
if [ -z "$PROJECT_REF" ]; then
    echo "Enter your Supabase project ref:"
    read PROJECT_REF
fi

# Link to project if not already linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Linking to Supabase project..."
    supabase link --project-ref $PROJECT_REF
fi

# Deploy the function
echo "📦 Deploying function..."
supabase functions deploy isko-ingest

echo "✅ Deployment complete!"
echo ""
echo "📍 Function URL:"
echo "   https://${PROJECT_REF}.functions.supabase.co/isko-ingest"
echo ""
echo "🧪 Test with:"
echo "   python test_ingest.py"
echo ""
echo "📊 View logs with:"
echo "   supabase functions logs isko-ingest"