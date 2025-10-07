/**
 * InsightPulseAI Pulser 2.0 - Main Express Application
 * 
 * This file sets up the Express application for the Pulser 2.0 web interface,
 * including routes, middleware, and integration with ClaudePromptExecutor.
 */

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');

// Create Express application
const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const ctaDemoRoutes = require('./router/routes/cta-demo');
const apiRoutes = require('./router/api');
const mainRouter = require('./router');
const deviceHealthApi = require('./juicer-stack/dashboards/device-health-api');
const clientMetricsApi = require('./juicer-stack/dashboards/client-metrics-api');

// Mount routes
app.use('/cta-demo', ctaDemoRoutes);
app.use('/api/cta-generator', ctaDemoRoutes);
app.use('/api', apiRoutes);
app.use('/api/devices', deviceHealthApi);
app.use('/api/client-metrics', clientMetricsApi);
app.use('/', mainRouter);

// Serve static files for Prompt Lab
app.use('/prompt-lab', express.static(path.join(__dirname, 'web/prompt-lab')));

// Serve static files for Juicer Dashboard
app.use('/dashboards', express.static(path.join(__dirname, 'juicer-stack/dashboards')));

// Dashboard routes - separated client-facing and internal operations
app.use('/dashboards/client', express.static(path.join(__dirname, 'juicer-stack/dashboards/client-facing')));
app.use('/dashboards/ops', express.static(path.join(__dirname, 'juicer-stack/dashboards/ops')));

// Catch-all route for Prompt Lab to enable client-side routing
app.get('/prompt-lab/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/prompt-lab/index.html'));
});

// Home page route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Device Health Monitoring',
    description: 'Advanced system monitoring dashboard for device performance and health',
    tools: [
      {
        name: 'CTA Demo',
        path: '/cta-demo',
        description: 'Call-to-action generator demo'
      },
      {
        name: 'Prompt Lab',
        path: '/prompt-lab',
        description: 'Browse, analyze, and improve system prompts with interactive tools'
      },
      {
        name: 'AI Insights Dashboard',
        path: '/dashboards/client/insights_dashboard.html',
        description: 'AI-generated business insights, trend analysis, and strategic recommendations'
      },
      {
        name: 'System Operations Dashboard',
        path: '/dashboards/ops/system_dashboard.html',
        description: 'Internal system health, device monitoring, and model performance metrics'
      },
      {
        name: 'Retail Performance',
        path: '/dashboards/retail_performance/retail_performance_dashboard.html',
        description: 'Track and analyze retail store performance metrics'
      },
      {
        name: 'Brand to SKU Drilldown',
        path: '/dashboards/drilldown-dashboard.html',
        description: 'Hierarchical data analysis from brand to product SKU level with customer insights'
      }
    ]
  });
});

// Create necessary directories if they don't exist
const publicDirs = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'public/components'),
  path.join(__dirname, 'public/components/analysis-overview'),
  path.join(__dirname, 'public/scripts'),
  path.join(__dirname, 'public/styles'),
  path.join(__dirname, 'public/images')
];

publicDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create basic CSS file if it doesn't exist
const baseStylesPath = path.join(__dirname, 'public/styles/base.css');
if (!fs.existsSync(baseStylesPath)) {
  const baseStyles = `
    /* Base styles for InsightPulseAI Pulser 2.0 */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f7f9;
    }
    
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    /* Header */
    .app-header {
      background-color: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 1rem 0;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo a {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: #333;
    }
    
    .logo img {
      height: 40px;
      margin-right: 10px;
    }
    
    .main-nav ul {
      display: flex;
      list-style: none;
    }
    
    .main-nav a {
      display: block;
      padding: 0.5rem 1rem;
      text-decoration: none;
      color: #555;
      font-weight: 500;
    }
    
    .main-nav a:hover,
    .main-nav a.active {
      color: #4a6cf7;
    }
    
    /* Main Content */
    .app-content {
      padding: 2rem 0;
      min-height: calc(100vh - 180px);
    }
    
    .page-header {
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .page-header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }
    
    /* Footer */
    .app-footer {
      background-color: #fff;
      border-top: 1px solid #eee;
      padding: 1.5rem 0;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .copyright {
      color: #777;
      font-size: 0.9rem;
    }
    
    .footer-links {
      display: flex;
      gap: 1.5rem;
    }
    
    .footer-links a {
      color: #555;
      text-decoration: none;
      font-size: 0.9rem;
    }
    
    .footer-links a:hover {
      color: #4a6cf7;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .header-content,
      .footer-content {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `;
  
  fs.writeFileSync(baseStylesPath, baseStyles);
}

// Create basic client-side JavaScript if it doesn't exist
const baseScriptPath = path.join(__dirname, 'public/scripts/app.js');
if (!fs.existsSync(baseScriptPath)) {
  const baseScript = `
    /**
     * Base JavaScript for InsightPulseAI Pulser 2.0
     */
    document.addEventListener('DOMContentLoaded', function() {
      console.log('InsightPulseAI Pulser 2.0 web interface loaded');
      
      // Initialize any global functionality here
    });
  `;
  
  fs.writeFileSync(baseScriptPath, baseScript);
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'The page you requested could not be found.',
    error: { status: 404 }
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // Render the error page
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error',
    message: err.message,
    error: err
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`InsightPulseAI Pulser 2.0 web interface running on port ${PORT}`);
});

module.exports = app;