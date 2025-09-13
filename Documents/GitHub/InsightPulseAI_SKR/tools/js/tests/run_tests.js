/**
 * run_tests.js
 * 
 * Enhanced test runner for Claude CLI unit tests
 * Simulates Jest-style test structure with detailed reporting
 * Matches Claude Code CLI testing behavior for parity
 */

const fs = require('fs');
const path = require('path');

// Terminal colors for formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Test result counters
let passed = 0;
let failed = 0;
let skipped = 0;
let startTime = null;

// Test suite tracking
let currentSuite = null;
let suiteResults = {};
let failedTests = [];

/**
 * Define a test suite
 * @param {string} name - Suite name
 * @param {Function} fn - Suite function containing tests
 */
function describe(name, fn) {
  currentSuite = name;
  suiteResults[name] = {
    name,
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now()
  };
  
  console.log(`\n${colors.bright}${name}${colors.reset}`);
  try {
    fn();
  } catch (error) {
    console.error(`${colors.red}Error in test suite "${name}": ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
  
  const duration = Date.now() - suiteResults[name].startTime;
  suiteResults[name].duration = duration;
}

/**
 * Define a test case
 * @param {string} name - Test name
 * @param {Function} fn - Test function, may be async
 */
function test(name, fn) {
  const testStartTime = Date.now();
  
  // Check if the function is async (returns a promise)
  const isAsync = fn.constructor.name === 'AsyncFunction';
  
  if (isAsync) {
    // For async tests, we need to handle promises
    fn().then(() => {
      // Test passed
      passed++;
      suiteResults[currentSuite].passed++;
      const duration = Date.now() - testStartTime;
      suiteResults[currentSuite].tests.push({ name, status: 'passed', duration });
      console.log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
    }).catch(error => {
      // Test failed
      failed++;
      failedTests.push({ suite: currentSuite, test: name, error });
      suiteResults[currentSuite].failed++;
      const duration = Date.now() - testStartTime;
      suiteResults[currentSuite].tests.push({ name, status: 'failed', error: error.message, duration });
      console.log(`  ${colors.red}✗${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
      console.log(`    ${colors.red}${error.message}${colors.reset}`);
    });
  } else {
    // For synchronous tests, we can use try/catch
    try {
      fn();
      passed++;
      suiteResults[currentSuite].passed++;
      const duration = Date.now() - testStartTime;
      suiteResults[currentSuite].tests.push({ name, status: 'passed', duration });
      console.log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
    } catch (error) {
      failed++;
      failedTests.push({ suite: currentSuite, test: name, error });
      suiteResults[currentSuite].failed++;
      const duration = Date.now() - testStartTime;
      suiteResults[currentSuite].tests.push({ name, status: 'failed', error: error.message, duration });
      console.log(`  ${colors.red}✗${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
      console.log(`    ${colors.red}${error.message}${colors.reset}`);
    }
  }
}

/**
 * Skip a test case
 * @param {string} name - Test name
 * @param {Function} fn - Test function (not executed)
 */
function skipTest(name, fn) {
  skipped++;
  suiteResults[currentSuite].skipped++;
  suiteResults[currentSuite].tests.push({ name, status: 'skipped' });
  console.log(`  ${colors.yellow}○${colors.reset} ${name} ${colors.dim}(SKIPPED)${colors.reset}`);
}

/**
 * Run test before each test in the current suite
 * @param {Function} fn - Setup function
 */
function beforeEach(fn) {
  if (!suiteResults[currentSuite]) {
    throw new Error(`Cannot use beforeEach outside of a test suite`);
  }
  
  suiteResults[currentSuite].beforeEach = fn;
}

/**
 * Run test after each test in the current suite
 * @param {Function} fn - Teardown function
 */
function afterEach(fn) {
  if (!suiteResults[currentSuite]) {
    throw new Error(`Cannot use afterEach outside of a test suite`);
  }
  
  suiteResults[currentSuite].afterEach = fn;
}

/**
 * Define an assertion (similar to Jest's expect)
 * @param {any} actual - Actual value
 * @returns {object} - Assertion object
 */
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but received ${actual}`);
      }
    },
    
    toEqual: (expected) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr} but received ${actualStr}`);
      }
    },
    
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected truthy value but received ${actual}`);
      }
    },
    
    toBeFalsy: () => {
      if (actual) {
        throw new Error(`Expected falsy value but received ${actual}`);
      }
    },
    
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    
    toMatch: (regex) => {
      if (!regex.test(actual)) {
        throw new Error(`Expected "${actual}" to match pattern ${regex}`);
      }
    },
    
    toThrow: (expected) => {
      try {
        actual();
        throw new Error('Expected function to throw an error but it did not');
      } catch (error) {
        // If expected is provided, check that the error matches
        if (expected) {
          if (typeof expected === 'string' && !error.message.includes(expected)) {
            throw new Error(`Expected error message to contain "${expected}" but got "${error.message}"`);
          } else if (expected instanceof RegExp && !expected.test(error.message)) {
            throw new Error(`Expected error message to match ${expected} but got "${error.message}"`);
          }
        }
        // Otherwise, any error is fine
      }
    },
    
    toBeGreaterThan: (expected) => {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    
    toBeLessThan: (expected) => {
      if (!(actual < expected)) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    
    toBeInstanceOf: (expected) => {
      if (!(actual instanceof expected)) {
        throw new Error(`Expected ${actual} to be an instance of ${expected.name}`);
      }
    },
    
    toHaveProperty: (property, value) => {
      if (!(property in actual)) {
        throw new Error(`Expected object to have property "${property}"`);
      }
      
      if (value !== undefined && actual[property] !== value) {
        throw new Error(`Expected property "${property}" to have value ${value} but got ${actual[property]}`);
      }
    },
    
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null but received ${actual}`);
      }
    },
    
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined but received ${actual}`);
      }
    },
  };
}

