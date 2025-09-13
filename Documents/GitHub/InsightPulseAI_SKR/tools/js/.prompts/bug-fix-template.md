# Bug Fix Template

## Bug Description
**Issue ID**: {{issue_id}}
**Affected File(s)**: {{affected_files}}
**Severity**: {{severity}} (Critical/High/Medium/Low)
**Reported By**: {{reporter}}

## Bug Reproduction
**Steps to Reproduce**:
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

**Expected Behavior**: {{expected_behavior}}
**Actual Behavior**: {{actual_behavior}}

## Root Cause Analysis
{{root_cause_analysis}}

## Fix Requirements
1. Must fix the issue without introducing new bugs
2. Must include tests that verify the fix
3. Must be minimal and focused on the specific issue
4. Must handle edge cases
5. {{additional_requirement}}

## Impact Assessment
**Components Affected**: {{components_affected}}
**Potential Side Effects**: {{potential_side_effects}}
**Users Affected**: {{users_affected}}

## Fix Strategy
1. {{strategy_step_1}}
2. {{strategy_step_2}}
3. {{strategy_step_3}}

## Verification Checklist
Before finalizing the fix, verify:
- [ ] Does the fix address the root cause of the bug?
- [ ] Have regression tests been added to prevent this bug in the future?
- [ ] Has the fix been tested in conditions similar to where the bug was found?
- [ ] Are there similar places in the code that might have the same bug?
- [ ] Does the fix introduce any potential performance issues?
- [ ] Have all edge cases been considered?

## Self-Test Prompts
- What if the input values are at their extremes?
- What if the system is under heavy load?
- What if the operation is interrupted midway?
- How might this fix interact with other recent changes?
- Could this fix mask other underlying issues?

## Return Format
**Original Code**: The buggy code
**Fixed Code**: The corrected implementation
**Explanation**: Analysis of the bug and how the fix addresses it
**Test Cases**: Tests to verify the fix works correctly