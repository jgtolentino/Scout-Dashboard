# Filipino Elements Analysis Tool

A comprehensive tool for analyzing and visualizing Filipino cultural elements in advertising campaigns and their correlation with business outcomes from the PH Awards SQLite database.

## Overview

This tool allows you to analyze Filipino cultural elements in advertising campaigns, visualize their usage patterns, and measure their correlation with business metrics such as ROI, sales lift, brand lift, and award recognition. The tool is based on data from the PH Awards SQLite database.

## Features

- **Data Analysis**: Extract and analyze Filipino cultural elements usage across campaigns
- **Correlation Analysis**: Calculate correlation between Filipino elements and business metrics
- **Visualization**: Generate charts and heatmaps to visualize the data
- **Reporting**: Create comprehensive reports in markdown format
- **CLI Interface**: Easy-to-use command-line interface for running analyses

## Components

The tool consists of three main components:

1. **Filipino Elements Analyzer** (`filipino_elements_analyzer.js`): Core module for data extraction and analysis
2. **Filipino Elements Visualizer** (`filipino_elements_visualizer.js`): Visualization module using Chart.js
3. **CLI Wrapper** (`analyze_filipino_elements.js`): Command-line interface for the tools

## Requirements

- Node.js 14+
- SQLite database with PH Awards data
- Dependencies:
  - chart.js
  - canvas
  - sqlite3
  - commander

Install dependencies:

```bash
npm install chart.js canvas sqlite3 commander
```

## Usage

### Basic Analysis

```bash
./analyze_filipino_elements.js analyze
```

This command runs a basic analysis and generates a markdown report with tables of element usage, correlations, and top campaigns by Filipino Index.

### Generate Visualizations

```bash
./analyze_filipino_elements.js visualize
```

This command generates visualizations and creates an enhanced report with embedded charts showing element usage, correlations, and Filipino Index distribution.

### Specific Analyses

**Show Element Usage:**

```bash
./analyze_filipino_elements.js usage
```

**Show Correlations:**

```bash
./analyze_filipino_elements.js correlations --sort roi
```

**Show Top Campaigns:**

```bash
./analyze_filipino_elements.js top-campaigns --count 15
```

### Generate Individual Charts

**Element Usage Chart:**

```bash
./analyze_filipino_elements.js chart-usage
```

**Correlation Heatmap:**

```bash
./analyze_filipino_elements.js chart-correlation
```

**Filipino Index Distribution:**

```bash
./analyze_filipino_elements.js chart-distribution
```

## Options

All commands support the following options:

- `-d, --database <path>`: Path to SQLite database (default: /Users/tbwa/ph_awards.db)
- `-o, --output <dir>`: Output directory for reports (default: /Users/tbwa/ph_awards_reports)

Some commands have specific options:

- `correlations`: `-s, --sort <metric>` - Sort by metric (roi, sales_lift, brand_lift, award_count)
- `top-campaigns`: `-n, --count <number>` - Number of campaigns to show

## Database Schema

The tool works with the PH Awards SQLite database which has the following structure:

- **PH_Awards_Campaigns**: Basic campaign information (id, campaign_name, brand, year)
- **PH_Filipino_Metrics**: Filipino cultural elements for each campaign (has_sari_sari, has_jeepney, etc.)
- **PH_Business_Impact**: Business metrics (roi, sales_lift, brand_lift)
- **PH_Awards_Performance**: Award metrics (award_count)
- **PH_Content_Analysis**: Content analysis data
- **PH_Evolution_Tracking**: Tracking of elements over time

## Filipino Elements

The tool analyzes the following Filipino cultural elements:

- Sari-sari store
- Jeepney
- Palengke (market)
- Fiesta
- Barong/Filipiniana
- Filipino food
- Adobo
- Filipino celebrities
- Pinoy humor
- Bahay Kubo
- Videoke/Karaoke
- Sundo/Hatid
- Tambay
- Balikbayan box
- Family values
- Resilience
- Street culture

## Visualization Styles

The visualizations are styled using TBWA brand colors:

- Primary: #FF3600 (TBWA Red/Orange)
- Secondary: #000000 (Black)
- Tertiary: #FFFFFF (White)
- Accent colors: #FFB800 (Yellow), #00C2FF (Blue), #00FF90 (Green), etc.

## Output

The tool generates several outputs:

1. **Basic Report**: `filipino_elements_analysis.md`
2. **Enhanced Report**: `filipino_elements_analysis_enhanced.md`
3. **Visualization Images**:
   - `filipino_elements_usage.png`
   - `filipino_elements_correlation.png`
   - `filipino_index_distribution.png`

## Integration with Pulser CLI

The Filipino Elements Analysis Tool can be integrated with the Pulser CLI by creating a shortcut in the shell configuration:

```bash
echo 'alias :analyze-filipino-elements="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/analyze_filipino_elements.js"' >> ~/.zshrc
source ~/.zshrc
```

Then use it with:

```bash
:analyze-filipino-elements visualize
```

## Examples

### Basic Analysis Report

Running `./analyze_filipino_elements.js analyze` produces a markdown report with tables showing:

- Summary statistics
- Filipino element usage percentages
- Correlations with business metrics
- Top campaigns by Filipino Index

### Enhanced Visualization Report

Running `./analyze_filipino_elements.js visualize` generates charts and an enhanced report with embedded visualizations:

- Bar chart of Filipino element usage
- Correlation heatmap showing the relationship between elements and business metrics
- Distribution chart of Filipino Index across campaigns

### Command Line Output

Running `./analyze_filipino_elements.js correlations` displays a table in the terminal:

```
Filipino Element Correlations (sorted by roi):
-------------------------------------------------------
Element             ROI    Sales    Brand   Awards
----------------------------------------------------------
sari_sari          0.65     0.42     0.38     0.51
filipino_food      0.61     0.48     0.35     0.45
barong_filipiniana 0.55     0.39     0.42     0.62
family_values      0.52     0.57     0.61     0.48
...
```

## Methodology

The tool calculates correlations using the Pearson correlation coefficient, which measures the linear relationship between two variables. The formula is implemented in SQL for efficient processing.

The Filipino Index is a composite score between 0 and 1 that represents the presence and intensity of Filipino cultural elements in a campaign.

## Author

InsightPulseAI Team - TBWA\