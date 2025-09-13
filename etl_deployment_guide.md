# 🚀 Enhanced ETL Pipeline Deployment Guide

## Complete Implementation for Scout ETL with ML-Powered Column Mapping

This guide provides step-by-step instructions for deploying the enhanced ETL pipeline that integrates your existing Scout infrastructure with advanced column mapping capabilities.

---

## 📋 Prerequisites

### Required Software
```bash
# Python 3.9+
python --version

# PostgreSQL client (for Supabase)
psql --version

# Docker (optional but recommended)
docker --version
```

### Environment Variables
Create a `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=cxzllzyxwpyptfretryc

# ETL Configuration
BATCH_SIZE=500
PARALLEL_WORKERS=4
SYNC_INTERVAL_MINUTES=15
LOG_LEVEL=INFO

# Monitoring
DASHBOARD_PORT=8080
PROMETHEUS_PORT=9090
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# File Paths
INPUT_DATA_PATH=/path/to/input/files
OUTPUT_PATH=/path/to/processed/files
MODEL_PATH=/app/models
```

---

## 🏗️ Database Setup

### Step 1: Run Database Migration

```bash
# Connect to Supabase and run the migration
PGPASSWORD='your-password' psql "postgres://postgres.cxzllzyxwpyptfretryc:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f 025_enhanced_etl_column_mapping.sql
```

### Step 2: Verify Migration Success

```sql
-- Check that new tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'scout'
  AND table_name IN ('column_mappings', 'ml_model_metadata', 'data_quality_metrics', 'transformation_rules');

-- Verify sample data
SELECT COUNT(*) FROM scout.column_mappings;
SELECT COUNT(*) FROM scout.transformation_rules;

-- Test health check function
SELECT * FROM scout.etl_health_check();
```

---

## 📦 Installation

### Option 1: Local Installation

```bash
# Create virtual environment
python -m venv etl_env
source etl_env/bin/activate  # On Windows: etl_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install additional ML dependencies
pip install scikit-learn joblib

# Copy files to working directory
cp etl_unified_column_mapper.py /app/
cp etl_monitoring_dashboard.py /app/
cp cross_tabs_etl_pipeline.py /app/
```

### Option 2: Docker Installation

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install ML dependencies
RUN pip install scikit-learn joblib prometheus-client

# Copy application files
COPY *.py ./
COPY *.sql ./migrations/

# Create directories
RUN mkdir -p /app/logs /app/models /app/data /app/outputs

# Expose ports
EXPOSE 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Run monitoring dashboard
CMD ["python", "etl_monitoring_dashboard.py"]
```

Build and run:
```bash
docker build -t etl-pipeline .
docker run -d --name etl-monitoring \
  --env-file .env \
  -p 8080:8080 \
  -p 9090:9090 \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  etl-pipeline
```

---

## 🔧 Configuration

### ETL Configuration File (`config/etl_config.json`)

```json
{
  "pipeline": {
    "batch_size": 500,
    "parallel_workers": 4,
    "retry_attempts": 3,
    "timeout_seconds": 300
  },
  "column_matching": {
    "fuzzy_threshold": 0.8,
    "enable_ml": true,
    "min_confidence": 0.6,
    "cache_enabled": true,
    "auto_learn": true
  },
  "data_quality": {
    "completeness_threshold": 0.8,
    "uniqueness_threshold": 0.95,
    "validity_threshold": 0.9
  },
  "monitoring": {
    "health_check_interval": 60,
    "metrics_retention_days": 30,
    "alert_cooldown_minutes": 30
  },
  "alerts": {
    "slack": {
      "enabled": true,
      "webhook_url": "${SLACK_WEBHOOK_URL}",
      "channel": "#etl-alerts"
    },
    "email": {
      "enabled": false,
      "recipients": ["admin@example.com"]
    }
  }
}
```

---

## 🚀 Running the System

### Start Individual Components

#### 1. Column Mapping Service
```bash
python etl_unified_column_mapper.py
```

#### 2. Monitoring Dashboard
```bash
python etl_monitoring_dashboard.py --host 0.0.0.0 --port 8080
```

#### 3. ETL Pipeline
```bash
python cross_tabs_etl_pipeline.py
```

### Start Complete System with Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  etl-pipeline:
    build: .
    container_name: scout-etl-enhanced
    restart: unless-stopped
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - BATCH_SIZE=${BATCH_SIZE}
      - LOG_LEVEL=${LOG_LEVEL}
    ports:
      - "8080:8080"  # Dashboard
      - "9090:9090"  # Prometheus
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./models:/app/models
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:alpine
    container_name: etl-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Start the system:
```bash
docker-compose up -d
```

---

## 📊 Accessing the Dashboards

### 1. ETL Monitoring Dashboard
- **URL**: http://localhost:8080
- **Features**:
  - Real-time health metrics
  - Column mapping statistics
  - Alert history
  - ETL performance trends

### 2. Prometheus Metrics
- **URL**: http://localhost:9090/metrics
- **Features**:
  - Raw metrics data
  - Custom ETL metrics
  - System performance data

### 3. API Endpoints

#### Health Check
```bash
curl http://localhost:8080/api/health
```

#### ETL Performance
```bash
curl http://localhost:8080/api/etl-performance
```

#### Column Mapping Stats
```bash
curl http://localhost:8080/api/column-mappings
```

#### Test Alerts
```bash
curl -X POST http://localhost:8080/api/test-alert
```

---

## 🔍 Testing the System

### 1. Test Column Mapping

```python
from etl_unified_column_mapper import UnifiedColumnMapper
import os

