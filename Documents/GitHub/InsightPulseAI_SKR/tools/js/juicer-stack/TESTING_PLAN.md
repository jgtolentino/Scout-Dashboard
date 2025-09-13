# Juicer GenAI Insights Testing Plan

This document outlines the testing strategy for the Juicer GenAI Insights system after deployment to Azure.

## 1. Test Environment Setup

Before beginning testing, ensure the following:

1. **Azure Resources**: All required Azure resources are deployed
   - Databricks workspace
   - Storage account with bronze/silver/gold/platinum containers
   - Static Web App for dashboard
   - Key Vault with secrets

2. **Databricks Configuration**:
   - Storage mounted at appropriate paths
   - Notebooks uploaded and configured
   - Cluster is running and accessible

3. **API Configuration**:
   - LLM API keys (Claude, OpenAI) are properly stored in Key Vault
   - API access is working correctly

4. **Sample Data**:
   - Create sample dataset for testing
   - Load sample data into Bronze layer

## 2. End-to-End Pipeline Tests

### 2.1 Data Processing Pipeline

Test the complete data processing pipeline from Bronze to Platinum layer:

1. **Bronze → Silver**:
   - Run `juicer_ingest_bronze.sql` notebook
   - Verify data is loaded into Bronze layer
   - Run `juicer_enrich_silver.py` notebook
   - Verify brand mentions and sentiment extraction in Silver layer

2. **Gold Layer Processing**:
   - Verify reconstructed transcripts in Gold layer
   - Check brand context enrichment

3. **Platinum Insights Generation**:
   - Run `juicer_gold_insights.py` notebook
   - Verify insights are generated in Platinum layer
   - Check confidence scoring and metadata

Use the following command to check data in each layer:

```sql
-- Bronze layer check
SELECT COUNT(*) FROM insight_pulse_ai.bronze.transcripts;

-- Silver layer check
SELECT COUNT(*) FROM insight_pulse_ai.silver.transcript_entity_mentions;

-- Gold layer check
SELECT COUNT(*) FROM insight_pulse_ai.gold.reconstructed_transcripts;

-- Platinum layer check
SELECT COUNT(*) FROM insight_pulse_ai.platinum.genai_insights;
```

### 2.2 LLM Integration Tests

Test each LLM provider for insights generation:

1. **Claude Integration**:
   ```python
   # Test Claude API access
   model_choice = "claude"
   result = await generate_insights_for_batch(batch_df, ["general"], model_choice)
   ```

2. **OpenAI Integration**:
   ```python
   # Test OpenAI API access
   model_choice = "openai"
   result = await generate_insights_for_batch(batch_df, ["general"], model_choice)
   ```

3. **Fallback Mechanism**:
   ```python
   # Test fallback mechanism
   model_choice = "auto"
   result = await generate_insights_for_batch(batch_df, ["general"], model_choice)
   ```

### 2.3 CLI and Command Integration

Test the CLI commands and Pulser integration:

1. **CLI Commands**:
   ```bash
   # Test direct CLI
   juicer insights generate --days 7 --model claude
   juicer insights show --type brand --brand TestBrand --limit 5
   ```

2. **Pulser Commands**:
   ```bash
   # Test Pulser integration
   :juicer insights generate --days 7 --model claude
   :juicer insights show --type brand --brand TestBrand --limit 5
   ```

## 3. Dashboard Tests

### 3.1 Dashboard Rendering

Verify dashboard components render correctly:

1. **Access Dashboard**: Navigate to the Static Web App URL
2. **UI Components**: Verify all components load correctly
   - Insights cards
   - Charts and visualizations
   - Filtering controls
   - Trend displays

3. **Responsive Design**: Test on different screen sizes
   - Desktop (1280x800)
   - Tablet (768x1024)
   - Mobile (375x667)

### 3.2 Visual QA

Run the dashboard visual QA tests:

```bash
# Run visual QA tests
node dashboard_qa.js --start-server

# Test specific components
node dashboard_qa.js --component brand-chart,sentiment-chart --breakpoint desktop
```

### 3.3 Interaction Tests

Test user interactions with the dashboard:

1. **Filtering**: Test filter controls
   - Time range filter (7/14/30/90 days)
   - Brand filter
   - Insight type filter
   - Confidence threshold filter

2. **Data Display**: Verify data updates when filters change

3. **Chart Interactions**: Test tooltips and interactive features

## 4. Quality Validation Tests

### 4.1 Insights Validation

Validate the quality of generated insights:

```bash
# Export insights to JSON
databricks fs cp dbfs:/mnt/insightpulseai/platinum/genai_insights /tmp/insights.json

# Run validation
node insights_validator.js --input /tmp/insights.json
```

Check the validation report for:
- Hallucination scores
- Contradiction detection
- Statistical accuracy
- Source alignment
- Overall quality scores

### 4.2 Hallucination Testing

Create specific test cases for hallucination detection:

1. **Factual Accuracy Test**: Compare insights against known ground truth
2. **Consistency Check**: Verify insights don't contradict themselves
3. **Source Verification**: Confirm insights are supported by source data

## 5. Performance Tests

### 5.1 Processing Performance

Measure processing times for different stages:

1. **Insights Generation**:
   - Time to process 100 transcripts
   - Memory usage during processing
   - Token usage per insight

2. **Dashboard Loading**:
   - Time to load dashboard
   - Time to render charts
   - Performance with large datasets (500+ insights)

### 5.2 Scalability Tests

Test system behavior with increasing data volumes:

1. **Large Dataset Test**:
   - Load 1000+ transcripts
   - Measure processing time and resource usage
   - Verify system stability

2. **Concurrent User Test**:
   - Simulate multiple users accessing dashboard
   - Measure response times and load

## 6. Automated Testing

Set up automated tests for CI/CD:

1. **Unit Tests**:
   - Create tests for key functions
   - Add to GitHub Actions workflow

2. **Integration Tests**:
   - Create end-to-end test scripts
   - Include in deployment validation

3. **Visual Regression Tests**:
   - Update baseline images
   - Configure automated testing

## 7. Test Matrix

Use this test matrix to track test execution:

| Test Category | Test Name | Environment | Status | Issues |
|---------------|-----------|-------------|--------|--------|
| Pipeline | Bronze → Silver | Dev | - | - |
| Pipeline | Gold Processing | Dev | - | - |
| Pipeline | Insights Generation | Dev | - | - |
| LLM | Claude Integration | Dev | - | - |
| LLM | OpenAI Integration | Dev | - | - |
| LLM | Fallback Mechanism | Dev | - | - |
| CLI | Direct Commands | Dev | - | - |
| CLI | Pulser Integration | Dev | - | - |
| Dashboard | UI Rendering | Dev | - | - |
| Dashboard | Responsive Design | Dev | - | - |
| Dashboard | Interactions | Dev | - | - |
| Quality | Insights Validation | Dev | - | - |
| Quality | Hallucination Testing | Dev | - | - |
| Performance | Processing Metrics | Dev | - | - |
| Performance | Dashboard Loading | Dev | - | - |
| Scalability | Large Dataset | Dev | - | - |
| Scalability | Concurrent Users | Dev | - | - |

## 8. Issue Tracking

Record any issues found during testing:

| Issue ID | Description | Severity | Status | Resolution |
|----------|-------------|----------|--------|------------|
| - | - | - | - | - |

## 9. Acceptance Criteria

The testing is considered successful when:

1. **Pipeline Integrity**: Data flows correctly through all layers
2. **Insights Quality**: Average confidence score > 85%
3. **Dashboard Functionality**: All components render and interact properly
4. **Performance**: Processing time < 5 minutes for 100 transcripts
5. **Stability**: No errors during normal operation
6. **Scalability**: Handles 1000+ transcripts and 10+ concurrent users

## 10. Test Environment Cleanup

After testing is complete:

1. Stop Databricks clusters to avoid unnecessary costs
2. Archive test data if needed
3. Clean up any temporary resources

## 11. Reporting

Create a test report documenting:

1. Test results and coverage
2. Issues found and resolutions
3. Performance metrics
4. Recommendations for improvement

Submit this report to stakeholders for review before promoting to production.