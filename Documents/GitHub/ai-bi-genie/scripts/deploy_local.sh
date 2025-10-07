#!/bin/bash
set -euo pipefail

# AI-BI-Genie Local Deployment Script
# This script deploys the AI-BI-Genie platform locally using Docker Compose

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log() {
    local level=$1
    shift
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $*" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} $*" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $*" ;;
    esac
}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

log "INFO" "Starting AI-BI-Genie local deployment..."

# Check prerequisites
log "INFO" "Checking prerequisites..."

if ! command -v docker >/dev/null 2>&1; then
    log "ERROR" "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    log "ERROR" "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    log "ERROR" "Docker daemon is not running. Please start Docker first."
    exit 1
fi

log "SUCCESS" "Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    log "INFO" "Creating .env file from template..."
    cp .env.example .env
    log "WARN" "Please edit .env file with your configuration before proceeding"
    read -p "Press Enter to continue after editing .env file..."
fi

# Create necessary directories
log "INFO" "Creating necessary directories..."
mkdir -p data/{raw,processed,curated,sample}
mkdir -p database/{migrations,schema,functions,seed}
mkdir -p logs

# Pull required images
log "INFO" "Pulling Docker images..."
docker-compose pull

# Build custom images
log "INFO" "Building application images..."
docker-compose build

# Start the services
log "INFO" "Starting services..."
docker-compose up -d

# Wait for services to be ready
log "INFO" "Waiting for services to start..."
sleep 30

# Check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            log "SUCCESS" "$service_name is healthy"
            return 0
        fi
        log "INFO" "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done

    log "ERROR" "$service_name failed to start"
    return 1
}

# Health checks
log "INFO" "Performing health checks..."

check_service_health "Nginx Gateway" "http://localhost:8080/health"
check_service_health "Streamlit Dashboard" "http://localhost:8501"
check_service_health "Angular Portal" "http://localhost:4200"
check_service_health "Prometheus" "http://localhost:9090/-/healthy"
check_service_health "Grafana" "http://localhost:3000/api/health"

# Display service URLs
log "SUCCESS" "AI-BI-Genie deployed successfully!"
echo ""
echo "🌐 Service URLs:"
echo "  📊 Main Portal:       http://localhost:8080"
echo "  📈 Streamlit Dashboard: http://localhost:8080/dashboard"
echo "  ⚙️  Angular Admin:     http://localhost:4200"
echo "  📊 Prometheus:        http://localhost:9090"
echo "  📈 Grafana:           http://localhost:3000 (admin/admin123)"
echo ""
echo "🔧 Development URLs:"
echo "  📱 Streamlit Direct:  http://localhost:8501"
echo "  🅰️  Angular Direct:    http://localhost:4200"
echo "  📊 Redis:             http://localhost:6379"
echo "  🗄️  PostgreSQL:        http://localhost:5432"
echo ""

# Show running containers
log "INFO" "Running containers:"
docker-compose ps

# Show logs command
echo ""
log "INFO" "To view logs, use:"
echo "  docker-compose logs -f [service-name]"
echo ""
log "INFO" "To stop all services, use:"
echo "  docker-compose down"
echo ""
log "INFO" "To stop and remove all data, use:"
echo "  docker-compose down -v"

# Create a simple monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "🔍 AI-BI-Genie System Status"
echo "=============================="
echo ""

# Check if containers are running
echo "📦 Container Status:"
docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
echo ""

# Check resource usage
echo "💻 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Check disk usage
echo "💾 Disk Usage:"
docker system df
echo ""

# Quick health checks
echo "🏥 Health Checks:"
services=(
    "Gateway:http://localhost:8080/health"
    "Streamlit:http://localhost:8501"
    "Angular:http://localhost:4200"
    "Prometheus:http://localhost:9090/-/healthy"
    "Grafana:http://localhost:3000/api/health"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    url=$(echo $service | cut -d: -f2-)
    if curl -f -s "$url" >/dev/null 2>&1; then
        echo "  ✅ $name: Healthy"
    else
        echo "  ❌ $name: Unhealthy"
    fi
done
EOF

chmod +x monitor.sh

log "SUCCESS" "Local deployment completed successfully!"
log "INFO" "Use './monitor.sh' to check system status"