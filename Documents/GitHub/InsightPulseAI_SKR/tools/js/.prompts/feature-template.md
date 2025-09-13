# Feature Implementation Template

## Feature Overview
**Name**: {{feature_name}}
**Purpose**: {{feature_purpose}}
**Target Files**: {{target_files}}

## Requirements
1. {{requirement_1}}
2. {{requirement_2}}
3. {{requirement_3}}

## Acceptance Criteria
- [ ] {{criteria_1}}
- [ ] {{criteria_2}}
- [ ] {{criteria_3}}

## Technical Constraints
- Must follow project architecture patterns
- Must include feature flag for gradual rollout
- Must include tests
- Must meet accessibility standards
- Performance must not degrade by more than 5%

## Implementation Strategy
1. Create feature flag: `ENABLE_{{FEATURE_NAME_UPPERCASE}}`
2. Implement core functionality behind feature flag
3. Add unit and integration tests
4. Add telemetry to measure usage and performance
5. Document the feature

## Security Requirements
- Sanitize all user inputs
- Use parameterized queries for database operations
- Validate any URLs or file paths
- Apply principle of least privilege
- Add appropriate authorization checks

## Verification Checklist
Before finalizing the implementation, verify:
- [ ] Is the code fully covered by tests?
- [ ] Does the implementation meet all acceptance criteria?
- [ ] Is the feature properly guarded by a feature flag?
- [ ] Are there appropriate error boundaries?
- [ ] Is telemetry in place to monitor usage?
- [ ] Are accessibility requirements met?
- [ ] Is the feature documented?

## Self-Test Prompts
- How would this feature behave if the backend is slow or unavailable?
- What happens if multiple users interact with this feature simultaneously?
- Are there any edge cases not covered by the current implementation?
- How would this feature scale with 10x or 100x the current user load?

## Return Format
**Implementation Plan**: Step-by-step plan
**Code Changes**: The new code to be added
**Tests**: Test cases to validate functionality
**Documentation**: Documentation for the feature