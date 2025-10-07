# Scout Dashboard URL Structure Implementation Guide

## Overview
This document outlines the proper implementation of URL structures for Scout Dashboard on Azure Static Web Apps, addressing 404 errors and ensuring clean URL patterns.

## Key Requirements

1. **File Structure Organization**
   - Create both directory/index.html AND flat file structures:
     - `/advisor/index.html` AND `/advisor.html`
     - `/edge/index.html` AND `/edge.html` 
     - `/ops/index.html` AND `/ops.html`

2. **Proper Routing Configuration**
   - Implement correct `staticwebapp.config.json` with appropriate routing rules
   - Handle both clean URLs and legacy URLs

## Implementation Details

### File Structure Best Practices

```
/
├── index.html               # Main entry point
├── advisor.html             # Flat file for direct access
├── edge.html                # Flat file for direct access
├── ops.html                 # Flat file for direct access
├── advisor/
│   └── index.html           # For clean URL access
├── edge/
│   └── index.html           # For clean URL access
└── ops/
    └── index.html           # For clean URL access
```

### staticwebapp.config.json Configuration

```json
{
  "routes": [
    { 
      "route": "/advisor", 
      "rewrite": "/advisor/index.html" 
    },
    { 
      "route": "/edge", 
      "rewrite": "/edge/index.html" 
    },
    { 
      "route": "/ops", 
      "rewrite": "/ops/index.html" 
    },
    {
      "route": "/insights_dashboard.html",
      "redirect": "/advisor",
      "statusCode": 301
    },
    {
      "route": "/advisor.html", 
      "rewrite": "/advisor/index.html" 
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*", "/assets/*"]
  }
}
```

### Deployment Process

1. **Prepare the deployment package**:
   - Ensure both directory structure and flat files exist
   - Include proper `staticwebapp.config.json`

2. **Verify URL accessibility**:
   - Test `/advisor` URL (clean URL)
   - Test `/advisor.html` URL (flat file)
   - Test legacy URLs with proper redirects

3. **Use the fix_404_deployment.sh script**:
   - This script automates the process of preparing the deployment package
   - It creates the necessary file structure and config

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| 404 on clean URLs | Ensure both directory structure and proper rewrite rules exist |
| Redirects not working | Check redirect rules in `staticwebapp.config.json` |
| Assets not loading | Verify navigationFallback exclusions include all asset paths |
| Nested routes failing | Add wildcard rules for nested paths (`/advisor/*`) |

## Verification Checklist

- [ ] Clean URLs are accessible (`/advisor`, `/edge`, `/ops`)
- [ ] Direct file URLs work (`/advisor.html`, `/edge.html`, `/ops.html`) 
- [ ] Legacy redirects function properly (`/insights_dashboard.html` → `/advisor`)
- [ ] Asset paths (JS, CSS, images) load correctly
- [ ] All internal links work as expected

## References

- [Azure Static Web Apps routing documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/routes)
- Local script: `fix_404_deployment.sh`
- Example config: `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy-advisor-fixed/staticwebapp.config.json`