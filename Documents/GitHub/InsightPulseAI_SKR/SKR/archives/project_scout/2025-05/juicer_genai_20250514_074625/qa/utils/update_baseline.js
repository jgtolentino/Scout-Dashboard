/**
 * Script for PR authors to update specific baselines
 * 
 * This utility helps developers update baseline images when intentionally 
 * changing visual design. It provides an interactive workflow to update
 * specific baselines rather than all of them at once.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Dashboard configurations (same as tests)
const dashboards = [
  {
    name: 'drilldown-dashboard',
    path: '/dashboards/drilldown-dashboard.html',
    components: ['header', 'brand-table', 'breadcrumb', 'kpi-cards', 'timeline-chart']
  },
  {
    name: 'retail-performance',
    path: '/dashboards/retail_performance/retail_performance_dashboard.html',
    components: ['header', 'performance-metrics', 'regional-map', 'trend-chart']
  }
];

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt function that returns a promise
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// Helper to create backup directory
function ensureBackupDir() {
  const backupDir = path.join(__dirname, '../backup', new Date().toISOString().replace(/:/g, '-'));
  fs.mkdirSync(backupDir, { recursive: true });
  return backupDir;
}

// Main function to update baselines
async function updateBaselines() {
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}   Baseline Update for Visual Changes${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

  // Get dashboard URL from environment or use default
  const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8080';
  console.log(`${colors.yellow}Using dashboard URL: ${DASHBOARD_URL}${colors.reset}\n`);

  // Ensure backup directory exists
  const backupDir = ensureBackupDir();
  console.log(`${colors.green}Created backup directory: ${backupDir}${colors.reset}\n`);

  // Count available components
  let componentCount = 0;
  dashboards.forEach(dashboard => {
    componentCount += dashboard.components.length;
  });

  // Show available dashboards and components
  console.log(`${colors.cyan}Available Dashboards and Components:${colors.reset}`);
  let index = 1;

  dashboards.forEach(dashboard => {
    console.log(`\n${colors.magenta}${dashboard.name}:${colors.reset}`);
    dashboard.components.forEach(component => {
      console.log(`  ${index}. ${component}`);
      index++;
    });
  });

  // Ask which components to update
  console.log(`\n${colors.yellow}Which components would you like to update?${colors.reset}`);
  console.log(`Enter component numbers separated by commas (e.g., 1,3,5) or "all" for all components:`);
  
  const answer = await prompt('> ');
  let componentsToUpdate = [];
  
  if (answer.toLowerCase() === 'all') {
    // Update all components
    dashboards.forEach(dashboard => {
      dashboard.components.forEach(component => {
        componentsToUpdate.push({ dashboard, component });
      });
    });
    console.log(`${colors.green}Updating all ${componentCount} components${colors.reset}\n`);
  } else {
    // Parse component numbers
    const selectedIndices = answer.split(',')
      .map(num => parseInt(num.trim(), 10))
      .filter(num => !isNaN(num) && num > 0 && num <= componentCount);
    
    if (selectedIndices.length === 0) {
      console.log(`${colors.red}No valid components selected. Exiting.${colors.reset}`);
      rl.close();
      return;
    }
    
    // Map indices to dashboard and component pairs
    index = 1;
    for (const dashboard of dashboards) {
      for (const component of dashboard.components) {
        if (selectedIndices.includes(index)) {
          componentsToUpdate.push({ dashboard, component });
        }
        index++;
      }
    }
    
    console.log(`${colors.green}Updating ${componentsToUpdate.length} components${colors.reset}\n`);
  }

  // Launch browser
  console.log(`${colors.yellow}Launching browser...${colors.reset}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Track which dashboards we've already loaded to avoid reloading
    const loadedDashboards = new Set();
    let currentPage = null;
    let currentDashboard = null;

    // Process each component to update
    for (const { dashboard, component } of componentsToUpdate) {
      console.log(`\n${colors.yellow}Processing: ${dashboard.name} - ${component}${colors.reset}`);
      
      // Check if we need to load a new dashboard
      if (currentDashboard !== dashboard.name) {
        // Close previous page if exists
        if (currentPage) {
          await currentPage.close();
        }
        
        // Create a new page
        currentPage = await browser.newPage();
        
        // Set viewport to consistent size for testing
        await currentPage.setViewport({ width: 1200, height: 800 });
        
        // Navigate to dashboard
        console.log(`  Loading ${DASHBOARD_URL}${dashboard.path}`);
        await currentPage.goto(`${DASHBOARD_URL}${dashboard.path}`, { timeout: 30000 });
        await currentPage.waitForTimeout(2000); // Allow time for rendering
        
        // Update current dashboard
        currentDashboard = dashboard.name;
        loadedDashboards.add(dashboard.name);
      }
      
      try {
        // Try to find the component
        await currentPage.waitForSelector(`.${component}`, { timeout: 5000 });
        const elementHandle = await currentPage.$(`.${component}`);
        
        if (elementHandle) {
          // Paths for baseline and backup
          const baselineDir = path.join(__dirname, '../baselines');
          const baselinePath = path.join(baselineDir, `${dashboard.name}-${component}.png`);
          const backupPath = path.join(backupDir, `${dashboard.name}-${component}.png`);
          
          // Backup existing baseline if it exists
          if (fs.existsSync(baselinePath)) {
            fs.copyFileSync(baselinePath, backupPath);
            console.log(`  ${colors.green}✓${colors.reset} Backed up existing baseline to ${backupPath}`);
          }
          
          // Take screenshot and save as new baseline
          const screenshot = await elementHandle.screenshot();
          fs.writeFileSync(baselinePath, screenshot);
          console.log(`  ${colors.green}✓${colors.reset} Updated baseline: ${baselinePath}`);
        } else {
          console.log(`  ${colors.red}✗${colors.reset} Component not found: ${component}`);
        }
      } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error updating ${component}: ${error.message}`);
      }
    }

    // Close the final page if exists
    if (currentPage) {
      await currentPage.close();
    }

    console.log(`\n${colors.green}${colors.bright}Baseline update complete!${colors.reset}`);
    console.log(`\n${colors.yellow}Summary:${colors.reset}`);
    console.log(`- Updated ${componentsToUpdate.length} components`);
    console.log(`- Backups stored in: ${backupDir}`);
    console.log(`\n${colors.magenta}Don't forget to commit these changes with your PR!${colors.reset}`);
  } finally {
    // Close the browser
    await browser.close();
    
    // Close readline interface
    rl.close();
  }
}

// Run the update function
updateBaselines().catch(error => {
  console.error(`${colors.red}Error during baseline update:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});