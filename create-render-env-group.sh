#!/bin/bash

# Render API endpoint
API_URL="https://api.render.com/v1/environment-groups"

# Check if RENDER_API_KEY is set
if [ -z "$RENDER_API_KEY" ]; then
    echo "Error: RENDER_API_KEY environment variable is not set"
    echo "Get your API key from: https://dashboard.render.com/account/api-keys"
    exit 1
fi

# Environment group name
GROUP_NAME="mcp-supabase-prod"

# Create the environment group
echo "Creating environment group: $GROUP_NAME"

curl -X POST "$API_URL" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$GROUP_NAME'",
    "envVars": [
      {
        "key": "SUPABASE_URL",
        "value": "https://cxzllzyxwpyptfretryc.supabase.co"
      },
      {
        "key": "SUPABASE_ACCESS_TOKEN",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g"
      },
      {
        "key": "PORT",
        "value": "8888"
      },
      {
        "key": "SUPABASE_ANON_KEY",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g"
      }
    ]
  }'

echo -e "\n\nEnvironment group created successfully!"
echo "You can now link this group to your services in the Render dashboard."