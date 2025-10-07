# Dashboard Monitoring and QA Tools

This documentation covers tools for monitoring and quality assurance of your Juicer Insights dashboard deployed on Azure Static Web Apps.

## Dashboard QA Checklist

Use this checklist to verify your dashboard deployment:

1. **Check live dashboard**:
   - Visit [insights_dashboard.html](https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html)
   - Verify layout renders correctly
   - Check that charts populate with data
   - Inspect browser console for errors

2. **Verify auto-redirect**:
   - Visit the [base URL](https://gentle-rock-04e54f40f.6.azurestaticapps.net/) 
   - Confirm it forwards to `/insights_dashboard.html`

3. **Test responsiveness**:
   - Check dashboard on desktop, tablet, and mobile views
   - Verify the layout adapts correctly to different screen sizes

4. **GitHub Actions Logs**:
   - Check GitHub > Actions tab
   - Confirm the latest workflow run completed successfully

## Monitoring Tools

### Visual Regression Testing

Our QA Screenshot tools capture the dashboard's appearance to detect visual regressions:

```bash
# From the tools directory
./capture_dashboard_qa.sh
```

This captures the entire dashboard and stores it in `../docs/images/`.

For chart-specific captures:

```bash
# From the tools directory
./capture_chart_qa.sh
```

### Setting Up Uptime Monitoring (Optional)

You can set up uptime monitoring for your dashboard using Azure Monitor:

1. In Azure Portal, navigate to your Static Web App
2. Click on "Monitoring" > "Alerts"
3. Add a new alert rule for availability

## Automated Integration Tests

Add the following to your workflow to automate dashboard testing:

```yaml
# In .github/workflows/azure-static-web-apps.yml
- name: Test Dashboard
  run: |
    cd tools/js/juicer-stack/tools
    npm install puppeteer
    ./capture_dashboard_qa.sh
    # Add validation logic here
```

## Troubleshooting Common Issues

### Dashboard Not Displaying

1. Check the browser console for JavaScript errors
2. Verify all required JS libraries are loading (Chart.js, etc.)
3. Ensure `staticwebapp.config.json` has correct MIME types and routes

### Charts Not Rendering

1. Check if Chart.js is loaded correctly
2. Verify the data structure passed to the charts
3. Try using the browser's developer tools to debug

### Backend Data Integration Issues

1. Check API endpoints in the network tab
2. Verify CORS settings if applicable
3. Test API responses independently

## Monitoring Schedule

Recommended monitoring cadence:

- Daily: Visual regression checks
- Weekly: Full dashboard QA
- Monthly: Performance analysis and optimization