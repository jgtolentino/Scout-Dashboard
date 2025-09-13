# 🧪 Caca QA Core

This action enables independent QA testing across any InsightPulseAI project:
- Visual rendering (screenshots)
- HTML structure validation
- PRD alignment
- Toggle functionality (sim/client)

## Overview

Caca QA Core is a reusable GitHub action that provides independent verification of InsightPulseAI projects. It ensures that deployments match their PRD specifications and render correctly, without allowing the deploying agent to validate its own work.

## Features

- **Independent Verification**: Ensures QA is performed by a separate agent (Caca) from the one that built the feature
- **Visual Validation**: Captures screenshots of deployed interfaces for verification
- **PRD Compliance**: Validates that the implementation matches the PRD requirements
- **Toggle Functionality**: Verifies that data source toggles and client/internal modes work correctly
- **ISO 9001 Aligned**: Follows best practices for independent quality assurance

## Usage

### In GitHub Workflows

```yaml
# .github/workflows/qa.yml

name: QA Check (Caca)

on:
  push:
    paths:
      - 'src/**'
      - 'docs/**'

jobs:
  qa_caca:
    uses: InsightPulseAI/qa-caca-core@main
    with:
      prd_path: docs/README_PRD_ADVISOR.md
      target_path: dist
      out_path: qa_reports
```

### From CLI

```bash
# After pushing dist + PRD
gh workflow run "QA Check (Caca)"
```

Or using Pulser CLI:

```bash
:qa check advisor
```

## Input Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| prd_path | Path to PRD markdown or YAML | Yes | - |
| target_path | Built HTML or dashboard folder | Yes | - |
| out_path | Path to store QA results | No | qa_reports/ |

## Output Reports

- Visual screenshots in `qa/snapshots/`
- YAML report in `qa_reports/qa_report.yaml`
- Detailed validation logs with pass/fail status

## Benefits

- **Scalable**: Works across all InsightPulseAI projects with minimal configuration
- **Independent**: Caca acts as a true agentic QA firewall
- **Consistent**: Provides standardized QA across all projects
- **Automated**: Integrates with CI/CD for continuous quality verification