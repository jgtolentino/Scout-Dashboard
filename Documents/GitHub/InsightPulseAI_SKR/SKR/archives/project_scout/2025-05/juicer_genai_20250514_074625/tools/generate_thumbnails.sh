#!/bin/bash
# generate_thumbnails.sh - Creates thumbnails and compressed versions of dashboard screenshots
# Usage: ./generate_thumbnails.sh [screenshot_path]

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Dashboard Screenshot Thumbnail Generator                  ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SCREENSHOTS_DIR="${PROJECT_ROOT}/assets/screenshots"
THUMBNAILS_DIR="${PROJECT_ROOT}/assets/thumbnails"
REPORTS_DIR="${PROJECT_ROOT}/assets/reports"
DOCS_DIR="${PROJECT_ROOT}/docs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create required directories
mkdir -p "${THUMBNAILS_DIR}"
mkdir -p "${REPORTS_DIR}"
mkdir -p "${DOCS_DIR}/images"
mkdir -p "${DOCS_DIR}/images/archive"

# Find latest screenshot if not specified
SCREENSHOT_PATH="${1:-$(ls -t ${SCREENSHOTS_DIR}/*.png | head -1)}"
if [ ! -f "${SCREENSHOT_PATH}" ]; then
  echo -e "${RED}Error: No screenshot found at ${SCREENSHOT_PATH}${RESET}"
  exit 1
fi

SCREENSHOT_FILENAME=$(basename "${SCREENSHOT_PATH}")
BASENAME="${SCREENSHOT_FILENAME%.*}"
DATE_PART="${BASENAME##*_}"

echo -e "${BLUE}Processing screenshot: ${SCREENSHOT_FILENAME}${RESET}"

# Check for required tools
CONVERT_TOOL=""
if command -v convert &> /dev/null; then
  CONVERT_TOOL="convert"
  echo -e "${GREEN}ImageMagick found, using 'convert' for image processing${RESET}"
elif command -v magick &> /dev/null; then
  CONVERT_TOOL="magick"
  echo -e "${GREEN}ImageMagick found, using 'magick' for image processing${RESET}"
elif command -v ffmpeg &> /dev/null; then
  echo -e "${YELLOW}ImageMagick not found, using ffmpeg as alternative${RESET}"
  CONVERT_TOOL="ffmpeg"
else
  echo -e "${YELLOW}Warning: Neither ImageMagick nor ffmpeg found. Using Node.js for basic image processing${RESET}"
  CONVERT_TOOL="node"
fi

# Generate outputs based on available tools
if [ "${CONVERT_TOOL}" = "convert" ] || [ "${CONVERT_TOOL}" = "magick" ]; then
  # Thumbnail for embedding in docs (300px width)
  echo -e "${BLUE}Generating thumbnail (300px width)...${RESET}"
  THUMBNAIL_PATH="${THUMBNAILS_DIR}/${BASENAME}_thumb.png"
  ${CONVERT_TOOL} "${SCREENSHOT_PATH}" -thumbnail 300x -quality 90 "${THUMBNAIL_PATH}"
  
  # Compressed version for reports (JPEG, 800px width)
  echo -e "${BLUE}Generating compressed version for reports (800px width)...${RESET}"
  COMPRESSED_PATH="${REPORTS_DIR}/${BASENAME}_compressed.jpg"
  ${CONVERT_TOOL} "${SCREENSHOT_PATH}" -resize 800x -quality 85 "${COMPRESSED_PATH}"
  
  # Archived versioned copy for docs
  echo -e "${BLUE}Creating archived version for docs...${RESET}"
  ARCHIVE_PATH="${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png"
  cp "${SCREENSHOT_PATH}" "${ARCHIVE_PATH}"
  
  # Latest version for docs
  echo -e "${BLUE}Updating latest version for docs...${RESET}"
  LATEST_PATH="${DOCS_DIR}/images/latest_dashboard.png"
  cp "${SCREENSHOT_PATH}" "${LATEST_PATH}"

