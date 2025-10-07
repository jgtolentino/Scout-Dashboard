# TBWA ETL Diagram

An interactive, TBWA-themed ETL diagram mini-webapp that visualizes data flow using Azure-style components and TBWA branding, aligned with the Azure Well-Architected Framework.

## Features

- Interactive diagram with hover effects
- TBWA color scheme and branding
- Official Azure architecture icons and connectors
- Responsive layout
- Different connector styles for batch vs. streaming data
- Alignment with Azure Well-Architected Framework pillars
- Delta Lake medallion architecture (Bronze, Silver, Gold)

## Available Versions

### 1. React Component Version
A full React implementation with interactive components:
- Located in the `src/` directory
- Fully interactive with hover effects
- Modular component structure for extensibility

### 2. Static Diagram Versions
Two HTML-only versions for quick viewing and embedding:

| File | Description |
|------|-------------|
| `static-demo.html` | Simple ETL diagram with basic layout |
| `full-architecture.html` | Complete Azure architecture with data flow |
| `full-architecture-updated.html` | Enhanced version aligned with Azure Well-Architected Framework |

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run start

# Build for production
npm run build
```

## Project Structure

```
tbwa-etl-diagram/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Diagram.jsx
│   │   ├── LayerCard.jsx
│   │   └── Connector.jsx
│   ├── styles/
│   │   └── diagram.css
│   └── index.jsx
├── static-demo.html           # Simple static version
├── full-architecture.html     # Full Azure architecture
├── full-architecture-updated.html  # Well-Architected Framework aligned
├── package.json
└── vite.config.js
```

## Integration

The build output can be easily embedded into the InsightPulseAI dashboard for full interactivity.

## Azure Well-Architected Framework Alignment

The updated full architecture diagram aligns with the following Azure Well-Architected Framework pillars:

1. **Security** - Includes Azure AD, Front Door, WAF, and DNS components
2. **Reliability** - Incorporates redundant data ingestion paths (batch and streaming)
3. **Performance Efficiency** - Utilizes Databricks optimization with Delta Lake medallion architecture
4. **Cost Optimization** - Implied through tiered data storage approach
5. **Operational Excellence** - Includes monitoring and BI visualization components

## Credits

This project uses icons from the Microsoft Azure Architecture Icons collection, used under Microsoft's icon terms. See the [official documentation](https://learn.microsoft.com/azure/architecture/icons/) for guidelines.