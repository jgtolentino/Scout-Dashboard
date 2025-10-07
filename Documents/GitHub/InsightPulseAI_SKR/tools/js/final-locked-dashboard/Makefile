# Makefile for Scout Analytics Dashboard
# Provides simple automation for packaging and deployment tasks

.PHONY: all help package deploy deploy-dry-run clean

# Default target (help)
all: help

# Help message
help:
	@echo "Scout Analytics Dashboard Build & Deploy"
	@echo "========================================"
	@echo ""
	@echo "Available targets:"
	@echo "  package          Create deployment package"
	@echo "  deploy           Deploy to Azure Static Web Apps"
	@echo "  deploy-dry-run   Perform a dry run of deployment (no actual deploy)"
	@echo "  clean            Clean up temporary files"
	@echo ""
	@echo "Environment variables:"
	@echo "  SCOUT_ROOT_DIR         Root directory (default: current directory)"
	@echo "  AZURE_SWA_NAME         Azure Static Web App name"
	@echo "  AZURE_RESOURCE_GROUP   Azure Resource Group"
	@echo ""
	@echo "Examples:"
	@echo "  make package"
	@echo "  make deploy AZURE_SWA_NAME=my-app AZURE_RESOURCE_GROUP=my-rg"

# Create deployment package
package:
	@echo "Creating deployment package..."
	@./scripts/package_dashboard.sh

# Deploy to Azure Static Web Apps
deploy:
	@echo "Deploying to Azure Static Web Apps..."
	@./scripts/deploy_dashboard.sh

# Perform a dry run of deployment
deploy-dry-run:
	@echo "Performing dry run of deployment..."
	@DRY_RUN=true ./scripts/deploy_dashboard.sh

# Clean up temporary files
clean:
	@echo "Cleaning up temporary files..."
	@rm -rf output/*
	@echo "Cleanup complete"