# Tasks

## Current Sprint

### In Progress
- [ ] Consolidate overlapping RLS policies identified in the hardening report

### TODO
- [ ] Enable RLS on exposed tables without protection  
- [ ] Clean up duplicate indexes to reduce storage overhead
- [ ] Configure Supabase Auth security settings (OTP expiry ≤ 10 min, leaked password protection)
- [ ] Audit SECURITY DEFINER functions for privilege escalation risks
- [ ] Revoke SELECT on materialized views from anon/authenticated unless justified

### Completed
- [x] Add hardening SQL analysis scripts (preview/apply mode) ✅ 2025-09-14
- [x] Add RLS policy overlap reporting ✅ 2025-09-14

## Backlog

### High Priority
- [ ] Task description
- [ ] Task description

### Medium Priority
- [ ] Task description
- [ ] Task description

### Low Priority
- [ ] Task description
- [ ] Task description

## Task Template

```markdown
### Task: [TASK-XXXX] Task Title

**Priority**: High | Medium | Low
**Assignee**: Name
**Due Date**: YYYY-MM-DD
**Status**: TODO | In Progress | Blocked | Done

**Description**:
Brief description of what needs to be done.

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Dependencies**:
- Depends on: TASK-XXXX
- Blocks: TASK-YYYY

**Notes**:
Additional context or considerations.
```

## Notes
- Use Task IDs matching pattern: (TASK|SCOUT|CES|ADS|NB)-\d+
- Update status regularly
- Link related tasks with dependencies
- Archive completed tasks monthly