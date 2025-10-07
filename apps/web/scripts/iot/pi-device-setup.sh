#!/bin/bash

# Pi Device IoT Setup Script for Scout Dashboard
# This script configures a Raspberry Pi for telemetry ingestion to Scout Dashboard

set -euo pipefail

echo "🥧 Scout Dashboard IoT - Pi Device Setup"
echo "========================================"

# Configuration
SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
IOT_INGEST_ENDPOINT="${SUPABASE_URL}/functions/v1/iot-ingest"
DEVICE_ID="${DEVICE_ID:-$(hostname)-$(date +%s)}"
DEVICE_TYPE="${DEVICE_TYPE:-raspberry_pi}"
ORG_ID="${ORG_ID:-demo-org}"

echo "🔧 Configuration:"
echo "  Device ID: ${DEVICE_ID}"
echo "  Device Type: ${DEVICE_TYPE}"
echo "  Organization: ${ORG_ID}"
echo "  Endpoint: ${IOT_INGEST_ENDPOINT}"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v curl &> /dev/null; then
    echo "❌ curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found, installing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✅ Prerequisites check complete"
echo ""

# Create data collection directory
DATA_DIR="/home/pi/iot-data"
mkdir -p "${DATA_DIR}"
echo "📁 Data directory created: ${DATA_DIR}"

# Create telemetry collection script
echo "📝 Creating telemetry collection script..."
cat > "${DATA_DIR}/collect_telemetry.py" << 'EOF'
#!/usr/bin/env python3

import json
import time
import random
import requests
import psutil
import os
from datetime import datetime, timezone

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://cxzllzyxwpyptfretryc.supabase.co')
IOT_INGEST_ENDPOINT = f"{SUPABASE_URL}/functions/v1/iot-ingest"
DEVICE_ID = os.getenv('DEVICE_ID', 'pi-device-001')
DEVICE_TYPE = os.getenv('DEVICE_TYPE', 'raspberry_pi')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')

def collect_system_metrics():
    """Collect system telemetry from Raspberry Pi"""
    
    # CPU and Memory
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    
    # Disk usage
    disk = psutil.disk_usage('/')
    
    # Network
    network = psutil.net_io_counters()
    
    # Temperature (Pi-specific)
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp_raw = f.read().strip()
            cpu_temp = float(temp_raw) / 1000.0
    except:
        cpu_temp = None
    
    # Load average
    load_avg = os.getloadavg()
    
    return {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'cpu_percent': cpu_percent,
        'memory_percent': memory.percent,
        'memory_used_mb': memory.used // (1024 * 1024),
        'memory_available_mb': memory.available // (1024 * 1024),
        'disk_used_percent': (disk.used / disk.total) * 100,
        'disk_free_gb': disk.free // (1024 * 1024 * 1024),
        'network_bytes_sent': network.bytes_sent,
        'network_bytes_recv': network.bytes_recv,
        'cpu_temp_celsius': cpu_temp,
        'load_avg_1min': load_avg[0],
        'load_avg_5min': load_avg[1],
        'load_avg_15min': load_avg[2],
        'uptime_seconds': time.time() - psutil.boot_time()
    }

