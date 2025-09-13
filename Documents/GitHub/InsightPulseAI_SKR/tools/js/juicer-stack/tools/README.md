# Juicer GenAI Insights Tools

This directory contains utility tools for the Juicer GenAI Insights platform.

## GenAI Insights Monitoring

### Overview

The GenAI Insights Monitoring system provides real-time visualization and tracking of insights generation, processing status, and system health metrics.

For detailed documentation, see [INSIGHTS_MONITORING_GUIDE.md](../docs/INSIGHTS_MONITORING_GUIDE.md)

### Tools

#### 1. `insights_monitor.js`

A Node.js dashboard application that provides real-time visualization of GenAI insights metrics.

**Features:**
- Interactive web dashboard with automatic refresh
- Multi-model distribution tracking (Claude, GPT-4, DeepSeek)
- Insight type and status visualization
- System health monitoring (CPU, memory, disk)
- Historical data charts for trend analysis
- REST API for metrics integration

**Usage:**
```bash
# Direct usage
node insights_monitor.js --port=3400 --dashboard --watch
```

#### 2. `run_insights_monitor.sh`

User-friendly shell script wrapper for launching the monitoring dashboard.

**Features:**
- Simple command-line interface
- Automatic browser launch
- Configurable refresh rate and history display
- Support for headless operation in production

**Usage:**
```bash
# Start with default settings
./run_insights_monitor.sh

# Custom configuration
./run_insights_monitor.sh --port=3500 --log-level=debug --history=14

# Headless operation for production
./run_insights_monitor.sh --no-dashboard > monitor.log 2>&1 &
```

#### 3. `update_insights_metrics.js`

Utility script for programmatically updating metrics from other tools and scripts.

**Features:**
- Add new insights with model, type, and status
- Reset counters for fresh tracking
- Update system metrics in real-time
- Force recount of all insights from reports directory
- Exportable as a module for integration

**Usage:**
```bash
# Add a new insight (model,type,status)
node update_insights_metrics.js --add-insight=claude,marketing,completed

# Update system metrics
node update_insights_metrics.js --update-system

# Reset all counters
node update_insights_metrics.js --reset-counters

# Force recount from reports directory
node update_insights_metrics.js --force-recount
```

## Dashboard Screenshot Automation

### Overview

The screenshot automation tools allow you to capture visual snapshots of deployed dashboards for:
- Visual QA
- Documentation
- Deployment verification
- Historical comparison

### Tools

#### 1. `shogun_dashboard_capture.sh`

A headless browser-based screenshot tool that captures high-quality images of deployed dashboards.

**Features:**
- Uses Puppeteer (Node.js) or headless Chrome based on available environment
- Handles authentication (if configured)
- Full-page or custom viewport capture
- Consistent naming with timestamps
- Stores images in `assets/screenshots/` directory

**Usage:**
```bash
cd juicer-stack/tools/
./shogun_dashboard_capture.sh [dashboard_url]
```

**Example:**
```bash
# Default URL
./shogun_dashboard_capture.sh

# Custom URL
./shogun_dashboard_capture.sh https://gentle-rock-04e54f40f.6.azurestaticapps.net
```

#### 2. `post_deployment_capture.sh`

Automatically triggers screenshot capture after deployments, with optional waiting periods for full dashboard loading.

**Features:**
- Integrates with CI/CD workflows
- Waits for deployment to stabilize
- Creates deployment logs
- Can be scheduled or triggered manually

**Usage:**
```bash
cd juicer-stack/tools/
./post_deployment_capture.sh [dashboard_url]
```

#### 3. `generate_thumbnails.sh`

Creates thumbnail and compressed versions of dashboard screenshots for documentation and reports.

**Features:**
- Generates thumbnails (300px width) for embedding in docs
- Creates compressed versions (800px JPEG) for reports
- Maintains a versioned archive of screenshots
- Creates an HTML gallery for viewing all screenshots
- Updates documentation links automatically
- Provides Markdown snippets for including in docs

**Usage:**
```bash
cd juicer-stack/tools/
./generate_thumbnails.sh [screenshot_path]
```

**Example:**
```bash
# Process the latest screenshot
./generate_thumbnails.sh

# Process a specific screenshot
./generate_thumbnails.sh /path/to/specific_screenshot.png
```

**Output:**
- Thumbnail: `assets/thumbnails/retail_dashboard_TIMESTAMP_thumb.png`
- Compressed: `assets/reports/retail_dashboard_TIMESTAMP_compressed.jpg`
- Archive: `docs/images/archive/dashboard_TIMESTAMP.png`
- Latest: `docs/images/latest_dashboard.png`
- Gallery: `assets/reports/dashboard_preview.html`

### GitHub Actions Integration

The tools are integrated into the `deploy-insights.yml` workflow to automatically capture screenshots after each deployment:

```yaml
- name: Capture Dashboard Screenshot
  run: |
    chmod +x ./tools/post_deployment_capture.sh
    ./tools/post_deployment_capture.sh ${{ env.DEPLOYED_DASHBOARD_URL }}

- name: Generate Thumbnails
  run: |
    chmod +x ./tools/generate_thumbnails.sh
    ./tools/generate_thumbnails.sh

- name: Upload Screenshot Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: dashboard-screenshots
    path: |
      assets/screenshots/*
      assets/reports/*
      assets/thumbnails/*
```

### Documentation Integration

The screenshot automation tools are integrated with documentation files:

1. **README_FINAL.md**
   - Shows the latest dashboard screenshot
   - Updates automatically after each capture

2. **STAKEHOLDER_BRIEF.md**
   - Displays compressed version of the dashboard for executive summary
   - Updates automatically when running `generate_thumbnails.sh`

3. **HTML Gallery**
   - Provides a visual history of dashboard versions
   - Available at `assets/reports/dashboard_preview.html`

### Requirements

- Node.js 14+ (for Puppeteer)
- Puppeteer or Chrome/Chromium browser
- ImageMagick/ffmpeg (optional, for better image processing)
- Bash shell environment
- Write access to assets and docs directories

### Output Formats

- Screenshots: PNG (high-quality, with transparency support)
- Thumbnails: PNG (300px width)
- Compressed: JPEG (800px width, optimized for reports)
- HTML Gallery: Browser-based viewer for all captured screenshots

## Troubleshooting

**No browser available:**
If neither Node.js/Puppeteer nor Chrome/Chromium is available, the script will exit with an error. Install one of these dependencies:

```bash
# Install Node.js and Puppeteer
npm install -g puppeteer

# Or install Chrome/Chromium
sudo apt install chromium-browser  # Debian/Ubuntu
brew install chromium  # macOS with Homebrew
```

**No image processing tools:**
For better thumbnail generation, install ImageMagick:

```bash
# Debian/Ubuntu
sudo apt install imagemagick

# macOS
brew install imagemagick

# Windows
choco install imagemagick
```

**Authentication issues:**
For dashboards requiring authentication, modify the script to include authentication handling or use pre-authenticated cookies.

**Blank screenshots:**
Increase the wait time for dashboard rendering by modifying the `setTimeout` value in the script.

## Future Enhancements

- Visual diff comparison between captures
- Automatic visual regression testing
- Multi-resolution/device capture
- Automated performance metrics collection