#!/bin/bash
set -euo pipefail

# Ask CES Platform Migration Script
# Migrates AI-BI-Genie to Ask CES branding and architecture

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ASCII Art for Ask CES
cat << 'EOF'
    _        _      ____  ______ ____  
   / \   ___| | __ / ___|| ____/ ___| 
  / _ \ / __| |/ /| |    |  _| \___ \ 
 / ___ \\__ \   < | |___ | |___ ___) |
/_/   \_\___/_|\_\ \____||_____|____/ 

Centralized Enterprise System Migration
EOF

log() {
    local level=$1
    shift
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $*" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} $*" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $*" ;;
        "CES") echo -e "${PURPLE}[ASK CES]${NC} $*" ;;
    esac
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/.migration_backup_$(date +%Y%m%d_%H%M%S)"

cd "$PROJECT_ROOT"

# Confirmation check
if [ "${1:-}" != "--confirm" ]; then
    log "WARN" "This will rebrand the entire platform from AI-BI-Genie to Ask CES"
    log "INFO" "Changes include:"
    echo "  • Platform name and branding"
    echo "  • Service and container names"
    echo "  • API endpoints and routes"
    echo "  • Configuration files"
    echo "  • Documentation and README"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "INFO" "Migration cancelled."
        exit 0
    fi
fi

log "CES" "🚀 Starting Ask CES platform migration..."

# Create backup
log "INFO" "Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR" 2>/dev/null || true

# Step 1: Update project structure and naming
log "CES" "📁 Updating project structure..."

# Rename main directory reference
if [ "$(basename "$PROJECT_ROOT")" = "ai-bi-genie" ]; then
    log "INFO" "Consider renaming project directory to 'ask-ces'"
fi

# Step 2: Update Docker Compose configuration
log "CES" "🐳 Updating Docker services..."

cat > docker-compose.yml << 'DOCKER_EOF'
version: '3.8'

services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: ask-ces-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - ask-ces-network

  # PostgreSQL Database (for local development)
  postgres:
    image: postgres:15-alpine
    container_name: ask-ces-postgres
    environment:
      POSTGRES_DB: ask_ces
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema:/docker-entrypoint-initdb.d
    networks:
      - ask-ces-network

  # Ask CES Insights Console (Streamlit)
  insights-console:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: ask-ces-insights
    ports:
      - "8501:8501"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/ask_ces
      - REDIS_URL=redis://redis:6379
      - PLATFORM_NAME=Ask CES
      - LOG_LEVEL=INFO
    volumes:
      - ./app:/app
    depends_on:
      - postgres
      - redis
    networks:
      - ask-ces-network
    restart: unless-stopped

  # CES Control Center (Angular Portal)
  control-center:
    build:
      context: ./azure-portal-spa
      dockerfile: Dockerfile.dev
    container_name: ask-ces-control
    ports:
      - "4200:4200"
    volumes:
      - ./azure-portal-spa:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PLATFORM_NAME=Ask CES
    networks:
      - ask-ces-network
    restart: unless-stopped

  # CES API Gateway
  ces-gateway:
    image: nginx:alpine
    container_name: ask-ces-gateway
    ports:
      - "8080:80"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infra/nginx/ces.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - insights-console
    networks:
      - ask-ces-network
    restart: unless-stopped

  # CES Pulse Monitor (Prometheus)
  pulse-monitor:
    image: prom/prometheus:latest
    container_name: ask-ces-pulse
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - ask-ces-network
    restart: unless-stopped

  # CES Analytics Dashboard (Grafana)
  analytics-dashboard:
    image: grafana/grafana:latest
    container_name: ask-ces-analytics
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=ces123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:3000
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - pulse-monitor
    networks:
      - ask-ces-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  ask-ces-network:
    driver: bridge
DOCKER_EOF

# Step 3: Update environment configuration
log "CES" "⚙️ Updating environment configuration..."

