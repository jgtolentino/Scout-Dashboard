# Missing Azure Architecture Icons

This document tracks Azure services or components that lack official icons and require fallback representation in architecture diagrams.

> **Note:** For Project Scout specific icon substitutions and standardized overrides, see [ICON_FALLBACK_POLICY.md](ICON_FALLBACK_POLICY.md).

## Current Missing Icons

| Service/Component | Used In | Fallback Type | Date Added | Status |
|-------------------|---------|---------------|------------|--------|
| GenAI Insights Processor | Project Scout | Rounded Rectangle (Azure Blue) | 2025-05-13 | Unofficial |
| Platinum Layer | Project Scout | Custom Rectangle (Orange #FF9F78) | 2025-05-13 | Custom Layer |
| Insight Summarization Engine | Project Scout | Hexagon (Azure Blue) | 2025-05-13 | Unofficial |

## Screenshot References

### GenAI Insights Processor
![GenAI Insights Processor Fallback](../assets/icon_references/genai_insights_processor_fallback.png)
*Note: This is a temporary fallback for the GenAI integration component.*

### Platinum Layer
![Platinum Layer](../assets/icon_references/platinum_layer_fallback.png)
*Note: Custom layer representation extending the traditional Medallion architecture.*

### Insight Summarization Engine
![Insight Summarization Engine](../assets/icon_references/insight_summarization_fallback.png)
*Note: Represents the summary generation capability of the GenAI Insights system.*

## Requesting Official Icons

If you need an official icon for any of these services, consider:

1. Checking the [latest Azure Architecture Icons](https://docs.microsoft.com/en-us/azure/architecture/icons/) as they are updated regularly
2. Submitting a request to Microsoft through their [feedback channels](https://feedback.azure.com/)
3. Creating a custom icon that follows [Azure design guidelines](https://docs.microsoft.com/en-us/azure/architecture/icons/design)

## Updates

When an official icon becomes available:
1. Update all diagrams using the fallback representation
2. Move the entry from "Current Missing Icons" to "Resolved Icons" below
3. Update the QA tooling to recognize the new official icon

## Resolved Icons

| Service/Component | Used In | Resolution Date | Notes |
|-------------------|---------|-----------------|-------|
| *None yet* | | | |