# Prompt Usage Standard Operating Procedure

**Version:** 1.1  
**Last Updated:** 2025-05-16  
**Author:** InsightPulseAI  
**Approved By:** System Admin Team

# PATCH: enforcement-language-hardening-v1
# The following changes have been made to enforce stricter language requirements:
# - Changed instances of "should" to "MUST" where appropriate
# - Replaced "recommended" with explicit requirements
# - Added enforcement mechanisms for critical requirements
# End of patch header

## 1. Purpose

This Standard Operating Procedure (SOP) provides guidelines for creating, modifying, testing, and deploying prompts within the InsightPulseAI system. It ensures consistency, quality, and proper versioning of prompts across all agents and workflows.

## 2. Scope

This SOP applies to all prompts used in:
- Agent definitions
- Task execution
- Content generation
- QA validation
- User-facing interfaces
- System automation

## 3. Responsibilities

| Role | Responsibilities |
|------|-----------------|
| Prompt Engineer | Creates and optimizes prompts, maintains prompt library |
| Agent Developer | Implements prompts within agent behaviors |
| QA Engineer | Validates prompt effectiveness and safety |
| System Admin | Approves production prompts, manages versioning |
| End User | Follows prompt usage guidelines |

## 4. Prompt Structure Standards

### 4.1 Core Components

All prompts MUST include the following components:

```
# [PROMPT_ID]: [PROMPT_NAME] v[VERSION]
# Purpose: Brief description of prompt purpose
# Updated: YYYY-MM-DD

[SYSTEM INSTRUCTIONS]

[CONTEXT SECTION]

[TASK DEFINITION]

[FORMAT INSTRUCTIONS]

[EXAMPLES] (when needed)
```

### 4.2 Naming Convention

Prompt IDs MUST follow the pattern:
- `pcode-v1`: Code-related prompts
- `pauto-v1`: Autonomous agent prompts
- `plist-v1`: List-generating prompts
- `pdev-v1`: Development environment prompts
- `pdocs-v1`: Documentation prompts

## 5. Prompt Management Procedure

### 5.1 Creating New Prompts

1. Create prompt file in appropriate directory under `/SKR/prompt_library/`
2. Include metadata YAML header with tags, version, and author
3. Test prompt with `:prompt-engineer test` command
4. Document test results
5. Submit for QA review

### 5.2 Modifying Existing Prompts

1. Create new version file under `/versions/` directory
2. Update metadata with version number and change history
3. Test against previous version baselines
4. Document improvements and changes
5. Submit for approval

### 5.3 Prompt Versioning

- Major version changes (`v1` → `v2`): Significant prompt rewrites
- Minor version changes (`v1.0` → `v1.1`): Adjustments and optimizations
- Patch changes (`v1.1.0` → `v1.1.1`): Typo fixes, minor clarifications

## 6. Prompt Testing Protocol

### 6.1 Test Requirements

All prompts MUST undergo testing for:
- Functionality (achieves intended outcome)
- Robustness (handles edge cases)
- Safety (rejects harmful inputs)
- Consistency (produces reliable outputs)
- Performance (responds within expected time)

### 6.2 Testing Commands

```bash
# Test a prompt against test cases
pulser prompt test <prompt_id> --test-suite standard

# Compare output to gold standard
pulser prompt compare <prompt_id> --baseline <baseline_file>

# Test prompt safety
pulser prompt safety <prompt_id> --level strict
```

### 6.3 Documenting Test Results

Record test results in `/test_results/<prompt_id>_<timestamp>.json`

## 7. Prompt Deployment

### 7.1 Deployment Requirements

Before deployment, prompts MUST have:
- Passed all test cases
- Documentation completed
- QA signoff
- Version updated in metadata

### 7.2 Deployment Process

1. Run `pulser prompt deploy <prompt_id> --environment <env>`
2. Verify deployment with `pulser prompt status <prompt_id>`
3. Monitor metrics with `pulser prompt monitor <prompt_id>`

### 7.3 Rollback Procedure

In case of issues:
1. Run `pulser prompt rollback <prompt_id> --version <previous_version>`
2. Document issues in prompt issue log
3. Address issues in next version

## 8. Integration with Agents

### 8.1 Agent Configuration

In agent YAML files, reference prompts by ID:

```yaml
prompts:
  primary: pcode-v1
  fallback: pcode-simple-v1
```

### 8.2 Dynamic Prompt Selection

For dynamic prompt selection, use the prompt router:

```python
selected_prompt = prompt_router.select(
    task_type="code_generation",
    complexity=task.complexity,
    user_preference=user.preferences.get("verbosity")
)
```

## 9. Quality Control

### 9.1 Regular Audits

- Monthly review of all production prompts
- Quarterly comparison against baseline metrics
- Continuous collection of feedback

### 9.2 Improvement Process

1. Identify underperforming prompts from metrics
2. Create variants using `pulser prompt variations`
3. Test variants against baseline
4. Deploy improvements following standard procedure

## 10. Related Documents

- [Prompt Engineering Guide](../PROMPT_ENGINEERING.md)
- [Agent Behavior Documentation](../agent_behavior.md)
- [QA Validation Procedures](qa_validation_sop.md)
- [Prompt Security Guidelines](prompt_security.md)

## 11. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2025-05-16 | Applied enforcement-language-hardening-v1 | Claude 3.7 Sonnet |
| 1.0 | 2025-05-15 | Initial SOP | InsightPulseAI |