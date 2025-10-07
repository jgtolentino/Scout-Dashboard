# Architecture Diagram Guidelines & QA Automation

## Overview

This document outlines the standards, best practices, and automation workflows for creating, maintaining, and validating architecture diagrams and dashboard screenshots for Project Scout. Following these guidelines ensures consistency, accessibility, and proper documentation across all project artifacts.

## 📐 Architecture Diagram Creation Guidelines

All system architecture diagrams for Project Scout must adhere to the following:

| Guideline               | Description                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Format**              | Use `draw.io` (XML) or `Figma` for visual clarity and reuse                                                   |
| **Icons**               | Use only official [Azure Architecture Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)     |
| **Layering**            | Follow Medallion architecture: Edge → Ingest → Bronze → Silver → Gold → Platinum                              |
| **WAF Mapping**         | Align services to Azure Well-Architected Framework (Reliability, Security, Cost, Ops Excellence, Performance) |
| **Annotations**         | Include service names, brief role tags (e.g., "STT Capture", "LLM Enrichment"), and interconnections          |
| **Export Requirements** | Save as high-res `.png`, `svg`, and editable `.drawio` or `.fig` source                                       |
| **Storage**             | Archive under: `docs/images/AZURE_ARCHITECTURE_PRO.png` and `docs/architecture_src/`                          |

## 📦 SVG vs. PNG vs. XML: Know Your Use Case

| Format            | Strengths                          | Weaknesses                                                         | Ideal Use                                             |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **SVG**           | Scalable, editable, semantic       | Can break if not exported properly; larger filesize if unoptimized | Embedding in websites or dashboards; layered diagrams |
| **PNG**           | Universal, fixed layout            | Not scalable, no layers                                            | Sharing with non-technical stakeholders, PDFs, slides |
| **XML (.drawio)** | Fully editable, version-controlled | Not human-readable; tool-dependent                                 | Internal team editing, version tracking, future edits |

> 🛑 *Never treat PNG as a source of truth*. Always archive the editable `.drawio` or `.fig` source.

## 🖼️ Icon Alignment & Branding Discipline

