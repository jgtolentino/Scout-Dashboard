# 🎯 Architecture Icon Substitution Policy for Project Scout

This document outlines fallback procedures and standardized substitutions when **official Azure icons are unavailable** or **preferred alternatives are defined** for Project Scout architecture diagrams.

![Project Scout Architecture](images/AZURE_ARCHITECTURE_PRO.png)

*Architecture diagram showing standardized icon substitutions*

## ✅ Confirmed Fallbacks and Custom Icons

| Component / Service          | Purpose                                 | Preferred Icon                  | Replacement Style                         | Status       |
| ---------------------------- | --------------------------------------- | ------------------------------- | ----------------------------------------- | ------------ |
| **GenAI Insights Processor** | Platinum-layer LLM summarization        | ❌ No Azure icon                 | `Rounded Rectangle` – Azure Blue          | ✅ Custom     |
| **Platinum Layer**           | GenAI insights enrichment stage         | ❌ No Azure layer icon           | `Custom Rectangle` – Orange `#FF9F78`     | ✅ Custom     |
| **Edge Device (STT Logger)** | Field-level transcription + IoT signals | 🔴 **Red Raspberry Pi Icon**    | ⛔ Replaces Azure "Device Blue" rectangle  | ✅ Overridden |
| **WebApp Dashboard**         | Visual interface (BI, QA)               | 🟪 Streamlit-style Monitor Icon | `Rounded Rectangle` – Purple              | ✅ Custom     |
| **Insights DB**              | Stores Platinum insights output         | ❌ No direct icon                | Uses **Azure SQL Database** icon          | ✅ Proxy      |
| **Databricks (Red)**         | Analytics & model compute               | 🟥 Red Databricks Icon          | Replaces older Azure-blue Databricks icon | ✅ Overridden |

## 📌 Fallback Design Guidelines

When substituting icons:

1. **Color rules must still follow the Medallion layers** (Bronze, Silver, Gold, Platinum).
2. Use **consistent size and padding** (64×64 preferred) to avoid misalignment.
3. If icon not available:
   * Prefer SVG import of known symbols (e.g., Raspberry Pi, Streamlit).
   * Use shape + color + clear label.
   * Avoid vague generic shapes (e.g., unlabeled circles or diamonds).

## Implementation Process

### For New Custom Icons

1. Update this policy document with the new component/service.
2. Add the custom icon information to `MISSING_AZURE_ICONS.md` for tracking.
3. When creating the icon in draw.io:
   - Tag with `qa:custom-icon` attribute
   - Include annotation: "Unofficial visual — no Azure icon available" (if applicable)
   - Use the specified color scheme from this document

### For Official Icon Overrides

1. Document the override in this policy document.
2. When using a non-standard icon, include a tooltip explaining the choice.
3. Maintain consistent sizing with the rest of the architecture.

## Icon Substitution Categories

The policy identifies several categories of icon substitutions:

| Substitution Type | Description | Example |
|-------------------|-------------|---------|
| **Custom** | No official icon exists, a shape is used instead | GenAI Insights Processor |
| **Overridden** | An official icon exists but a different icon is preferred | Red Raspberry Pi Icon |
| **Proxy** | An existing icon is used to represent a similar service | Azure SQL Database for Insights DB |

## Diagram QA Integration

All custom icons and overrides in Project Scout diagrams are automatically validated using:

1. The `diagram_qa.js` Node.js tool
2. The `diagram_qa_validate.sh` bash script

These tools check for:
- Proper icon tagging with `qa:custom-icon`
- Consistency with this policy document
- Documentation in `MISSING_AZURE_ICONS.md`

## References

- [ARCHITECTURE_ICON_HANDLING.md](ARCHITECTURE_ICON_HANDLING.md) - General guidelines for icon handling
- [MISSING_AZURE_ICONS.md](MISSING_AZURE_ICONS.md) - Tracking document for missing Azure icons
- [QA_CHECKLIST_PROJECT_SCOUT.md](QA_CHECKLIST_PROJECT_SCOUT.md) - Comprehensive QA checklist
- [Azure Architecture Center](https://docs.microsoft.com/en-us/azure/architecture/) - Official Azure architecture resources