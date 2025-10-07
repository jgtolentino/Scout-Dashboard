#!/bin/bash
# Local Development Environment Setup for Scout DLT Pipeline
# This script sets up a local development environment for testing the Scout DLT Pipeline
# including sample data generation and simulation mode for the Client360 Dashboard

# Exit on error
set -e

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="local_setup_$(date +%Y%m%d%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${GREEN}Scout DLT Pipeline Local Development Setup${NC}"
echo "============================================="
echo "$(date): Starting local setup process"
echo ""

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${YELLOW}Warning: $1 is not installed. Some functionality may be limited.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
echo -e "${BLUE}[1/7] Checking required tools${NC}"
check_command "python3" || echo "Python 3 is required for local development"
check_command "pip3" || echo "pip is required for Python package installation"
check_command "node" || echo "Node.js is required for dashboard development"
check_command "npm" || echo "npm is required for package management"
check_command "docker" || echo "Docker is recommended for local database simulation"

# Create local .env file
echo -e "${BLUE}[2/7] Creating local environment configuration${NC}"
if [[ ! -f ".env.local" ]]; then
    cat > .env.local << EOF
# Local Development Environment
SIMULATION_MODE=true
LOCAL_DEV=true

# Database Configuration (for local testing)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scout_local
DB_USER=scout
DB_PASSWORD=scout123

# Dashboard Configuration
DASHBOARD_PORT=3000
API_PORT=3001

# Simulated Data Paths
SAMPLE_DATA_PATH=./sample_data
BRONZE_DATA_PATH=./sample_data/bronze
SILVER_DATA_PATH=./sample_data/silver
GOLD_DATA_PATH=./sample_data/gold
EOF
    echo -e "${GREEN}Created .env.local with default settings${NC}"
else
    echo ".env.local already exists, skipping creation"
fi

# Set up Python virtual environment
echo -e "${BLUE}[3/7] Setting up Python virtual environment${NC}"
if ! check_command "python3"; then
    echo -e "${RED}Python 3 is required. Please install it and try again.${NC}"
    exit 1
fi

if [[ ! -d "venv" ]]; then
    python3 -m venv venv
    echo -e "${GREEN}Created Python virtual environment${NC}"
else
    echo "Python virtual environment already exists"
fi

# Activate virtual environment and install requirements
source venv/bin/activate
echo "Installing Python requirements"
pip install -r pi_client/requirements.txt
pip install pytest pytest-mock pyspark databricks-connect

# Set up Node.js environment for dashboard
echo -e "${BLUE}[4/7] Setting up Node.js environment for dashboard${NC}"
if check_command "npm"; then
    cd client360_dashboard
    npm install
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}Installed Node.js dependencies for dashboard${NC}"
else
    echo -e "${YELLOW}Skipping Node.js setup${NC}"
fi

# Create sample data directories
echo -e "${BLUE}[5/7] Creating sample data structure${NC}"
mkdir -p sample_data/bronze sample_data/silver sample_data/gold

# Generate sample data
echo -e "${BLUE}[6/7] Generating sample data${NC}"
if [[ ! -f "sample_data/sari_sari_heartbeat_data.json" ]]; then
    python3 - << 'EOF'
import json
import random
import datetime
import os
import uuid
from pathlib import Path

# Create base directories
sample_dir = Path("sample_data")
bronze_dir = sample_dir / "bronze"
silver_dir = sample_dir / "silver"
gold_dir = sample_dir / "gold"

# Ensure directories exist
for dir_path in [sample_dir, bronze_dir, silver_dir, gold_dir]:
    dir_path.mkdir(exist_ok=True)

# Sample store data
stores = [
    {"store_id": "S001", "store_name": "Central Sari-Sari Store", "region_name": "NCR", "city_name": "Manila"},
    {"store_id": "S002", "store_name": "Mindanao Convenience", "region_name": "Davao", "city_name": "Davao City"},
    {"store_id": "S003", "store_name": "Visayas Corner Store", "region_name": "Central Visayas", "city_name": "Cebu City"},
    {"store_id": "S004", "store_name": "Luzon Mini Mart", "region_name": "Central Luzon", "city_name": "Angeles City"},
    {"store_id": "S005", "store_name": "Island Convenience", "region_name": "Western Visayas", "city_name": "Iloilo City"}
]

