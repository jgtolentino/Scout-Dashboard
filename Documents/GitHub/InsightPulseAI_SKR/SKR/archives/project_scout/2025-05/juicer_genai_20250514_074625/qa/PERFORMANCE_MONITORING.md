# Performance Monitoring with Grafana

This guide explains how to set up continuous performance monitoring for Scout dashboards using Lighthouse reports and Grafana.

## Overview

Performance metrics from Lighthouse tests are saved as JSON files in the `reports/lh` directory. These can be imported into Grafana to visualize performance trends over time.

## Setup Instructions

### 1. Configure Lighthouse Output

The Lighthouse tests automatically save performance reports in the correct format. No additional configuration is needed.

### 2. Set Up Grafana Dashboard

1. **Install the Lighthouse Grafana Plugin**

   In your Grafana instance, install the "Lighthouse" plugin:
   - Navigate to Configuration > Plugins
   - Search for "Lighthouse"
   - Click "Install"

2. **Create a JSON Data Source**

   - Go to Configuration > Data Sources
   - Click "Add data source"
   - Select "JSON API"
   - Configure the data source to point to your CI system's artifacts URL where Lighthouse JSON reports are stored

3. **Import the Dashboard Template**

   A template dashboard is provided in the `grafana` directory. To import it:
   - In Grafana, go to Create > Import
   - Upload the JSON file from `qa/grafana/lighthouse-dashboard.json`
   - Select your JSON data source
   - Click "Import"

### 3. Configure CI to Archive Lighthouse Reports

Make sure your CI system archives the Lighthouse reports after each run.

#### GitHub Actions Example

```yaml
- name: Upload Lighthouse reports
  uses: actions/upload-artifact@v3
  with:
    name: lighthouse-reports
    path: tools/js/juicer-stack/qa/reports/lh/*.json
    retention-days: 90
```

#### Azure DevOps Example

```yaml
- task: PublishPipelineArtifact@1
  inputs:
    targetPath: 'tools/js/juicer-stack/qa/reports/lh'
    artifact: 'lighthouse-reports'
    publishLocation: 'pipeline'
  displayName: 'Publish Lighthouse Reports'
  condition: always()
```

## Analyzing Performance Trends

The Grafana dashboard shows the following metrics over time:

1. **Performance Score** - Overall Lighthouse performance score (0-100)
2. **Time to Interactive** - How long it takes for the page to become fully interactive
3. **First Contentful Paint** - Time when the first content is painted
4. **Largest Contentful Paint** - Time when the largest content element is painted
5. **Total Blocking Time** - Sum of all time periods where the main thread was blocked
6. **Cumulative Layout Shift** - Measure of unexpected layout shifts

## Setting Up Alerts

You can configure Grafana alerts to notify you when performance degrades:

1. In your dashboard, click on any panel
2. Select "Edit"
3. Go to the "Alert" tab
4. Configure alert conditions (e.g., Performance Score < 80)
5. Set up notification channels (Slack, Email, etc.)

## Troubleshooting

If you don't see data in Grafana:

1. Verify that Lighthouse JSON reports are being generated correctly
2. Check that reports are being archived by your CI system
3. Confirm the JSON data source is correctly configured
4. Ensure the dashboard is pointing to the right data source

## Additional Resources

- [Lighthouse Scoring Documentation](https://web.dev/performance-scoring/)
- [Grafana Alerting Documentation](https://grafana.com/docs/grafana/latest/alerting/)
- [Core Web Vitals](https://web.dev/vitals/)