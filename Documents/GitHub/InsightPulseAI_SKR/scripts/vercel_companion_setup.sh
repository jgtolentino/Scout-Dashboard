#!/bin/bash
#
# vercel_companion_setup.sh - Deploy Vercel Companion GUI for Pointer/GEZ Flows
#
# This script sets up and deploys the Vercel Companion GUI that integrates with 
# the Pointer → Manus → Artifact system.

VERSION="1.1.0"

set -e  # Exit on any error

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT="$(dirname "$(dirname "$0")")"
VERCEL_APP_DIR="${REPO_ROOT}/vercel-companion"
LAUNCHPAD_DIR="${REPO_ROOT}/launchpad-auth-stripe-flow"
LOG_FILE="${REPO_ROOT}/logs/vercel_setup_$(date +%Y%m%d_%H%M%S).log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
  local message="$1"
  local level="${2:-INFO}"
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

# Display script banner
show_banner() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}          InsightPulseAI Vercel Companion Setup - v${VERSION}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Display help message
show_help() {
  show_banner
  echo 
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "Options:"
  echo "  -i, --init         Initialize a new Vercel Companion GUI project"
  echo "  -d, --deploy       Deploy to Vercel"
  echo "  -l, --link         Link to existing Pointer/Manus systems"
  echo "  -a, --all          Do all: init, link, and deploy"
  echo "  -v, --version      Show version"
  echo "  -h, --help         Show this help"
  echo
  echo "Examples:"
  echo "  $0 --init           # Set up a new project"
  echo "  $0 --deploy         # Deploy to Vercel"
  echo "  $0 --all            # Complete setup and deployment"
  echo
}

# Check for required tools
check_requirements() {
  log "Checking requirements..." "INFO"
  
  local missing_tools=()
  
  # Check for Node.js
  if ! command -v node &> /dev/null; then
    missing_tools+=("Node.js")
  else
    local node_version=$(node -v | cut -d 'v' -f 2)
    log "Node.js version: ${node_version}" "INFO"
    
    # Check Node.js version (require 18+)
    if [[ "$(echo "${node_version}" | cut -d '.' -f 1)" -lt 18 ]]; then
      log "Node.js version ${node_version} is less than 18. Please upgrade." "ERROR"
      missing_tools+=("Node.js v18+")
    fi
  fi
  
  # Check for npm
  if ! command -v npm &> /dev/null; then
    missing_tools+=("npm")
  else
    log "npm version: $(npm -v)" "INFO"
  fi
  
  # Check for Vercel CLI
  if ! command -v vercel &> /dev/null; then
    missing_tools+=("Vercel CLI")
  else
    log "Vercel CLI installed" "INFO"
  fi

  # Check for git
  if ! command -v git &> /dev/null; then
    missing_tools+=("git")
  else
    log "git version: $(git --version)" "INFO"
  fi
  
  # If any tools are missing, exit with error
  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    log "Missing required tools: ${missing_tools[*]}" "ERROR"
    echo -e "${RED}Please install the missing tools and try again.${NC}"
    echo -e "${YELLOW}You can install Vercel CLI with: npm install -g vercel${NC}"
    exit 1
  fi
  
  log "All requirements satisfied" "SUCCESS"
}

# Initialize a new Vercel Companion project
initialize_project() {
  log "Initializing Vercel Companion project..." "INFO"
  
  # Check if directory already exists
  if [[ -d "$VERCEL_APP_DIR" ]]; then
    log "Directory $VERCEL_APP_DIR already exists." "WARNING"
    read -p "Do you want to remove it and start fresh? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log "Removing existing directory..." "INFO"
      rm -rf "$VERCEL_APP_DIR"
    else
      log "Using existing directory" "INFO"
      return 0
    fi
  fi
  
  # Create project directory
  mkdir -p "$VERCEL_APP_DIR"
  cd "$VERCEL_APP_DIR"
  
  # Initialize a Next.js project with TypeScript
  log "Creating Next.js app with TypeScript..." "INFO"
  npx create-next-app@latest . --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"
  
  # Install additional dependencies
  log "Installing additional dependencies..." "INFO"
  npm install @vercel/analytics axios swr react-hook-form zod @hookform/resolvers
  
  # Copy relevant components from launchpad-auth
  if [[ -d "$LAUNCHPAD_DIR" ]]; then
    log "Copying components from launchpad-auth-stripe-flow..." "INFO"
    mkdir -p "$VERCEL_APP_DIR/src/components/ui"
    cp -r "$LAUNCHPAD_DIR/src/components/ui/"* "$VERCEL_APP_DIR/src/components/ui/"
  else
    log "Launchpad auth directory not found, skipping component copy" "WARNING"
  fi
  
  # Create environment file
  log "Creating environment file..." "INFO"
  cat > "$VERCEL_APP_DIR/.env.local" << EOF
# Vercel Companion Configuration
NEXT_PUBLIC_APP_VERSION=${VERSION}
NEXT_PUBLIC_POINTER_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MANUS_API_URL=http://localhost:3002/api

# Feature flags
NEXT_PUBLIC_ENABLE_GEZ_FLOW=true
EOF

  log "Project initialization complete" "SUCCESS"
}

