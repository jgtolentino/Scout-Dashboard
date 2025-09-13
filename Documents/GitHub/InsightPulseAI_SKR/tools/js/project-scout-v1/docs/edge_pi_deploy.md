# 🥧 Scout Dashboard - Edge/Raspberry Pi Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Scout Dashboard on edge devices, specifically Raspberry Pi, for scenarios requiring local data processing, offline operation, or data sovereignty.

## Prerequisites

### Hardware Requirements

#### Minimum Configuration
- **Raspberry Pi 4 Model B** (4GB RAM recommended)
- **32GB microSD card** (Class 10 or better)
- **Power supply** (5V 3A USB-C)
- **Network connectivity** (Ethernet or WiFi)

#### Recommended Configuration
- **Raspberry Pi 4 Model B** (8GB RAM)
- **64GB microSD card** (Class 10 or better)
- **External USB drive** (for data storage)
- **Case with cooling** (heat dissipation)

### Software Requirements
- **Raspberry Pi OS** (64-bit, Lite or Desktop)
- **Python 3.8+**
- **Node.js 16+**
- **SQLite 3**
- **Git**

## Installation Steps

### 1. Prepare Raspberry Pi

#### Install Raspberry Pi OS
```bash
# Flash Raspberry Pi OS to microSD card using Raspberry Pi Imager
# Enable SSH and configure WiFi during imaging process

# After first boot, update the system
sudo apt update && sudo apt upgrade -y

# Install required system packages
sudo apt install -y git python3-pip nodejs npm sqlite3 curl wget
```

#### Configure System Settings
```bash
# Expand filesystem (if not done automatically)
sudo raspi-config --expand-rootfs

# Set timezone
sudo timedatectl set-timezone America/New_York  # Adjust for your location

# Configure memory split (reduce GPU memory for headless operation)
echo "gpu_mem=16" | sudo tee -a /boot/config.txt

# Reboot to apply changes
sudo reboot
```

### 2. Install Scout Dashboard

#### Clone Repository
```bash
# Create application directory
sudo mkdir -p /opt/scout-dashboard
sudo chown $USER:$USER /opt/scout-dashboard

# Clone the repository
cd /opt/scout-dashboard
git clone https://github.com/your-org/scout-dashboard.git .
```

#### Install Python Dependencies
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install --upgrade pip
pip install -r requirements.txt

# If requirements.txt doesn't exist, install core dependencies
pip install pandas sqlalchemy requests flask sqlite3
```

#### Install Node.js Dependencies
```bash
# Install Node.js packages
npm install

# Install global dependencies
sudo npm install -g pm2  # Process manager for Node.js
```

### 3. Configure Edge Deployment

#### Create Edge Configuration
```bash
# Copy and modify configuration for edge deployment
cp etl/config/pipeline.json etl/config/pipeline_edge.json
```

Edit `etl/config/pipeline_edge.json`:
```json
{
  "pipeline": {
    "name": "scout-dashboard-edge",
    "version": "1.0.0",
    "description": "Scout Dashboard Edge ETL Pipeline"
  },
  "data_sources": [
    {
      "name": "local_sensors",
      "type": "file",
      "connection": {
        "path": "/opt/scout-dashboard/data/sensors/",
        "format": "json"
      },
      "schedule": "*/5 * * * *",
      "enabled": true
    },
    {
      "name": "api_fallback",
      "type": "api",
      "connection": {
        "url": "https://scout-dashboard-poc-api-v2.azurewebsites.net/api/transactions",
        "method": "GET"
      },
      "schedule": "0 */6 * * *",
      "enabled": true
    }
  ],
  "load_destinations": [
    {
      "name": "local_storage",
      "type": "sqlite",
      "connection": {
        "database": "/opt/scout-dashboard/data/scout_edge.db"
      },
      "enabled": true
    },
    {
      "name": "dashboard_files",
      "type": "json_files",
      "connection": {
        "path": "/opt/scout-dashboard/deploy/data/"
      },
      "enabled": true
    }
  ],
  "edge_deployment": {
    "local_processing": true,
    "sync_interval": 3600,
    "offline_mode": true,
    "compression": true
  }
}
```

#### Create Data Directories
```bash
# Create necessary directories
mkdir -p /opt/scout-dashboard/data/{sensors,logs,backups}
mkdir -p /opt/scout-dashboard/deploy/data
```

### 4. Setup Database

#### Initialize SQLite Database
```bash
# Navigate to project directory
cd /opt/scout-dashboard

