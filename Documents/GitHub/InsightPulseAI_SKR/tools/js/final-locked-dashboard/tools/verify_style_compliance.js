#!/usr/bin/env node
/**
 * verify_style_compliance.js
 * Verification script for Power BI styling compliance
 * Part of InsightPulseAI Unified Developer Deployment SOP (v1.0)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Text formatting for console output
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

// Get environment variables or use defaults
const ROOT_DIR = process.env.SCOUT_ROOT_DIR || path.join(process.env.HOME, "Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard");
const STYLE_GUIDE_PATH = process.env.STYLE_GUIDE_PATH || "POWER_BI_STYLE_GUIDE.md";
const DASHBOARD_PATH = process.env.DASHBOARD_PATH || "insights_dashboard_v2.html";

// Print header
console.log(`${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${BLUE}║  Power BI Style Compliance Verification                         ${RESET}`);
console.log(`${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${RESET}`);
console.log();

// Verify file paths
const styleGuidePath = path.join(ROOT_DIR, STYLE_GUIDE_PATH);
const dashboardPath = path.join(ROOT_DIR, DASHBOARD_PATH);
const cssPath = path.join(ROOT_DIR, 'css/retail_edge_style_patch.css');

if (!fs.existsSync(styleGuidePath)) {
  console.error(`${RED}Error: Style guide file not found at ${styleGuidePath}${RESET}`);
  process.exit(1);
}

if (!fs.existsSync(dashboardPath)) {
  console.error(`${RED}Error: Dashboard HTML file not found at ${dashboardPath}${RESET}`);
  process.exit(1);
}

if (!fs.existsSync(cssPath)) {
  console.error(`${RED}Error: CSS file not found at ${cssPath}${RESET}`);
  process.exit(1);
}

console.log(`${GREEN}✓${RESET} Found required files`);

// Read the dashboard HTML
const dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

// Define the checks to perform
const styleChecks = [
  {
    name: "Azure blue header",
    check: () => css.includes("#0078D4") || css.includes("var(--azure-blue)"),
    critical: true
  },
  {
    name: "Breadcrumb navigation",
    check: () => dashboardHtml.includes("breadcrumb") || dashboardHtml.includes("nav-path"),
    critical: true
  },
  {
    name: "KPI cards with left accent",
    check: () => css.includes("border-left") && (dashboardHtml.includes("kpi-card") || dashboardHtml.includes("metric-card")),
    critical: true
  },
  {
    name: "Responsive grid layout",
    check: () => dashboardHtml.includes("grid") || dashboardHtml.includes("flex"),
    critical: true
  },
  {
    name: "Chart containers with proper headers",
    check: () => dashboardHtml.includes("chart-container") || dashboardHtml.includes("visualization-container"),
    critical: false
  },
  {
    name: "Unified GenAI presentation",
    check: () => dashboardHtml.includes("GenAI") || dashboardHtml.includes("ai-insight") || dashboardHtml.includes("insight-card"),
    critical: true
  },
  {
    name: "Tailwind-compatible classes",
    check: () => dashboardHtml.includes("class=\"") && !dashboardHtml.includes("tw-"),
    critical: false
  },
  {
    name: "Proper footer with spacing",
    check: () => dashboardHtml.includes("footer") || dashboardHtml.includes("dashboard-footer"),
    critical: false
  },
  {
    name: "Card elevation with shadows",
    check: () => css.includes("box-shadow") || css.includes("shadow"),
    critical: false
  },
  {
    name: "Typography hierarchy",
    check: () => css.includes("font-size") && (css.includes("heading") || css.includes("title")),
    critical: false
  }
];

// Run the checks
console.log(`\n${BOLD}Running Style Compliance Checks...${RESET}\n`);

let passedChecks = 0;
let failedCritical = false;

styleChecks.forEach((check, index) => {
  const passed = check.check();
  
  if (passed) {
    console.log(`${GREEN}✓${RESET} ${check.name}`);
    passedChecks++;
  } else {
    if (check.critical) {
      console.log(`${RED}✗ ${check.name} [CRITICAL]${RESET}`);
      failedCritical = true;
    } else {
      console.log(`${YELLOW}✗ ${check.name} [WARNING]${RESET}`);
    }
  }
});

// Print summary
console.log(`\n${BOLD}Compliance Summary${RESET}`);
console.log(`${BLUE}------------------${RESET}`);
console.log(`Passed: ${GREEN}${passedChecks}/${styleChecks.length}${RESET} checks`);

if (failedCritical) {
  console.log(`\n${RED}${BOLD}❌ FAILED: Critical style compliance issues detected${RESET}`);
  console.log(`${YELLOW}Please fix critical issues before deployment${RESET}`);
  process.exit(1);
} else if (passedChecks < styleChecks.length) {
  console.log(`\n${YELLOW}${BOLD}⚠️ WARNING: Some non-critical style issues detected${RESET}`);
  console.log(`${YELLOW}Deployment can continue, but consider fixing these issues${RESET}`);
  process.exit(0);
} else {
  console.log(`\n${GREEN}${BOLD}✅ PASSED: All style compliance checks passed${RESET}`);
  console.log(`${GREEN}Dashboard is compliant with Power BI styling guidelines${RESET}`);
  process.exit(0);
}