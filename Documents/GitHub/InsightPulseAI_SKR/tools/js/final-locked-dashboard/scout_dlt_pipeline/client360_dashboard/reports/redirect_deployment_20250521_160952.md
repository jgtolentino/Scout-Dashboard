# Root Redirect Deployment

## Deployment Summary
- **Timestamp:** Wed 21 May 2025 16:09:58 PST
- **Deployment URL:** https://blue-coast-0acb6880f.6.azurestaticapps.net
- **Deployment Package:** output/redirect_20250521_160952.zip

## Configuration
- Root URL ("/") redirects to the dashboard at "/360/index.html"
- All unknown routes redirect to the dashboard 
- No more landing page with multiple options

## Verification
- The dashboard loads automatically when visiting https://blue-coast-0acb6880f.6.azurestaticapps.net
- Direct access to https://blue-coast-0acb6880f.6.azurestaticapps.net/360/ also works
- Previous landing page with multiple options has been removed

This deployment implements the exact Static Web App configuration specified by the user to redirect
the root URL directly to the dashboard, eliminating the need for a landing page selector.