# Initialize database
python3 -c "
import sqlite3
import json

# Create database
conn = sqlite3.connect('data/scout_edge.db')

# Create tables
conn.execute('''
CREATE TABLE IF NOT EXISTS scout_transactions (
    id INTEGER PRIMARY KEY,
    transaction_id TEXT,
    timestamp TEXT,
    amount REAL,
    location TEXT,
    processed_at TEXT
)
''')

conn.execute('''
CREATE TABLE IF NOT EXISTS scout_geographic (
    id INTEGER PRIMARY KEY,
    location TEXT,
    latitude REAL,
    longitude REAL,
    region TEXT,
    processed_at TEXT
)
''')

conn.execute('''
CREATE TABLE IF NOT EXISTS scout_products (
    id INTEGER PRIMARY KEY,
    product_id TEXT,
    name TEXT,
    category TEXT,
    brand TEXT,
    price REAL,
    processed_at TEXT
)
''')

# Create indexes
conn.execute('CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON scout_transactions(timestamp)')
conn.execute('CREATE INDEX IF NOT EXISTS idx_geographic_location ON scout_geographic(location)')
conn.execute('CREATE INDEX IF NOT EXISTS idx_products_category ON scout_products(category)')

conn.commit()
conn.close()
print('Database initialized successfully')
"
```

### 5. Configure Services

#### Create Systemd Service for ETL Pipeline
```bash
# Create service file
sudo tee /etc/systemd/system/scout-etl.service > /dev/null <<EOF
[Unit]
Description=Scout Dashboard ETL Pipeline
After=network.target

[Service]
Type=forking
User=pi
WorkingDirectory=/opt/scout-dashboard
Environment=PATH=/opt/scout-dashboard/venv/bin
ExecStart=/opt/scout-dashboard/venv/bin/python etl/run_pipeline.py --config etl/config/pipeline_edge.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable scout-etl
sudo systemctl start scout-etl
```

#### Create Systemd Service for Dashboard
```bash
# Create dashboard service
sudo tee /etc/systemd/system/scout-dashboard.service > /dev/null <<EOF
[Unit]
Description=Scout Dashboard Web Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/scout-dashboard
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node src/api/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable scout-dashboard
sudo systemctl start scout-dashboard
```

### 6. Setup Web Server (Optional)

#### Install and Configure Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/scout-dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name localhost;
    
    # Serve static dashboard files
    location / {
        root /opt/scout-dashboard/deploy;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/scout-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configure Data Collection

#### Setup Local Data Ingestion
```bash
# Create data collection script
tee /opt/scout-dashboard/scripts/collect_sensor_data.py > /dev/null <<EOF
#!/usr/bin/env python3
"""
Local sensor data collection script for Raspberry Pi
"""

import json
import time
import random
from datetime import datetime
from pathlib import Path

def collect_sensor_data():
    """Simulate sensor data collection"""
    data = {
        "timestamp": datetime.now().isoformat(),
        "sensor_id": "pi_sensor_001",
        "temperature": round(random.uniform(20.0, 30.0), 2),
        "humidity": round(random.uniform(40.0, 80.0), 2),
        "foot_traffic": random.randint(0, 50),
        "transaction_count": random.randint(0, 10)
    }
    return data

def save_sensor_data(data):
    """Save sensor data to file"""
    sensor_dir = Path("/opt/scout-dashboard/data/sensors")
    sensor_dir.mkdir(exist_ok=True)
    
    filename = f"sensor_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = sensor_dir / filename
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Sensor data saved to {filepath}")