# Initialize mapper
mapper = UnifiedColumnMapper(
    supabase_url=os.getenv('SUPABASE_URL'),
    supabase_key=os.getenv('SUPABASE_SERVICE_KEY')
)

# Test mapping
source_columns = ['trans_id', 'store_num', 'payment_type']
target_schema = ['transaction_id', 'store_id', 'payment_method']

mappings = mapper.batch_map_columns(source_columns, target_schema, 'test_sheet')
print("Mappings:", mappings)
```

### 2. Test ETL Pipeline

```python
from cross_tabs_etl_pipeline import CrossTabsETLPipeline

config = {
    'fuzzy_match_threshold': 0.8,
    'batch_size': 100,
    'validate_data': True
}

pipeline = CrossTabsETLPipeline(config)
success = pipeline.run_pipeline(
    '/path/to/test_file.xlsx',
    '/path/to/output'
)
print("Pipeline success:", success)
```

### 3. Test Health Checks

```bash
# Test database connection
PGPASSWORD='your-password' psql "postgres://postgres.cxzllzyxwpyptfretryc:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -c "SELECT * FROM scout.etl_health_check();"

# Test dashboard health
curl -f http://localhost:8080/api/health || echo "Dashboard not responding"

# Test Prometheus metrics
curl -f http://localhost:9090/metrics | head -20
```

---

## 📈 Monitoring and Alerts

### Health Metrics

The system monitors these key metrics:

1. **Pipeline Health**
   - Minutes since last sync
   - Success rate (24h)
   - Average processing time

2. **Column Mapping Effectiveness**
   - Mapping confidence scores
   - Strategy distribution
   - User validation rate

3. **Data Quality**
   - Completeness scores
   - Uniqueness validation
   - Error rates

### Alert Configuration

Alerts are triggered when:
- No sync for >30 minutes (Warning)
- No sync for >60 minutes (Critical)
- Success rate <80% (Warning)
- Data quality <70% (Critical)

### Customizing Alerts

Edit `config/etl_config.json`:
```json
{
  "alerts": {
    "rules": [
      {
        "metric_name": "custom_metric",
        "condition": "greater_than",
        "threshold": 100,
        "severity": "warning",
        "channels": ["slack"],
        "cooldown_minutes": 30
      }
    ]
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Test connection
PGPASSWORD='password' psql "connection_string" -c "SELECT 1;"

# Check firewall/network
curl -I https://cxzllzyxwpyptfretryc.supabase.co
```

#### 2. Column Mapping Not Working
```python
# Check mapping cache
mapper = UnifiedColumnMapper(supabase_url, supabase_key)
print("Cache size:", len(mapper.mapping_cache))

# Retrain ML model
result = mapper.retrain_ml_model()
print("Training result:", result)
```

#### 3. Dashboard Not Loading
```bash
# Check logs
docker logs etl-monitoring

# Test API directly
curl http://localhost:8080/api/health

# Check port binding
netstat -an | grep 8080
```

#### 4. Alerts Not Working
```bash
# Test Slack webhook
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  -d '{"text":"Test message"}'

# Check alert history
curl http://localhost:8080/api/alerts
```

### Performance Tuning

#### Increase Batch Size
```env
BATCH_SIZE=1000  # Increase from 500
PARALLEL_WORKERS=8  # Increase from 4
```

#### Enable ML Model Caching
```python
# In column mapper configuration
config = {
    'cache_enabled': True,
    'cache_ttl': 3600,
    'ml_model_cache': True
}
```

#### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_etl_sync_log_performance
ON scout.etl_sync_log(sync_timestamp DESC, status);

CREATE INDEX CONCURRENTLY idx_column_mappings_performance
ON scout.column_mappings(last_used DESC, confidence_score DESC);
```

---

## 📚 API Documentation

### Column Mapping API

#### Find Mapping
```python
mapping = mapper.find_column_mapping(
    source_column="trans_id",
    available_targets=["transaction_id", "txn_id"],
    sheet_source="sales_data",
    min_confidence=0.6
)
```

#### Batch Mapping
```python
mappings = mapper.batch_map_columns(
    source_columns=["trans_id", "store_num"],
    target_schema=["transaction_id", "store_id"],
    sheet_source="sales_data"
)
```

#### Generate Report
```python
report = mapper.generate_mapping_report(mappings)
print(json.dumps(report, indent=2))
```

### Monitoring API

#### Get Health Metrics
```http
GET /api/health
Content-Type: application/json

Response:
[
  {
    "name": "minutes_since_last_sync",
    "value": 5.2,
    "status": "healthy",
    "details": {...},
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Performance Data
```http
GET /api/etl-performance
Content-Type: application/json

Response:
[
  {
    "sync_date": "2024-01-15",
    "sync_type": "incremental",
    "avg_duration_seconds": 45.2,
    "total_records_processed": 1250,
    "successful_syncs": 24,
    "failed_syncs": 0
  }
]
```

---

## 🔄 Maintenance

### Daily Tasks
- Check dashboard for health status
- Review alert notifications
- Monitor data quality metrics

### Weekly Tasks
- Review column mapping effectiveness
- Analyze ETL performance trends
- Update ML model if needed

### Monthly Tasks
- Full system health review
- Performance optimization
- Update transformation rules

### Backup and Recovery
```bash
# Backup configuration
cp -r config/ backup/config-$(date +%Y%m%d)/

# Backup ML models
cp -r models/ backup/models-$(date +%Y%m%d)/

# Database backup (via Supabase dashboard)
# Or export specific tables
pg_dump -h host -U user -t scout.column_mappings > column_mappings_backup.sql
```

---

## 🎯 Performance Expectations

### Baseline Performance
- **Processing Speed**: 500-1000 records/minute
- **Column Mapping**: <100ms per column
- **ML Prediction**: <50ms per prediction
- **Dashboard Response**: <2 seconds
- **Memory Usage**: <1GB under normal load

### Scaling Recommendations
- **Single File**: Up to 100MB Excel files
- **Concurrent Files**: Up to 5 files simultaneously
- **Daily Volume**: Up to 1M records
- **Column Mappings**: Up to 10K unique mappings

---

## 📞 Support

### Logs Location
- Application logs: `/app/logs/etl.log`
- Error logs: `/app/logs/error.log`
- Docker logs: `docker logs etl-monitoring`

### Debug Commands
```bash
# Check system status
docker-compose ps

# View real-time logs
docker-compose logs -f etl-pipeline

# Connect to database
PGPASSWORD='password' psql "connection_string"

# Test individual components
python -c "from etl_unified_column_mapper import *; print('Column mapper OK')"
python -c "from etl_monitoring_dashboard import *; print('Dashboard OK')"
```

### Health Check URLs
- Dashboard: http://localhost:8080/api/health
- Prometheus: http://localhost:9090/metrics
- Database: Run `SELECT * FROM scout.etl_health_check();`

---

This enhanced ETL pipeline provides a production-ready solution that integrates seamlessly with your existing Scout infrastructure while adding powerful column mapping and monitoring capabilities. 🚀