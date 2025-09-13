# Replit Autoscale Deployment Guide

## 🚀 Quick Start

Your Brand Performance Dashboard is now configured for Replit Autoscale deployment!

### 1. **Upload to Replit**

1. Go to https://replit.com
2. Create a new Repl or use your existing MockifyCreator workspace
3. Upload this entire `pulser-poc` directory

### 2. **Install Dependencies**

In the Replit Shell:
```bash
npm ci
```

### 3. **Build for Production**

```bash
npm run build
```

This will:
- Build the React frontend to `dist/`
- Copy the lightweight dashboard
- Prepare all assets for production

### 4. **Test Locally**

```bash
npm run start:prod
```

Then check:
- Dashboard: Preview URL in Replit
- API Health: `/api/health`
- Brands KPIs: `/api/brands-lightweight?type=kpis`

### 5. **Configure Secrets**

In Replit sidebar → **Secrets**, add:

```env
# Azure OpenAI (if using AI insights)
AZURE_OPENAI_KEY=your-key-here
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com/

# Redis (if using caching)
REDIS_HOST=your-redis-host
REDIS_KEY=your-redis-key

# Application Insights (if using monitoring)
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Database (if needed)
DB_CONNECTION_STRING=your-connection-string
```

### 6. **Deploy to Autoscale**

1. Click **Deploy** button (top-right)
2. Choose **Autoscale** (middle card)
3. Configure:
   - **Machine Power**: 4 vCPUs / 8 GiB RAM (recommended)
   - **Max Machines**: 3 (or based on your needs)
   - **Min Machines**: 1
4. Click **Approve and configure build settings**
5. Replit will run `npm run build` then `npm run start:prod`

## 📁 Project Structure

```
pulser-poc/
├── .replit              # Replit configuration
├── replit.nix           # Nix environment setup
├── server.js            # Production server entry point
├── package.json         # With production scripts
├── dist/                # Built frontend (after npm run build)
├── api/                 # API endpoints
│   ├── brands-lightweight/   # Memory-optimized API
│   ├── brands/              # Standard brands API
│   └── data/               # brands_500.json
└── frontend/            # React source code
```

## 🔧 Configuration Files

### `.replit`
- Configures Node.js environment
- Sets production build & run commands
- Maps ports 3000 (internal) → 80 (external)
- Enables API port 7072

### `replit.nix`
- Installs Node.js 20
- Includes TypeScript support
- Adds necessary build tools

### `server.js`
- Unified production server
- Serves static files from `dist/`
- Mounts all API endpoints
- Handles SPA routing

## 🎯 Memory Optimizations Included

Your deployment includes all memory optimizations:
- **Lightweight API** (`/api/brands-lightweight/*`)
- **Server-side aggregation** (no raw data to client)
- **Paginated endpoints** (10 items per page)
- **Progressive loading** (KPIs first)
- **5-minute cache headers**

## 🌐 After Deployment

Your app will be available at:
```
https://your-repl-name.your-username.repl.co
```

### Verify Everything Works:
1. **Dashboard loads** without memory issues
2. **API endpoints** return data:
   - `/api/health`
   - `/api/brands-lightweight?type=kpis`
   - `/api/brands-lightweight?type=leaderboard&page=1`
3. **Pagination** works on leaderboard
4. **Charts render** without crashes

## 🔍 Troubleshooting

### "Cannot find module" errors
- Run `npm ci` to install dependencies
- Make sure you ran `npm run build`

### API returns 404
- Check that `api/` directory was uploaded
- Verify `brands_500.json` is in `api/data/`

### Dashboard shows "Not Built"
- Run `npm run build` to create production files
- Check that `dist/` directory exists

### Memory issues persist
- Verify you're using `/brands-lightweight` endpoints
- Check browser console for large payloads
- Ensure you deployed the lightweight dashboard

## 📊 Performance Tips

1. **Use Autoscale** for automatic scaling
2. **Monitor memory** in Replit's metrics
3. **Enable caching** with Redis for better performance
4. **Set up monitoring** with Application Insights

---

Your dashboard is now ready for production on Replit! The lightweight implementation ensures it runs smoothly even with limited resources.