def send_telemetry(data):
    """Send telemetry data to Scout Dashboard"""
    
    payload = {
        'device_id': DEVICE_ID,
        'device_type': DEVICE_TYPE,
        'event_data': data,
        'event_timestamp': data['timestamp']
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'x-client-info': 'pi-telemetry/1.0.0'
    }
    
    try:
        response = requests.post(
            IOT_INGEST_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Telemetry sent successfully - Event ID: {result.get('event_id', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to send telemetry: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending telemetry: {str(e)}")
        return False

def main():
    print(f"🥧 Starting telemetry collection for device: {DEVICE_ID}")
    
    while True:
        try:
            # Collect metrics
            metrics = collect_system_metrics()
            print(f"📊 Collected metrics: CPU {metrics['cpu_percent']:.1f}%, "
                  f"Memory {metrics['memory_percent']:.1f}%, "
                  f"Temp {metrics['cpu_temp_celsius']:.1f}°C")
            
            # Send to Scout Dashboard
            success = send_telemetry(metrics)
            
            if success:
                print("💤 Sleeping for 60 seconds...")
            else:
                print("⚠️  Failed to send, will retry in 60 seconds...")
            
            time.sleep(60)
            
        except KeyboardInterrupt:
            print("\n🛑 Telemetry collection stopped by user")
            break
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            time.sleep(60)

if __name__ == "__main__":
    main()
EOF

chmod +x "${DATA_DIR}/collect_telemetry.py"
echo "✅ Telemetry collection script created"

# Create systemd service for auto-start
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/scout-iot-telemetry.service > /dev/null << EOF
[Unit]
Description=Scout Dashboard IoT Telemetry Collection
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=${DATA_DIR}
Environment=DEVICE_ID=${DEVICE_ID}
Environment=DEVICE_TYPE=${DEVICE_TYPE}
Environment=SUPABASE_URL=${SUPABASE_URL}
Environment=SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}
ExecStart=/usr/bin/python3 ${DATA_DIR}/collect_telemetry.py
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service created"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install --user requests psutil

# Create configuration validation script
echo "🧪 Creating configuration test script..."
cat > "${DATA_DIR}/test_connection.py" << 'EOF'
#!/usr/bin/env python3

import json
import requests
import os
from datetime import datetime, timezone

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://cxzllzyxwpyptfretryc.supabase.co')
IOT_INGEST_ENDPOINT = f"{SUPABASE_URL}/functions/v1/iot-ingest"
DEVICE_ID = os.getenv('DEVICE_ID', 'pi-test-device')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')

def test_connection():
    print("🧪 Testing connection to Scout Dashboard IoT Expert...")
    print(f"   Endpoint: {IOT_INGEST_ENDPOINT}")
    print(f"   Device ID: {DEVICE_ID}")
    print("")
    
    # Test 1: OPTIONS request (CORS preflight)
    print("1. Testing CORS preflight...")
    try:
        response = requests.options(IOT_INGEST_ENDPOINT, timeout=5)
        print(f"   Status: {response.status_code}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    # Test 2: Test telemetry payload
    print("\n2. Testing telemetry submission...")
    test_payload = {
        'device_id': DEVICE_ID,
        'device_type': 'test_device',
        'event_data': {
            'test_metric': 42.0,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'message': 'Connection test from Pi device'
        }
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'x-client-info': 'pi-connection-test/1.0.0'
    }
    
    try:
        response = requests.post(
            IOT_INGEST_ENDPOINT,
            json=test_payload,
            headers=headers,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("✅ Connection test successful!")
            return True
        else:
            print("❌ Connection test failed")
            return False
            
    except Exception as e:
        print(f"   Error: {str(e)}")
        print("❌ Connection test failed")
        return False

if __name__ == "__main__":
    test_connection()
EOF

chmod +x "${DATA_DIR}/test_connection.py"

echo ""
echo "🎉 Pi Device Setup Complete!"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Set your Supabase anonymous key:"
echo "   export SUPABASE_ANON_KEY='your-anon-key-here'"
echo ""
echo "2. Test the connection:"
echo "   cd ${DATA_DIR} && python3 test_connection.py"
echo ""
echo "3. Start telemetry collection:"
echo "   sudo systemctl enable scout-iot-telemetry"
echo "   sudo systemctl start scout-iot-telemetry"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status scout-iot-telemetry"
echo ""
echo "5. View logs:"
echo "   sudo journalctl -u scout-iot-telemetry -f"
echo ""
echo "📁 Files created in: ${DATA_DIR}"
echo "🔧 Service: scout-iot-telemetry"
echo ""
echo "🚨 Important: Make sure to set SUPABASE_ANON_KEY before starting!"