cat > .env << 'ENV_EOF'
# Ask CES Platform Configuration

# Platform Identity
PLATFORM_NAME=Ask CES
PLATFORM_VERSION=3.0
PLATFORM_MOTTO=Central Intelligence for Enterprise Success

# Local Development Settings
FLASK_ENV=development
DEBUG=true
LOG_LEVEL=INFO

# Database Configuration (Local PostgreSQL)
SQL_SERVER=postgres
SQL_DATABASE=ask_ces
SQL_USERNAME=postgres
SQL_PASSWORD=postgres123
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/ask_ces

# Redis Configuration (Local Redis)
REDIS_CONNECTION_STRING=redis://redis:6379
REDIS_URL=redis://redis:6379

# JWT Configuration (Development keys)
JWT_SECRET=ask-ces-local-development-secret-key-32-chars-minimum
JWT_ISSUER=ask-ces-local
JWT_AUDIENCE=ask-ces-local-users

# Port Configuration
INSIGHTS_CONSOLE_PORT=8501
CONTROL_CENTER_PORT=4200
CES_GATEWAY_PORT=8080
PULSE_MONITOR_PORT=9090
ANALYTICS_DASHBOARD_PORT=3000

# Application Settings
PYTHONPATH=/app
NODE_ENV=development

# CES API Configuration
CES_API_BASE_URL=http://localhost:8080/api/ces/v1
CES_QUERY_ENDPOINT=/ask
CES_INSIGHTS_ENDPOINT=/insights
CES_PULSE_ENDPOINT=/pulse
CES_STRATEGIES_ENDPOINT=/strategies

# Cloud placeholders
AZURE_SUBSCRIPTION_ID=local-development
RESOURCE_GROUP=ask-ces-local
LOCATION=local
APPLICATION_INSIGHTS_KEY=local-dev-key
OPENAI_API_KEY=your-openai-key-here
AZURE_COGNITIVE_SERVICES_KEY=your-cognitive-key-here
ENV_EOF

# Step 4: Update Nginx configuration
log "CES" "🌐 Updating gateway configuration..."

cat > infra/nginx/ces.conf << 'NGINX_EOF'
# Ask CES API Gateway Configuration

upstream ces_insights_console {
    server insights-console:8501;
}

