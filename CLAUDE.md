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

## Default Operating Mode (Zero-Secret)
1) Claude uses **env names only**; Bruno injects values from the vault.  
2) Canonical env names: `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL` (RO).  
3) Preview Branches apply migrations on every commit; merge to `main` applies to prod.

## Auto Flow
Generate migration → `supabase start` → `supabase db reset` → push PR → CI drift check → merge → prod apply → CI verifies prod==repo.

## Project Standards
- Follow medallion architecture (Bronze → Silver → Gold → Platinum)
- Implement proper error handling and logging
- Use TypeScript for type safety
- Maintain comprehensive test coverage

## ETL Pipeline Configuration

### Data Sources
- **Google Drive**: Scout transaction data (JSON/ZIP files)
- **Excel Files**: Cross-tabulation data with mismatch resolution
- **Real-time**: Streaming data via webhooks

### Processing Architecture
```
Source → Bronze (Raw) → Silver (Cleaned) → Gold (Enriched) → Platinum (Analytics)
```

### Column Mismatch Resolution
- **Fuzzy Matching**: 0.8 threshold for automatic column mapping
- **Pattern Recognition**: Extract patterns from column names
- **Historical Learning**: Store successful mappings in `scout.column_mappings`
- **Confidence Scoring**: ML-based matching with weighted scores

### ETL Configuration
```yaml
etl:
  batch_size: 500
  parallel_workers: 4
  retry_attempts: 3
  sync_interval: 15min
  full_sync: daily_02:00

column_matching:
  fuzzy_threshold: 0.8
  enable_ml: true
  cache_mappings: true
  auto_learn: true

monitoring:
  health_checks: enabled
  prometheus_metrics: true
  grafana_dashboards: enabled
  alert_channels: [slack, email]
```

### Database Tables
- `scout.etl_queue` - Job queue and status
- `scout.column_mappings` - Historical column resolutions
- `scout.etl_sync_log` - Complete audit trail
- `scout.data_quality_metrics` - Quality validation results

### Quality Gates
1. **Syntax Validation**: Data type checking
2. **Schema Validation**: Column presence and format
3. **Business Rules**: Domain-specific validations
4. **Completeness**: Null value thresholds
5. **Uniqueness**: Duplicate detection
6. **Consistency**: Cross-table validation