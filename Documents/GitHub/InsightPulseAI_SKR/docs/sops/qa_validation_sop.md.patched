# QA Validation Standard Operating Procedure

**Version:** 1.1  
**Last Updated:** 2025-05-16  
**Author:** InsightPulseAI  
**Approved By:** QA Team Lead

# PATCH: enforcement-language-hardening-v1
# The following changes have been made to enforce stricter language requirements:
# - Changed instances of "should" to "MUST" where appropriate
# - Replaced "recommended" with explicit requirements
# - Added enforcement mechanisms for critical requirements
# End of patch header

## 1. Purpose

This Standard Operating Procedure (SOP) establishes a standardized process for quality assurance validation across all components of the InsightPulseAI system, with a focus on prompt behavior, agent responses, and system output quality.

## 2. Scope

This SOP applies to validation of:
- Prompt templates and libraries
- Agent behaviors and responses
- Generated content quality
- CLI command functionality
- System integration points
- UI/UX consistency
- Regression testing

## 3. Responsibilities

| Role | Responsibilities |
|------|-----------------|
| QA Engineer | Executes validation procedures, documents results |
| Caca Agent | Performs automated validation and regression tests |
| Prompt Engineer | Remediates prompt-related quality issues |
| Agent Developer | Addresses agent behavior quality concerns |
| Release Manager | Ensures QA approval before production deployment |

## 4. QA Validation Process

### 4.1 Validation Framework

All quality validation MUST follow the **PRCAE** framework:
- **Precision**: Accuracy and correctness of output
- **Relevance**: Appropriateness to context and user needs
- **Consistency**: Reliability across multiple executions
- **Adaptability**: Handling of edge cases and variations
- **Effectiveness**: Achievement of intended outcomes

### 4.2 Validation Levels

| Level | Description | Required For |
|-------|-------------|-------------|
| L1 | Basic functional testing | All components |
| L2 | In-depth behavioral testing | User-facing components |
| L3 | Edge case and stress testing | Critical system components |
| L4 | Integration and system testing | Major releases |
| L5 | Production monitoring | Deployed systems |

## 5. Automated Testing with Caca Agent

### 5.1 Using ping_caca

The ping_caca utility MUST be used to validate system components against quality standards:

```bash
# Basic validation
python ping_caca.py --check prompt_quality --prompt-id pcode-v1

# Brand mention detection validation
python ping_caca.py --check brand_mentions --interaction-id TEST001

# Dashboard validation
python ping_caca.py --check dashboard_quality --dashboard insights_dashboard.html
```

### 5.2 Validation Configuration

Configure validation parameters in `qa_config.yaml`:

```yaml
validation:
  prompt_quality:
    metrics:
      - correctness
      - safety
      - consistency
    thresholds:
      correctness: 0.85
      safety: 0.95
      consistency: 0.90
  
  brand_mentions:
    metrics:
      - precision
      - recall
      - f1_score
    thresholds:
      precision: 0.80
      recall: 0.80
      f1_score: 0.80
```

### 5.3 Automated Test Scheduling

Schedule regular validation tests:

```bash
# Add to crontab
0 2 * * * /usr/bin/python /path/to/ping_caca.py --check all --output /path/to/logs
```

## 6. Prompt Quality Validation

### 6.1 Prompt Testing Protocol

1. **Baseline Testing**: Test prompt against gold standard examples
2. **Variation Testing**: Test with parameter variations
3. **Adversarial Testing**: Test with edge case inputs
4. **Integration Testing**: Test within agent workflows

### 6.2 Quality Metrics

- **Task completion rate**: % of successful task completions
- **Output relevance**: 0-10 scale of relevance to input
- **Hallucination rate**: % of factually incorrect statements
- **Instruction adherence**: % of instructions followed correctly
- **Response consistency**: Standard deviation across multiple runs

### 6.3 Testing Golden Dataset

Maintain golden test dataset for regression testing:
- Location: `/qa/golden_datasets/<component_type>/`
- Format: JSON files with inputs and expected outputs
- Update process: Quarterly review and enhancement

## 7. Agent Behavior Validation

### 7.1 Behavior Testing Process

