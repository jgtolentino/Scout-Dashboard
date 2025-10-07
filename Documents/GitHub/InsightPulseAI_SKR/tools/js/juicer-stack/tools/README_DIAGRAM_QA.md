# Architecture Diagram QA Tools

This package provides tools for validating, enhancing, and ensuring the quality of architecture diagrams in the Juicer stack. The tools are designed to support the development lifecycle of architectural diagrams, from quick validation to comprehensive QA and export.

## Quick Start

To run a quick QA check on a diagram:

```bash
./run_quick_diagram_qa.sh [diagram-name] [diagram-path] [output-dir]
```

For example:

```bash
./run_quick_diagram_qa.sh project_scout_with_genai
```

## Available Tools

### 1. Quick Diagram QA

A lightweight tool for fast validation of architecture diagrams.

**Purpose:** Perform basic checks on diagram structure, layout, and content.

**Usage:**
```bash
./run_quick_diagram_qa.sh [diagram-name]
```

**Key Features:**
- Validates diagram file existence and format
- Checks for minimum components and connections
- Ensures components are properly labeled
- Verifies relationships between architecture entities
- Outputs a JSON and markdown report with findings

### 2. Comprehensive Diagram QA

A thorough QA suite for production diagrams.

**Purpose:** Perform detailed validation before diagrams are finalized for release.

**Usage:**
```bash
./run_complete_diagram_qa.sh [diagram-name]
```

**Key Features:**
- All checks from Quick QA plus:
- Typography and text standards validation
- Spacing and layout precision
- Visual consistency across elements
- Structural and logical integrity
- Proper layer organization (Bronze, Silver, Gold, Platinum)
- Export to various formats (PNG, SVG)
- Visual render check

### 3. Diagram Preview

A preview tool for visualizing diagrams in a browser.

**Purpose:** View and inspect diagrams before deployment.

**Usage:**
```bash
./preview_diagram.sh [diagram-name]
```

**Key Features:**
- Creates an interactive HTML preview
- Starts a local web server
- Opens the default browser to view the diagram
- Provides options to view in draw.io or download source

### 4. Convenient Aliases

Adds shell aliases for easier access to the diagram tools.

**Purpose:** Simplify and standardize workflow for diagram QA.

**Usage:**
```bash
source ./diagram_qa_aliases.sh
```

**Key Aliases:**
- `quick-diagram-qa <diagram-name>` - Run quick QA checks
- `full-diagram-qa <diagram-name>` - Run comprehensive QA
- `export-diagram <diagram-name>` - Generate exports
- `preview-diagram <diagram-name>` - Open diagram in browser
- `qa-scout` - Quick QA on Project Scout diagram
- `qa-retail` - Quick QA on Retail Architecture diagram
- `qa-azure` - Quick QA on Azure Medallion diagram

## Integration with CI/CD

The diagram QA tools can be integrated into CI/CD pipelines using GitHub Actions. A sample workflow is included in the Juicer stack GitHub workflows directory.

**Key Integration Points:**
1. Run on pull requests containing `.drawio` files
2. Validate diagrams automatically
3. Generate exports for documentation
4. Comment on PRs with findings

## Standards and Guidelines

These tools enforce the following architecture diagram standards:

1. **Typography & Text**
   - Consistent font (Segoe UI or Roboto)
   - Standard font sizes
   - Proper text alignment and capitalization

2. **Layout & Spacing**
   - Icons aligned on baseline grid
   - Equal padding between layers
   - No overlapping elements
   - Centered flow arrows

3. **Visual Elements**
   - Official Azure icons
   - Consistent icon size
   - Azure color palette with medallion color-coding
   - Consistent line styles

4. **Logical Flow**
   - Proper medallion tier flow
   - Clear GenAI insights connections
   - Complete component labeling
   - Explicit data flow direction

## Requirements

- Node.js
- Bash shell
- Python (for preview server)
- Optional: draw.io CLI for exports

## Installation

1. Clone the repository
2. Ensure scripts are executable: `chmod +x *.sh *.js`
3. Install dependencies: `npm install xmldom puppeteer chalk open`
4. Source aliases: `source ./diagram_qa_aliases.sh`

## Output Files

Results are stored in:
- Quick QA Report: `docs/images/quick_qa_results.md`
- Comprehensive QA Report: `docs/images/full_qa_report.md`
- JSON Data: `docs/images/qa_results.json`
- Logs: `logs/diagram_qa_[timestamp].md`