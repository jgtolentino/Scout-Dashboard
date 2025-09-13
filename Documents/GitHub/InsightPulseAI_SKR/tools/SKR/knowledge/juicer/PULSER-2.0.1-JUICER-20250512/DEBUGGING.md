# Juicer Debugging and Troubleshooting Guide

This document provides guidance for debugging and troubleshooting common issues with Juicer components.

## Node.js Backend Debugging

### Common Issues

1. **node-fetch Dependency**
   
   If you encounter errors related to `fetch` not being found:
   
   ```
   ReferenceError: fetch is not defined
   ```
   
   **Solution:** Ensure node-fetch is installed:
   
   ```bash
   npm install node-fetch@3.3.2
   ```
   
   Or for CommonJS modules, use:
   
   ```js
   // In juicer.js
   const fetch = require('node-fetch');
   ```

2. **Invalid JSON Response**
   
   ```
   SyntaxError: Unexpected token in JSON at position X
   ```
   
   **Solution:** Check for malformed JSON in response handlers. Set breakpoints in:
   
   - `router/commands/juicer.js` in the executeQuery and generateSketchFromResults functions
   - Check if the sketch generation API is returning valid JSON

### Debugging the Juicer Command Handler

```bash
# Run with Node.js debugging enabled
NODE_DEBUG=juicer node --inspect router/index.js
```

Then connect using Chrome DevTools at chrome://inspect.

## Python CLI Debugging

### Common Issues

1. **Missing Rich Library**
   
   ```
   ModuleNotFoundError: No module named 'rich'
   ```
   
   **Solution:** Install dependencies:
   
   ```bash
   pip install -r juicer-stack/cli/requirements.txt
   ```

2. **API Connection Issues**
   
   If you encounter connection errors when the CLI tries to connect to the Node.js API:
   
   **Solution:** Check configuration in `~/.pulser/juicer_config.json`:
   
   ```bash
   # Create the config directory if it doesn't exist
   mkdir -p ~/.pulser
   
   # Create a default config file
   cat > ~/.pulser/juicer_config.json << EOF
   {
     "workspace_url": "https://adb-123456789.0.azuredatabricks.net",
     "api_token": "",
     "default_cluster_id": "",
     "notebooks_path": "/juicer",
     "local_api_url": "http://localhost:3001/api"
   }
   EOF
   ```

### Debugging the Python CLI

```bash
# Enable verbose logging
python -m juicer-stack.cli.juicer_cli --debug query "Show brand mentions"

# Set the log level
export JUICER_LOG_LEVEL=DEBUG
```

## Dashboard Debugging

### Common Issues

1. **Chart.js Not Loading**
   
   If charts aren't rendering:
   
   **Solution:** Check browser console for errors and ensure Chart.js is loading from CDN:
   
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
   ```

2. **SVG Rendering Issues**
   
   If SVGs aren't displaying correctly:
   
   **Solution:** Check browser console for errors and ensure SVG content is valid XML.

### Testing the Dashboard Locally

```bash
# Using Python's built-in HTTP server
cd juicer-stack/dashboards
python -m http.server 8000

# Then open in browser
open http://localhost:8000/juicer_dash_shell.html
```

## Databricks Integration Debugging

### Common Issues

1. **Connection Issues**
   
   If you can't connect to Databricks:
   
   **Solution:** Check workspace URL and token in config:
   
   ```bash
   cat ~/.pulser/juicer_config.json
   ```

2. **Missing Libraries in Notebooks**
   
   If notebooks fail with missing libraries:
   
   **Solution:** Install required libraries on the Databricks cluster:
   
   ```
   pandas
   numpy
   mlflow
   rapidfuzz
   ```

### Testing Databricks Connectivity

```bash
# Test connectivity to Databricks with the CLI
juicer config --set workspace_url=https://your-workspace.azuredatabricks.net api_token=your-token

# Test a simple query
juicer query "SELECT 1 as test"
```

## Sketch Generation API Debugging

### Common Issues

1. **Sketch Generation API Not Responding**
   
   If sketch preview isn't generating:
   
   **Solution:** Check if the API is running and accessible:
   
   ```bash
   curl -X POST http://localhost:3001/api/sketch_generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test sketch","description":"Test"}'
   ```

2. **Invalid SVG Content**
   
   If SVG content doesn't render or has errors:
   
   **Solution:** Validate SVG content with an SVG validator.

## Logs and Diagnostics

### Collect Diagnostic Information

To collect all diagnostic information for troubleshooting:

```bash
# Create diagnostic archive
mkdir -p diagnostics
cp -r juicer-stack diagnostics/
cp router/commands/juicer.js diagnostics/
cp ~/.pulser/juicer_config.json diagnostics/
cp ~/.pulser/juicer.log diagnostics/ 2>/dev/null || echo "No log file found"
tar -czf juicer-diagnostics.tar.gz diagnostics/
rm -rf diagnostics/

echo "Diagnostics saved to juicer-diagnostics.tar.gz"
```