# Sample brands data
brands = [
    {"brand_id": "B001", "brand_name": "Nestle", "company_name": "Nestle Philippines", "is_tbwa_client": True},
    {"brand_id": "B002", "brand_name": "San Miguel", "company_name": "San Miguel Corporation", "is_tbwa_client": False},
    {"brand_id": "B003", "brand_name": "Jollibee", "company_name": "Jollibee Foods Corporation", "is_tbwa_client": True},
    {"brand_id": "B004", "brand_name": "Coca-Cola", "company_name": "Coca-Cola Philippines", "is_tbwa_client": False},
    {"brand_id": "B005", "brand_name": "Universal Robina", "company_name": "URC", "is_tbwa_client": True}
]

# Sample categories
categories = [
    {"category_id": "C001", "category_name": "Beverages"},
    {"category_id": "C002", "category_name": "Snacks"},
    {"category_id": "C003", "category_name": "Household Items"},
    {"category_id": "C004", "category_name": "Personal Care"},
    {"category_id": "C005", "category_name": "Canned Goods"}
]

# Sample products
products = []
for i in range(1, 21):
    brand = random.choice(brands)
    category = random.choice(categories)
    products.append({
        "product_id": f"P{i:03d}",
        "product_name": f"Product {i}",
        "brand_id": brand["brand_id"],
        "brand_name": brand["brand_name"],
        "category_id": category["category_id"],
        "category_name": category["category_name"],
        "default_price": round(random.uniform(10, 500), 2),
        "is_active": random.random() > 0.1
    })

# Generate device heartbeat data
devices = [f"RPI{i:03d}" for i in range(1, 11)]
heartbeat_data = []

for _ in range(100):
    device_id = random.choice(devices)
    store = random.choice(stores)
    timestamp = datetime.datetime.now() - datetime.timedelta(minutes=random.randint(0, 1440))
    
    heartbeat_data.append({
        "device_id": device_id,
        "timestamp": timestamp.isoformat(),
        "store_id": store["store_id"],
        "status": random.choice(["online", "offline", "warning", "error"]),
        "battery_level": str(random.randint(10, 100)),
        "temperature_c": str(round(random.uniform(25, 55), 1)),
        "memory_usage_pct": str(random.randint(10, 95)),
        "disk_usage_pct": str(random.randint(10, 95)),
        "network_signal_strength": str(random.randint(1, 5)),
        "camera_fps": str(round(random.uniform(10, 30), 1)),
        "errors": None if random.random() > 0.2 else "Low disk space",
        "sw_version": f"1.{random.randint(0, 9)}.{random.randint(0, 9)}"
    })

# Generate transcript data
interaction_types = ["greeting", "question", "browsing", "purchase_intent", "checkout", "assistance", "leaving"]
transcripts = []

for _ in range(50):
    store = random.choice(stores)
    timestamp = datetime.datetime.now() - datetime.timedelta(hours=random.randint(0, 72))
    session_id = str(uuid.uuid4())
    
    transcripts.append({
        "device_id": random.choice(devices),
        "timestamp": timestamp.isoformat(),
        "session_id": session_id,
        "interaction_type": random.choice(interaction_types),
        "transcript": "Hello, I'm looking for some snacks for my family.",
        "visual_cues": "customer_approaching",
        "customer_id": f"CUST{random.randint(1, 1000):04d}",
        "store_id": store["store_id"],
        "zone_id": random.choice(["entrance", "checkout", "product_display", "fitting_room"]),
        "confidence": str(round(random.uniform(0.5, 0.98), 2)),
        "duration_sec": str(random.randint(5, 120))
    })

# Generate visual data
visual_data = []
for _ in range(75):
    store = random.choice(stores)
    timestamp = datetime.datetime.now() - datetime.timedelta(hours=random.randint(0, 72))
    session_id = str(uuid.uuid4())
    
    visual_data.append({
        "device_id": random.choice(devices),
        "timestamp": timestamp.isoformat(),
        "session_id": session_id,
        "frame_id": random.randint(1, 1000),
        "detection_type": random.choice(["face", "gesture", "zone", "object"]),
        "confidence": round(random.uniform(0.5, 0.98), 2),
        "bounding_box": {
            "x": random.randint(0, 640),
            "y": random.randint(0, 480),
            "width": random.randint(50, 200),
            "height": random.randint(50, 200)
        },
        "attributes": {
            "age_group": random.choice(["child", "young_adult", "adult", "senior"]),
            "gender": random.choice(["male", "female", "unknown"]),
            "gesture_type": random.choice(["pointing", "waving", "reaching", "none"]),
            "object_class": random.choice(["person", "basket", "product", "currency"]),
            "zone_id": random.choice(["entrance", "checkout", "product_display", "fitting_room"]),
            "motion_direction": random.choice(["entering", "exiting", "browsing", "stationary"]),
            "dwell_time_sec": round(random.uniform(0, 300), 1)
        },
        "metadata": {
            "store_id": store["store_id"],
            "camera_position": random.choice(["entrance", "checkout", "aisle", "ceiling"]),
            "resolution": "640x480",
            "fps": round(random.uniform(15, 30), 1),
            "model_version": "yolov5-1.0.0"
        }
    })

