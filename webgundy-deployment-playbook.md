# 🚀 WebBundy Full-Stack Deployment Playbook

This playbook covers the complete deployment of the WebBundy Suite — including mobile app, attendance and expense APIs, Jason OCR agent, and three web portals with Concur-style design.

---

## 📋 Table of Contents
1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Security Configuration](#security-configuration)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Disaster Recovery](#disaster-recovery)
7. [Performance Optimization](#performance-optimization)

---

## 🔧 Pre-Deployment Requirements

### System Requirements
- **Node.js**: v18+ (LTS recommended)
- **pnpm or npm**: Latest version
- **Docker**: v20+ with Docker Compose
- **PostgreSQL**: v14+ with PostGIS extension
- **Python**: v3.9+ (for OCR fallback)
- **Expo CLI**: Latest version for mobile development
- **Redis**: v7.0+ for session management
- **Nginx**: For reverse proxy (production)

### Cloud Services
- **Azure Blob Storage** or **AWS S3** for file uploads
- **SendGrid** or **AWS SES** for email notifications
- **Twilio** for SMS alerts (optional)
- **CloudFlare** for CDN and DDoS protection

### Development Tools
```bash
# Install required global packages
npm install -g pnpm expo-cli pm2 nodemon

# Verify installations
node --version    # Should be v18+
pnpm --version   # Should be v7+
docker --version # Should be v20+
psql --version   # Should be v14+
```

---

## 🛠 Local Development Setup

### 1. Initial Setup
```bash
# Clone repository
git clone https://github.com/yourcompany/webgundy.git
cd webgundy

# Make scripts executable
chmod +x setup-environment.sh
chmod +x webgundy-web-setup.sh
chmod +x migrations/run-migrations.sh

# Run automated setup
./setup-environment.sh
```

### 2. Database Setup
```bash
# Navigate to migrations
cd migrations/

# Create databases and run migrations
./run-migrations.sh

# Verify database setup
./test-database.sh

# Return to root
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp backend/attendance-api/.env.example backend/attendance-api/.env
cp backend/expense-api/.env.example backend/expense-api/.env

# Edit environment files with your values
# Required: DATABASE_URL, JWT_SECRET, AZURE_STORAGE_CONNECTION
```

### 4. Start Backend Services
```bash
# Terminal 1: Attendance API
cd backend/attendance-api
pnpm install
pnpm dev  # Runs on port 3001

# Terminal 2: Expense API with Jason OCR
cd backend/expense-api
pnpm install
pnpm dev  # Runs on port 3002

# Terminal 3: Jason OCR Service (if using Python version)
cd backend/jason-ocr
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Setup Web Interfaces
```bash
# Run web setup script
./webgundy-web-setup.sh

# Navigate to web directory
cd webgundy-web

# Install dependencies
pnpm install
pnpm run install:all

# Start all web portals concurrently
pnpm run dev
```

### 6. Mobile App Setup
```bash
# Terminal 4: Mobile App
cd mobile/webgundy-geoclock
pnpm install

# Start Expo
npx expo start

# Options:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app
```

### 7. Verify All Services
```bash
# Check service health
curl http://localhost:3001/health  # Attendance API
curl http://localhost:3002/health  # Expense API
curl http://localhost:3000         # Admin Dashboard
curl http://localhost:3003         # Manager Portal
curl http://localhost:3004         # Employee Portal
```

---

## 🚀 Production Deployment

### 1. Infrastructure Setup

#### Option A: Azure Deployment
```yaml
# azure-resources.yaml
resources:
  - type: App Service Plan
    name: webgundy-asp
    sku: P1V2
    
  - type: Web App
    name: webgundy-api
    runtime: NODE|18-lts
    
  - type: PostgreSQL Server
    name: webgundy-db
    version: 14
    sku: B_Gen5_2
    
  - type: Storage Account
    name: webgundystorage
    sku: Standard_LRS
    containers:
      - selfies
      - receipts
      
  - type: Application Insights
    name: webgundy-insights
```

#### Option B: AWS Deployment
```yaml
# aws-cloudformation.yaml
Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: webgundy-cluster
      
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: postgres
      EngineVersion: "14.7"
      DBInstanceClass: db.t3.medium
      
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: webgundy-files
      
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
```

### 2. Docker Deployment
```bash
# Build all images
docker build -t webgundy/attendance-api ./backend/attendance-api
docker build -t webgundy/expense-api ./backend/expense-api
docker build -t webgundy/admin-dashboard ./web/admin-dashboard
docker build -t webgundy/manager-portal ./web/manager-portal
docker build -t webgundy/employee-portal ./web/employee-portal

# Push to registry
docker push webgundy/attendance-api:latest
docker push webgundy/expense-api:latest
docker push webgundy/admin-dashboard:latest
docker push webgundy/manager-portal:latest
docker push webgundy/employee-portal:latest
```

### 3. Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webgundy-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webgundy-api
  template:
    metadata:
      labels:
        app: webgundy-api
    spec:
      containers:
      - name: attendance-api
        image: webgundy/attendance-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 4. Database Migration (Production)
```bash
# Connect to production database
export DATABASE_URL=postgresql://user:pass@prod-host:5432/webgundy

# Run migrations
cd migrations
./run-migrations.sh --production

# Verify
psql $DATABASE_URL -c "SELECT * FROM schema_version;"
```

### 5. SSL/TLS Configuration
```nginx
# /etc/nginx/sites-available/webgundy
server {
    listen 443 ssl http2;
    server_name webgundy.com;
    
    ssl_certificate /etc/letsencrypt/live/webgundy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webgundy.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/attendance {
        proxy_pass http://localhost:3001;
    }
    
    location /api/expense {
        proxy_pass http://localhost:3002;
    }
}
```

---

## 🔐 Security Configuration

### 1. Environment Variables
```bash
# Production .env
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-base64-32>
DATABASE_URL=postgresql://user:pass@host:5432/webgundy
REDIS_URL=redis://user:pass@host:6379
AZURE_STORAGE_CONNECTION=<your-connection-string>
SENTRY_DSN=<your-sentry-dsn>
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
```

### 2. API Security Headers
```javascript
// security-middleware.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. Database Security
```sql
-- Row Level Security
ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_own_entries ON clock_entries
  FOR ALL
  TO authenticated_user
  USING (user_id = current_user_id());

-- Audit logging
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT,
  operation TEXT,
  user_id INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);
```

---

## 📊 Monitoring & Maintenance

### 1. Health Checks
```javascript
// health-check-endpoints.js
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage()
  };
  
  res.status(200).json(health);
});
```

### 2. Monitoring Stack
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      
  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

### 3. Log Aggregation
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs
pm2 monit
```

### 4. Performance Metrics
```javascript
// metrics.js
const promClient = require('prom-client');
const register = new promClient.Registry();

// Define metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

register.registerMetric(httpRequestDuration);
```

---

## 🔄 Disaster Recovery

### 1. Backup Strategy
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump $DATABASE_URL > backups/db_$DATE.sql

# Compress and encrypt
tar -czf - backups/db_$DATE.sql | \
  openssl enc -aes-256-cbc -salt -out backups/db_$DATE.tar.gz.enc

# Upload to cloud
az storage blob upload \
  --container-name backups \
  --file backups/db_$DATE.tar.gz.enc \
  --name db_$DATE.tar.gz.enc

# Clean old backups (keep 30 days)
find backups/ -name "*.sql" -mtime +30 -delete
```

### 2. Recovery Procedures
```bash
# Restore database
openssl enc -d -aes-256-cbc -in backup.tar.gz.enc | tar -xzf -
psql $DATABASE_URL < backup.sql

# Restore files from cloud
az storage blob download \
  --container-name receipts \
  --name $BLOB_NAME \
  --file restored/$BLOB_NAME
```

### 3. Failover Configuration
```yaml
# haproxy.cfg
defaults
  mode http
  timeout connect 5000ms
  timeout client 50000ms
  timeout server 50000ms

backend webgundy_api
  balance roundrobin
  option httpchk GET /health
  server api1 10.0.1.10:3001 check
  server api2 10.0.1.11:3001 check backup
```

---

## ⚡ Performance Optimization

### 1. Caching Strategy
```javascript
// redis-cache.js
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

### 2. Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_clock_entries_user_date ON clock_entries(user_id, entry_date);
CREATE INDEX idx_expenses_status ON expenses(status) WHERE status = 'pending';

-- Partitioning for large tables
CREATE TABLE clock_entries_2024 PARTITION OF clock_entries
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 3. CDN Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.webgundy.com'],
  },
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.webgundy.com'
    : '',
};
```

---

## 🎯 Final Production Checklist

- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Database backed up
- [ ] Monitoring alerts configured
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Rollback plan tested
- [ ] Team trained on procedures
- [ ] Customer support notified

---

## 📞 Support Contacts

- **DevOps Team**: devops@webgundy.com
- **Security Team**: security@webgundy.com
- **On-Call**: +1-xxx-xxx-xxxx
- **Escalation**: management@webgundy.com

---

## 🚦 Go-Live Steps

1. **Final Testing** (T-24h)
   ```bash
   ./scripts/pre-production-test.sh
   ```

2. **Database Migration** (T-2h)
   ```bash
   ./scripts/migrate-production.sh
   ```

3. **Deploy Services** (T-1h)
   ```bash
   ./scripts/deploy-all.sh --production
   ```

4. **Smoke Tests** (T-0)
   ```bash
   ./scripts/smoke-tests.sh
   ```

5. **Monitor & Verify**
   - Check Grafana dashboards
   - Verify Sentry error rates
   - Monitor user activity
   - Review performance metrics

---

## 🎉 Success Criteria

- ✅ All services responding < 200ms
- ✅ Zero critical errors in first hour
- ✅ 99.9% uptime maintained
- ✅ All user roles can login
- ✅ Mobile app syncing correctly
- ✅ Jason OCR processing receipts
- ✅ Expense approvals flowing
- ✅ Clock-in/out working with geofencing

---

**You're now ready for production deployment!** 🚀