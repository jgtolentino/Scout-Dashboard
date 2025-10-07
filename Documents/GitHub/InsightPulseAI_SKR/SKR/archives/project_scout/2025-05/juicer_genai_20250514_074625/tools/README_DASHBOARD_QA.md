# Dashboard QA Screenshot Tools

These tools capture headless screenshots of dashboards for QA documentation purposes.

## Quick Usage

### Full Dashboard Screenshot

```bash
# From the tools directory
./capture_dashboard_qa.sh

# Specify custom URL and output path
./capture_dashboard_qa.sh "http://localhost:8080" "custom_dashboard.png"
```

### Chart-Only Screenshot

```bash
# From the tools directory
./capture_chart_qa.sh

# Specify custom URL and output path
./capture_chart_qa.sh "http://localhost:8080" "custom_chart.png"
```

## Features

- **Headless Capture**: No browser UI needed
- **Automatic Server**: Starts a local server for the dashboard
- **Thumbnail Generation**: Creates a smaller preview image
- **Timestamped Output**: Default filenames include date/time
- **QA Integration**: Places images in the docs/images folder

## Integration with CI/CD

Add to your GitHub workflow:

```yaml
- name: Capture Dashboard QA Screenshot
  run: |
    cd tools/js/juicer-stack/tools
    npm install puppeteer
    ./capture_dashboard_qa.sh
```

## Requirements

- Node.js
- NPM
- ImageMagick (optional, for thumbnail generation)

## Manual Screenshot Capturing

You can also use the Node.js script directly:

```bash
# Install dependencies
npm install puppeteer

# Run the script
node qa_screenshot.js "http://localhost:3000" "output.png"
```

## Integrating Screenshots into QA Reports

Add the following to your Markdown reports:

```markdown
## Dashboard QA Verification

![Dashboard QA Screenshot](../images/20250513_123456_dashboard_qa.png)

*Screenshot captured on May 13, 2025*
```