1. **Function Testing**: Test individual agent functions
2. **Interaction Testing**: Test agent interactions with other agents
3. **Workflow Testing**: Test end-to-end agent workflows
4. **Stress Testing**: Test agent behavior under load

### 7.2 Agent Quality Metrics

- **Decision accuracy**: % of correct routing decisions
- **Response quality**: Composite score from Caca evaluation
- **Fallback effectiveness**: % of successful fallback recovery
- **Processing time**: Average task completion time
- **Memory utilization**: Peak memory usage during processing

## 8. Content Quality Validation

### 8.1 Content Validation Process

1. **Fact checking**: Verify factual accuracy
2. **Style checking**: Verify adherence to style guides
3. **Safety checking**: Verify no harmful or inappropriate content
4. **Usefulness checking**: Verify utility to end user

### 8.2 Content Quality Metrics

- **Factual accuracy**: % of verifiably correct facts
- **Style compliance**: % adherence to style guidelines
- **Safety score**: Composite safety metric (0-100)
- **User value rating**: Estimated value to user (0-10)

## 9. Dashboard Quality Validation

### 9.1 Visual Regression Testing

1. **Baseline capture**: Capture screenshots of expected UI
2. **Comparison testing**: Compare new versions to baselines
3. **Element validation**: Verify all UI elements present and functional
4. **Responsive testing**: Test across device viewports

### 9.2 Dashboard Quality Metrics

- **Visual diff score**: % pixel difference from baseline
- **Functionality score**: % of functional elements working
- **Performance score**: Load time and interaction responsiveness
- **Accessibility score**: WCAG compliance metrics

## 10. QA Issue Management

### 10.1 Issue Severity Levels

| Level | Description | Response Time | Resolution Time |
|-------|-------------|---------------|-----------------|
| S1 | Critical - System unusable | Immediate | ≤ 4 hours |
| S2 | Major - Significant impact | ≤ 2 hours | ≤ 24 hours |
| S3 | Moderate - Partial functionality | ≤ 8 hours | ≤ 72 hours |
| S4 | Minor - Cosmetic or enhancement | ≤ 24 hours | Next release |

### 10.2 Issue Documentation

Document all issues with:
- Issue ID and severity
- Detailed description
- Steps to reproduce
- Expected vs. actual results
- Screenshots or code snippets
- Assigned owner
- Resolution plan

### 10.3 Resolution Workflow

1. Issue identified through validation
2. Issue logged in tracking system
3. Issue assigned to responsible team
4. Fix implemented and tested
5. Verification testing by QA
6. Issue closed after successful verification

## 11. Release Quality Gates

### 11.1 Pre-release Validation

Before any release:
1. Run full QA validation suite
2. Verify no open S1 or S2 issues
3. Verify regression tests pass
4. Obtain QA signoff

### 11.2 Post-release Validation

After deployment:
1. Run smoke tests on production
2. Monitor system health metrics
3. Capture baseline metrics for next release
4. Document lessons learned

## 12. Custom QA Validator Development

### 12.1 Creating New Validators

To add new validation capabilities:

1. Create validator class in `validators/` directory
2. Implement standard validation interface
3. Define quality metrics and thresholds
4. Add test cases
5. Register with ping_caca framework

Example:
```python
class NewValidator(BaseValidator):
    def validate(self, input_data):
        # Validation logic here
        return ValidationResult(score=0.95, passed=True)
```

### 12.2 Validator Registration

Register validators in `validator_registry.yaml`:
```yaml
validators:
  prompt_quality: validators.prompt.PromptQualityValidator
  brand_mentions: validators.brands.BrandMentionsValidator
  new_validator: validators.custom.NewValidator
```

## 13. Related Documents

- [Prompt Usage SOP](prompt_usage_sop.md)
- [CLI Command SOP](cli_command_sop.md)
- [QA Development Guide](../qa_development_guide.md)
- [Issue Resolution Workflow](../issue_resolution.md)

## 14. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2025-05-16 | Applied enforcement-language-hardening-v1 | Claude 3.7 Sonnet |
| 1.0 | 2025-05-15 | Initial SOP | InsightPulseAI |