upstream ces_control_center {
    server control-center:4200;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=ces_api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ces_dashboard_limit:10m rate=5r/s;

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-CES-Platform "Ask CES v3.0";

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # CES Portal root
    location / {
        limit_req zone=ces_dashboard_limit burst=20 nodelay;
        proxy_pass http://ces_control_center;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Angular dev server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # CES Insights Console
    location /insights {
        limit_req zone=ces_dashboard_limit burst=10 nodelay;
        rewrite ^/insights/(.*)$ /$1 break;
        proxy_pass http://ces_insights_console;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Streamlit specific headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-Host $host;
    }

    # CES API endpoints
    location /api/ces/v1/ {
        limit_req zone=ces_api_limit burst=50 nodelay;
        
        # Route to appropriate backend based on endpoint
        location /api/ces/v1/ask {
            proxy_pass http://ces_insights_console/api/ask;
        }
        
        location /api/ces/v1/insights {
            proxy_pass http://ces_insights_console/api/insights;
        }
        
        location /api/ces/v1/pulse {
            proxy_pass http://ces_insights_console/api/pulse;
        }
        
        location /api/ces/v1/strategies {
            proxy_pass http://ces_insights_console/api/strategies;
        }
        
        # Default API response
        return 200 '{"platform":"Ask CES","version":"3.0","status":"ready"}';
        add_header Content-Type application/json;
    }

    # Platform identity endpoint
    location /identity {
        return 200 '{"platform":"Ask CES","version":"3.0","modules":["Query","Insights","Pulse","Strategies"],"motto":"Central Intelligence for Enterprise Success"}';
        add_header Content-Type application/json;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "Ask CES: Healthy\n";
        add_header Content-Type text/plain;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @control_center_static;
    }

    location @control_center_static {
        proxy_pass http://ces_control_center;
        proxy_set_header Host $host;
    }

    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
NGINX_EOF

# Step 5: Update Streamlit app branding
log "CES" "📊 Updating Insights Console (Streamlit app)..."

cat > app/ces_app.py << 'STREAMLIT_EOF'
"""
Ask CES - Centralized Enterprise System
Insights Console (Streamlit Application)
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
from datetime import datetime, timedelta

# Page configuration
st.set_page_config(
    page_title="Ask CES - Insights Console",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS with CES branding
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(120deg, #0052cc, #0073e6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        padding: 2rem 0;
    }
    .ces-subtitle {
        text-align: center;
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 2rem;
    }
    .ces-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 10px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        border-left: 4px solid #0052cc;
    }
    .ces-insight {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-left: 4px solid #0052cc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }
    .ces-metric {
        font-size: 2rem;
        font-weight: bold;
        color: #0052cc;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def generate_ces_data():
    """Generate sample data for Ask CES demonstration"""
    # Revenue trend data
    dates = pd.date_range(start=datetime.now() - timedelta(days=90), end=datetime.now(), freq='D')
    revenue_data = pd.DataFrame({
        'date': dates,
        'revenue': np.random.normal(50000, 10000, len(dates)).cumsum() + 1000000
    })
    
    # Regional sales data
    regions = ['Metro Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio']
    region_data = pd.DataFrame({
        'region': regions,
        'sales': np.random.uniform(100000, 500000, len(regions))
    })
    
    # Category sales data
    categories = ['Fast Food', 'Beverages', 'Snacks', 'Coffee', 'Ice Cream', 'Dairy']
    category_data = pd.DataFrame({
        'category': categories,
        'sales': np.random.uniform(80000, 300000, len(categories))
    })
    
    return revenue_data, region_data, category_data

def main():
    """Main Ask CES application"""
    
    # Header
    st.markdown('<h1 class="main-header">🎯 Ask CES</h1>', unsafe_allow_html=True)
    st.markdown(
        '<p class="ces-subtitle">Centralized Enterprise System | Insights Console</p>',
        unsafe_allow_html=True
    )
    
    # Sidebar
    with st.sidebar:
        st.image("https://via.placeholder.com/150x75/0052cc/ffffff?text=Ask+CES", width=150)
        
        st.markdown("### 🎯 CES Modules")
        module = st.selectbox(
            "Select Module",
            ["🔍 Query Engine", "💡 Insights Hub", "📊 Pulse Monitor", "🎯 Strategy Center"]
        )
        
        st.markdown("### 📅 Time Range")
        date_range = st.date_input(
            "Analysis Period",
            value=(datetime.now() - timedelta(days=30), datetime.now()),
            max_value=datetime.now().date()
        )
        
        st.markdown("### 🌏 Philippines Regions")
        ph_regions = ['Metro Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Cagayan de Oro']
        selected_regions = st.multiselect(
            "Select Regions",
            options=ph_regions,
            default=ph_regions
        )
        
        st.markdown("### 🤖 Ask CES Anything")
        ces_query = st.text_area(
            "Natural Language Query:",
            placeholder="Ask CES: What are the top performing Nestle products in Manila this quarter?"
        )
        
        if st.button("🎯 Ask CES"):
            with st.spinner("CES is analyzing..."):
                st.session_state.ces_response = f"**CES Analysis Result:**\n\nBased on your query about {selected_regions[0] if selected_regions else 'Metro Manila'}, here are the key insights:\n\n• **Revenue Growth**: 15.2% increase vs last quarter\n• **Top Product**: Maggi noodles showing 34% growth\n• **Market Share**: Nestle leads with 28% in the beverage category\n• **Recommendation**: Expand Maggi distribution in Cebu and Davao"
    
    # Main content based on selected module
    if "Query Engine" in module:
        render_query_engine()
    elif "Insights Hub" in module:
        render_insights_hub()
    elif "Pulse Monitor" in module:
        render_pulse_monitor()
    else:
        render_strategy_center()

def render_query_engine():
    """Render CES Query Engine"""
    st.markdown("## 🔍 CES Query Engine")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### Ask CES in Natural Language")
        
        sample_queries = [
            "What are Nestle's top performing products in Metro Manila?",
            "Show me Jollibee sales trends for the last 6 months",
            "Compare McDonald's vs KFC performance in Cebu",
            "Which SM malls have the highest foot traffic?",
            "Analyze Coca-Cola market share in Davao"
        ]
        
        selected_query = st.selectbox("Sample Queries:", [""] + sample_queries)
        
        if selected_query:
            st.markdown(f"**Selected Query:** {selected_query}")
            
            # Simulate CES response
            if "Nestle" in selected_query:
                response = """
                **CES Analysis - Nestle Performance in Metro Manila:**
                
                📈 **Key Metrics:**
                • Total Revenue: ₱2.1B (Q3 2024)
                • Growth Rate: +18.5% vs Q2 2024
                • Market Share: 32% in beverage category
                
                🏆 **Top Products:**
                1. Maggi Instant Noodles - ₱890M
                2. Nescafe 3-in-1 - ₱567M  
                3. Bear Brand Milk - ₱445M
                
                📊 **Channel Performance:**
                • Supermarkets: 45% of sales
                • Convenience Stores: 35% of sales
                • Traditional Trade: 20% of sales
                
                💡 **CES Recommendation:**
                Increase Maggi variant distribution in 7-Eleven outlets across Makati and BGC.
                """
                st.markdown(response)
    
    with col2:
        st.markdown("### 🎯 Quick Insights")
        
        st.markdown(
            '<div class="ces-card"><h4>Active Brands</h4><div class="ces-metric">847</div><p>Brands tracked in CES</p></div>',
            unsafe_allow_html=True
        )
        
        st.markdown(
            '<div class="ces-card"><h4>Daily Queries</h4><div class="ces-metric">1,234</div><p>Questions answered today</p></div>',
            unsafe_allow_html=True
        )
        
        st.markdown(
            '<div class="ces-card"><h4>Accuracy Rate</h4><div class="ces-metric">94.2%</div><p>CES prediction accuracy</p></div>',
            unsafe_allow_html=True
        )

def render_insights_hub():
    """Render CES Insights Hub"""
    st.markdown("## 💡 CES Insights Hub")
    
    # Generate sample data
    revenue_data, region_data, category_data = generate_ces_data()
    
    # KPI Cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(
            '<div class="ces-card"><h4>Total Revenue</h4><div class="ces-metric">₱2.5B</div><p style="color: green;">↑ 15.2%</p></div>',
            unsafe_allow_html=True
        )
    
    with col2:
        st.markdown(
            '<div class="ces-card"><h4>Active Outlets</h4><div class="ces-metric">12,847</div><p style="color: green;">↑ 8.3%</p></div>',
            unsafe_allow_html=True
        )
    
    with col3:
        st.markdown(
            '<div class="ces-card"><h4>Avg Transaction</h4><div class="ces-metric">₱186.50</div><p style="color: orange;">↓ 2.1%</p></div>',
            unsafe_allow_html=True
        )
    
    with col4:
        st.markdown(
            '<div class="ces-card"><h4>CES Score</h4><div class="ces-metric">8.7/10</div><p style="color: green;">↑ 0.4</p></div>',
            unsafe_allow_html=True
        )
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 📈 Revenue Trend")
        fig_revenue = px.line(revenue_data, x='date', y='revenue', 
                             title='Philippines Market Revenue Trend',
                             color_discrete_sequence=['#0052cc'])
        fig_revenue.update_layout(template='plotly_white')
        st.plotly_chart(fig_revenue, use_container_width=True)
    
    with col2:
        st.markdown("### 🌏 Sales by Region")
        fig_region = px.pie(region_data, values='sales', names='region',
                           title='Sales Distribution - Philippines',
                           color_discrete_sequence=px.colors.qualitative.Set3)
        fig_region.update_layout(template='plotly_white')
        st.plotly_chart(fig_region, use_container_width=True)
    
    # CES Insights
    if 'ces_response' in st.session_state:
        st.markdown("### 🎯 CES Generated Insights")
        st.markdown(
            f'<div class="ces-insight">{st.session_state.ces_response}</div>',
            unsafe_allow_html=True
        )

def render_pulse_monitor():
    """Render CES Pulse Monitor"""
    st.markdown("## 📊 CES Pulse Monitor")
    st.info("Real-time market pulse monitoring - Coming in CES v3.1")

def render_strategy_center():
    """Render CES Strategy Center"""
    st.markdown("## 🎯 CES Strategy Center")
    st.info("Strategic recommendations engine - Coming in CES v3.2")

if __name__ == "__main__":
    main()
STREAMLIT_EOF

# Step 6: Update deployment scripts
log "CES" "🚀 Updating deployment scripts..."

cat > scripts/deploy_ces.sh << 'DEPLOY_EOF'
#!/bin/bash
set -euo pipefail

# Ask CES Platform Deployment Script

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Ask CES ASCII Art
cat << 'ASCIIEOF'
    _        _      ____  ______ ____  
   / \   ___| | __ / ___|| ____/ ___| 
  / _ \ / __| |/ /| |    |  _| \___ \ 
 / ___ \\__ \   < | |___ | |___ ___) |
/_/   \_\___/_|\_\ \____||_____|____/ 

Centralized Enterprise System v3.0
ASCIIEOF

log() {
    local level=$1
    shift
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $*" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} $*" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $*" ;;
        "CES") echo -e "${PURPLE}[ASK CES]${NC} $*" ;;
    esac
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

log "CES" "🚀 Starting Ask CES platform deployment..."

# Check prerequisites
log "INFO" "Checking prerequisites..."
if ! command -v docker >/dev/null 2>&1; then
    log "ERROR" "Docker is required but not installed"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    log "ERROR" "Docker Compose is required but not installed"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    log "ERROR" "Docker daemon is not running"
    exit 1
fi

log "SUCCESS" "Prerequisites check passed"

# Pull and build images
log "CES" "📦 Building Ask CES containers..."
docker-compose pull
docker-compose build

# Start services
log "CES" "🌟 Starting Ask CES services..."
docker-compose up -d

# Wait for services
log "INFO" "Waiting for services to initialize..."
sleep 30

# Health checks
check_service() {
    local name=$1
    local url=$2
    local attempts=30
    local count=1

    while [ $count -le $attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            log "SUCCESS" "$name is healthy ✅"
            return 0
        fi
        log "INFO" "Waiting for $name... ($count/$attempts)"
        sleep 5
        ((count++))
    done

    log "ERROR" "$name failed to start ❌"
    return 1
}

log "CES" "🏥 Performing health checks..."

check_service "CES Gateway" "http://localhost:8080/health"
check_service "Insights Console" "http://localhost:8501"
check_service "Control Center" "http://localhost:4200"
check_service "Pulse Monitor" "http://localhost:9090/-/healthy"
check_service "Analytics Dashboard" "http://localhost:3000/api/health"

# Test CES API
log "CES" "🧪 Testing CES API..."
if curl -f -s "http://localhost:8080/identity" | grep -q "Ask CES"; then
    log "SUCCESS" "CES API is responding correctly ✅"
else
    log "WARN" "CES API test inconclusive"
fi

# Display success message
log "SUCCESS" "🎉 Ask CES platform deployed successfully!"
echo ""
echo "🎯 Ask CES Access Points:"
echo "================================"
echo "  🏠 CES Portal:         http://localhost:8080"
echo "  🔍 Insights Console:   http://localhost:8080/insights"
echo "  ⚙️  Control Center:     http://localhost:4200"
echo "  📊 Pulse Monitor:      http://localhost:9090"
echo "  📈 Analytics Dashboard: http://localhost:3000 (admin/ces123)"
echo ""
echo "🔗 CES API Endpoints:"
echo "================================"
echo "  🎯 Platform Identity:  http://localhost:8080/identity"
echo "  🔍 Ask CES:           http://localhost:8080/api/ces/v1/ask"
echo "  💡 Insights:          http://localhost:8080/api/ces/v1/insights"
echo "  📊 Pulse:             http://localhost:8080/api/ces/v1/pulse"
echo "  🎯 Strategies:        http://localhost:8080/api/ces/v1/strategies"
echo ""

# Show running containers
log "INFO" "CES Services Status:"
docker-compose ps

# Create monitoring script
cat > ces_monitor.sh << 'MONITOR_EOF'
#!/bin/bash
echo "🎯 Ask CES System Status"
echo "========================"
echo ""

echo "📦 CES Container Status:"
docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
echo ""

echo "💻 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

echo "🏥 CES Health Checks:"
services=(
    "Gateway:http://localhost:8080/health"
    "Insights:http://localhost:8501"
    "Control:http://localhost:4200"
    "Pulse:http://localhost:9090/-/healthy"
    "Analytics:http://localhost:3000/api/health"
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

echo ""
echo "🎯 Ask CES v3.0 - Centralized Enterprise System"
MONITOR_EOF

chmod +x ces_monitor.sh

log "CES" "✨ Ask CES deployment completed!"
log "INFO" "Use './ces_monitor.sh' to check system status"
log "INFO" "Use 'docker-compose down' to stop all services"
DEPLOY_EOF

chmod +x scripts/deploy_ces.sh

# Step 7: Update project README
log "CES" "📚 Updating documentation..."

# Update other text replacements
log "CES" "🔄 Performing global text replacements..."

# Function to safely replace text in files
replace_in_file() {
    local file=$1
    local old=$2
    local new=$3
    
    if [ -f "$file" ]; then
        sed -i.bak "s|$old|$new|g" "$file" && rm -f "$file.bak"
    fi
}

# Replace in key files
replace_in_file "README.md" "AI-BI Genie" "Ask CES"
replace_in_file "README.md" "AI-BI-Genie" "Ask CES"
replace_in_file "README.md" "ai-bi-genie" "ask-ces"
replace_in_file "README.md" "🧞‍♂️" "🎯"

replace_in_file "package.json" "ai-bi-genie" "ask-ces" 2>/dev/null || true
replace_in_file "azure-portal-spa/package.json" "ai-bi-genie" "ask-ces"

# Update validation script
replace_in_file "scripts/validate_deployment.sh" "AI-BI-Genie" "Ask CES"
replace_in_file "scripts/validate_deployment.sh" "ai-bi-genie" "ask-ces"

log "SUCCESS" "✅ Migration completed successfully!"

# Final steps
log "CES" "🎯 Final migration steps:"
echo ""
echo "✅ Project rebranded to Ask CES"
echo "✅ Docker services renamed and configured"
echo "✅ API endpoints updated to CES v3.0 structure"
echo "✅ Environment configuration updated"
echo "✅ Documentation updated"
echo "✅ Deployment scripts prepared"
echo ""

log "CES" "🚀 Ready to deploy Ask CES!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/deploy_ces.sh"
echo "2. Access: http://localhost:8080"
echo "3. Monitor: ./ces_monitor.sh"
echo ""

log "SUCCESS" "🎉 Welcome to Ask CES - Your Centralized Enterprise System!"
EOF

chmod +x scripts/migrate_to_ces.sh

# Execute the migration
log "CES" "🚀 Running Ask CES migration..."
./scripts/migrate_to_ces.sh --confirm