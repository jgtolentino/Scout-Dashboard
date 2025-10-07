# TBWA Brand Insights Flow Diagram Formatter

This toolkit helps format and enhance the TBWA Brand Insights Flow diagram with properly aligned text and SVG icons.

## Overview

The toolkit includes several Python scripts to:

1. Convert SVG icons to inline format compatible with Draw.io
2. Patch text content and alignment in the diagram
3. Add icons to specific cells based on a mapping configuration
4. Produce a final, polished diagram that follows TBWA visual identity guidelines

## Setup and Usage

### Prerequisites

- Python 3.6+
- The PyYAML package (`pip install pyyaml`)

### Directory Structure

```
brand_mentions_fix/
├── assets/
│   ├── icons/                  # SVG icon files
│   ├── icons_inline/           # Converted inline SVG icons (generated)
│   └── text_placements.yaml    # Text content and alignment configuration
├── claude_icon_inline_format.py # Convert SVGs to inline format
├── drawio_text_patcher.py      # Fix text alignment and content
├── add_icons_to_diagram.py     # Add icons to diagram
├── icon_mapping.yaml           # Icon to cell mapping configuration
├── project_scout_flow.drawio   # Original diagram
├── run_diagram_fix.sh          # Main workflow script
└── README.md                   # This file
```

### Running the Workflow

Simply execute the main script:

```bash
./run_diagram_fix.sh
```

This will:
1. Convert SVG icons to inline format
2. Patch text in the diagram based on the YAML configuration
3. Add icons to specified cells
4. Produce a final diagram file: `project_scout_flow_final.drawio`

### Configuration Files

#### Text Placement (assets/text_placements.yaml)

Controls text content and alignment for cells:

```yaml
placements:
  - id: "cell_id"               # Cell ID in the diagram
    text: "New text content"    # Text content (can be multiline)
    align: "left"               # Alignment: left, center, right
```

#### Icon Mapping (icon_mapping.yaml)

Maps cells to icons:

```yaml
icon_mapping:
  cells:
    - id: "cell_id"             # Cell ID in the diagram
      icon: "icon_name"         # Icon name (without .svg extension)
  defaults:
    x: 10                       # X offset within cell
    y: 10                       # Y offset within cell
    width: 32                   # Icon width
    height: 32                  # Icon height
```

## Viewing the Result

Open the final diagram (`project_scout_flow_final.drawio`) in [Draw.io](https://app.diagrams.net/) or the Draw.io desktop application.

## Troubleshooting

- If icons don't appear, check that SVG files are properly formatted
- Ensure cell IDs in the configuration files match those in the diagram
- For text alignment issues, modify the alignment in the text_placements.yaml file