/**
 * Generate detailed test report
 * @returns {string} HTML report
 */
function generateReport() {
  const totalTests = passed + failed + skipped;
  const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0;
  const duration = Date.now() - startTime;
  
  let report = `
= Claude CLI Test Report =
  
Total Tests: ${totalTests}
Passed: ${passed} (${successRate}%)
Failed: ${failed}
Skipped: ${skipped}
Duration: ${(duration / 1000).toFixed(2)}s

`;

  // Add summary per suite
  report += `= Suite Results =\n\n`;
  for (const suiteName in suiteResults) {
    const suite = suiteResults[suiteName];
    const suiteTotal = suite.passed + suite.failed + suite.skipped;
    const suiteSuccessRate = suiteTotal > 0 ? ((suite.passed / suiteTotal) * 100).toFixed(2) : 0;
    
    report += `${suiteName}:\n`;
    report += `  Passed: ${suite.passed}/${suiteTotal} (${suiteSuccessRate}%)\n`;
    report += `  Failed: ${suite.failed}\n`;
    report += `  Skipped: ${suite.skipped}\n`;
    report += `  Duration: ${(suite.duration / 1000).toFixed(2)}s\n\n`;
  }
  
  // Add failed test details
  if (failedTests.length > 0) {
    report += `= Failed Tests =\n\n`;
    for (const failure of failedTests) {
      report += `${failure.suite} > ${failure.test}:\n`;
      report += `  Error: ${failure.error.message}\n`;
      if (failure.error.stack) {
        report += `  Stack: ${failure.error.stack.split('\n').slice(1).join('\n    ')}\n`;
      }
      report += `\n`;
    }
  }
  
  return report;
}

/**
 * Save test report to file
 * @param {string} report - Test report content
 */
function saveReport(report) {
  try {
    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/g, '');
    const reportPath = path.join(reportDir, `test-report-${timestamp}.log`);
    
    fs.writeFileSync(reportPath, report);
    console.log(`\nTest report saved to: ${reportPath}`);
  } catch (error) {
    console.error(`Error saving test report: ${error.message}`);
  }
}

/**
 * Run all test files in the tests directory
 * @returns {Promise<void>}
 */
async function runAllTests() {
  startTime = Date.now();
  
  // Reset counters
  passed = 0;
  failed = 0;
  skipped = 0;
  failedTests = [];
  suiteResults = {};
  
  const testDir = __dirname;
  const files = fs.readdirSync(testDir);
  
  // Find all test files except this runner
  const testFiles = files.filter(file => 
    file.endsWith('_tests.js') && 
    file !== 'run_tests.js'
  );
  
  console.log(`\n${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.bright}Claude CLI Test Runner${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`\nFound ${testFiles.length} test files...\n`);
  
  // Run each test file
  for (const file of testFiles) {
    const testPath = path.join(testDir, file);
    console.log(`${colors.bright}Running tests in ${file}...${colors.reset}`);
    
    try {
      require(testPath);
    } catch (error) {
      console.error(`${colors.red}Error running tests in ${file}:${colors.reset}`, error);
    }
  }
  
  // Allow async tests to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Print summary
  const duration = Date.now() - startTime;
  const totalTests = passed + failed + skipped;
  const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0;
  
  console.log(`\n${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.bright}TEST RESULTS${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`${colors.cyan}==================================${colors.reset}`);
  
  // Generate and save report
  const report = generateReport();
  saveReport(report);
  
  if (failed > 0) {
    console.log(`\n${colors.red}Tests failed. See report for details.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All tests passed successfully!${colors.reset}`);
  }
}

// Export the test functions
module.exports = {
  describe,
  test,
  skipTest,
  beforeEach,
  afterEach,
  expect,
  runAllTests
};

// If run directly, execute all tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}