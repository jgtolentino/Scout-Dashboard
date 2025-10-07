# GenAI Insights Monitoring Guide

This guide explains how to use the Insights Monitoring dashboard to track the GenAI insights integration's performance, quality, and system health.

## Overview

The GenAI Insights Monitoring tool provides real-time monitoring and visualization of insights generation, processing status, and system health metrics. It helps answer questions like:

- How many insights are being generated?
- Which models are performing best?
- What types of insights are most common?
- How is the system performing over time?
- Are there any processing bottlenecks?

## Getting Started

### Launch the Monitoring Dashboard

Start the monitoring dashboard with default settings:

```bash
cd /path/to/juicer-stack/tools
./run_insights_monitor.sh
```

This will:
1. Start the monitoring server on port 3400
2. Open your default web browser to the dashboard
3. Begin collecting system metrics
4. Automatically refresh every 30 seconds

### Dashboard URL

Access the dashboard directly at:
```
http://localhost:3400/
```

### REST API Endpoint

Metrics are also available as JSON via the API endpoint:
```
http://localhost:3400/api/metrics
```

This endpoint can be integrated with other monitoring systems or custom dashboards.

## Dashboard Features

### Main Dashboard

The dashboard is divided into four main sections:

1. **Insights Overview**: Total count, status distribution, and data layer badges
2. **Model Distribution**: Breakdown of insights by AI model (Claude, GPT-4, DeepSeek)
3. **Insight Types**: Distribution by category (sales, marketing, customer, etc.)
4. **System Health**: Real-time CPU, memory, and disk usage metrics

### Historical Data

The 7-day history section shows:

- Chart visualization of daily insight generation
- Tabular data with trends and top models
- Comparative metrics to identify patterns

## Command-Line Options

Customize the monitoring dashboard using these options:

```bash
# Change the port number
./run_insights_monitor.sh --port=3500

# Set logging verbosity
./run_insights_monitor.sh --log-level=debug  # Options: debug, info, warn, error

# Change history display days
./run_insights_monitor.sh --history=14  # Default: 7

# Disable auto-opening dashboard
./run_insights_monitor.sh --no-dashboard

# Disable auto-refresh
./run_insights_monitor.sh --no-watch

# Change data directory
./run_insights_monitor.sh --data-dir=../custom/path
```

## Production Deployment

For production environments, you can run the monitoring tool as a background service:

```bash
# Run as background service with logging
./run_insights_monitor.sh --no-dashboard --port=3500 > /var/log/insights-monitor.log 2>&1 &

# Save the process ID for later management
echo $! > /var/run/insights-monitor.pid
```

## Dashboard Controls

- **Auto-refresh Toggle**: Enable/disable automatic 30-second page refresh
- **System Health Indicators**: Color-coded gauges (green: normal, yellow: warning, red: critical)
- **Last Updated Timestamp**: Shows when metrics were last collected

## Insights Lifecycle Tracking

The dashboard tracks insights through their entire lifecycle:

- **Pending**: Queued for processing
- **Processing**: Currently being generated
- **Completed**: Successfully generated and available
- **Failed**: Encountered errors during generation

## Data Source

The monitoring dashboard uses these data sources:

1. **Insights Reports**: JSON files in the `data/insights/reports` directory
2. **Metrics History**: Tracked in `data/insights/metrics.json`
3. **System Metrics**: Collected in real-time from the host machine

## Integration with Other Tools

The monitoring system integrates with:

- **Pulser CLI**: Through the `pulser_insights_cli.js` tool
- **Crontab**: For scheduled metrics collection and alerts
- **External Dashboards**: Via the REST API endpoint

## Troubleshooting

If you encounter issues with the monitoring dashboard:

1. **Dashboard won't launch**:
   - Check that Node.js v14+ is installed
   - Verify permissions on the data directory
   - Ensure port 3400 is available

2. **Empty metrics**:
   - Verify insights report files exist in the reports directory
   - Check metrics.json file for proper formatting
   - Run with `--log-level=debug` for detailed logging

3. **High resource usage**:
   - Increase polling interval with custom code modification
   - Run with `--no-watch` to disable auto-refresh

## Best Practices

- **Regular Monitoring**: Check the dashboard daily to track trends
- **Historical Analysis**: Review 7-day trends to identify patterns
- **Alert Setup**: Configure alerts for critical thresholds
- **Capacity Planning**: Use historical data for scaling decisions

## Next Steps

- Configure email alerts for insights failures
- Set up dashboard access controls
- Integrate with Azure Monitor or other enterprise monitoring systems
- Expand metrics collection to include more detailed performance indicators