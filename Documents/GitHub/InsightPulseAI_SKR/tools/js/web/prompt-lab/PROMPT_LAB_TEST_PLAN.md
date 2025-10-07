# Prompt Lab Web Explorer Test Plan

## Overview

This test plan outlines the verification steps required before deploying the Prompt Lab web explorer to production. 
The plan covers API connectivity, functional UI tests, visual QA, and deployment validation.

Test Owner: Jake Tolentino  
QA Agents: Claudia, Caca  
Target Completion: Before InsightPulseAI 2.3.0 release

## ✅ `/prompt-lab` Deployment & Testing Checklist

### 🔌 API Connectivity

* [ ] Confirm `/api/prompt_engineer/analyze` returns expected structure
  * Test with valid prompt text
  * Validate response contains scores, strengths, weaknesses
  * Check performance with large prompts (>2000 characters)

* [ ] Confirm `/api/prompt_engineer/improve` and `variations` respond correctly
  * Test improve with different goals (clarity, specificity, examples)
  * Test variations with different count parameters (1-5)
  * Verify response format matches frontend expectations

* [ ] Validate error handling 
  * Test with missing prompt body
  * Test with empty prompt text
  * Test with malformed request structure
  * Verify error messages are user-friendly

### 🧪 Functional UI Tests

* [ ] Load default prompt in editor on first render
  * Verify content loads correctly
  * Check formatting and syntax highlighting
  * Test with different screen sizes

* [ ] Run "Analyze" → show result in ScoreChart
  * Click Analyze button and verify loading state
  * Confirm chart renders correctly with scores
  * Verify strengths/weaknesses lists populate
  * Test responsiveness of analysis panel

* [ ] Modify prompt → run "Improve" → update text area with improved version
  * Edit prompt text
  * Select improvement goals
  * Run improve and verify text updates
  * Check changes summary is displayed correctly

* [ ] Generate 3–5 variations and show each in preview blocks
  * Set variation count using input control
  * Trigger generation and verify loading state
  * Confirm variations display with name and focus
  * Test "Use This" button to select variation

* [ ] Use search/filter UI to find tagged prompts via `system_prompts` endpoint
  * Test search by keyword
  * Test filtering by category
  * Test selecting/deselecting tags
  * Verify results update dynamically
  * Check empty state handling

### 🎨 Visual QA

* [ ] Capture full-page screenshot via `visual_qa capture --url /prompt-lab`
  * Capture desktop breakpoint (1920×1080)
  * Capture tablet breakpoint (768×1024)
  * Capture mobile breakpoint (375×667)

* [ ] Compare with visual baseline using `visual_qa compare`
  * Create baseline if this is first test
  * Compare with existing baseline if available
  * Document any visual regressions

* [ ] Log result to Caca with `qa_report.js --feature prompt-lab`
  * Generate QA report with detailed findings
  * Include screenshots and comparison results
  * Add recommendations for visual improvements

### 📦 Deployment Artifacts

* [ ] Confirm `/tools/js/web/prompt-lab/dist` contains optimized build
  * Verify JS bundle is minified
  * Check CSS optimization
  * Validate asset references

* [ ] Validate `vercel.json` or route config includes `/prompt-lab`
  * Confirm correct routing configuration
  * Verify API proxy settings
  * Check cache headers

* [ ] Load page at `https://[your-domain]/prompt-lab` without console errors
  * Test in Chrome, Firefox, Safari
  * Verify no JS errors in console
  * Check network requests complete successfully
  * Validate performance metrics (load time < 2s)

## Test Data

Use the following prompts for testing:

1. **Simple Prompt**:
```
Write a concise summary of the quarterly sales report.
```

2. **Complex Prompt**:
```
You are an expert in molecular biology. Analyze the attached RNA sequencing data and identify any potential mutations in the BRCA1 gene. For each mutation, provide:
1. The specific location in the genome
2. The type of mutation (missense, nonsense, etc.)
3. Potential clinical significance based on current literature
4. Recommended follow-up tests

Format your response as a detailed technical report that would be suitable for a peer-reviewed journal. Include appropriate citations where necessary.
```

3. **System Prompt**:
```
You are Claude, an AI assistant created by Anthropic to be helpful, harmless, and honest.

When responding to the user:
1. Be comprehensive and specific
2. Use clear, concise language
3. Break down complex concepts
4. Avoid speculation when uncertain
5. Maintain a helpful, conversational tone
```

## Expected Results

After completing all tests:

1. All API endpoints should respond correctly with expected data structures
2. UI components should render and function as designed across all breakpoints
3. Visual appearance should match design specifications with no regressions
4. Build artifacts should be optimized and deployment-ready
5. No console errors or performance issues should be present

## Reporting

Document all test results in:
- Jira ticket PULSE-2025
- QA report generated via `qa_report.js`
- Screenshots stored in `/QA/prompt-lab/`

## Sign-off Requirements

The following approvals are required before production deployment:

- [ ] QA Lead (Caca)
- [ ] Engineering Lead (Jake)
- [ ] Product Owner (Claudia)

## Post-Deployment Validation

After deployment to production:

1. Verify functionality in production environment
2. Monitor error rates and performance metrics for 24 hours
3. Collect initial user feedback
4. Document any issues for immediate hotfix or future iteration