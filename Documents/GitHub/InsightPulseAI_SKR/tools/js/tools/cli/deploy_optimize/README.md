# Deploy Optimization Toolkit

A collection of tools to optimize the build-deploy cycle for Pulser dashboards, making deployments faster, leaner, and smarter.

## 🧩 Toolkit Components

| Tool                   | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `hash_check.sh`        | Prevents unnecessary builds by comparing file hashes    |
| `diff_analyzer.sh`     | Detects what files changed to determine build strategy  |
| `selective_packager.sh`| Creates optimized packages with only changed files      |
| `hot_redeploy.sh`      | Fast route-specific hot deployment during development   |
| `vite_cache_config.js` | Configures Vite build caching for faster builds         |
| `dash.deploy.js`       | Dash agent integration for smart deployment             |

## 🚀 Getting Started

### Basic Usage

For a quick deployment of a dashboard route:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js
./tools/cli/deploy_optimize/hot_redeploy.sh advisor
```

### Dash Agent Integration

To deploy via the Dash agent:

```bash
node ./tools/cli/deploy_optimize/dash.deploy.js advisor --hot
```

Or for dry run:

```bash
node ./tools/cli/deploy_optimize/dash.deploy.js advisor --dry-run
```

## 🔍 How It Works

### Smart Build Detection

The toolkit intelligently determines when a rebuild is needed by:

1. Analyzing git diffs to see what files have changed
2. Calculating hashes of source files to detect changes
3. Skipping builds when possible to save time

### Vite Build Cache

Configures Vite to use a persistent cache directory:

```javascript
// Added to vite.config.ts
cacheDir: './.vite-cache'
```

This significantly speeds up repeated builds by reusing previous compilation results.

### Selective Packaging

Instead of packaging the entire application for each deployment:

1. Identifies only the changed components
2. Creates minimal deployment packages
3. Reduces upload size and time

### Hot Deployment

The `hot_redeploy.sh` script provides a streamlined workflow for iterative development:

1. Automatically detects changes
2. Performs targeted rebuilds when needed
3. Creates minimal deployment packages
4. Provides Azure deployment instructions

## 🔧 Configuration

### Environment Variables

You can set these environment variables to customize the toolkit behavior:

- `DEPLOY_ROOT`: Base directory for deployments (default: `deploy-ready`)
- `SRC_DIR_PREFIX`: Prefix for source directories (default: `mockify-`)
- `WEBAPP_NAME`: Azure Static Web App name

### Customizing Routes

The toolkit supports deploying different dashboard routes (`advisor`, `edge`, `ops`, etc.). Simply specify the route name when using the tools.

## 🧰 For Claude and Dev Agents

Claude and other AI agents can use this toolkit to optimize the development workflow:

```bash
:dash deploy advisor --hot
```

This command will:
1. Check if a rebuild is truly needed
2. Use incremental builds with caching when possible
3. Create minimal deployment packages
4. Provide clear deployment instructions

## 🛠️ Advanced Usage Examples

### Packaging Only Changed Assets

```bash
./selective_packager.sh --route advisor --package-type assets --out assets_update.zip
```

### Analyzing Changes Without Building

```bash
./diff_analyzer.sh --since HEAD~3 --route advisor
```

### Full CI/CD Pipeline

For GitHub Actions:

```yaml
- name: Optimize Build
  run: node ./tools/cli/deploy_optimize/vite_cache_config.js ./vite.config.ts

- name: Check for Changes
  id: diff
  run: ./tools/cli/deploy_optimize/diff_analyzer.sh --route advisor

- name: Build (if needed)
  if: steps.diff.outputs.needs_build == 'true'
  run: npm run build

- name: Deploy to Azure
  run: node ./tools/cli/deploy_optimize/dash.deploy.js advisor --prod
```