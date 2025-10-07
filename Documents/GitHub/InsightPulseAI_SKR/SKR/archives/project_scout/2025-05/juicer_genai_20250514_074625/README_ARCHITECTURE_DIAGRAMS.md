# Architecture Diagrams Guide

This document provides guidance on creating, updating, and validating architecture diagrams for Project Scout and related components.

## Overview

Architecture diagrams are a critical part of our documentation, helping everyone understand the system design, data flow, and component relationships. To ensure our diagrams maintain a consistent professional standard, we've implemented a quality assurance process and style guide.

## Diagram QA Workflow

1. **Create or Update Diagram**
   - Use draw.io or diagrams.net to create/edit diagrams
   - Follow the style guide (see [ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md](docs/ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md))
   - Save as .drawio files in `/docs/architecture_src/` directory

2. **Run QA Validation**
   ```bash
   # From the tools directory
   ./diagram_qa_validate.sh /path/to/your-diagram.drawio
   ```

3. **Review QA Results**
   - Check the QA report at `/docs/images/qa_results.txt`
   - Make recommended adjustments to fix any issues
   - Re-run validation until all checks pass

4. **Use Generated Assets**
   - High-res PNG: `/docs/images/AZURE_ARCHITECTURE_PRO.png`
   - SVG for embedding: `/docs/images/AZURE_ARCHITECTURE_PRO.svg`
   - Thumbnail: `/docs/images/AZURE_ARCHITECTURE_THUMBNAIL.png`

5. **Update Documentation**
   - Insert diagram into relevant documentation
   - Use the provided markdown snippets from the QA tool output

## Continuous Integration

When you commit diagram changes, our GitHub Actions workflow will automatically:

1. Validate the diagram against quality standards
2. Generate exports in various formats
3. Test visual rendering
4. Provide QA feedback on pull requests

See [.github/workflows/diagram-qa.yml](.github/workflows/diagram-qa.yml) for workflow details.

## Diagram Quality Standards

We follow a comprehensive set of standards to ensure all architecture diagrams are:

- **Consistent**: Using standardized colors, fonts, icons, and layouts
- **Clear**: Properly labeled with clean component organization
- **Accurate**: Correctly representing system components and data flows
- **Professional**: Meeting visual quality standards for external presentations

For detailed quality criteria, see [DIAGRAM_QA_CHECKLIST.md](docs/DIAGRAM_QA_CHECKLIST.md).

## Style Guide

Our detailed style guide includes:

- Color palettes for different component types
- Typography standards
- Icon usage guidelines
- Layout patterns for Medallion architecture
- Best practices for different audience types

For complete guidelines, see [ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md](docs/ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md).

## Tools & Resources

- **draw.io Desktop**: https://github.com/jgraph/drawio-desktop/releases
- **Azure Architecture Icons**: https://learn.microsoft.com/en-us/azure/architecture/icons/
- **QA Script**: [diagram_qa_validate.sh](tools/diagram_qa_validate.sh)
- **Style Guide**: [ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md](docs/ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md)
- **QA Checklist**: [DIAGRAM_QA_CHECKLIST.md](docs/DIAGRAM_QA_CHECKLIST.md)

## Latest Architecture Diagram

![Project Scout Architecture](docs/images/AZURE_ARCHITECTURE_THUMBNAIL.png)

*Click for [full-size diagram](docs/images/AZURE_ARCHITECTURE_PRO.png)*