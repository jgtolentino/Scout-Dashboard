# Scout Dashboard QA Framework Quick Start Guide

This guide provides quick-start instructions for using the Power BI-parity QA framework for Scout dashboards.

## 1. Quick-start in a fresh clone

```bash
git clone <repo>
cd qa
./run_qa.sh          # Runs all tests
```

The framework includes:
- Visual parity tests (baseline-diff)
- Accessibility testing (Axe a11y scan)
- Performance testing (Lighthouse perf)
- Behavior parity tests (Jest unit snapshot)

All tests must pass for CI to succeed (green check ✅). Any failure results in a non-zero exit code that stops CI merge processes.

## 2. CI/CD Integration

### GitHub Actions (`.github/workflows/qa.yml`)

```yaml
jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Install deps
        run: npm ci
      - name: Run QA suite
        run: ./qa/run_qa.sh
```

### Azure DevOps

```yaml
- script: |
    npm ci
    ./qa/run_qa.sh
  displayName: 'QA parity gate'
```

> **Tip:** add `continueOnError: true` on the Lighthouse step if you only want performance tests to warn, not block.

A full Azure DevOps pipeline example is included in `azure-pipelines.yml`.

## 3. Artifacts

| Artifact            | Path                         | Retain why                    |
| ------------------- | ---------------------------- | ----------------------------- |
| ⚡ Lighthouse JSON   | `qa/reports/lh/*.json`       | Trending perf in Grafana      |
| 🖼️ Pixel-diff PNGs | `qa/reports/pixel/*.png`     | Attach to PR for quick glance |
| ♿ Axe HTML          | `qa/reports/axe/report.html` | Auditors love it              |

Add a plain `actions/upload-artifact` step to retrieve artifacts from the PR page:

```yaml
- uses: actions/upload-artifact@v3
  with:
    name: qa-reports
    path: qa/reports/
```

## 4. Keeping Baselines Fresh

1. **Nightly cron** - Set up a scheduled job to run `cron_nightly_baseline.sh`
   ```bash
   # Example crontab entry (runs at 2 AM daily)
   0 2 * * * /path/to/repo/tools/js/juicer-stack/qa/cron_nightly_baseline.sh
   ```

2. **PR author updates** - When making intentional visual changes, run:
   ```bash
   npm run baseline:update
   # or
   ./run_qa.sh baseline:update
   ```
   This runs an interactive process to update specific baselines affected by your changes.

3. **Jest snapshot reminders** - The tests will alert you when baselines need updating.

## 5. Advanced Setup Options

| Feature                         | Commands                                       |
|--------------------------------|------------------------------------------------|
| Percy or Chromatic integration | See `VISUAL_REVIEW_INTEGRATION.md`             |
| Playwright trace capture       | `./run_qa.sh test:behavior --trace`            |
| Slack/Teams notifications      | Configure in CI as shown in `NOTIFICATIONS.md` |

## Debugging

If tests fail, check the following:

1. Baseline images - Make sure baselines are up to date
2. Element selectors - Component class names must match test expectations
3. Network issues - Dashboard must be running and accessible
4. Browser compatibility - Tests use Puppeteer (Chrome)

For more detailed debugging:
```bash
./run_qa.sh debug
```

## Learn More

- `INTEGRATION_GUIDE.md` - Detailed integration instructions
- `PERFORMANCE_MONITORING.md` - Setting up Grafana monitoring
- `DASHBOARD_QA_CICD_SETUP.md` - Detailed CI/CD setup

## Next Steps

1. Merge the QA framework into your repository
2. Configure CI/CD integration 
3. Set up scheduled baseline updates
4. Configure Grafana dashboard for performance monitoring