# Generate KPI data
kpi_data = {
    "total_sales": round(random.uniform(50000, 500000), 2),
    "avg_conversion_rate": round(random.uniform(0.1, 0.5), 2),
    "avg_growth_rate": round(random.uniform(-0.05, 0.25), 2),
    "total_stores": len(stores),
    "brand_sentiment": round(random.uniform(50, 90), 1)
}

# Generate regional performance data
regional_performance = []
for region in set(store["region_name"] for store in stores):
    regional_performance.append({
        "region_name": region,
        "total_sales": round(random.uniform(10000, 100000), 2),
        "store_count": random.randint(5, 50),
        "avg_growth_rate": round(random.uniform(-0.05, 0.25), 2),
        "avg_conversion_rate": round(random.uniform(0.1, 0.5), 2)
    })

# Create full sample dataset
sample_data = {
    "data": {
        "stores": stores,
        "brands": brands,
        "products": products,
        "categories": categories,
        "transactions": transcripts,
        "kpis": kpi_data,
        "regions": regional_performance
    }
}

# Save files
with open(sample_dir / "sari_sari_heartbeat_data.json", "w") as f:
    json.dump(heartbeat_data, f, indent=2)

with open(sample_dir / "sari_sari_visual_data.json", "w") as f:
    json.dump(visual_data, f, indent=2)

with open(sample_dir / "sari_sari_simulated_data.json", "w") as f:
    json.dump(sample_data, f, indent=2)

with open(sample_dir / "fmcg_sample_data.json", "w") as f:
    json.dump(sample_data, f, indent=2)

print(f"Generated sample data files in {sample_dir}")
EOF
    echo -e "${GREEN}Generated sample data files${NC}"
else
    echo "Sample data files already exist"
fi

# Create convenience scripts for local development
echo -e "${BLUE}[7/7] Creating convenience scripts${NC}"

# Create start_local_dashboard.sh
cat > start_local_dashboard.sh << 'EOF'
#!/bin/bash
# Start local dashboard for development

# Load local environment variables
if [[ -f .env.local ]]; then
    set -a
    source .env.local
    set +a
fi

# Check if user provided port override
PORT=${1:-$DASHBOARD_PORT}
PORT=${PORT:-3000}

cd client360_dashboard
echo "Starting dashboard on port $PORT"
SIMULATION_MODE=true LOCAL_DEV=true npm run dev -- --port $PORT
EOF
chmod +x start_local_dashboard.sh

# Create start_local_api.sh
cat > start_local_api.sh << 'EOF'
#!/bin/bash
# Start local API server for development

# Load local environment variables
if [[ -f .env.local ]]; then
    set -a
    source .env.local
    set +a
fi

# Check if user provided port override
PORT=${1:-$API_PORT}
PORT=${PORT:-3001}

cd client360_dashboard
echo "Starting API server on port $PORT"
SIMULATION_MODE=true LOCAL_DEV=true npm run api -- --port $PORT
EOF
chmod +x start_local_api.sh

# Create simulate_events.sh
cat > simulate_events.sh << 'EOF'
#!/bin/bash
# Simulate event generation for local testing

# Load local environment variables
if [[ -f .env.local ]]; then
    set -a
    source .env.local
    set +a
fi

# Activate Python environment
source venv/bin/activate

# Run the event simulator
python3 -m sample_data.load_test_data
EOF
chmod +x simulate_events.sh

echo -e "${GREEN}Local development environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Start the local dashboard: ./start_local_dashboard.sh"
echo "3. Start the local API server: ./start_local_api.sh"
echo "4. Simulate event generation: ./simulate_events.sh"
echo ""
echo "For full deployment to Azure, use deploy_end_to_end.sh"
echo "See COMPREHENSIVE_IMPLEMENTATION_GUIDE.md for detailed documentation"
echo ""
echo "Setup log saved to: $LOG_FILE"
exit 0