if __name__ == "__main__":
    while True:
        try:
            data = collect_sensor_data()
            save_sensor_data(data)
            time.sleep(300)  # Collect every 5 minutes
        except KeyboardInterrupt:
            print("Data collection stopped")
            break
        except Exception as e:
            print(f"Error collecting data: {e}")
            time.sleep(60)  # Wait 1 minute before retry
EOF

chmod +x /opt/scout-dashboard/scripts/collect_sensor_data.py
```

#### Create Cron Job for Data Collection
```bash
# Add cron job for data collection
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/scout-dashboard/venv/bin/python /opt/scout-dashboard/scripts/collect_sensor_data.py") | crontab -
```

### 8. Setup Monitoring

#### Create Health Check Script
```bash
tee /opt/scout-dashboard/scripts/health_check.sh > /dev/null <<EOF
#!/bin/bash

# Health check script for Scout Dashboard on Raspberry Pi

echo "Scout Dashboard Edge Health Check - \$(date)"
echo "================================================"

# Check system resources
echo "System Resources:"
echo "CPU Usage: \$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | cut -d'%' -f1)"
echo "Memory Usage: \$(free | grep Mem | awk '{printf \"%.1f%%\", \$3/\$2 * 100.0}')"
echo "Disk Usage: \$(df -h / | awk 'NR==2{printf \"%s\", \$5}')"
echo "Temperature: \$(vcgencmd measure_temp | cut -d'=' -f2)"
echo ""

# Check services
echo "Service Status:"
systemctl is-active --quiet scout-etl && echo "ETL Pipeline: RUNNING" || echo "ETL Pipeline: STOPPED"
systemctl is-active --quiet scout-dashboard && echo "Dashboard: RUNNING" || echo "Dashboard: STOPPED"
systemctl is-active --quiet nginx && echo "Web Server: RUNNING" || echo "Web Server: STOPPED"
echo ""

# Check database
echo "Database Status:"
if [ -f "/opt/scout-dashboard/data/scout_edge.db" ]; then
    RECORD_COUNT=\$(sqlite3 /opt/scout-dashboard/data/scout_edge.db "SELECT COUNT(*) FROM scout_transactions;")
    echo "Database: ACCESSIBLE (\$RECORD_COUNT transactions)"
else
    echo "Database: NOT FOUND"
fi
echo ""

# Check network connectivity
echo "Network Status:"
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo "Internet: CONNECTED"
else
    echo "Internet: DISCONNECTED"
fi

if curl -s http://localhost:3000/api/health &> /dev/null; then
    echo "API Server: ACCESSIBLE"
else
    echo "API Server: NOT ACCESSIBLE"
fi
echo ""

echo "Health check complete"
EOF

chmod +x /opt/scout-dashboard/scripts/health_check.sh

# Add to cron for regular health checks
(crontab -l 2>/dev/null; echo "0 */6 * * * /opt/scout-dashboard/scripts/health_check.sh >> /opt/scout-dashboard/data/logs/health.log 2>&1") | crontab -
```

### 9. Configure Cloud Synchronization (Optional)

#### Create Sync Script
```bash
tee /opt/scout-dashboard/scripts/cloud_sync.py > /dev/null <<EOF
#!/usr/bin/env python3
"""
Cloud synchronization script for edge deployment
"""

import json
import sqlite3
import requests
from datetime import datetime, timedelta
from pathlib import Path

