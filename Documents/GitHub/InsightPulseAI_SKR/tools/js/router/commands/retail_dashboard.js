/**
 * Retail Dashboard Command
 *
 * This command provides access to retail edge and performance dashboards
 * with options to deploy, open, and manage configurations.
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Command configuration
const command = 'retail-dashboard';

// Handler function for the retail-dashboard command
async function handler(args, context) {
  const subcommand = args._[0] || 'help';
  const options = args;

  // Path to scripts
  const deployScript = path.join(__dirname, '../../juicer-stack/tools/deploy_retail_dashboards.sh');
  const localServerScript = path.join(__dirname, '../../juicer-stack/tools/serve_retail_dashboards.sh');

  // Make sure at least one script exists
  if (!fs.existsSync(deployScript) && !fs.existsSync(localServerScript)) {
    return {
      message: '❌ Scripts not found! Expected at least one of: ' + deployScript + ' or ' + localServerScript,
      error: true
    };
  }

  // Handle different subcommands
  switch (subcommand) {
    case 'deploy':
      if (!fs.existsSync(deployScript)) {
        return {
          message: '❌ Deployment script not found! Expected at: ' + deployScript,
          error: true
        };
      }
      return await deployDashboards(deployScript, options);

    case 'serve':
    case 'local':
      if (!fs.existsSync(localServerScript)) {
        return {
          message: '❌ Local server script not found! Expected at: ' + localServerScript,
          error: true
        };
      }
      return await serveLocalDashboards(localServerScript, options);

    case 'edge':
      // Try local first, then cloud
      if (options.local) {
        return openLocalRetailEdgeDashboard(options);
      } else {
        return openRetailEdgeDashboard(options);
      }

    case 'performance':
      // Try local first, then cloud
      if (options.local) {
        return openLocalRetailPerformanceDashboard(options);
      } else {
        return openRetailPerformanceDashboard(options);
      }

    case 'status':
      return checkDeploymentStatus(options);

    case 'help':
    default:
      return showHelp();
  }
}

/**
 * Deploy the retail dashboards
 */
async function deployDashboards(scriptPath, options) {
  return new Promise((resolve) => {
    console.log('🚀 Deploying retail dashboards...');

    const childProcess = exec(`${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Deployment error:', error);
        resolve({
          message: `❌ Deployment failed: ${error.message}`,
          error: true,
          details: stderr
        });
        return;
      }

      resolve({
        message: '✅ Retail dashboards deployment completed',
        details: stdout
      });
    });

    // Stream output in real-time
    childProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    childProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}

/**
 * Serve retail dashboards locally
 */
async function serveLocalDashboards(scriptPath, options) {
  console.log('🌐 Starting local server for retail dashboards...');
  console.log('Press Ctrl+C in the terminal to stop the server when finished');

  // Start the server script in a new terminal window
  const openTerminal = process.platform === 'darwin'
    ? `osascript -e 'tell app "Terminal" to do script "cd $(dirname "${scriptPath}") && ${scriptPath}"'`
    : scriptPath;

  exec(openTerminal, (error) => {
    if (error) {
      console.error('Server start error:', error);
      return {
        message: `❌ Failed to start local server: ${error.message}`,
        error: true
      };
    }
  });

  // Wait briefly to allow server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Determine the server port - it might be dynamic if 8000 was in use
  let port = 8000;
  const portFilePath = '/tmp/retail_dashboards_*/server_port.txt';

  try {
    // Find the most recent port file
    const portFiles = await new Promise((resolve, reject) => {
      exec(`ls -t ${portFilePath} 2>/dev/null | head -1`, (error, stdout) => {
        if (error || !stdout.trim()) {
          // If no port file found, just use the default port
          resolve([]);
        } else {
          resolve([stdout.trim()]);
        }
      });
    });

    if (portFiles.length > 0) {
      // Read the port from the file
      const portFile = portFiles[0];
      const portContent = await new Promise((resolve) => {
        exec(`cat ${portFile}`, (error, stdout) => {
          if (error || !stdout.trim()) {
            resolve(port.toString());
          } else {
            resolve(stdout.trim());
          }
        });
      });

      if (portContent && /^\d+$/.test(portContent)) {
        port = parseInt(portContent, 10);
      }
    }
  } catch (e) {
    console.error('Error determining port:', e);
    // Continue with default port
  }

  // Open the browser with the found port
  exec(`open http://localhost:${port}`, (error) => {
    if (error) {
      console.error('Browser open error:', error);
    }
  });

  return {
    message: '✅ Local server for retail dashboards started',
    details: `Server running at http://localhost:${port}\nPress Ctrl+C in the terminal window to stop the server`
  };
}

/**
 * Open the Retail Edge dashboard
 */
function openRetailEdgeDashboard(options) {
  const url = options.url || 'https://retailedgedash0513.z13.web.core.windows.net/retail_edge_dashboard.html';

  exec(`open "${url}"`, (error) => {
    if (error) {
      console.error('Failed to open URL:', error);
      return {
        message: `❌ Failed to open Retail Edge dashboard: ${error.message}`,
        error: true
      };
    }
  });

  return {
    message: `🔍 Opening Retail Edge Dashboard: ${url}`
  };
}

/**
 * Determine the local server port
 */
async function getLocalServerPort() {
  const defaultPort = 8000;
  const portFilePath = '/tmp/retail_dashboards_*/server_port.txt';

  try {
    // Find the most recent port file
    const portFiles = await new Promise((resolve) => {
      exec(`ls -t ${portFilePath} 2>/dev/null | head -1`, (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([]);
        } else {
          resolve([stdout.trim()]);
        }
      });
    });

    if (portFiles.length > 0) {
      // Read the port from the file
      const portFile = portFiles[0];
      const portContent = await new Promise((resolve) => {
        exec(`cat ${portFile}`, (error, stdout) => {
          if (error || !stdout.trim()) {
            resolve(defaultPort.toString());
          } else {
            resolve(stdout.trim());
          }
        });
      });

      if (portContent && /^\d+$/.test(portContent)) {
        return parseInt(portContent, 10);
      }
    }
  } catch (e) {
    console.error('Error determining port:', e);
  }

  return defaultPort;
}

