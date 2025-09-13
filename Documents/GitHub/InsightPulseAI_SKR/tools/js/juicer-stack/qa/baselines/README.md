# Baseline Images

This directory contains baseline screenshots for visual comparison testing.

## Generating Baselines

To generate baseline images for all dashboard components:

```bash
npm run capture-baselines
```

## Naming Convention

Baseline images follow this naming pattern:

```
[dashboard-name]-[component-name].png
```

Example:
- `drilldown-dashboard-brand-table.png`
- `retail-performance-header.png`

## Baseline Management

When making changes to dashboard components:

1. Run tests to see if visual changes have been introduced
2. If intentional changes were made, update baselines with:
   ```bash
   npm run capture-baselines
   ```
3. Commit updated baseline images along with your code changes

## Placeholder Baselines

This directory contains some placeholder baseline images until actual dashboards are fully implemented and ready for baseline captures.