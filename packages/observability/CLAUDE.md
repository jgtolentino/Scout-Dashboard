# CLAUDE.md — Orchestration Rules

## Execution Model
- **Bruno** is the executor - handles environment, secrets, and deployment
- **Claude Code** orchestrates - plans, coordinates, and validates
- No secrets in prompts or repo; route via Bruno environment injection

## MCP Endpoints
Available in Dev Mode:
- **Supabase** - Database operations, Edge Functions, migrations
- **GitHub** - Repository management, issues, PRs
- **Figma** - Design system integration, component specs
- **Gmail** - Communication and notification workflows

## Communication Style
- **Direct and critical** - produce runnable, actionable blocks
- **Evidence-based** - validate before execution
- **Quality-gated** - test, lint, and validate all changes
- **Documentation-first** - maintain clear project records

## Project Standards
- Follow medallion architecture (Bronze → Silver → Gold → Platinum)
- Implement proper error handling and logging
- Use TypeScript for type safety
- Maintain comprehensive test coverage