# Architecture Diagram Style Guide

This document provides a comprehensive style guide for creating consistent, professional architecture diagrams for Project Scout and related projects, with a focus on Azure cloud architecture and Medallion data processing patterns.

## 🎨 Visual Language

### Color Palette

Use this consistent color palette across all architecture diagrams:

| Component Type | Color | Hex Code | Example Usage |
|----------------|-------|----------|---------------|
| **Azure Services** | Azure Blue | `#0078D4` | Azure Storage, Functions, etc. |
| **Data Flow** | Dark Blue | `#004578` | Arrows, connections |
| **Bronze Layer** | Bronze | `#CD7F32` | Bronze layer components |
| **Silver Layer** | Silver | `#C0C0C0` | Silver layer components |
| **Gold Layer** | Gold | `#FFD700` | Gold layer components |
| **Platinum Layer** | Orange | `#FF9F78` | GenAI/Platinum components |
| **Dashboards/UI** | Light Orange | `#FFB74D` | Visualization components |
| **Supporting Infrastructure** | Gray | `#505050` | Compute, networking |
| **Background Zones** | Transparent fill with thin border | `#0000000A` (10% opacity) | Layer grouping |

### Typography

| Text Type | Font | Size | Style | Example |
|-----------|------|------|-------|---------|
| **Diagram Title** | Segoe UI or Roboto | 18pt | Bold | `Project Scout Architecture` |
| **Layer Headings** | Segoe UI or Roboto | 16pt | Bold | `Bronze Layer` |
| **Component Labels** | Segoe UI or Roboto | 11pt | Regular | `Data Lake Storage` |
| **Flow Descriptions** | Segoe UI or Roboto | 10pt | Italic | `Real-time processing` |
| **Notes** | Segoe UI or Roboto | 10pt | Regular, Muted | `Deployed in West US` |

### Icons

- Use only official [Azure Architecture Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)
- Maintain consistent icon size (48×48px or 64×64px recommended)
- Use SVG format icons for best quality
- Do not distort or recolor official icons
- Position text labels beneath icons, centered

### Shapes

| Component Type | Shape | Style | Example |
|----------------|-------|-------|---------|
| **Azure Services** | Rectangle | Rounded corners, solid border | Azure Functions |
| **Data Stores** | Cylinder | Solid border | Databases, Data Lake |
| **Processes** | Rectangle | Rounded corners, dashed border | Data Processing |
| **Layers** | Rectangle | Rounded corners, very light fill, thin border | Bronze/Silver/Gold sections |
| **External Systems** | Cloud | Solid border | External services |
| **User/Client** | Person/Device | Solid | End users/devices |

## 📐 Layout Principles

### Medallion Architecture Flow

Medallion architecture should follow this standard layout:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │     │             │
│    Edge     │ ──> │   Bronze    │ ──> │   Silver    │ ──> │    Gold     │ ──> │  Platinum   │
│             │     │             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

- Ensure clear left-to-right or top-to-bottom flow
- Use consistent spacing between layers
- Group related components within each layer
- Use background shading to visually separate layers

### Connections

- Use arrows to show data flow direction
- Keep connection lines straight (orthogonal) when possible
- Avoid crossing lines when possible
- Label important connections with data type/format

### Spacing and Alignment

- Align objects to a virtual grid (50px intervals recommended)
- Maintain consistent spacing between components (min 20px)
- Center labels under their components
- Ensure adequate whitespace around major sections

## 🔄 Common Patterns

### GenAI Insights Pattern

When showing GenAI insights integration with Medallion architecture:

```
┌─────────┐     ┌─────────────┐
│         │     │             │
│  Gold   │ ──> │  Platinum   │
│ Layer   │     │   Layer     │
│         │     │             │
└────┬────┘     └──────┬──────┘
     │                 │
     │                 ▼
     │           ┌─────────────┐
     │           │             │
     │           │    GenAI    │
     │           │  Insights   │
     │           │             │
     │           └──────┬──────┘
     │                  │
     └───────┐   ┌──────┘
             ▼   ▼
      ┌────────────────┐
      │                │
      │   Dashboard    │
      │                │
      └────────────────┘
```

