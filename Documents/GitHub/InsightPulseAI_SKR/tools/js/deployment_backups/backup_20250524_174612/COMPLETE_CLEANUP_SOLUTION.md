# Complete Repository Cleanup Solution

## Overview

This solution provides both **scheduled automated cleanup** and **manual cleanup** options for the `tbwa-smp/project-scout` repository to maintain a minimal, professional structure with only 2 main folders.

## Target Structure

After cleanup, the repository will contain only:

```
tbwa-smp/project-scout/
├── 📁 dashboard/           # Web analytics dashboard
│   ├── index.html          # Main dashboard
│   ├── js/                 # JavaScript files
│   ├── css/                # Stylesheets
│   ├── data/               # Data files
│   └── README.md           # Dashboard deployment instructions
├── 📁 edge/                # Raspberry Pi edge computing app
│   ├── main.py             # Main edge application
│   ├── requirements.txt    # Python dependencies
│   ├── install.sh          # Raspberry Pi installation script
│   ├── config.json         # Edge configuration
│   └── README.md           # Edge deployment instructions
├── 📁 legacy/              # Archived documentation
│   ├── package.json        # Original package info
│   ├── DEPLOYMENT_GUIDE.md # Historical deployment docs
│   └── README.md           # Legacy explanation
├── 📄 README.md            # Clean project description
├── 📄 LICENSE              # License file
├── 📄 .gitignore           # Production-focused rules
└── 📁 .github/             # Workflows (if automated)
```

## Option 1: Automated Scheduled Cleanup

### GitHub Actions Workflow
**File**: `.github/workflows/scheduled-repo-cleanup.yml`

**Features**:
- ✅ Runs monthly (1st of each month at 3 AM UTC)
- ✅ Can be manually triggered
- ✅ Creates backup branches before cleanup
- ✅ Preserves important files in legacy/
- ✅ Generates cleanup reports
- ✅ Commits changes automatically

**Setup**:
1. Copy the workflow file to your repository
2. Commit and push to main branch
3. Enable GitHub Actions if not already enabled
4. The cleanup will run automatically

### Manual Trigger
```bash
# Go to GitHub > Actions > Scheduled Repository Cleanup > Run workflow
```

## Option 2: Manual Cleanup

### Quick Manual Commands
**File**: `manual_repo_cleanup.sh`

**Usage**:
1. Navigate to your `tbwa-smp/project-scout` directory
2. Run: `./manual_repo_cleanup.sh`
3. Copy and paste the displayed commands
4. Verify the final structure

### What It Does:
1. **Creates backup branch** with timestamp
2. **Moves dashboard** from deployment location to `/production`
3. **Archives important docs** to `/legacy`
4. **Removes development directories**:
   - `tools/`
   - `final-locked-dashboard/`
   - `node_modules/`
   - `dist/`, `build/`
   - `scripts/`, `src/`, `test/`
   - `docs/`, `temp/`, `tmp/`
   - `agents/`, `pulser/`
5. **Removes development files**:
   - `.env.local`, `.env.development`
   - `CLAUDE.md`, `.pulserrc`
   - `*.log`, `*.temp`, `*.bak`
   - Internal files (`*_INTERNAL.*`)
   - Archive files (`*.zip`, `*.tar.gz`)
6. **Creates clean documentation**
7. **Commits and tags** the cleanup

## What Gets Preserved

### In `/dashboard`
- Complete Client360 Dashboard deployment
- All necessary JavaScript, CSS, and data files
- Web dashboard ready for Azure Static Web Apps
- Dashboard README with deployment instructions

### In `/edge`
- Raspberry Pi edge computing application
- Speech-to-Text and face detection code
- Python dependencies and installation scripts
- Configuration for sari-sari store data collection
- Edge README with Raspberry Pi setup instructions

### In `/legacy`
- Original `package.json`
- Important deployment guides
- Historical documentation
- Reference materials for audit/compliance

### In Root
- Clean, professional README
- License file
- Production-focused .gitignore
- Essential Git configuration

## What Gets Removed

- ❌ All development tooling (`tools/`, `scripts/`)
- ❌ Build artifacts (`dist/`, `build/`, `node_modules/`)
- ❌ Internal agent configurations (`agents/`, `pulser/`)
- ❌ Development dashboards (`final-locked-dashboard/`)
- ❌ AI assistant signatures and internal branding
- ❌ Temporary files and logs
- ❌ Internal documentation
- ❌ Development environment files

## Benefits

### For Clients
- ✅ **Professional appearance** - Clean, minimal structure
- ✅ **Easy deployment** - Simple `/production` folder
- ✅ **No confusion** - Only essential files visible
- ✅ **Security** - No internal tooling exposed
- ✅ **Trust** - Professional repository management

### For Development Team
- ✅ **Automated maintenance** - No manual work required
- ✅ **Safe cleanup** - Backup branches preserved
- ✅ **Audit trail** - All changes tracked
- ✅ **Rollback capability** - Can recover any files
- ✅ **Compliance** - Meets professional standards

## Recovery Options

If you need to recover removed files:

```bash
# List backup branches
git branch -r | grep backup

# Recover specific file
git checkout backup/cleanup-20250524-120000 -- path/to/file

# Recover entire directory
git checkout backup/cleanup-20250524-120000 -- tools/
```

## Deployment After Cleanup

### Dashboard - Azure Static Web Apps
```bash
cd dashboard
az staticwebapp deploy --name scout-dashboard-uat --source ./
```

### Dashboard - Local Testing
```bash
cd dashboard
python -m http.server 8080
# Visit http://localhost:8080
```

### Edge - Raspberry Pi Installation
```bash
# On Raspberry Pi
cd edge
chmod +x install.sh
./install.sh

# Configure and start
export STORE_ID="sari-sari-001" 
sudo systemctl start client360-edge
sudo systemctl status client360-edge
```

### GitHub Pages
```bash
# Repository settings > Pages > Source: Deploy from branch > main > /dashboard
```

## Monitoring

### Automated (GitHub Actions)
- Monthly cleanup reports in Actions artifacts
- Automatic verification of structure
- Email notifications on failures
- Branch protection maintained

### Manual Verification
```bash
# Check structure
ls -la

# Check dashboard deployment
cd dashboard && ls -la

# Check edge application  
cd edge && ls -la

# Check legacy archives  
cd legacy && ls -la
```

## Implementation Timeline

### Immediate (Manual)
1. Run `manual_repo_cleanup.sh` 
2. Verify structure
3. Test deployment from `/production`
4. Communicate to team

### Ongoing (Automated)
1. Set up GitHub Actions workflow
2. Monitor monthly cleanup reports
3. Adjust cleanup rules as needed
4. Maintain professional standards

## Success Metrics

After implementation:
- ✅ Repository has ≤ 6 root-level items
- ✅ Dashboard files in `/dashboard` and edge app in `/edge`
- ✅ No development artifacts visible
- ✅ Professional README and documentation
- ✅ Clean commit history going forward
- ✅ Client-ready at all times

This solution ensures your repository maintains a professional, minimal structure suitable for client presentation while preserving all necessary functionality and historical reference materials.