/**
 * Open the local Retail Edge dashboard
 */
async function openLocalRetailEdgeDashboard(options) {
  const port = await getLocalServerPort();
  const url = options.url || `http://localhost:${port}/retail_edge_dashboard.html`;

  exec(`open "${url}"`, (error) => {
    if (error) {
      console.error('Failed to open URL:', error);
      return {
        message: `❌ Failed to open local Retail Edge dashboard: ${error.message}`,
        error: true
      };
    }
  });

  return {
    message: `🔍 Opening local Retail Edge Dashboard: ${url}`
  };
}

/**
 * Open the Retail Performance dashboard
 */
function openRetailPerformanceDashboard(options) {
  const url = options.url || 'https://retailperfdash0513.z13.web.core.windows.net/retail_performance_dashboard.html';

  exec(`open "${url}"`, (error) => {
    if (error) {
      console.error('Failed to open URL:', error);
      return {
        message: `❌ Failed to open Retail Performance dashboard: ${error.message}`,
        error: true
      };
    }
  });

  return {
    message: `📊 Opening Retail Performance Dashboard: ${url}`
  };
}

/**
 * Open the local Retail Performance dashboard
 */
async function openLocalRetailPerformanceDashboard(options) {
  const port = await getLocalServerPort();
  const url = options.url || `http://localhost:${port}/retail_performance_dashboard.html`;

  exec(`open "${url}"`, (error) => {
    if (error) {
      console.error('Failed to open URL:', error);
      return {
        message: `❌ Failed to open local Retail Performance dashboard: ${error.message}`,
        error: true
      };
    }
  });

  return {
    message: `📊 Opening local Retail Performance Dashboard: ${url}`
  };
}

/**
 * Check deployment status of the dashboards
 */
async function checkDeploymentStatus(options) {
  const cloudEdgeUrl = 'https://retailedgedash0513.z13.web.core.windows.net/retail_edge_dashboard.html';
  const cloudPerformanceUrl = 'https://retailperfdash0513.z13.web.core.windows.net/retail_performance_dashboard.html';
  const localUrl = 'http://localhost:8000/';

  return {
    message: '📡 Retail Dashboards Status:',
    details: [
      '☁️ Cloud Deployments:',
      `  📱 Retail Edge: ${cloudEdgeUrl}`,
      `  📈 Retail Performance: ${cloudPerformanceUrl}`,
      '',
      '💻 Local Development Server:',
      `  🌐 Dashboard Index: ${localUrl}`,
      `  📱 Retail Edge: ${localUrl}retail_edge_dashboard.html`,
      `  📈 Retail Performance: ${localUrl}retail_performance_dashboard.html`
    ].join('\n')
  };
}

/**
 * Show help information
 */
function showHelp() {
  return {
    message: '🛒 Retail Dashboard Commands:',
    details: [
      '• retail-dashboard deploy - Deploy both dashboards to Azure',
      '• retail-dashboard serve - Start local server for dashboards',
      '• retail-dashboard local - Alias for serve command',
      '• retail-dashboard edge [--local] - Open the Retail Edge dashboard',
      '• retail-dashboard performance [--local] - Open the Retail Performance dashboard',
      '• retail-dashboard status - Check deployment status and URLs',
      '• retail-dashboard help - Show this help message',
      '',
      '📝 Examples:',
      '• retail-dashboard serve - Start local development server',
      '• retail-dashboard edge --local - Open local Edge dashboard',
      '• retail-dashboard performance --local - Open local Performance dashboard'
    ].join('\n')
  };
}

// Export the command and handler
module.exports = {
  command,
  handler
};