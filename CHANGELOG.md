
## [7.0.1] — 2025-09-14 (Security & Performance Hardening)

### Added
- SQL hardening analysis: `supabase/migrations/20250913204116_hardening_analysis.sql` (preview/apply mode)
- RLS policy overlap report: `supabase/migrations/20250913204303_rls_policy_overlap_report.sql`
- Database connection script: `scripts/db/run-hardening-analysis.sh` with Bruno-style env injection
- Bruno collections for database operations in `.bruno/collections/supabase/`

### Security
- **CRITICAL**: Identified 146+ tables in exposed schemas without Row Level Security
- **HIGH**: Found 108 foreign key constraints missing covering indexes (performance impact)
- Guidance to enable **Leaked password protection** and set **OTP expiry ≤ 10 minutes** in Supabase Auth
- SECURITY DEFINER functions and materialized views flagged for privilege review

### Performance
- Automated detection of missing FK-covering indexes (ready to apply via `apply := true`)
- No duplicate indexes found (good database hygiene)
- Connection pooler configured for `aws-0-ap-southeast-1.pooler.supabase.com:6543`

### Changed
- Updated connection scripts to use correct database password vs service role key distinction
- Enhanced Bruno environment configuration for secure database access

## [7.0.0-alpha.2] — 2025-09-13 (Docs & Workbench)

### Added
* PRD.md, CLAUDE.md, PLANNING.md, TASKS.md under /docs
* Tasks snapshot exporter: scripts/docs/export-tasks.sh
* Auditor CI already installed; docs referenced in PRD/Planning

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Core functionality

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Initial security implementation

## Template Entry

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature description [TASK-XXXX]

### Changed
- Change description [TASK-YYYY]

### Deprecated
- Deprecation notice [TASK-ZZZZ]

### Removed
- Removal description [TASK-AAAA]

### Fixed
- Bug fix description [TASK-BBBB]

### Security
- Security improvement [TASK-CCCC]
```

## Guidelines

- Add entries for every release
- Use Task IDs matching pattern: (TASK|SCOUT|CES|ADS|NB)-\d+
- Link to relevant issues or PRs when available
- Keep entries concise but descriptive
- Follow chronological order (newest first)
- Use semantic versioning for releases