def sync_to_cloud():
    """Sync local data to cloud storage"""
    db_path = "/opt/scout-dashboard/data/scout_edge.db"
    
    if not Path(db_path).exists():
        print("Local database not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        
        # Get recent transactions (last 24 hours)
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        
        cursor = conn.execute("""
            SELECT * FROM scout_transactions 
            WHERE processed_at > ? 
            ORDER BY processed_at DESC
        """, (yesterday,))
        
        transactions = [dict(zip([col[0] for col in cursor.description], row)) 
                       for row in cursor.fetchall()]
        
        conn.close()
        
        if transactions:
            # Send to cloud API (implement your cloud endpoint)
            cloud_endpoint = "https://your-cloud-api.com/api/edge-sync"
            
            payload = {
                "device_id": "pi_edge_001",
                "timestamp": datetime.now().isoformat(),
                "data": transactions
            }
            
            # Uncomment when cloud endpoint is available
            # response = requests.post(cloud_endpoint, json=payload)
            # if response.status_code == 200:
            #     print(f"Synced {len(transactions)} transactions to cloud")
            # else:
            #     print(f"Sync failed: {response.status_code}")
            
            print(f"Would sync {len(transactions)} transactions to cloud")
        else:
            print("No new data to sync")
        
        return True
        
    except Exception as e:
        print(f"Sync error: {e}")
        return False

if __name__ == "__main__":
    sync_to_cloud()
EOF

chmod +x /opt/scout-dashboard/scripts/cloud_sync.py

# Add to cron for regular sync (every 6 hours)
(crontab -l 2>/dev/null; echo "0 */6 * * * /opt/scout-dashboard/venv/bin/python /opt/scout-dashboard/scripts/cloud_sync.py >> /opt/scout-dashboard/data/logs/sync.log 2>&1") | crontab -
```

### 10. Access Dashboard

#### Local Access
```bash
# Access dashboard directly
http://[raspberry-pi-ip]

# Or if using localhost
http://localhost
```

#### Find Raspberry Pi IP Address
```bash
# Get IP address
ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1
```

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check service status
sudo systemctl status scout-etl
sudo systemctl status scout-dashboard

# Check logs
sudo journalctl -u scout-etl -f
sudo journalctl -u scout-dashboard -f
```

#### Database Issues
```bash
# Check database file permissions
ls -la /opt/scout-dashboard/data/scout_edge.db

# Test database connection
sqlite3 /opt/scout-dashboard/data/scout_edge.db ".tables"
```

#### Network Issues
```bash
# Test local API
curl http://localhost:3000/api/health

# Test external connectivity
ping 8.8.8.8
curl https://scout-dashboard-poc-api-v2.azurewebsites.net/api/transactions
```

### Performance Optimization

#### Reduce Memory Usage
```bash
# Limit journal size
sudo journalctl --vacuum-size=100M

# Optimize SQLite
sqlite3 /opt/scout-dashboard/data/scout_edge.db "VACUUM; ANALYZE;"
```

#### Monitor Resources
```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor CPU and memory
htop

# Monitor disk I/O
sudo iotop
```

### Backup and Recovery

#### Create Backup Script
```bash
tee /opt/scout-dashboard/scripts/backup.sh > /dev/null <<EOF
#!/bin/bash

BACKUP_DIR="/opt/scout-dashboard/data/backups"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup database
cp /opt/scout-dashboard/data/scout_edge.db \$BACKUP_DIR/scout_edge_\$TIMESTAMP.db

# Backup configuration
tar -czf \$BACKUP_DIR/config_\$TIMESTAMP.tar.gz etl/config/

# Clean old backups (keep last 7 days)
find \$BACKUP_DIR -name "*.db" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$TIMESTAMP"
EOF

chmod +x /opt/scout-dashboard/scripts/backup.sh

# Add to cron for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scout-dashboard/scripts/backup.sh >> /opt/scout-dashboard/data/logs/backup.log 2>&1") | crontab -
```

## Security Considerations

### Firewall Configuration
```bash
# Install and configure UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow ssh

# Allow HTTP
sudo ufw allow 80

# Allow HTTPS (if using SSL)
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### SSL/TLS Setup (Optional)
```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
# sudo certbot --nginx -d your-domain.com
```

### Secure Configuration
```bash
# Disable unused services
sudo systemctl disable bluetooth
sudo systemctl disable avahi-daemon

# Update system regularly
sudo apt update && sudo apt upgrade -y

# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

This comprehensive guide provides everything needed to deploy the Scout Dashboard on Raspberry Pi for edge computing scenarios, with full local processing capabilities and optional cloud synchronization.