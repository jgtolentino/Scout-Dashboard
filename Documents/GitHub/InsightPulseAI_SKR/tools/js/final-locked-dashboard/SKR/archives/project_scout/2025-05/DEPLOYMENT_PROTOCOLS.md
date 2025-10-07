# InsightPulseAI: Unified Developer Deployment SOP 

**Version:** 1.0  
**Author:** InsightPulseAI Dev Team  
**Date:** 2025-05-14  
**Status:** Approved

## Summary

This document captures the Unified Developer Deployment SOP v1.0 implementation, which standardizes deployment practices across all InsightPulseAI projects, starting with the Scout Analytics Dashboard. This SOP defines directory structures, packaging workflows, deployment procedures, style compliance guidelines, and Pulser integration standards.

## Key Components

### 1. Directory Structure Standard

```
/project_root/
├── scripts/                # All deployment, packaging, and utility scripts
├── public/                 # Static assets (HTML, CSS, JS, images)
├── css/                    # Design system, Tailwind patches, style harmonization
├── js/                     # Visualization logic, GenAI integrations
├── docs/                   # All documentation, SOPs, style guides, and mappings
├── Makefile                # Unified automation entrypoint
└── README_DESKTOP.md       # Human-readable deployment overview
```

### 2. Workflow Scripts

- `scripts/package_dashboard.sh` - Creates deployment packages
- `scripts/deploy_dashboard.sh` - Deploys to Azure Static Web Apps
- `tools/verify_style_compliance.js` - Validates Power BI style compliance
- `tools/monitor_dashboard_uptime.js` - Monitors dashboard availability

### 3. Documentation

- `docs/SOP_DEPLOYMENT.md` - Primary SOP reference
- `docs/QA_GUIDELINES_POWERBI_PARITY.md` - QA guidelines
- `POWER_BI_STYLE_GUIDE.md` - Style specifications
- `README_DESKTOP.md` - Simplified deployment instructions

### 4. Pulser Integration

Pulser tasks and workflows for dashboard deployment automation with the following triggers:

- `:deploy scout` - Deploy Scout dashboard
- `:package scout` - Package dashboard for deployment
- `:validate scout` - Validate deployment (dry run)
- `:deploy full` - Full workflow: package, validate, deploy, monitor
- `:qa dashboard` - Validate QA requirements

## Implementation Details

The Unified Developer Deployment SOP has been implemented in the Scout Analytics Dashboard project. Key improvements include:

1. Standardized directory structure for all components
2. Robust error handling in deployment scripts
3. Environment variable support for cross-environment compatibility
4. Dry-run validation before deployment
5. Automatic packaging with desktop integration
6. Style compliance verification
7. Uptime monitoring
8. Comprehensive documentation

## Reference

The full implementation can be found in the following location:
`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/`

Primary SOP document:
`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/docs/SOP_DEPLOYMENT.md`

## Next Steps

1. Extend the Unified Developer Deployment SOP to other projects
2. Add CI/CD integration with GitHub Actions
3. Develop automated visual regression testing
4. Create a dashboard deployment analytics dashboard

## Related Documents

- `CLAUDE.md` - Project context for Pulser 2.0
- `pulser_tasks.yaml` - Pulser system integration
- `POWER_BI_STYLE_GUIDE.md` - Style guide for Power BI aesthetic