* **Azure Icons** have strict layout guides — use the [official Microsoft icon set](https://learn.microsoft.com/en-us/azure/architecture/icons/) to avoid IP issues.
* **Maintain consistent spacing and labeling** between layers (e.g., horizontal lanes for Bronze → Silver → Gold → Platinum).
* Use **text labels directly inside or beneath icons**, never floating freely — improves accessibility and clarity.
* Ensure brand names (internal vs. client-facing) are consistent with white-labeling guidelines:
  * Internal branding for SKR archives
  * Client branding for deployed dashboards and documentation
  * Use `SnowWhite` agent for converting between versions

## 📸 Headless Screenshot QA (Automated Visual Validation)

To confirm successful deployment and visual readiness of the dashboards, follow this automated QA protocol:

| Step                       | Tool / Script                                       | Output Location                              |
| -------------------------- | --------------------------------------------------- | -------------------------------------------- |
| **Capture Live Dashboard** | `shogun_dashboard_capture.sh [url]`                 | `assets/screenshots/retail_dashboard_*.png`  |
| **Generate Thumbnails**    | `generate_thumbnails.sh`                            | `assets/thumbnails/`, `assets/reports/`      |
| **Archive Screenshot**     | Auto-copied to `docs/images/latest_dashboard.png`   |                                              |
| **Embed in Docs**          | Linked in `README_FINAL.md`, `STAKEHOLDER_BRIEF.md` |                                              |
| **Auto Trigger**           | GitHub Action in `deploy-insights.yml`              | Continuous screenshot generation post-deploy |

> ✅ This process ensures every deployment is verifiably complete and visually archived, aiding in QA, regression detection, and stakeholder reporting.

## 🔄 Automated Screenshot Capture

Screenshots of live dashboards are automatically captured at several key points:

1. **After each deployment**:
   * Built into the `deploy-insights.yml` GitHub Actions workflow
   * Screenshots are captured, thumbnails generated, and documentation updated

2. **On a weekly schedule**:
   * The `scheduled-dashboard-capture.yml` workflow runs every Monday at 9:00 AM UTC
   * Creates a historical record of dashboard evolution
   * Generates an issue with screenshot report

3. **During production pushes**:
   * The `dual_repo_push.sh` script includes dashboard screenshot capture
   * Screenshots are included in the SKR archive with appropriate metadata

4. **On-demand capture**:
   * Use `trigger_github_deployment.sh` and select option 2 to capture manually
   * Helpful for ad-hoc documentation needs or when validating changes

## ❌ Anti-Patterns to Avoid

| Pitfall                                                 | Why It's Harmful                                     |
| ------------------------------------------------------- | ---------------------------------------------------- |
| ❌ Using raster logos from Google search                 | Breaks consistency, can introduce license violations |
| ❌ Embedding text labels *outside* icons                 | Makes the diagram unreadable at scale or in exports  |
| ❌ Saving over the master `.drawio` file without backup  | Kills reusability and version traceability           |
| ❌ Using flattened PNGs without version/date in filename | Makes it hard to know if diagram is outdated         |
| ❌ Inconsistent icon styles or scales                    | Results in unprofessional, hard-to-interpret diagrams|
| ❌ Overly complex diagrams without hierarchical breakdowns| Overwhelms stakeholders with unnecessary detail     |

## 📓 Versioning and CI/CD Integration

* Diagrams should be versioned and tracked alongside code
* Include a visual version indicator (e.g., small version tag or date) in the diagram itself
* Diagram updates should trigger a snapshot of the currently deployed dashboard for comparison
* CI/CD pipelines should enforce the presence of both source and exported files
* Consider implementing visual diff testing for diagrams to catch unexpected changes

## 📋 Architecture Diagram Checklist

Use this checklist when creating or reviewing architecture diagrams:

- [ ] Uses proper layering following Medallion architecture
- [ ] Employs official Azure architecture icons
- [ ] Includes clear, readable labels on all components
- [ ] Shows data flow with directional arrows
- [ ] Maps components to Azure Well-Architected Framework
- [ ] Exported in all required formats (SVG, PNG, source)
- [ ] Stored in the correct documentation locations
- [ ] Visually matches the deployed dashboard (verified by screenshot)
- [ ] Follows white-labeling guidelines appropriate for the audience

## 🛠️ Tool Reference

| Tool                          | Purpose                                              | Command                                       |
|-------------------------------|------------------------------------------------------|-----------------------------------------------|
| `shogun_dashboard_capture.sh` | Captures high-quality screenshots of live dashboards | `./shogun_dashboard_capture.sh [dashboard_url]` |
| `generate_thumbnails.sh`      | Creates various sized versions of screenshots for docs | `./generate_thumbnails.sh [screenshot_path]` |
| `trigger_github_deployment.sh`| Triggers GitHub Actions workflows including screenshot capture | `./trigger_github_deployment.sh` |
| `post_deployment_capture.sh`  | Captures screenshots immediately after deployment    | `./post_deployment_capture.sh [dashboard_url]` |
| `dual_repo_push.sh`           | Pushes to GitHub and SKR Archive with dashboard screenshots | `./dual_repo_push.sh` |

## 📊 Example: Architecture Diagram to Dashboard Comparison

For an ideal architecture diagram to dashboard flow, follow this pattern:

1. Create architecture diagram with proper layering and components
2. Deploy the system according to the architecture
3. Capture dashboard screenshot to validate implementation
4. Place side-by-side in documentation for comparison
5. Store both in version control
6. Schedule regular snapshots to detect visual drift

![Latest Architecture Diagram](./images/AZURE_ARCHITECTURE_PRO.png)

*↑ Architecture Diagram: Layered structure of the Juicer GenAI Insights platform.*

![Latest Dashboard](./images/latest_dashboard.png)

*↑ Dashboard Implementation: Current state of the deployed system.*