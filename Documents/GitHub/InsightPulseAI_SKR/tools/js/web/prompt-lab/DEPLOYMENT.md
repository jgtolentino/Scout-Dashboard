# Prompt Lab Deployment Guide

This document outlines the deployment process for the Prompt Lab web explorer, a key feature of InsightPulseAI 2.3.0.

## Deployment Architecture

The Prompt Lab is deployed as part of the Pulser web interface and consists of:

1. **Frontend Components**:
   - React-based UI located in `/tools/js/web/prompt-lab/`
   - Static assets (HTML, CSS, JS, SVG icons)

2. **Backend Services**:
   - API endpoints in `/tools/js/router/api/`
   - Express server configuration in `app.js`

3. **Deployment Configuration**:
   - Vercel deployment configuration in `vercel.json`
   - Route handling for web and API layers

## Prerequisites

Before deploying, ensure you have:

- Node.js 14+ installed
- Access to the Pulser API services
- Vercel CLI (if deploying to Vercel)

## Local Development

To run the Prompt Lab locally:

```bash
# Navigate to the js tools directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3001/prompt-lab`

## Production Deployment

### Building for Production

1. Build the React frontend:
   ```bash
   # From the prompt-lab directory
   cd /tools/js/web/prompt-lab
   npm run build
   ```

2. The build output will be in `/tools/js/web/prompt-lab/dist/`.

### Deploying to Vercel

1. Ensure the `vercel.json` configuration is up to date
2. Deploy using the Vercel CLI:
   ```bash
   vercel
   ```

### Deploying to a Standard Web Server

1. Copy the entire `/tools/js` directory to your web server
2. Install dependencies:
   ```bash
   npm install --production
   ```
3. Start the server:
   ```bash
   NODE_ENV=production node app.js
   ```

## API Integration

The Prompt Lab requires these API endpoints:

- `/api/system_prompts/search` - Search for prompts
- `/api/system_prompts/view` - View prompt content
- `/api/system_prompts/info` - Get collection info
- `/api/prompt_engineer/analyze` - Analyze prompt quality
- `/api/prompt_engineer/improve` - Improve a prompt
- `/api/prompt_engineer/variations` - Generate prompt variations

## Verifying Deployment

After deployment, verify the following:

1. The Prompt Lab is accessible at your domain: `/prompt-lab`
2. API endpoints respond correctly (check browser network tab)
3. Prompt analysis, improvement, and variation features work
4. UI elements display correctly on different devices
5. No console errors are present

## Rollback Procedure

If issues are encountered:

1. Revert to previous version in your version control:
   ```bash
   git checkout [previous-commit]
   ```

2. If using Vercel, rollback to previous deployment:
   ```bash
   vercel rollback
   ```

## Monitoring

Monitor the following after deployment:

1. API response times
2. Error rates
3. User feedback
4. Console errors

## Security Considerations

- Ensure API endpoints validate input
- Consider rate limiting to prevent abuse
- Review prompts for sensitive information

## Support

For deployment issues, contact:
- Jake Tolentino - Engineering Lead
- Claudia - Product Owner