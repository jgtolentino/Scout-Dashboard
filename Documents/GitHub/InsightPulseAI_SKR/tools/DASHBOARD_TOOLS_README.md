# Superset Dashboard Tools

This suite of tools helps you create, enhance, and deploy Superset dashboards. The tools integrate with the Surf agent for advanced dashboard optimization.

## Commands

### :dashboard

The main dashboard management command that provides an interactive menu to:
- Package dashboards as Docker images
- Deploy dashboards to Superset servers
- Use Surf agent to enhance dashboards

Usage:
```bash
:dashboard
```

### :superset-docker

Package a dashboard as a Docker image for easy deployment:

```bash
:superset-docker --dir /path/to/dashboards --name my-dashboard --tag v1.0
```

Options:
- `--dir` - Dashboard directory (default: /Users/tbwa/Downloads/superset)
- `--name` - Docker image name (default: superset-dashboard)
- `--tag` - Docker image tag (default: latest)

### :superset-deploy

Deploy a dashboard to a Superset server:

```bash
:superset-deploy --host http://localhost:8088 --json my_dashboard.json --user admin --pass admin
```

Options:
- `--host` - Superset host URL (required)
- `--json` - Dashboard JSON file (required)
- `--user` - Superset username (default: admin)
- `--pass` - Superset password (default: admin)
- `--dry-run` - Validate without uploading

### :surf Integration

The Surf agent can enhance dashboards with:
- Improved layout and visualization
- Descriptive titles and annotations
- Optimized color schemes
- Data validation and consistency checks

Example:
```bash
:surf --goal "Enhance Superset dashboard in ~/Downloads/superset/brand_analytics_dashboard.json" --backend claude
```

## Workflow

1. Start with dashboard files in `/Users/tbwa/Downloads/superset/`
2. Run `:dashboard` to see available options
3. Choose to package, deploy, or enhance the dashboard
4. Follow the prompts to complete the operation

## Docker Package

The Docker package created by `:superset-docker` includes:
- All dashboard JSON files
- A standalone Superset instance
- Automatic dashboard import
- Documentation

To use the Docker package:
```bash
docker load -i superset-dashboard-latest.tar
docker run -p 8088:8088 superset-dashboard:latest
```

Then access the dashboard at http://localhost:8088

## Troubleshooting

If you encounter issues:
1. Check that your dashboard JSON is valid
2. Ensure Superset server is running (for direct deployment)
3. Verify Docker is installed (for packaging)
4. Use `:surf` to fix any dashboard issues automatically

Created by Claude on May 10, 2025