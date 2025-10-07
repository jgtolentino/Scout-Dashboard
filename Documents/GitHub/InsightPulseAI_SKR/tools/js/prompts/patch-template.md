# Patch Template for Code Changes

## Context
I'm working with file: {{file_path}}
Purpose of this file: {{purpose}}

## Current Issue
{{describe_issue}}

## Requirements for the Change
1. {{requirement_1}}
2. {{requirement_2}}
3. {{requirement_3}}

## Constraints
- Must maintain existing API contracts
- Changes must be minimal and focused
- Code must follow project style guide
- Must handle edge cases
- Must not introduce performance regressions

## Security Requirements
- No hardcoded credentials or secrets
- Input validation for all user-supplied data
- Proper error handling
- XSS protection for frontend code

## Verification Checklist
Before finalizing the patch, verify:
- [ ] Does the code pass all linting rules?
- [ ] Does the code maintain backward compatibility?
- [ ] Is proper error handling implemented?
- [ ] Are there edge cases not covered?
- [ ] Does the solution introduce potential security vulnerabilities?
- [ ] Would this code pass a code review?
- [ ] Have all TODOs been resolved?

## Self-Test Prompts
- If this code fails, what would be the most likely failure mode?
- What code path would be affected if [key dependency] changes?
- How might this change impact system performance?
- What is the worst-case time/space complexity?

## Return Format
**Original Code**: The code segment being replaced
**Patched Code**: The new improved code
**Explanation**: Brief explanation of the changes made
**Verification**: How I verified the solution meets requirements