- Show clear input from Gold layer to Platinum/GenAI
- Show connection to storage for insights results
- Show visualization path to dashboards
- Highlight LLM integration points

### Data Ingestion Pattern

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Source    │ ──> │  Ingestion  │ ──> │ Bronze Lake │
│    Data     │     │   Service   │     │   Storage   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

- Show data sources clearly
- Indicate ingestion frequency if applicable
- Show connection to landing/bronze storage

## 🔍 Level of Detail Guidelines

### High-Level Architecture (for executives)

- Focus on key components and their relationships
- Use 10-15 major components maximum
- Emphasize business value and outcomes
- Include minimal technical details

### Mid-Level Architecture (for stakeholders)

- Include all significant system components
- Show primary data flows and integrations
- Label key technologies and platforms
- Include system boundaries and interfaces

### Detailed Architecture (for implementation teams)

- Include all components, including supporting services
- Show detailed data flows with formats
- Label deployment regions/environments
- Include performance characteristics, scaling info

## 📄 Documentation Templates

### Architectural Decision Template

When documenting architectural decisions in relation to diagrams:

```markdown
# [Decision Title]

## Context
[Brief description of the architectural context]

## Decision
[Clear statement of the architecture decision]

## Diagram Reference
See component `[ComponentName]` in the architecture diagram.

## Consequences
[Implications of this decision]
```

### Component Description Template

When documenting individual components from the diagram:

```markdown
# [Component Name]

## Purpose
[What this component does]

## Technology
[Implementation technology]

## Dependencies
- Inputs from: [list components]
- Outputs to: [list components]

## Configuration
[Key configuration details]

## Scaling Characteristics
[How this component scales]
```

## 🧰 Tools & Resources

### Recommended Tools

- **draw.io/diagrams.net**: Primary diagramming tool
- **LucidChart**: Alternative for collaborative editing
- **Azure Architecture Center**: Reference architectures
- **Figma**: For design-focused presentations

### Azure Icon Resources

- **Official Azure Icons**: [Download from Microsoft](https://learn.microsoft.com/en-us/azure/architecture/icons/)
- **draw.io Azure Libraries**: Load from draw.io's built-in libraries
- **Custom Icons**: Store in `/docs/architecture_src/custom_icons/`

## 🔄 Workflow

1. Create initial rough diagram with basic components
2. Review with stakeholders for conceptual alignment
3. Refine with proper styles, icons, and layouts
4. Run through QA checklist (see `DIAGRAM_QA_CHECKLIST.md`)
5. Generate exports (PNG, SVG)
6. Integrate into documentation
7. Archive source file for future updates

## ⚡ Best Practices

- **Single Page**: Keep architecture on a single page when possible
- **Consistency**: Maintain visual consistency across all diagrams
- **Context**: Provide enough context for the audience
- **Updates**: Keep diagrams updated with architecture changes
- **Versions**: Maintain versioned copies for historical reference
- **Accessibility**: Consider color blindness (add labels, use patterns)
- **Zoom Levels**: Design to be readable at different zoom levels

## 📝 Medallion-Specific Guidelines

When creating diagrams for Medallion architecture specifically:

### Bronze Layer

- Show raw data landing
- Include initial validation steps
- Show data structure (unprocessed/raw)
- Indicate quality metrics if applicable

### Silver Layer

- Show cleaning and enrichment processes
- Include entity resolution components
- Show normalization steps
- Indicate schema enforcement

### Gold Layer

- Show business entities and relationships
- Include aggregations and data models
- Show serving layer components
- Indicate performance optimizations

### Platinum Layer

- Show AI/ML components
- Include insights generation processes
- Show presentation and export mechanisms
- Indicate feedback loops to Gold layer

## 🛠️ Diagram Validation

- Run `/tools/js/juicer-stack/tools/diagram_qa_validate.sh` on all diagrams
- Review automatically generated artifacts in `/docs/images/`
- Update diagrams based on QA results
- Verify all diagrams meet the standards in `DIAGRAM_QA_CHECKLIST.md`