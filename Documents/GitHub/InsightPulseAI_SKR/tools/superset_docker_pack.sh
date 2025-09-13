#!/bin/bash
# Superset Dashboard Docker Packager
# Creates a Docker image that contains the dashboard for easier deployment

set -e

# ANSI color codes
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Default values
DASHBOARD_DIR="/Users/tbwa/Downloads/superset"
IMAGE_NAME="superset-dashboard"
IMAGE_TAG="latest"

# Show help
show_help() {
  echo -e "${BOLD}Superset Dashboard Docker Packager${NC}"
  echo -e "Creates a Docker image with your dashboard for easy deployment"
  echo
  echo -e "Usage: $0 [options]"
  echo
  echo -e "Options:"
  echo -e "  -d, --dir DIR       Dashboard directory (default: $DASHBOARD_DIR)"
  echo -e "  -n, --name NAME     Docker image name (default: $IMAGE_NAME)"
  echo -e "  -t, --tag TAG       Docker image tag (default: $IMAGE_TAG)"
  echo -e "  --help              Show this help message"
  echo
  echo -e "Example:"
  echo -e "  $0 --dir /path/to/dashboards --name my-analytics-dash --tag v1.0"
  echo
}

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -d|--dir) DASHBOARD_DIR="$2"; shift ;;
    -n|--name) IMAGE_NAME="$2"; shift ;;
    -t|--tag) IMAGE_TAG="$2"; shift ;;
    --help) show_help; exit 0 ;;
    *) echo -e "${RED}Unknown parameter: $1${NC}"; show_help; exit 1 ;;
  esac
  shift
done

# Validate dashboard directory
if [ ! -d "$DASHBOARD_DIR" ]; then
  echo -e "${RED}Error: Dashboard directory not found: $DASHBOARD_DIR${NC}"
  exit 1
fi

# Find dashboard JSON files
JSON_FILES=($(find "$DASHBOARD_DIR" -name "*.json" -maxdepth 1 -type f))
if [ ${#JSON_FILES[@]} -eq 0 ]; then
  echo -e "${RED}Error: No JSON files found in $DASHBOARD_DIR${NC}"
  exit 1
fi

echo -e "${BLUE}${BOLD}📦 Superset Dashboard Docker Packager${NC}"
echo -e "${BOLD}Dashboard directory:${NC} $DASHBOARD_DIR"
echo -e "${BOLD}Docker image:${NC} $IMAGE_NAME:$IMAGE_TAG"
echo -e "${BOLD}Dashboard files:${NC}"
for f in "${JSON_FILES[@]}"; do
  echo -e "  - $(basename "$f")"
done
echo

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}Creating Docker package in $TEMP_DIR...${NC}"

# Copy dashboard files
cp "${JSON_FILES[@]}" "$TEMP_DIR/"

# Create Dockerfile
cat > "$TEMP_DIR/Dockerfile" << EOF
FROM apache/superset:latest

USER root
WORKDIR /app

# Copy dashboard JSON files
COPY *.json /app/dashboards/

# Install necessary tools
RUN apt-get update && apt-get install -y jq curl

# Create import script
RUN echo '#!/bin/bash \\n\
set -e \\n\
\\n\
# Start Superset \\n\
echo "Starting Superset..." \\n\
superset run -p 8088 --with-threads --reload --debugger & \\n\
SUPERSET_PID=\$! \\n\
\\n\
# Wait for Superset to start \\n\
echo "Waiting for Superset to start..." \\n\
until curl -s http://localhost:8088/health >/dev/null; do \\n\
  sleep 2 \\n\
done \\n\
\\n\
echo "Superset is running" \\n\
\\n\
# Create admin user if it doesnt exist \\n\
superset fab create-admin \\n\
  --username admin \\n\
  --firstname Superset \\n\
  --lastname Admin \\n\
  --email admin@superset.com \\n\
  --password admin || true \\n\
\\n\
# Initialize database \\n\
superset db upgrade \\n\
\\n\
# Setup roles \\n\
superset init \\n\
\\n\
# Import dashboards \\n\
echo "Importing dashboards..." \\n\
for dashboard in /app/dashboards/*.json; do \\n\
  echo "Importing \$dashboard..." \\n\
  superset import_dashboards -p "\$dashboard" \\n\
done \\n\
\\n\
echo "Dashboards imported successfully" \\n\
\\n\
# Keep container running \\n\
wait \$SUPERSET_PID \\n\
' > /app/import_dashboards.sh

RUN chmod +x /app/import_dashboards.sh

# Create startup script
RUN echo '#!/bin/bash \\n\
/app/import_dashboards.sh \\n\
' > /app/startup.sh

RUN chmod +x /app/startup.sh

# Switch back to superset user
USER superset

# Set entrypoint
ENTRYPOINT ["/app/startup.sh"]
EOF

# Build Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t "$IMAGE_NAME:$IMAGE_TAG" "$TEMP_DIR" || {
  echo -e "${RED}Error: Failed to build Docker image${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
}

# Clean up
rm -rf "$TEMP_DIR"

# Save image to tar file
SAVE_PATH="$DASHBOARD_DIR/$IMAGE_NAME-$IMAGE_TAG.tar"
echo -e "${BLUE}Saving Docker image to $SAVE_PATH...${NC}"
docker save -o "$SAVE_PATH" "$IMAGE_NAME:$IMAGE_TAG" || {
  echo -e "${RED}Error: Failed to save Docker image${NC}"
  exit 1
}

echo -e "${GREEN}${BOLD}✅ Dashboard packaged successfully!${NC}"
echo
echo -e "${BOLD}To run this dashboard:${NC}"
echo -e "  docker load -i $SAVE_PATH"
echo -e "  docker run -p 8088:8088 $IMAGE_NAME:$IMAGE_TAG"
echo
echo -e "${BOLD}Then access Superset at:${NC} http://localhost:8088"
echo -e "${BOLD}Username:${NC} admin"
echo -e "${BOLD}Password:${NC} admin"
echo
echo -e "${YELLOW}Note: This is a standalone deployment for testing purposes.${NC}"
echo -e "${YELLOW}For production use, refer to the official Superset deployment guide.${NC}"

# Create a simple readme file
README_PATH="$DASHBOARD_DIR/DASHBOARD_README.md"
cat > "$README_PATH" << EOF
# Superset Dashboard Package

This package contains a Docker image with your Superset dashboard.

## Contents

$(for f in "${JSON_FILES[@]}"; do echo "- $(basename "$f")"; done)

## Running the Dashboard

1. Load the Docker image:
   \`\`\`
   docker load -i $IMAGE_NAME-$IMAGE_TAG.tar
   \`\`\`

2. Run the container:
   \`\`\`
   docker run -p 8088:8088 $IMAGE_NAME:$IMAGE_TAG
   \`\`\`

3. Access Superset at: http://localhost:8088
   - Username: admin
   - Password: admin

## About

This package was created by Surf Agent on $(date "+%Y-%m-%d")
EOF

echo -e "${BLUE}Created dashboard documentation at:${NC} $README_PATH"