# VisualSynth

VisualSynth is a Pulser agent that automates the full lifecycle of dashboard generation — from natural language requirements to live deployment — with Power BI parity.

## Overview

The VisualSynth agent leverages AI to transform business requirements into fully functional, interactive dashboards with minimal human intervention. It handles everything from requirement parsing to deployment, ensuring consistent quality and adherence to design standards.

## Key Features

- **Natural Language Processing**: Convert plain English requirements into structured KPIs
- **Schema Mapping**: Automatically map dashboard elements to your database schema
- **Interactive UI Generation**: Create responsive dashboards with WCAG 2.1 AA compliance
- **Power BI Parity**: Match the look and feel of Power BI dashboards with web technologies
- **Automated QA**: Validate against baseline visuals with visual regression testing
- **One-Click Deployment**: Deploy to Azure Static Web Apps with GitHub Actions

## Installation

VisualSynth is included in Pulser 2.2.1 and later. No additional installation is required.

## Usage

### Command Line Interface

```bash
# Parse requirements into structured KPIs
visualsynth.sh gather "I want a dashboard showing sales by region, top customers, and product performance"

# Map KPIs to database schema
visualsynth.sh map-schema

# Generate dashboard layout
visualsynth.sh plan-ui

# Generate dashboard code
visualsynth.sh generate-code

# Run QA validation
visualsynth.sh qa

# Deploy to Azure
visualsynth.sh deploy
```

### Configuration

VisualSynth can be configured through the deployment configuration file:

```
/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/config/deployment.json
```

This file contains settings for:
- Deployment targets (Azure, GitHub, local)
- Visual themes
- Dashboard templates
- QA thresholds

## File Structure

```
/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/
├── agents/
│   └── visualsynth.yaml           # Agent configuration
├── config/
│   └── deployment.json            # Deployment configuration
├── docs/
│   └── VISUALSYNTH_QA_CHECKLIST.md # QA validation checklist
├── output/
│   └── visualsynth/               # Generated artifacts
│       ├── input.txt              # Natural language requirements
│       ├── structured_kpi.json    # Parsed KPI definitions
│       ├── kpi_table_mapping.yaml # Database schema mapping
│       ├── dashboard_wireframe.json # Dashboard layout
│       ├── retail_dashboard.html  # Generated dashboard
│       ├── qa_report.json         # QA validation report
│       └── deployment_log.json    # Deployment logs
├── qa/
│   └── baselines/                 # Visual regression baselines
│       └── retail_dashboard.png   # Baseline screenshot
├── templates/
│   └── dashboards/                # Dashboard templates
│       └── retail.json            # Retail dashboard template
└── utils/
    └── scripts/
        └── visualsynth.sh         # CLI wrapper script
```

## Examples

### Basic Dashboard Generation

```bash
visualsynth.sh gather "Create a retail dashboard with brand loyalty by store, top-selling SKUs, and customer sentiment trends"
visualsynth.sh map-schema
visualsynth.sh plan-ui
visualsynth.sh generate-code
visualsynth.sh qa
visualsynth.sh deploy
```

### Custom Template

```bash
visualsynth.sh gather "Create a retail dashboard with brand loyalty by store, top-selling SKUs, and customer sentiment trends"
visualsynth.sh map-schema
visualsynth.sh plan-ui --template executive
visualsynth.sh generate-code --theme dark
visualsynth.sh qa
visualsynth.sh deploy --target github
```

## Integration

VisualSynth integrates with other Pulser agents:
- Works with **Stacey** for deployment coordination
- Uses **Caca** for QA validation
- Can receive requirements from **Edge** in conversational format

## License

Part of the InsightPulseAI / Pulser 2.0 licensed software suite.

## Support

For issues or enhancement requests, contact the Pulser development team.