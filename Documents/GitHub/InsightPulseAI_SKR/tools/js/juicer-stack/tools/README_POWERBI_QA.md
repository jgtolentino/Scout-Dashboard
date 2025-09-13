# Power BI Style Dashboard QA Tool

This tool ensures dashboards maintain the look and feel of native Power BI visualizations by applying strict quality checks focused on typography, layout, component styling, and interaction patterns.

## Quick Start

```bash
# Run against a local dashboard
./run_powerbi_qa.sh http://localhost:3000/dashboard

# Run against a deployed dashboard
./run_powerbi_qa.sh https://example.com/azure-hosted-dashboard
```

## Overview

The Power BI Style QA tool performs comprehensive checks to ensure dashboards maintain Power BI's native look and feel, including:

### 1. Theme & Typography

- Verifies headings use Segoe UI Semibold at 16-18px
- Checks body text is Segoe UI at 11-14px with correct color (#252423)
- Validates accent colors against Power BI blue (#118DFF) or TBWA yellow (#FFE600)

### 2. 8-px Grid Alignment

- Ensures visual components snap to multiples of 8px
- Checks for minimum 16px spacing between adjacent components
- Generates grid overlay to visualize alignment issues

### 3. KPI Card Format

- Validates KPI cards have consistent format with metric, title, and delta indicators
- Checks for proper color coding on delta indicators (+green/-red)
- Ensures consistent formatting across all metric cards

### 4. Interaction Behavior

- Simulates Power BI's on-object toolbar (format, focus mode, etc.)
- Visualizes hover/click interactions to match Power BI patterns
- Creates a reference visualization for review

### 5. Accessibility (WCAG AA)

- Tests color contrast for text elements (minimum 3:1 ratio)
- Checks for proper ARIA attributes on interactive components
- Validates against WCAG AA standards

### 6. Performance Metrics

- Measures load time, first paint, and interaction responsiveness
- Compares against performance budget (FCP < 2s, interaction < 0.5s)
- Tracks resource size and initial render performance

### 7. Snapshot Regression

- Compares against reference screenshots to detect visual changes
- Identifies regression issues with pixel-level comparison
- Highlights differences with visual overlays

## Integration with CI/CD

This tool is integrated with GitHub Actions to automatically validate dashboards on every change:

```yaml
- name: Run Power BI Style QA Check
  run: |
    cd qa
    npm run qa:ci
```

Failed checks will block merges, ensuring dashboards always maintain the Power BI visual style.

## Output Artifacts

The tool generates several types of output:

1. **Annotated Screenshots** - Visualizations with grid overlays, interaction highlights
2. **Markdown Report** - Detailed findings with screenshots and recommendations
3. **JSON Results** - Machine-readable format for integration with other tools
4. **Pixel Diff Images** - Visual comparison with reference screenshots

## Example Usage

### Command Line

```bash
# Basic usage
./run_powerbi_qa.sh http://localhost:3000

# With custom output directory
./run_powerbi_qa.sh http://localhost:3000 /path/to/output

# In CI environment
node powerbi_qa_addon.js http://localhost:3000 ./output && exit $(jq '.failures | length' ./output/powerbi_qa_results_*.json)
```

### GitHub Actions Integration

The tool includes a GitHub workflow configuration that:

1. Activates on dashboard file changes
2. Starts a local server to host the dashboard
3. Runs the QA checks against the dashboard
4. Uploads results as artifacts
5. Fails the build if critical issues are found

### Extending the Tool

The QA system is modular and can be extended with:

```javascript
// Add a custom check
// Inside powerbi_qa_addon.js after other checks
console.log(`\n${colors.cyan}Running custom check...${colors.reset}`);

const customResults = await page.evaluate(() => {
  // Custom validation logic here
  return { passed: true, details: "Custom check passed" };
});

if (customResults.passed) {
  qaResults.passed.push({
    check: 'Custom Check',
    message: 'Custom validation passed'
  });
} else {
  qaResults.warnings.push({
    check: 'Custom Check',
    message: 'Custom validation failed',
    details: customResults.details
  });
}
```

## Requirements

- Node.js 14+
- NPM packages: puppeteer, pixelmatch, pngjs, axe-core
- Python 3 (for local server in CI environment)

## Installation

```bash
# Clone the repository
git clone https://github.com/example/dashboard-repo.git

# Install dependencies
cd dashboard-repo/qa
npm install

# Run the QA tool
cd ../tools
./run_powerbi_qa.sh http://localhost:3000
```