elif [ "${CONVERT_TOOL}" = "ffmpeg" ]; then
  # Thumbnail using ffmpeg
  echo -e "${BLUE}Generating thumbnail using ffmpeg...${RESET}"
  THUMBNAIL_PATH="${THUMBNAILS_DIR}/${BASENAME}_thumb.png"
  ffmpeg -i "${SCREENSHOT_PATH}" -vf "scale=300:-1" -y "${THUMBNAIL_PATH}" 2>/dev/null
  
  # Compressed version using ffmpeg
  echo -e "${BLUE}Generating compressed version using ffmpeg...${RESET}"
  COMPRESSED_PATH="${REPORTS_DIR}/${BASENAME}_compressed.jpg"
  ffmpeg -i "${SCREENSHOT_PATH}" -vf "scale=800:-1" -q:v 1 -y "${COMPRESSED_PATH}" 2>/dev/null
  
  # Archived versioned copy for docs
  echo -e "${BLUE}Creating archived version for docs...${RESET}"
  ARCHIVE_PATH="${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png"
  cp "${SCREENSHOT_PATH}" "${ARCHIVE_PATH}"
  
  # Latest version for docs
  echo -e "${BLUE}Updating latest version for docs...${RESET}"
  LATEST_PATH="${DOCS_DIR}/images/latest_dashboard.png"
  cp "${SCREENSHOT_PATH}" "${LATEST_PATH}"

elif [ "${CONVERT_TOOL}" = "node" ]; then
  # Create a temporary Node.js script for image processing
  TEMP_SCRIPT="${PROJECT_ROOT}/tools/.temp_thumbnail.js"
  
  cat > "${TEMP_SCRIPT}" << EOL
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function processImage() {
  try {
    const image = await loadImage('${SCREENSHOT_PATH}');
    
    // Create thumbnail
    const thumbRatio = image.width / 300;
    const thumbHeight = Math.round(image.height / thumbRatio);
    
    const thumbCanvas = createCanvas(300, thumbHeight);
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(image, 0, 0, 300, thumbHeight);
    
    const thumbOut = fs.createWriteStream('${THUMBNAILS_DIR}/${BASENAME}_thumb.png');
    const thumbStream = thumbCanvas.createPNGStream();
    thumbStream.pipe(thumbOut);
    
    // Create compressed version
    const compressedRatio = image.width / 800;
    const compressedHeight = Math.round(image.height / compressedRatio);
    
    const compressedCanvas = createCanvas(800, compressedHeight);
    const compressedCtx = compressedCanvas.getContext('2d');
    compressedCtx.drawImage(image, 0, 0, 800, compressedHeight);
    
    const compressedOut = fs.createWriteStream('${REPORTS_DIR}/${BASENAME}_compressed.jpg');
    const compressedStream = compressedCanvas.createJPEGStream({ quality: 0.85 });
    compressedStream.pipe(compressedOut);
    
    // Copy original for archive and latest
    fs.copyFileSync('${SCREENSHOT_PATH}', '${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png');
    fs.copyFileSync('${SCREENSHOT_PATH}', '${DOCS_DIR}/images/latest_dashboard.png');
    
    console.log('Image processing complete');
  } catch (error) {
    console.error('Error processing image:', error);
    process.exit(1);
  }
}

// Check if canvas is available
try {
  require('canvas');
  processImage();
} catch (error) {
  // Fall back to simple copy if canvas is not available
  console.log('Canvas module not available, falling back to simple copy');
  fs.copyFileSync('${SCREENSHOT_PATH}', '${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png');
  fs.copyFileSync('${SCREENSHOT_PATH}', '${DOCS_DIR}/images/latest_dashboard.png');
  fs.copyFileSync('${SCREENSHOT_PATH}', '${THUMBNAILS_DIR}/${BASENAME}_thumb.png');
  fs.copyFileSync('${SCREENSHOT_PATH}', '${REPORTS_DIR}/${BASENAME}_compressed.jpg');
}
EOL

  # Try to install required Node.js modules if needed
  if ! npm list -g | grep -q canvas; then
    echo -e "${YELLOW}canvas module not found, trying to install...${RESET}"
    npm install -g canvas || echo "Failed to install canvas module, falling back to simple copy"
  fi

  # Run the Node.js script
  echo -e "${BLUE}Processing images with Node.js...${RESET}"
  node "${TEMP_SCRIPT}" || {
    echo -e "${YELLOW}Node.js processing failed, falling back to simple copy${RESET}"
    # Simple copy if node processing fails
    cp "${SCREENSHOT_PATH}" "${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png"
    cp "${SCREENSHOT_PATH}" "${DOCS_DIR}/images/latest_dashboard.png"
    cp "${SCREENSHOT_PATH}" "${THUMBNAILS_DIR}/${BASENAME}_thumb.png"
    cp "${SCREENSHOT_PATH}" "${REPORTS_DIR}/${BASENAME}_compressed.jpg"
  }
  
  # Clean up temporary script
  rm "${TEMP_SCRIPT}"
