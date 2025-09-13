# Code Refactoring Template

## Target for Refactoring
**File(s)**: {{file_paths}}
**Code Section**: {{code_section}}
**Current Purpose**: {{current_purpose}}

## Reason for Refactoring
{{refactoring_reason}}

## Goals
1. {{goal_1}}
2. {{goal_2}}
3. {{goal_3}}

## Non-Goals
1. {{non_goal_1}}
2. {{non_goal_2}}

## Technical Constraints
- Must maintain identical functionality
- Must not change public API signatures
- Must improve code quality metrics
- Must maintain or improve performance
- Must maintain or improve test coverage

## Refactoring Strategy
1. Identify code smells and technical debt
2. Create or update tests to verify current behavior
3. Refactor incrementally, verifying tests pass at each step
4. Measure performance before and after

## Quality Requirements
- Reduce cognitive complexity
- Improve readability and maintainability
- Follow SOLID principles
- Use appropriate design patterns
- Remove duplication
- Improve naming

## Verification Checklist
Before finalizing the refactoring, verify:
- [ ] Do all existing tests pass?
- [ ] Have new tests been added for previously untested code?
- [ ] Has the code complexity been reduced?
- [ ] Has performance been maintained or improved?
- [ ] Does the refactored code follow project conventions?
- [ ] Have all code smells been addressed?
- [ ] Is the refactored code more maintainable?

## Self-Test Prompts
- What parts of the codebase might be affected by these changes?
- What edge cases might the current implementation handle that I need to preserve?
- How might my changes affect performance in unexpected ways?
- What assumptions am I making about the current code that might be incorrect?

## Return Format
**Original Code**: The code section being refactored
**Refactored Code**: The improved implementation
**Changes**: Summary of key changes made
**Benefits**: How the refactoring improves the codebase
**Test Strategy**: How the changes have been verified