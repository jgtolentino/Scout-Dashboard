#!/usr/bin/env bash

# PulserBuilder Deployment Script
# This script handles various deployment scenarios for the PulserBuilder application

set -e

# Configuration
PROJECT_NAME="pulserbuilder"
FIREBASE_PROJECT="pulserbuilder-dev"
VERCEL_PROJECT="pulserbuilder"
ENVIRONMENT=${1:-"development"}
DEPLOY_TARGET=${2:-"all"} # all, frontend, backend, functions
SKIP_BUILD=${3:-false}
CURRENT_DIR=$(pwd)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    log_error "$1 is required but not installed."
    exit 1
  fi
}

# Validate required tools
check_deps() {
  log_info "Checking dependencies..."
  check_command "node"
  check_command "npm"
  
  if [[ "$DEPLOY_TARGET" == "backend" || "$DEPLOY_TARGET" == "all" || "$DEPLOY_TARGET" == "functions" ]]; then
    check_command "firebase"
  fi
  
  if [[ "$DEPLOY_TARGET" == "frontend" || "$DEPLOY_TARGET" == "all" ]]; then
    check_command "vercel"
  fi
}

load_env() {
  log_info "Loading $ENVIRONMENT environment configuration..."
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    export NODE_ENV="production"
    FIREBASE_PROJECT="pulserbuilder-prod"
    ENV_FILE=".env.production"
  elif [[ "$ENVIRONMENT" == "staging" ]]; then
    export NODE_ENV="production"
    FIREBASE_PROJECT="pulserbuilder-staging"
    ENV_FILE=".env.staging"
  else
    export NODE_ENV="development"
    FIREBASE_PROJECT="pulserbuilder-dev"
    ENV_FILE=".env.development"
  fi
  
  # Load environment variables if env file exists
  if [[ -f "$ENV_FILE" ]]; then
    log_info "Loading environment variables from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  else
    log_warning "$ENV_FILE not found, using default environment variables"
  fi
}

build_frontend() {
  if [[ "$SKIP_BUILD" == "true" ]]; then
    log_info "Skipping frontend build as requested"
    return
  fi
  
  log_info "Building frontend for $ENVIRONMENT environment..."
  
  # Install dependencies if needed
  if [[ ! -d "node_modules" ]]; then
    log_info "Installing dependencies..."
    npm install
  fi
  
  # Run the build
  log_info "Running build..."
  if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build:production
  elif [[ "$ENVIRONMENT" == "staging" ]]; then
    npm run build:staging
  else
    npm run build
  fi
  
  log_success "Frontend build completed"
}

build_functions() {
  if [[ "$SKIP_BUILD" == "true" ]]; then
    log_info "Skipping functions build as requested"
    return
  fi
  
  log_info "Building Firebase functions for $ENVIRONMENT environment..."
  
  cd "$SCRIPT_DIR/backend/functions"
  
  # Install dependencies if needed
  if [[ ! -d "node_modules" ]]; then
    log_info "Installing functions dependencies..."
    npm install
  fi
  
  # Build the functions
  log_info "Building functions..."
  npm run build
  
  cd "$CURRENT_DIR"
  log_success "Functions build completed"
}

deploy_frontend() {
  log_info "Deploying frontend to Vercel ($ENVIRONMENT)..."
  
  # First build if not skipping
  if [[ "$SKIP_BUILD" != "true" ]]; then
    build_frontend
  fi
  
  # Deploy to Vercel
  if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Deploying to production..."
    vercel --prod
  elif [[ "$ENVIRONMENT" == "staging" ]]; then
    log_info "Deploying to staging..."
    vercel --env NODE_ENV=production
  else
    log_info "Deploying to preview environment..."
    vercel
  fi
  
  log_success "Frontend deployment completed"
}

deploy_functions() {
  log_info "Deploying Firebase functions to $FIREBASE_PROJECT..."
  
  # First build if not skipping
  if [[ "$SKIP_BUILD" != "true" ]]; then
    build_functions
  fi
  
  # Deploy to Firebase
  cd "$SCRIPT_DIR/backend/functions"
  firebase use $FIREBASE_PROJECT
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    firebase deploy --only functions
  else
    firebase deploy --only functions
  fi
  
  cd "$CURRENT_DIR"
  log_success "Functions deployment completed"
}

deploy_backend() {
  log_info "Deploying backend to Firebase ($ENVIRONMENT)..."
  
  # Deploy functions
  deploy_functions
  
  # Deploy Firestore rules and indexes
  firebase use $FIREBASE_PROJECT
  firebase deploy --only firestore
  
  log_success "Backend deployment completed"
}

deploy_all() {
  log_info "Deploying everything to $ENVIRONMENT environment..."
  
  # Deploy backend first
  deploy_backend
  
  # Then deploy frontend
  deploy_frontend
  
  log_success "All deployments completed successfully!"
}

# Main execution
main() {
  cd "$SCRIPT_DIR"
  
  # Print header
  echo "====================================================="
  echo "PulserBuilder Deployment Script"
  echo "Environment: $ENVIRONMENT"
  echo "Target: $DEPLOY_TARGET"
  echo "Skip Build: $SKIP_BUILD"
  echo "====================================================="
  
  # Check dependencies
  check_deps
  
  # Load environment variables
  load_env
  
  # Execute deployment based on target
  case $DEPLOY_TARGET in
    "frontend")
      deploy_frontend
      ;;
    "backend")
      deploy_backend
      ;;
    "functions")
      deploy_functions
      ;;
    "all")
      deploy_all
      ;;
    *)
      log_error "Unknown deployment target: $DEPLOY_TARGET"
      echo "Available targets: all, frontend, backend, functions"
      exit 1
      ;;
  esac
  
  # Final success message
  log_success "Deployment of $DEPLOY_TARGET to $ENVIRONMENT completed successfully!"
}

main "$@"