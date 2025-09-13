# Visual QA Automation & Architecture Documentation

This document provides an overview of the visual QA automation system and architecture diagram guidelines implemented for Project Scout. These tools ensure consistent documentation and visual validation of deployed components.

## Overview

The visual QA automation suite consists of two major components:

1. **Dashboard Screenshot Automation**: Captures, processes, and archives screenshots of live dashboards
2. **Architecture Diagram Guidelines**: Standards for creating and maintaining architecture diagrams

Together, these components provide a comprehensive visual documentation system that integrates with CI/CD workflows and ensures architectural consistency throughout the project.

## Dashboard Screenshot Automation

### Tools and Workflow

The dashboard screenshot automation suite consists of the following tools:

| Script | Purpose | Outputs |
|--------|---------|---------|
| `shogun_dashboard_capture.sh` | Captures headless browser screenshots of dashboards | Full-size PNG screenshots |
| `generate_thumbnails.sh` | Creates thumbnails and compressed versions | Thumbnails, compressed images, gallery |
| `post_deployment_capture.sh` | Triggers screenshot capture after deployments | Deployment logs and screenshots |

### Automated Trigger Points

Screenshots are automatically captured at several key points in the development workflow:

1. **GitHub Actions - Post-Deployment**:
   - The `deploy-insights.yml` workflow includes a screenshot capture step
   - Screenshots are taken after successful deployments
   - Thumbnails are generated and documentation is updated
   - All artifacts are uploaded to GitHub for easy access

2. **GitHub Actions - Weekly Schedule**:
   - The `scheduled-dashboard-capture.yml` workflow runs weekly
   - Creates a historical record of dashboard evolution
   - Generates an issue with screenshot report
   - Can be triggered manually for ad-hoc capture

3. **Production Deployment**:
   - The `dual_repo_push.sh` script includes dashboard screenshot capture
   - Screenshots are included in the SKR archive with appropriate metadata
   - Visual versioning is maintained for each production release

### Integration with Documentation

Dashboard screenshots are automatically integrated into the following documentation:

1. **README_FINAL.md**: Shows the latest dashboard screenshot
2. **STAKEHOLDER_BRIEF.md**: Displays a compressed version for executive viewing
3. **HTML Gallery**: Provides a visual history of dashboard versions

## Architecture Diagram Guidelines

The [Architecture Diagram Guidelines](./ARCHITECTURE_DIAGRAM_GUIDELINES.md) document provides comprehensive standards for creating and maintaining architecture diagrams, including:

- Format standards (SVG, PNG, XML)
- Icon selection and placement
- Layering guidelines for Medallion architecture
- WAF mapping
- Export requirements
- Storage conventions

### Current Architecture Diagram

The current architecture diagram for the Juicer GenAI Insights system is shown below:

![Azure Architecture](./images/AZURE_ARCHITECTURE_PRO.png)

This diagram follows the Medallion architecture pattern with Edge, Bronze, Silver, Gold, and Platinum layers, and includes all key components of the system.

### Visual Consistency Check

One of the primary purposes of the screenshot automation is to ensure visual consistency between the architecture diagram and the actual deployed dashboard. This helps identify visual drift and ensures that documentation remains accurate over time.

#### Architecture Diagram:
![Azure Architecture](./images/AZURE_ARCHITECTURE_PRO.png)

#### Deployed Dashboard:
![Deployed Dashboard](./images/latest_dashboard.png)

## Usage Instructions

### Capturing Dashboard Screenshots

To manually capture a dashboard screenshot:

```bash
# Capture from default URL
./tools/shogun_dashboard_capture.sh

# Capture from custom URL
./tools/shogun_dashboard_capture.sh https://custom-deployment-url.azurestaticapps.net
```

### Generating Thumbnails and Compressed Versions

To generate thumbnails and compressed versions of screenshots:

```bash
# Process the latest screenshot
./tools/generate_thumbnails.sh

# Process a specific screenshot
./tools/generate_thumbnails.sh /path/to/specific_screenshot.png
```

### Triggering Weekly Screenshot Capture

To manually trigger a weekly screenshot capture:

```bash
# Run the trigger script
./trigger_github_deployment.sh

# Select option 2 to trigger screenshot capture
```

### Production Deployment with Screenshots

During the production deployment process, you'll be prompted to capture dashboard screenshots:

```bash
# Run the dual repo push script
./dual_repo_push.sh

# When prompted, choose 'y' to capture dashboard screenshots
```

## CI/CD Integration

The screenshot automation is fully integrated with the CI/CD pipeline:

1. GitHub Actions workflow automatically captures screenshots after deployment
2. Weekly scheduled workflow captures screenshots every Monday
3. Production deployment scripts include screenshot capture
4. All artifacts are archived and linked to documentation

## Best Practices

1. **Architectural Accuracy**: Ensure that architecture diagrams accurately reflect the deployed components
2. **Regular Capture**: Maintain a regular cadence of dashboard screenshots beyond automation
3. **Visual Regression**: Compare screenshots over time to identify visual regressions
4. **Documentation Integration**: Always embed the latest screenshots in stakeholder documentation
5. **Version Control**: Maintain all source files for architecture diagrams under version control

## Resources and References

- [Architecture Diagram Guidelines](./ARCHITECTURE_DIAGRAM_GUIDELINES.md): Complete guidelines for diagram creation
- [Azure Architecture Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/): Official Microsoft icon set
- [Screenshot Automation Tools README](../tools/README.md): Documentation for screenshot tools
- [HTML Screenshot Gallery](../assets/reports/dashboard_preview.html): Visual history of dashboard evolution