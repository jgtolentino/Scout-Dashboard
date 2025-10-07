# 🛡️ Deployment Safety Guide

## 🚀 Enhanced Production Deployment Scripts

I've created a comprehensive suite of deployment scripts that address common failure points:

### 1. **Pre-Deployment Testing** (`test_deployment_readiness.sh`)
```bash
./test_deployment_readiness.sh
```

Checks:
- ✅ Tool availability and versions
- ✅ Azure/GitHub authentication
- ✅ Environment variables
- ✅ Network connectivity
- ✅ File system permissions
- ✅ Project structure
- ✅ Security (no hardcoded secrets)

### 2. **Safe Deployment** (`deploy_scout_production_safe.sh`)
```bash
./deploy_scout_production_safe.sh
```

Features:
- 🔄 Automatic rollback on failure
- 📝 Comprehensive logging
- 💾 Pre-deployment backups
- 🔁 Retry logic for transient failures
- ⏱️ Deployment tracking with unique IDs
- 🧪 Post-deployment verification

### 3. **Real-time Monitoring** (`monitor_deployment.sh`)
```bash
# One-time check
./monitor_deployment.sh

# Continuous monitoring
./monitor_deployment.sh --continuous
```

Monitors:
- 📊 Azure resource status
- 🌐 Website health (HTTP status, response time)
- 📋 Content validation
- 🔒 SSL certificate status
- ⚡ Performance metrics

### 4. **Rollback Capability** (`rollback_deployment.sh`)
```bash
# Rollback specific deployment
./rollback_deployment.sh 20240124_153045

# List available rollback points
./rollback_deployment.sh
```

## 🎯 Quick Start Commands

### Standard Deployment (with Makefile)
```bash
# Basic deployment
make prod

# With pre-flight checks
make test-ready && make prod
```

### Safe Deployment (recommended for production)
```bash
# 1. Test readiness
./test_deployment_readiness.sh

# 2. Deploy with safety features
./deploy_scout_production_safe.sh

# 3. Monitor deployment
./monitor_deployment.sh --continuous
```

### If Something Goes Wrong
```bash
# Check logs
tail -f logs/deployment_*.log

# Rollback to previous version
./rollback_deployment.sh

# Or use Makefile
make rollback
```

## 🚨 Common Failure Points Addressed

### 1. **Environment Issues**
- ✅ Comprehensive tool version checking
- ✅ PATH validation
- ✅ Environment variable verification with warnings

### 2. **Azure Resource Problems**
- ✅ Pre-deployment resource validation
- ✅ Name collision detection
- ✅ Quota and permission checks
- ✅ Automatic resource creation with error handling

### 3. **Build Failures**
- ✅ Clean builds with cache clearing
- ✅ Dependency installation with retry
- ✅ Detailed build error logging
- ✅ Pre-build backup for recovery

### 4. **Deployment Issues**
- ✅ Token retrieval with retry logic
- ✅ Progress tracking and verbose output
- ✅ Automatic rollback on failure
- ✅ Deployment state preservation

### 5. **Verification Problems**
- ✅ Exponential backoff for health checks
- ✅ Multiple verification methods
- ✅ Content validation (whitelabel compliance)
- ✅ Performance metrics tracking

## 📁 Directory Structure

```
.
├── Makefile                          # Primary deployment automation
├── make_prod.sh                      # User-friendly wrapper
├── deploy_scout_production.sh        # Standard deployment script
├── deploy_scout_production_safe.sh   # Enhanced safe deployment
├── test_deployment_readiness.sh      # Pre-deployment tests
├── monitor_deployment.sh             # Real-time monitoring
├── rollback_deployment.sh            # Rollback functionality
├── .rollback/                        # Rollback data directory
│   └── YYYYMMDD_HHMMSS/             # Deployment snapshots
└── logs/                            # Deployment logs
    └── deployment_*.log             # Timestamped logs
```

## 🔒 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Check for hardcoded values** - Run security tests
3. **Verify whitelabeling** - No internal branding in production
4. **Monitor access logs** - Check Azure Portal regularly
5. **Use rollback points** - Keep deployment history

## 📊 Monitoring Dashboard

Access deployment metrics:
```bash
# Quick status
make status

# Recent logs
make logs

# Cost estimation
make costs
```

## 🆘 Emergency Procedures

### Deployment Stuck
```bash
# 1. Stop current deployment (Ctrl+C)
# 2. Check status
./monitor_deployment.sh

# 3. Rollback if needed
./rollback_deployment.sh
```

### Resource Issues
```bash
# Check Azure quotas
az vm list-usage --location "East US 2"

# Check resource group
az resource list -g RG-TBWA-ProjectScout-Compute
```

### Authentication Problems
```bash
# Re-authenticate Azure
az login

# Re-authenticate GitHub
gh auth login
```

## 🎉 Success Indicators

- ✅ All pre-deployment tests pass
- ✅ HTTP 200 response from dashboard
- ✅ No internal branding visible
- ✅ Response time under 2 seconds
- ✅ SSL certificate valid
- ✅ No error keywords in content

## 📝 Deployment Checklist

- [ ] Environment variables set
- [ ] Azure login active
- [ ] GitHub authentication valid
- [ ] Whitelabeling scripts ready
- [ ] At least 2GB free disk space
- [ ] Network connectivity stable
- [ ] Previous deployment backed up
- [ ] Monitoring terminal ready

---

**Remember**: Always test in a non-production environment first!