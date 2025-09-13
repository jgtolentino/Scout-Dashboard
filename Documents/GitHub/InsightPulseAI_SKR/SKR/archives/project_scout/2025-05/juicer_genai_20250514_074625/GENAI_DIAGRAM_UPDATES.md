# GenAI Insights Integration: Diagram Updates

This document explains the updates made to the Project Scout architectural diagram to reflect the integration of GenAI-powered insights capabilities.

## Overview of Updates

The updated architecture diagram adds a new **Platinum Layer** to the Medallion Architecture, representing the AI-driven insights and analytics tier that sits above the existing Bronze, Silver, and Gold layers. This new layer is responsible for transforming Gold layer data into actionable business intelligence through advanced GenAI processing.

## Key Components Added

1. **Platinum Layer**
   - Positioned as the highest tier in the Medallion architecture
   - Functions as the AI-driven insights & analysis layer
   - Builds upon the reconstructed, enriched data from the Gold layer

2. **GenAI Insights Component**
   - Core processing engine for generating insights using LLMs
   - Implements multi-model support (Claude/OpenAI/DeepSeek)
   - Features fallback mechanisms for high availability
   - Includes confidence scoring and validation

3. **Insights Database**
   - Structured storage for generated insights
   - Includes tables for insights and recommended actions
   - Supports efficient querying by brand, type, confidence, etc.
   - Implements proper schema design with views for common query patterns

4. **Insights Dashboard**
   - Interactive visualization of generated insights
   - Features filtering, sorting, and dynamic visualization
   - Supports various chart types for different analysis needs
   - Integrates with the existing dashboard ecosystem

## Data Flow

The updated diagram illustrates the end-to-end flow:

1. Bronze Layer → Silver Layer → Gold Layer (existing flow)
2. Gold Layer → Platinum Layer (new)
3. Platinum Layer → GenAI Insights → Insights DB (new)
4. GenAI Insights → Insights Dashboard (new)

## Technical Implementation

The technical components supporting this architecture include:

- SQL schema for Platinum layer (`juicer_setup_insights_tables.sql`)
- Python notebook for insights generation (`juicer_gold_insights.py`)
- YAML configuration for agent integration (`insights_hook.yaml`)
- HTML/JS for insights visualization (`insights_dashboard.html`, `insights_visualizer.js`)
- CLI tools for insights generation and management (`insights_generator.js`, `pulser_insights_cli.js`)

## Running the Diagram Update

To update your local copy of the Project Scout diagram with these new components:

```bash
# Navigate to the tools directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/tools

# Run the update script
./update_project_scout_diagram.sh

# Alternatively, specify custom input and output paths
./update_project_scout_diagram.sh /path/to/input.drawio /path/to/output.drawio
```

The script will:

1. Add the new components to the diagram
2. Create proper connections to existing components
3. Save the updated diagram in the specified location
4. Generate a PNG export for documentation (if draw.io CLI is available)

## Integration with Documentation

The updated diagram is integrated with project documentation:

- A copy is saved to the `docs/diagrams/` directory
- PNG export is generated for inclusion in reports and presentations
- This allows for consistent representation of the architecture across all materials

## Next Steps

After updating the diagram:

1. Review the positioning and connections of new components
2. Adjust layout if needed for better visualization
3. Consider updating related documentation to reference the new architectural elements
4. Share the updated diagram with stakeholders for feedback