# Link to existing systems
link_systems() {
  log "Linking to Pointer/Manus systems..." "INFO"
  
  # Check if project is initialized
  if [[ ! -d "$VERCEL_APP_DIR" ]]; then
    log "Vercel Companion project not initialized. Run --init first." "ERROR"
    exit 1
  fi
  
  cd "$VERCEL_APP_DIR"
  
  # Create system connector configuration
  mkdir -p "$VERCEL_APP_DIR/src/lib"
  
  # Create API client for Pointer system
  log "Creating Pointer API client..." "INFO"
  cat > "$VERCEL_APP_DIR/src/lib/pointer-client.ts" << EOF
/**
 * Pointer API Client
 * Connects to the Pointer system for SKR management
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_POINTER_API_URL || 'http://localhost:3001/api';

export interface SearchQuery {
  query: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export const pointerClient = {
  search: async (query: SearchQuery): Promise<SearchResult[]> => {
    try {
      const response = await axios.post(\`\${API_URL}/search\`, query);
      return response.data.results;
    } catch (error) {
      console.error('Error searching SKR:', error);
      throw error;
    }
  },
  
  backup: async (): Promise<{ status: string; backupPath: string }> => {
    try {
      const response = await axios.post(\`\${API_URL}/backup\`);
      return response.data;
    } catch (error) {
      console.error('Error backing up SKR:', error);
      throw error;
    }
  },
  
  export: async (id?: string): Promise<{ status: string; exportPath: string }> => {
    try {
      const response = await axios.post(\`\${API_URL}/export\`, { id });
      return response.data;
    } catch (error) {
      console.error('Error exporting SKR:', error);
      throw error;
    }
  }
};
EOF
  
  # Create API client for Manus system
  log "Creating Manus API client..." "INFO"
  cat > "$VERCEL_APP_DIR/src/lib/manus-client.ts" << EOF
/**
 * Manus API Client
 * Connects to the Manus system for artifact processing
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_MANUS_API_URL || 'http://localhost:3002/api';

export interface ArtifactRequest {
  skrId: string;
  templateId?: string;
  parameters?: Record<string, any>;
}

export interface Artifact {
  id: string;
  skrId: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export const manusClient = {
  createArtifact: async (request: ArtifactRequest): Promise<Artifact> => {
    try {
      const response = await axios.post(\`\${API_URL}/artifacts\`, request);
      return response.data;
    } catch (error) {
      console.error('Error creating artifact:', error);
      throw error;
    }
  },
  
  getArtifact: async (id: string): Promise<Artifact> => {
    try {
      const response = await axios.get(\`\${API_URL}/artifacts/\${id}\`);
      return response.data;
    } catch (error) {
      console.error('Error fetching artifact:', error);
      throw error;
    }
  },
  
  listArtifacts: async (): Promise<Artifact[]> => {
    try {
      const response = await axios.get(\`\${API_URL}/artifacts\`);
      return response.data;
    } catch (error) {
      console.error('Error listing artifacts:', error);
      throw error;
    }
  }
};
EOF

  # Create simple placeholder API route for local testing
  mkdir -p "$VERCEL_APP_DIR/src/app/api"
  log "Creating API route for local testing..." "INFO"
  
  mkdir -p "$VERCEL_APP_DIR/src/app/api/status/route.ts"
  cat > "$VERCEL_APP_DIR/src/app/api/status/route.ts" << EOF
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'online',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '${VERSION}',
    connections: {
      pointer: process.env.NEXT_PUBLIC_POINTER_API_URL ? 'configured' : 'not configured',
      manus: process.env.NEXT_PUBLIC_MANUS_API_URL ? 'configured' : 'not configured',
    },
    features: {
      gezFlow: process.env.NEXT_PUBLIC_ENABLE_GEZ_FLOW === 'true',
    }
  });
}
EOF

  log "System linking complete" "SUCCESS"
}

# Deploy to Vercel
deploy_to_vercel() {
  log "Deploying to Vercel..." "INFO"
  
  # Check if project is initialized
  if [[ ! -d "$VERCEL_APP_DIR" ]]; then
    log "Vercel Companion project not initialized. Run --init first." "ERROR"
    exit 1
  fi
  
  cd "$VERCEL_APP_DIR"
  
  # Ensure vercel.json exists
  log "Creating Vercel configuration..." "INFO"
  cat > "$VERCEL_APP_DIR/vercel.json" << EOF
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["sfo1"],
  "env": {
    "NEXT_PUBLIC_APP_VERSION": "${VERSION}"
  }
}
EOF

  # Check if user is logged in to Vercel
  if ! vercel whoami &> /dev/null; then
    log "Not logged in to Vercel. Please login first." "INFO"
    vercel login
  fi
  
  # Deploy
  log "Starting deployment..." "INFO"
  vercel deploy --prod
  
  log "Deployment complete" "SUCCESS"
}

# Main execution logic
main() {
  # No arguments, show help
  if [[ $# -eq 0 ]]; then
    show_help
    exit 0
  fi
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)
        show_help
        exit 0
        ;;
      -v|--version)
        echo -e "${BLUE}InsightPulseAI Vercel Companion Setup${NC} v${VERSION}"
        exit 0
        ;;
      -i|--init)
        show_banner
        check_requirements
        initialize_project
        shift
        ;;
      -l|--link)
        show_banner
        check_requirements
        link_systems
        shift
        ;;
      -d|--deploy)
        show_banner
        check_requirements
        deploy_to_vercel
        shift
        ;;
      -a|--all)
        show_banner
        check_requirements
        initialize_project
        link_systems
        deploy_to_vercel
        shift
        ;;
      *)
        log "Unknown option: $1" "ERROR"
        show_help
        exit 1
        ;;
    esac
  done
}

# Execute main function with all arguments
main "$@"