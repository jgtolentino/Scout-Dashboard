# Client360 Dashboard UAT Schedule & Sign-Off

**Document Version:** 1.0  
**Last Updated:** May 21, 2025  
**Status:** Approved

## Overview

This document outlines the User Acceptance Testing (UAT) schedule, responsibilities, and sign-off process for the Client360 Dashboard. UAT is critical to ensure the dashboard meets all stakeholder requirements and functions properly before deployment to production.

## UAT Participants

| Role | Name | Department | Contact |
|------|------|------------|---------|
| UAT Lead | [UAT Lead Name] | Business Analysis | uat.lead@tbwa.com |
| QA Engineer | [QA Engineer Name] | Quality Assurance | qa.engineer@tbwa.com |
| Business Analyst | [Business Analyst Name] | Business Analysis | business.analyst@tbwa.com |
| Operations Representative | [Operations Rep Name] | Operations | ops.rep@tbwa.com |
| IT Engineer | [IT Engineer Name] | IT/Technical | it.engineer@tbwa.com |
| Data Scientist | [Data Scientist Name] | Data Analytics | data.scientist@tbwa.com |
| Marketing Lead | [Marketing Lead Name] | Marketing | marketing.lead@tbwa.com |

## UAT Schedule

| Activity | Date | Owner | Status |
|----------|------|-------|--------|
| UAT Preparation | May 22, 2025 | QA Engineer | Scheduled |
| Test Execution | May 23–24, 2025 | QA & Stakeholders | Scheduled |
| Defect Triage & Retesting | May 25–26, 2025 | UAT Lead | Scheduled |
| UAT Sign-Off | May 27, 2025 | Business Analyst | Scheduled |

## UAT Test Environments

| Environment | URL | Purpose | Access Method |
|-------------|-----|---------|--------------|
| UAT | https://uat-client360-dashboard.azurestaticapps.net | User Acceptance Testing | Azure AD SSO |
| Production | https://blue-coast-0acb6880f.6.azurestaticapps.net | Live Environment | Azure AD SSO |

## Test Cases Overview

The UAT test cases will cover:

1. **Global Navigation & Controls**
   - Header functionality
   - Filter capabilities
   - Date picker and ranges
   - Data source toggle (real vs simulated)

2. **KPI Tiles & Metrics**
   - Accuracy of calculations
   - Clickable drill-down behavior
   - Visual representation
   - Performance metrics

3. **Geospatial Map**
   - Store locations accuracy
   - Hover functionality
   - Interaction with filters
   - Performance with varying data loads

4. **Charts & Visualizations**
   - Data accuracy
   - Responsiveness to filter changes
   - Export functionality
   - Visual consistency

5. **AI-Powered Insights**
   - Relevance of recommendations
   - Accuracy of insights
   - Contextual drill-down
   - Latency and performance

6. **Theme & Styling**
   - TBWA branding compliance
   - Color scheme consistency
   - Responsive design
   - Accessibility standards

## Defect Management

1. **Severity Levels:**
   - Critical: Renders system unusable
   - High: Major function impacted, no workaround
   - Medium: Function impacted, workaround available
   - Low: Minor issues, cosmetic or enhancement

2. **Reporting Process:**
   - Document in Azure DevOps
   - Include steps to reproduce
   - Add screenshots and environment details
   - Assign severity and priority

3. **Triage Schedule:**
   - Daily during UAT period
   - Critical defects addressed immediately
   - UAT Lead to facilitate triage meetings

## Exit Criteria

UAT will be considered complete when:

1. All critical and high severity defects are resolved
2. 90% of test cases pass
3. Business stakeholders formally sign off
4. Documentation is complete and up-to-date
5. Performance metrics meet defined thresholds

## Sign-Off Process

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Owner | [Business Owner] | _________________ | ________ |
| UAT Lead | [UAT Lead] | _________________ | ________ |
| QA Manager | [QA Manager] | _________________ | ________ |
| IT Manager | [IT Manager] | _________________ | ________ |
| Project Manager | [Project Manager] | _________________ | ________ |

## Post-UAT Activities

| Activity | Date | Owner | Status |
|----------|------|-------|--------|
| Deploy to Production | May 28, 2025 | DevOps Engineer | Scheduled |
| Production Verification | May 28, 2025 | QA Engineer | Scheduled |
| Hypercare Support | May 28-31, 2025 | Support Team | Scheduled |
| Post-Implementation Review | June 3, 2025 | Project Manager | Scheduled |

---

## Appendix A: UAT Feedback Form

For each feature tested, UAT participants will complete:

1. Feature/Functionality tested
2. Test case ID
3. Pass/Fail status
4. Comments/Observations
5. Suggestions for improvement

Link to feedback form: [UAT Feedback Form](https://forms.tbwa.com/client360-uat-feedback)

---

## Pulser Integration

This document has been integrated with the Pulser workflow system. Updates to the UAT schedule and sign-off status will be automatically synchronized with the project management dashboard.

**Pulser Task ID:** UAT-CLIENT360-2025-05-21

This document was generated with Pulser CLI v2.3.0 on May 21, 2025.