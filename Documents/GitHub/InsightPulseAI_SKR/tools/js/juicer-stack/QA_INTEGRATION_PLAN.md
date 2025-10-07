# QA Integration Plan: Architecture Diagrams & Dashboards

This document outlines the integration plan for our newly created QA tools for architecture diagrams and Power BI-style dashboards.

## 1. Current Status

### Architecture Diagram QA
- ✅ Quick QA tool implemented (`quick_diagram_qa.js`)
- ✅ Preview tool created (`preview_diagram.sh`) 
- ✅ CLI integration completed
- ✅ First QA run successful (7/8 passes)
- ⚠️ Missing draw.io CLI for automated exports

### Dashboard QA (Power BI Style)
- ✅ Power BI style checker implemented (`powerbi_qa_addon.js`)
- ✅ GitHub workflow configuration created
- ✅ CLI integration completed
- ⚠️ Local server setup needed for automated testing

## 2. Integration Steps

### 2.1 Environment Setup (Day 1)

1. **Install Dependencies**
   ```bash
   # In the juicer-stack/qa directory
   npm install --save-dev puppeteer@^21.0.0 pixelmatch@^5.3.0 pngjs@^7.0.0 axe-core@^4.7.0
   ```

2. **Install draw.io CLI** (for diagram exports)
   ```bash
   # macOS
   brew install drawio-desktop
   
   # Ubuntu
   wget https://github.com/jgraph/drawio-desktop/releases/download/v21.1.2/drawio-amd64-21.1.2.deb
   sudo dpkg -i drawio-amd64-21.1.2.deb
   ```

3. **Add Shell Aliases**
   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   alias quick-diagram-qa='bash /path/to/run_quick_diagram_qa.sh'
   alias powerbi-qa='bash /path/to/run_powerbi_qa.sh'
   ```

### 2.2 Developer Workflow (Day 1-2)

1. **Update Documentation**
   - Add QA tools section to main README.md
   - Create workflow documentation for architecture teams
   - Create styleguide reference for dashboard developers

2. **Create QA Templates**
   - Standardized QA report format for both tools
   - QA comment templates for Pull Requests
   - Requirements document for new diagrams/dashboards

3. **Configure Local Development**
   - Set up local dashboard server for testing
   - Create test fixtures for both tools
   - Add debugging configurations

### 2.3 CI/CD Integration (Day 3-4)

1. **GitHub Actions Integration**
   - Configure workflow triggers on diagram/dashboard changes
   - Set up artifact storage for QA reports
   - Add PR comment automation for QA results

2. **QA Enforcement**
   - Set up blocking checks for critical failures
   - Configure notification system for warnings
   - Create exemption process for special cases

3. **Monitoring**
   - Track QA success rate over time
   - Monitor performance of QA tools
   - Create dashboard for QA metrics

### 2.4 Reference Implementation (Day 5)

1. **Create Golden Examples**
   - Perfect diagram examples that pass all checks
   - Power BI style dashboard examples
   - QA report examples for training

2. **Training Materials**
   - Quick guide for using QA tools
   - Common fixes for typical issues
   - Troubleshooting guide

## 3. Testing Plan

### 3.1 Unit Tests

- Test individual QA checks in isolation
- Verify error handling for malformed inputs
- Test performance with large diagrams/dashboards

### 3.2 Integration Tests

- Full pipeline tests with GitHub Actions
- Cross-browser compatibility for dashboard QA
- Test with different diagram/dashboard complexity levels

### 3.3 User Acceptance Testing

- Architecture team validation of diagram QA
- Dashboard team validation of Power BI style checks
- Leadership review of QA reports

## 4. Rollout Plan

### Week 1: Soft Launch
- Make tools available but not mandatory
- Run on existing diagrams/dashboards in read-only mode
- Gather feedback and adjust thresholds

### Week 2: Progressive Adoption
- Make tools mandatory for new diagrams/dashboards
- Run on existing assets with warning-only mode
- Train teams on using the tools

### Week 3: Full Enforcement
- Make tools mandatory for all PR submissions
- Enforce blocking on critical failures
- Continue gathering metrics

## 5. Success Metrics

- 100% of new diagrams pass QA before merge
- 90% of existing diagrams pass QA after remediation
- 95% of dashboards match Power BI style guidelines
- Reduced time spent on manual QA by 75%
- Positive developer satisfaction with tools

## 6. Resources Required

- 1 developer to maintain and improve QA tools (0.25 FTE)
- Storage for reference images (~200MB)
- CI computation time for automated checks (~50 minutes/day)
- Documentation updates (2 hours/week)

## Timeline

| Week | Goal | Tasks |
|------|------|-------|
| Week 1 | Environment Setup | Install dependencies, configure tools |
| Week 1 | Developer Workflow | Documentation, templates, local setup |
| Week 2 | CI/CD Integration | GitHub Actions, enforcement, monitoring |
| Week 2 | Reference Implementation | Golden examples, training materials |
| Week 3 | Soft Launch | Optional usage, collect feedback |
| Week 4 | Progressive Adoption | Mandatory for new assets, train teams |
| Week 5 | Full Enforcement | Mandatory for all PRs, metrics collection |

This integration plan ensures our architecture diagrams and dashboards maintain consistent quality and professional appearance.