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
- **Vector Embeddings**: Convert Filipino elements to vector embeddings for semantic analysis *(New in v1.1)*
- **Similarity Search**: Find semantically similar campaigns using vector space *(New in v1.1)*
- **Clustering**: Group campaigns by Filipino element similarity *(New in v1.1)*

## Components

The tool consists of these main components:

1. **Filipino Elements Analyzer** (`filipino_elements_analyzer.js`): Core module for data extraction and analysis
2. **Filipino Elements Visualizer** (`filipino_elements_visualizer.js`): Visualization module using Chart.js
3. **CLI Wrapper** (`analyze_filipino_elements.js`): Command-line interface for the tools
4. **Vector Embedding Add-on** (`vector_embedding_addon.py`): Python module for vector-based analysis *(New in v1.1)*

## Requirements

### JavaScript Components
- Node.js 14+
- SQLite database with PH Awards data
- Dependencies:
  - chart.js
  - canvas
  - sqlite3
  - commander

### Python Vector Components *(New in v1.1)*
- Python 3.7+
- Dependencies:
  - sentence-transformers
  - faiss-cpu
  - numpy
  - matplotlib
  - scikit-learn

Install JavaScript dependencies:

```bash
npm install
```

Install Python dependencies:

```bash
pip install numpy matplotlib scikit-learn sentence-transformers faiss-cpu
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

### Vector Embedding Analysis *(New in v1.1)*

```bash
python vector_embedding_addon.py --build --analyze
```

This command builds a vector index from the Filipino elements data and generates a clustering analysis with visualizations.

### Similarity Search *(New in v1.1)*

```bash
python vector_embedding_addon.py --search "Campaign with Filipino street culture and humor"
```

This command finds campaigns that are semantically similar to the query text.

### NPM Scripts

You can also use the provided npm scripts:

```bash
# JavaScript analysis
npm run analyze
npm run visualize

# Vector analysis (Python)
npm run vector-build
npm run vector-analyze
```

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

Vector embedding commands have additional options:

- `--clusters <number>`: Number of clusters for analysis (default: 5)
- `--model <name>`: Sentence transformer model name (default: paraphrase-multilingual-MiniLM-L12-v2)

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

## Vector Embedding Features *(New in v1.1)*

The vector embedding functionality:

- Converts Filipino elements to semantic vector representations
- Allows finding campaigns with similar Filipino elements, even if they don't match exactly
- Clusters campaigns into groups based on semantic similarity
- Provides visualizations of campaign relationships in vector space

For more details on the vector embedding capabilities, see [README_VECTOR_EMBEDDINGS.md](README_VECTOR_EMBEDDINGS.md)

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
3. **Vector Analysis Report**: `filipino_elements_vector_analysis.md` *(New in v1.1)*
4. **Visualization Images**:
   - `filipino_elements_usage.png`
   - `filipino_elements_correlation.png`
   - `filipino_index_distribution.png`
   - `campaign_clusters.png` *(New in v1.1)*

## Integration with Pulser CLI

The Filipino Elements Analysis Tool can be integrated with the Pulser CLI by creating a shortcut in the shell configuration:

```bash
echo 'alias :analyze-filipino-elements="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/filipino-elements-analyzer/analyze_filipino_elements.js"' >> ~/.zshrc
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

### Vector Embedding Analysis *(New in v1.1)*

Running `python vector_embedding_addon.py --analyze` generates:

- Clustering of campaigns based on Filipino element similarity
- t-SNE visualization of campaign relationships
- Analysis of dominant Filipino elements in each cluster
- Identification of campaign groups with similar cultural approaches

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

Vector embeddings are created using sentence transformers to convert campaign descriptions into dense numerical vectors, enabling semantic similarity comparisons and clustering.

## Author

InsightPulseAI Team - TBWA\