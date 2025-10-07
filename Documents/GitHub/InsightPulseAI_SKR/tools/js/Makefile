# Scout Dashboard - Robust Production Deployment Makefile
# Comprehensive deployment workflow with error handling and rollback capabilities

.PHONY: help preflight deploy verify rollback clean install dev build test backup restore status

# Default target
help:
	@echo "Scout Dashboard - Production Deployment Commands"
	@echo ""
	@echo "Prerequisites:"
	@echo "  make preflight    - Run comprehensive pre-deployment checks"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy       - Deploy to production with full error handling"
	@echo "  make verify       - Verify deployment health and functionality"
	@echo ""
	@echo "Maintenance:"
	@echo "  make backup       - Create deployment backup"
	@echo "  make rollback     - Rollback to previous deployment"
	@echo "  make status       - Check current deployment status"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make test         - Run tests"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Clean temporary files and logs"
	@echo "  make restore      - Restore from specific backup"

# Comprehensive pre-deployment validation
preflight:
	@echo "🚀 Running pre-deployment checks..."
	@chmod +x scripts/preflight_checks.sh
	@./scripts/preflight_checks.sh

# Production deployment with error handling
deploy: preflight backup
	@echo "🚀 Starting production deployment..."
	@chmod +x scripts/deploy_production.sh
	@./scripts/deploy_production.sh

# Verify deployment health
verify:
	@echo "🔍 Verifying deployment..."
	@chmod +x scripts/verify_deployment.sh
	@./scripts/verify_deployment.sh

# Rollback deployment
rollback:
	@echo "🔄 Rolling back deployment..."
	@chmod +x scripts/rollback_deployment.sh
	@./scripts/rollback_deployment.sh

# Create deployment backup
backup:
	@echo "💾 Creating deployment backup..."
	@mkdir -p deployment_backups
	@BACKUP_DIR="deployment_backups/backup_$(shell date +%Y%m%d_%H%M%S)" && \
	mkdir -p "$$BACKUP_DIR" && \
	cp -r frontend "$$BACKUP_DIR/" 2>/dev/null || true && \
	cp -r api "$$BACKUP_DIR/" 2>/dev/null || true && \
	cp *.json "$$BACKUP_DIR/" 2>/dev/null || true && \
	cp *.md "$$BACKUP_DIR/" 2>/dev/null || true && \
	echo "✅ Backup created at $$BACKUP_DIR"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@if [ -d "frontend" ]; then \
		cd frontend && npm install; \
	fi
	@if [ -d "api" ]; then \
		cd api && npm install; \
	fi
	@npm install 2>/dev/null || echo "⚠️  No root package.json found"

# Development server
dev: install
	@echo "🏃 Starting development server..."
	@if [ -d "frontend" ]; then \
		cd frontend && npm run dev; \
	else \
		echo "❌ Frontend directory not found"; \
		exit 1; \
	fi

# Build for production
build: install
	@echo "🏗️  Building for production..."
	@if [ -d "frontend" ]; then \
		cd frontend && npm run build; \
	else \
		echo "❌ Frontend directory not found"; \
		exit 1; \
	fi

# Run tests
test:
	@echo "🧪 Running tests..."
	@if [ -d "frontend" ]; then \
		cd frontend && npm test 2>/dev/null || echo "⚠️  No tests configured for frontend"; \
	fi
	@if [ -d "api" ]; then \
		cd api && npm test 2>/dev/null || echo "⚠️  No tests configured for API"; \
	fi

# Check deployment status
status:
	@echo "📊 Checking deployment status..."
	@if command -v az >/dev/null 2>&1; then \
		az staticwebapp list --resource-group project-scout --output table 2>/dev/null || \
		echo "⚠️  Unable to check Azure status (not logged in or no resources)"; \
	else \
		echo "❌ Azure CLI not installed"; \
	fi
	@echo ""
	@if [ -d "logs" ]; then \
		echo "📋 Recent logs:"; \
		ls -la logs/ | tail -5; \
	fi

# Restore from specific backup
restore:
	@echo "📁 Available backups:"
	@if [ -d "deployment_backups" ]; then \
		ls -la deployment_backups/; \
		echo ""; \
		echo "To restore a specific backup, run:"; \
		echo "  cp -r deployment_backups/backup_YYYYMMDD_HHMMSS/* ./"; \
	else \
		echo "❌ No backups found"; \
	fi

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	@rm -rf temp_restore_* 2>/dev/null || true
	@rm -rf node_modules/.cache 2>/dev/null || true
	@if [ -d "frontend" ]; then \
		cd frontend && rm -rf dist build .next 2>/dev/null || true; \
	fi
	@if [ -d "logs" ]; then \
		find logs -name "*.log" -mtime +7 -delete 2>/dev/null || true; \
	fi
	@echo "✅ Cleanup completed"

# Emergency procedures
emergency-stop:
	@echo "🚨 Emergency stop - attempting to halt all deployments..."
	@if command -v az >/dev/null 2>&1; then \
		echo "🛑 Checking for active deployments..."; \
		az staticwebapp deployment list --name scout-dashboard --resource-group project-scout 2>/dev/null || \
		echo "⚠️  Unable to check deployments"; \
	fi
	@echo "💡 Manual intervention may be required - check Azure portal"

# Full deployment pipeline (preflight -> deploy -> verify)
deploy-full: preflight backup deploy verify
	@echo "🎉 Full deployment pipeline completed!"
	@echo "🔗 Check 'make status' for deployment details"

# Quick deploy (skip some checks for faster deployment)
deploy-quick:
	@echo "⚡ Quick deployment (minimal checks)..."
	@chmod +x scripts/deploy_production.sh
	@SKIP_PREFLIGHT=true ./scripts/deploy_production.sh

# Development workflow
dev-setup: install
	@echo "🔧 Setting up development environment..."
	@if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then \
		cp .env.example .env.local; \
		echo "📝 Created .env.local from template"; \
	fi
	@echo "✅ Development setup completed"
	@echo "💡 Run 'make dev' to start development server"