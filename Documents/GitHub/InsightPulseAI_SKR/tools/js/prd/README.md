# Pulser PRD Generator

A structured Product Requirements Document (PRD) generator for InsightPulseAI projects. This tool helps standardize product planning and requirements gathering across teams while ensuring compatibility with AI development workflows.

## Overview

The Pulser PRD Generator creates well-structured Product Requirements Documents in both Markdown and YAML formats. It's designed to:

- Standardize product planning across the InsightPulseAI ecosystem
- Capture critical product requirements in a consistent format
- Generate files that can be used directly with AI agents and development tools
- Streamline the product planning to development handoff

## Installation

No installation required. The tool is ready to use as part of the InsightPulseAI toolkit.

### Dependencies

- Python 3.6+
- PyYAML
- Rich (optional, for enhanced CLI experience)

If you don't have Rich installed, the script will work with a simplified interface.

## Usage

### CLI Command

Run the PRD generator using either:

```bash
# Using the Pulser alias
:generate-prd

# Or directly
python /path/to/generate_prd.py
```

### Interactive Prompts

The tool will prompt you for the following information:

1. **Product Name** - What are you building?
2. **Problem Statement** - What user or business problem does this solve?
3. **Target Audience** - Who is this for?
4. **Core Features** - List key features (comma-separated)
5. **AI Integration** - How does AI factor into the experience?
6. **Constraints / Must-Nots** - What should the product/agent NOT do?
7. **Data Sources / APIs** - What inputs will it use?
8. **Success Criteria** - How will you measure success?
9. **Launch Context** - Is this a test, MVP, or full release?

### Output Files

The tool generates two files in the `/prd/` directory:

- `prd_<product-name>.md` - Human-readable Markdown PRD
- `prd_<product-name>.yaml` - Machine-readable YAML for Pulser agents

## Sample PRDs

Sample PRDs are included for reference:

- `sample_prd_dashboard.md` - Example PRD for a dashboard project
- `sample_prd_agent.md` - Example PRD for an AI agent

## Integration with Pulser

The PRD Generator integrates with the Pulser ecosystem in several ways:

1. **SKR Integration**: PRDs are automatically tagged and stored in the Structured Knowledge Repository (SKR) via Kalaw
2. **Agent Input**: YAML outputs can be used directly as input for agent configuration
3. **Task Tracking**: PRDs can be linked to task records for project tracking

## Tips for Effective PRDs

1. **Be specific** - Vague requirements lead to misaligned implementations
2. **Focus on outcomes** - Describe the "why" behind features
3. **Define constraints clearly** - What the product should NOT do is as important as what it should do
4. **Set measurable success criteria** - Make them quantifiable when possible
5. **Consider the user** - Always keep the target audience's needs in mind

## Customization

To customize the PRD template or add additional fields:

1. Modify the `FIELDS` dictionary in `generate_prd.py`
2. Update the `generate_markdown()` function to include your new fields

## Troubleshooting

**Q: The script doesn't run with enhanced formatting**  
A: Install the Rich library using `pip install rich`

**Q: Where are my generated files?**  
A: Check the `/prd/` directory. Files are named with your product name (converted to lowercase with underscores)

## Contributing

To improve the PRD Generator:

1. Submit enhancement ideas through the standard InsightPulseAI workflow
2. For urgent fixes, contact the Pulser core team

## License

This tool is part of the InsightPulseAI toolkit and is subject to the company's internal usage policies.