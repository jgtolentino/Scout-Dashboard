#!/bin/bash
# Script to generate dashboard preview image using browser automation
# Requires Chrome/Chromium and puppeteer-screenshot-cli
# Install with: npm install -g puppeteer-screenshot-cli

echo "Generating dashboard preview image..."

# Check if puppeteer-screenshot-cli is installed
if ! command -v puppeteer-screenshot > /dev/null 2>&1; then
  echo "puppeteer-screenshot-cli is not installed. Please install it with:"
  echo "npm install -g puppeteer-screenshot-cli"
  exit 1
fi

# Generate the screenshot
puppeteer-screenshot \
  --url file://$(pwd)/images/dashboard-preview.html \
  --output images/dashboard-preview.jpg \
  --viewport.width 1280 \
  --viewport.height 800 \
  --delay 500

echo "Screenshot generated at images/dashboard-preview.jpg"

# Create a fallback image if puppeteer fails
if [ ! -f "images/dashboard-preview.jpg" ]; then
  echo "Failed to generate screenshot. Creating a placeholder image..."
  
  # Create a simple canvas with text using ImageMagick (if available)
  if command -v convert > /dev/null 2>&1; then
    convert -size 1280x800 \
      -background "#f0f2f5" \
      -gravity center \
      -font Arial \
      -pointsize 40 \
      -fill "#666666" \
      label:"TBWA Client360 Dashboard Preview" \
      images/dashboard-preview.jpg
    
    echo "Placeholder image created with ImageMagick."
  else
    echo "ImageMagick not available. Please manually create a preview image at images/dashboard-preview.jpg"
  fi
fi

# Create a readme file to explain how to generate the preview image
cat > images/README.md << EOF
# Dashboard Preview Generation

To generate the dashboard preview image:

1. Install the required tools:
   \`\`\`
   npm install -g puppeteer-screenshot-cli
   \`\`\`

2. Run the generate_preview.sh script:
   \`\`\`
   cd landing-page
   ./generate_preview.sh
   \`\`\`

Alternatively, you can manually:
- Open images/dashboard-preview.html in a browser
- Take a screenshot
- Save it as images/dashboard-preview.jpg

The landing page will look for this image at: images/dashboard-preview.jpg
EOF

echo "Created README file with instructions in images/README.md"