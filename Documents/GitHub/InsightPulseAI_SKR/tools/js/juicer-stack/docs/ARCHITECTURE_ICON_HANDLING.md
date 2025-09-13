# Azure Architecture Icon Handling Guide

This document provides guidelines for handling Azure architecture icons in diagrams, including fallback procedures when official icons are unavailable.

> **Note:** For Project Scout specific icon substitutions and overrides, see [ICON_FALLBACK_POLICY.md](ICON_FALLBACK_POLICY.md).

## Official Azure Icons

Always use the official Microsoft Azure icons when available, as they provide consistent visual representation of Azure services and are immediately recognizable to stakeholders.

**Sources for official icons:**
- [Microsoft Azure Architecture Icons](https://docs.microsoft.com/en-us/azure/architecture/icons/)
- [Official Azure Icon Repository](https://github.com/microsoft/azure-repos)
- Draw.io/diagrams.net Azure icon library (built-in)

## Fallback Icon Handling

When an official Azure icon is unavailable for a specific service or component, follow this standardized fallback procedure:

### Fallback Procedure

1. **Check alternative sources:**
   - [GitHub Microsoft Architecture Icons](https://github.com/microsoft/architecture-icons)
   - Azure Portal UI screenshots (if appropriate)
   - Community-maintained repositories

2. **If no icon is available, use standardized fallback:**
   - Use a standard draw.io shape (rounded rectangle or labeled hexagon)
   - Apply Azure Blue color (#0078D4) with white font for visual consistency
   - Include clear service name as text label
   - Add a small annotation (tooltip or note): *"Unofficial visual — no Azure icon available"*
   - Tag the component with a `qa:custom-icon` attribute for tracking

3. **Document the missing icon:**
   - Add the service to `MISSING_AZURE_ICONS.md` with:
     - Service name
     - Diagram location
     - Fallback used
     - Screenshot (if available)

## Visual Consistency Rules

When using fallback representations, maintain these consistency rules:

| Element Type | Shape | Fill Color | Text Color | Border |
|--------------|-------|------------|------------|--------|
| Azure Service | Rounded Rectangle | #0078D4 | White | None |
| Custom Component | Hexagon | #0078D4 | White | None |
| Connector | Built-in Azure connector | N/A | Black | Solid/Dashed |

## Example Fallback Implementation

```
// In draw.io/diagrams.net
1. Insert > Shape > Azure > Rounded Rectangle
2. Set fill color to #0078D4
3. Set text color to white
4. Add service name as text
5. Right-click > Edit Data... > Add custom property:
   - Name: qa:custom-icon
   - Value: true
6. Add tooltip: "Unofficial visual — no Azure icon available"
```

## Tracking Missing Icons

All missing Azure icons should be tracked in `MISSING_AZURE_ICONS.md` to:
1. Facilitate future updates when official icons become available
2. Provide consistency across multiple diagrams
3. Enable automated QA validation

## QA Integration

The diagram QA tools (`diagram_qa.js` and `diagram_qa_validate.sh`) will automatically check for:
- Presence of `qa:custom-icon` attribute on non-standard shapes
- Visual consistency of fallback representations
- Documentation of missing icons in `MISSING_AZURE_ICONS.md`

## Fallback Icon Checklist

| Checkpoint | Description |
|------------|-------------|
| Use standard draw.io shape | Rounded rectangle or labeled hexagon |
| Apply Azure Blue color | #0078D4 with white font |
| Include annotation | Tooltip or note: "Unofficial visual — no Azure icon available" |
| Check alternative sources | GitHub repos, community sources |
| Tag with attribute | `qa:custom-icon` for tracking |
| Document in missing icons file | Add to `MISSING_AZURE_ICONS.md` |