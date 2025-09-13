# Cherry-Pick Repository Cleanup Strategy

## Overview

This cleanup strategy preserves ALL original files in the legacy folder while creating clean, production-ready deployments through selective cherry-picking of files.

## Strategy: Preserve Everything, Deploy Clean

### 1. Complete Preservation
- **ALL original files** moved to `/legacy/original/`
- **Zero data loss** - every file preserved
- **Complete audit trail** maintained
- **Full rollback capability** available

### 2. Cherry-Picked Production
- **Only clean files** copied to `/dashboard` and `/edge`
- **Whitelabeling applied** during cherry-picking
- **Production-ready structure** created
- **Client-safe deployments** ensured

## Repository Structure After Cleanup

```
tbwa-smp/project-scout/
├── 📁 dashboard/              # Cherry-picked, clean web dashboard
│   ├── index.html            # Whitelabeled dashboard
│   ├── js/                   # Clean JavaScript files
│   ├── css/                  # Production stylesheets
│   ├── data/                 # Clean data files
│   ├── staticwebapp.config.json
│   └── README.md             # Dashboard deployment guide
├── 📁 edge/                  # Cherry-picked, clean Raspberry Pi app
│   ├── main.py               # Clean edge application
│   ├── requirements.txt      # Production dependencies
│   ├── install.sh            # Raspberry Pi installer
│   ├── config.json           # Clean configuration
│   └── README.md             # Edge deployment guide
├── 📁 legacy/                # ALL original repository content
│   ├── original/             # Complete original repository
│   │   ├── final-locked-dashboard/
│   │   ├── tools/
│   │   ├── agents/
│   │   ├── scripts/
│   │   └── [everything else]
│   ├── docs/                 # Organized documentation
│   ├── tools/                # Development tools
│   ├── config/               # Configuration files
│   └── README.md             # Legacy usage guide
├── 📄 README.md              # Clean project description
├── 📄 LICENSE                # License file
└── 📄 .gitignore             # Production-focused rules
```

## Cherry-Picking Process

### Dashboard Files
1. **Search paths** in legacy for dashboard deployments:
   - `legacy/original/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy`
   - `legacy/original/client360_v2.5.0_whitelabeled`
   - `legacy/original/deploy`

2. **Copy only production files**:
   - `index.html` - Main dashboard
   - `js/` - JavaScript modules
   - `css/` - Stylesheets  
   - `data/` - Data files
   - `staticwebapp.config.json` - Azure config
   - `version.json` - Version info

3. **Apply whitelabeling**:
   - Replace "InsightPulseAI" → "Client360"
   - Replace "TBWA" → "Client"
   - Remove AI signatures
   - Clean internal branding

### Edge Files
1. **Search paths** in legacy for edge components:
   - `legacy/original/edge`
   - `legacy/original/raspberry-pi`
   - `legacy/original/sari-sari-edge`

2. **Copy or create clean files**:
   - `main.py` - Main application
   - `requirements.txt` - Dependencies
   - `install.sh` - Installer script
   - `config.json` - Configuration

3. **Apply whitelabeling** to all Python/shell files

## Benefits of This Approach

### ✅ **Complete Preservation**
- No data loss whatsoever
- Full development history maintained
- Legal/IP protection ensured
- Audit compliance guaranteed

### ✅ **Clean Production**
- Only deployment-ready files in production folders
- Whitelabeled and client-safe
- Professional repository appearance
- No development artifacts exposed

### ✅ **Easy Recovery**
- Any file can be recovered from legacy
- Complete original structure preserved
- No need for git history exploration
- Simple file copy operations

### ✅ **Client Safety**
- No internal branding exposed
- No AI signatures visible
- No development tooling accessible
- Professional presentation guaranteed

## Usage Instructions

### For Developers
```bash
# Work normally, all files preserved in legacy
# Cherry-pick updates to production folders as needed
cp legacy/original/some-new-feature/file.js dashboard/js/

# Apply whitelabeling
sed -i 's/InsightPulseAI/Client360/g' dashboard/js/file.js
```

### For Deployment
```bash
# Dashboard deployment (only clean files)
cd dashboard
az staticwebapp deploy --name scout-dashboard-uat --source ./

# Edge deployment (only clean files)  
cd edge
scp -r . pi@raspberry-pi:/home/pi/client360-edge/
```

### For Recovery
```bash
# Find any original file
find legacy/ -name "filename.ext"

# Recover to workspace
cp legacy/original/path/to/file.ext ./

# Recover entire directory
cp -r legacy/original/some-directory ./
```

## Automated Maintenance

### GitHub Actions
- **Monthly automated cleanup** with cherry-picking
- **Backup creation** before any changes
- **Verification checks** for clean structure
- **Whitelabeling enforcement** on all production files

### Pre-commit Hooks
- **Prevent internal branding** in production folders
- **Allow everything** in legacy folder
- **Enforce clean structure** in root

## Compliance & Security

### Audit Trail
- ✅ Complete original repository in legacy
- ✅ Cherry-picking process documented
- ✅ Whitelabeling changes tracked
- ✅ Deployment history maintained

### Client Safety
- ✅ No internal tooling exposed
- ✅ No development artifacts visible
- ✅ No AI signatures present
- ✅ Professional branding only

### Legal Protection
- ✅ Development history preserved
- ✅ IP timeline documented
- ✅ Original authorship maintained
- ✅ Rollback capabilities available

## Best Practices

### Development Workflow
1. **Develop normally** - work in legacy/original or workspace
2. **Cherry-pick to production** - copy clean files to dashboard/edge
3. **Apply whitelabeling** - clean internal references
4. **Test deployment** - verify production folders work
5. **Commit changes** - only production folders to main

### Client Delivery
1. **Use only production folders** for client deployments
2. **Never expose legacy folder** to clients
3. **Always verify whitelabeling** before delivery
4. **Maintain clean documentation** in production READMEs

### Maintenance
1. **Regular cleanup** via automated scripts
2. **Cherry-pick updates** from legacy to production
3. **Monitor for drift** between legacy and production
4. **Update whitelabeling** rules as needed

This approach ensures **complete preservation** of all development work while providing **clean, professional deployments** suitable for client presentation.