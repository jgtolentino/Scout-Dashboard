#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all edge functions to your Supabase project

set -e

echo "🚀 Supabase Edge Functions Deployment"
echo "===================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF:-cxzllzyxwpyptfretryc}"
FUNCTIONS_DIR="$(dirname "$0")"

echo "📁 Functions directory: $FUNCTIONS_DIR"
echo "🎯 Project ref: $PROJECT_REF"

# Check if already linked
if ! supabase projects list 2>/dev/null | grep -q "$PROJECT_REF"; then
    echo ""
    echo "🔗 Linking to Supabase project..."
    supabase link --project-ref "$PROJECT_REF"
fi

# Deploy functions
echo ""
echo "📦 Deploying functions..."

# Array of functions to deploy
functions=(
    "hello-world"
    "user-activity"
    "expense-ocr"
)

# Deploy each function
for func in "${functions[@]}"; do
    if [ -d "$FUNCTIONS_DIR/$func" ]; then
        echo ""
        echo "🔧 Deploying $func..."
        
        # Check if function has environment variables
        if [ -f "$FUNCTIONS_DIR/$func/.env" ]; then
            supabase functions deploy "$func" --env-file "$FUNCTIONS_DIR/$func/.env"
        else
            supabase functions deploy "$func"
        fi
        
        if [ $? -eq 0 ]; then
            echo "✅ $func deployed successfully"
        else
            echo "❌ Failed to deploy $func"
        fi
    else
        echo "⚠️  Skipping $func - directory not found"
    fi
done

# Get function URLs
echo ""
echo "🌐 Function URLs:"
echo "================"

SUPABASE_URL="https://$PROJECT_REF.supabase.co"

for func in "${functions[@]}"; do
    echo ""
    echo "📌 $func:"
    echo "   URL: $SUPABASE_URL/functions/v1/$func"
    echo "   Method: GET/POST"
    echo "   Auth: Required (Bearer token)"
done

# Create test script
echo ""
echo "📝 Creating test script..."

cat > "$FUNCTIONS_DIR/test-functions.sh" << 'EOF'
#!/bin/bash

# Test script for Supabase Edge Functions

SUPABASE_URL="${SUPABASE_URL:-https://cxzllzyxwpyptfretryc.supabase.co}"
ANON_KEY="${SUPABASE_ANON_KEY:-your_anon_key_here}"

echo "🧪 Testing Supabase Edge Functions"
echo "================================="

# Test hello-world GET
echo ""
echo "Testing hello-world (GET)..."
curl -s --location --request GET \
  "$SUPABASE_URL/functions/v1/hello-world?name=TBWA" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" | jq .

# Test hello-world POST
echo ""
echo "Testing hello-world (POST)..."
curl -s --location --request POST \
  "$SUPABASE_URL/functions/v1/hello-world" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data '{"name":"TBWA","data":{"source":"test"}}' | jq .

echo ""
echo "✅ Basic tests completed!"
echo ""
echo "Note: user-activity and expense-ocr require authenticated users."
echo "Test them from your application with proper auth tokens."
EOF

chmod +x "$FUNCTIONS_DIR/test-functions.sh"

echo "✅ Test script created: test-functions.sh"

# Show logs command
echo ""
echo "📊 View logs with:"
for func in "${functions[@]}"; do
    echo "   supabase functions logs $func --tail"
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Set SUPABASE_ANON_KEY in your environment"
echo "2. Run ./test-functions.sh to test the functions"
echo "3. Check logs if any issues occur"
echo "4. Integrate with your frontend application"