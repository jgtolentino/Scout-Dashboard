/**
 * CI Environment Preparation Utility
 * 
 * This script prepares the QA framework for CI/CD integration by:
 * 1. Creating necessary directories
 * 2. Generating placeholder baseline images if needed
 * 3. Setting up environment variables
 * 4. Validating test configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Directory paths
const baseDir = path.resolve(__dirname, '..');
const dirPaths = {
  baselines: path.join(baseDir, 'baselines'),
  temp: path.join(baseDir, 'temp'),
  reports: path.join(baseDir, 'reports'),
  debug: path.join(baseDir, 'debug')
};

// Dashboard configuration
const dashboards = [
  {
    name: 'drilldown-dashboard',
    components: ['header', 'brand-table', 'breadcrumb', 'kpi-cards', 'timeline-chart']
  },
  {
    name: 'retail-performance',
    components: ['header', 'performance-metrics', 'regional-map', 'trend-chart']
  }
];

// Main function
async function prepareEnvironment() {
  console.log(`${colors.bright}${colors.fg.blue}==========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.fg.blue}   CI Environment Preparation${colors.reset}`);
  console.log(`${colors.bright}${colors.fg.blue}==========================================${colors.reset}\n`);
  
  // 1. Create necessary directories
  console.log(`${colors.fg.yellow}Creating necessary directories...${colors.reset}`);
  Object.values(dirPaths).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ${colors.fg.green}✓${colors.reset} Created ${dir}`);
    } else {
      console.log(`  ${colors.fg.green}✓${colors.reset} ${dir} already exists`);
    }
  });
  
  // 2. Generate placeholder baselines if needed
  console.log(`\n${colors.fg.yellow}Checking for baseline images...${colors.reset}`);
  const baselineCount = fs.readdirSync(dirPaths.baselines)
    .filter(file => file.endsWith('.png') || file.endsWith('.svg'))
    .length;
  
  if (baselineCount === 0) {
    console.log(`  ${colors.fg.red}✗${colors.reset} No baseline images found`);
    console.log(`  ${colors.fg.yellow}Generating placeholder baselines...${colors.reset}`);
    
    // Create SVG placeholder images
    for (const dashboard of dashboards) {
      for (const component of dashboard.components) {
        const baselineName = `${dashboard.name}-${component}`;
        const baselinePath = path.join(dirPaths.baselines, `${baselineName}.svg`);
        
        // Create an SVG placeholder
        const svgContent = `
          <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <rect x="5" y="5" width="490" height="290" fill="white" stroke="#aaa" stroke-width="2" stroke-dasharray="5,5"/>
            <text x="50%" y="45%" font-family="Arial" font-size="24" text-anchor="middle" fill="#555">${component}</text>
            <text x="50%" y="55%" font-family="Arial" font-size="16" text-anchor="middle" fill="#777">${dashboard.name}</text>
          </svg>
        `;
        
        fs.writeFileSync(baselinePath, svgContent);
        console.log(`  ${colors.fg.green}✓${colors.reset} Created placeholder: ${baselineName}.svg`);
      }
    }
  } else {
    console.log(`  ${colors.fg.green}✓${colors.reset} Found ${baselineCount} baseline images`);
  }
  
  // 3. Set up environment variables
  console.log(`\n${colors.fg.yellow}Setting up environment variables...${colors.reset}`);
  const envVars = {
    DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:8080',
    NODE_ENV: process.env.NODE_ENV || 'test'
  };
  
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${colors.fg.green}✓${colors.reset} ${key}=${value}`);
  });
  
  // Create .env file for local development
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(path.join(baseDir, '.env'), envContent);
  console.log(`  ${colors.fg.green}✓${colors.reset} Created .env file with variables`);
  
  // 4. Validate Jest configuration
  console.log(`\n${colors.fg.yellow}Validating Jest configuration...${colors.reset}`);
  try {
    const jestConfig = require('../jest.config.js');
    console.log(`  ${colors.fg.green}✓${colors.reset} Jest configuration is valid`);
    
    if (jestConfig.globals && jestConfig.globals.DASHBOARD_URL) {
      console.log(`  ${colors.fg.green}✓${colors.reset} Dashboard URL in Jest config: ${jestConfig.globals.DASHBOARD_URL}`);
    } else {
      console.log(`  ${colors.fg.yellow}!${colors.reset} Dashboard URL not set in Jest globals`);
    }
  } catch (e) {
    console.log(`  ${colors.fg.red}✗${colors.reset} Jest configuration error: ${e.message}`);
  }
  
  // 5. Create babel.config.js if it doesn't exist
  console.log(`\n${colors.fg.yellow}Checking Babel configuration...${colors.reset}`);
  const babelConfigPath = path.join(baseDir, 'babel.config.js');
  if (!fs.existsSync(babelConfigPath)) {
    const babelConfig = `
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
`;
    fs.writeFileSync(babelConfigPath, babelConfig);
    console.log(`  ${colors.fg.green}✓${colors.reset} Created babel.config.js`);
  } else {
    console.log(`  ${colors.fg.green}✓${colors.reset} babel.config.js already exists`);
  }
  
  // Final summary
  console.log(`\n${colors.bright}${colors.fg.blue}CI Environment Setup Complete!${colors.reset}`);
  console.log(`\nRun tests with: ${colors.fg.cyan}npm test${colors.reset}`);
}

// Run the preparation
prepareEnvironment().catch(error => {
  console.error(`${colors.fg.red}Error preparing CI environment:${colors.reset}`, error);
  process.exit(1);
});