else
  # Just copy files if no processing tools available
  echo -e "${YELLOW}No image processing tools available, performing simple copy${RESET}"
  cp "${SCREENSHOT_PATH}" "${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png"
  cp "${SCREENSHOT_PATH}" "${DOCS_DIR}/images/latest_dashboard.png"
  cp "${SCREENSHOT_PATH}" "${THUMBNAILS_DIR}/${BASENAME}_thumb.png"
  cp "${SCREENSHOT_PATH}" "${REPORTS_DIR}/${BASENAME}_compressed.jpg"
fi

# Generate HTML preview of all screenshots
echo -e "${BLUE}Generating HTML preview...${RESET}"
HTML_PREVIEW="${REPORTS_DIR}/dashboard_preview.html"

cat > "${HTML_PREVIEW}" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Juicer Dashboards Gallery</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #333; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .screenshot { border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
    .screenshot img { width: 100%; height: auto; border: 1px solid #eee; }
    .screenshot h3 { margin: 10px 0; font-size: 14px; }
    .screenshot p { margin: 5px 0; font-size: 12px; color: #666; }
    .latest { border: 2px solid #4CAF50; }
  </style>
</head>
<body>
  <h1>Juicer Dashboards Gallery</h1>
  <p>Generated on $(date)</p>
  
  <h2>Latest Dashboard</h2>
  <div class="screenshot latest">
    <img src="../screenshots/${SCREENSHOT_FILENAME}" alt="Latest Dashboard">
    <h3>Latest: ${SCREENSHOT_FILENAME}</h3>
    <p>Captured: $(date -r "${SCREENSHOT_PATH}" "+%Y-%m-%d %H:%M:%S")</p>
    <p><a href="../screenshots/${SCREENSHOT_FILENAME}" target="_blank">View Full Size</a></p>
  </div>
  
  <h2>Archive</h2>
  <div class="gallery">
EOL

# Add all screenshots to the gallery
for img in "${SCREENSHOTS_DIR}"/*.png; do
  filename=$(basename "${img}")
  timestamp=$(date -r "${img}" "+%Y-%m-%d %H:%M:%S")
  
  cat >> "${HTML_PREVIEW}" << EOL
    <div class="screenshot">
      <img src="../screenshots/${filename}" alt="${filename}">
      <h3>${filename}</h3>
      <p>Captured: ${timestamp}</p>
      <p><a href="../screenshots/${filename}" target="_blank">View Full Size</a></p>
    </div>
EOL
done

# Close the HTML
cat >> "${HTML_PREVIEW}" << EOL
  </div>
</body>
</html>
EOL

echo -e "${GREEN}Generated HTML preview: ${HTML_PREVIEW}${RESET}"

# Output results
echo -e "\n${GREEN}Process completed successfully!${RESET}"
echo -e "${BLUE}Files created:${RESET}"
echo -e "- Thumbnail (300px): ${THUMBNAILS_DIR}/${BASENAME}_thumb.png"
echo -e "- Compressed (800px): ${REPORTS_DIR}/${BASENAME}_compressed.jpg" 
echo -e "- Archived: ${DOCS_DIR}/images/archive/dashboard_${DATE_PART}.png"
echo -e "- Latest: ${DOCS_DIR}/images/latest_dashboard.png"
echo -e "- HTML Preview: ${HTML_PREVIEW}"

# Provide Markdown usage instructions
echo -e "\n${BLUE}Markdown for including in documentation:${RESET}"
echo -e "${YELLOW}
# Latest Dashboard

![Juicer Insights Dashboard](../images/latest_dashboard.png)

*Dashboard captured on $(date -r "${SCREENSHOT_PATH}" "+%Y-%m-%d")*

## Thumbnail Version

![Juicer Insights Dashboard Thumbnail](../images/archive/dashboard_${DATE_PART}.png)
${RESET}"

echo -e "${GREEN}Done!${RESET}"