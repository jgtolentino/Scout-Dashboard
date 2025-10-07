# 🚀 TBWA Dashboard Integration Guide

## Overview
This guide shows how to integrate the `retail-insight-pilot-project` frontend with the `client` backend.

## Architecture
```
retail-insight-pilot-project/     (Modern React Frontend)
    ├── src/
    │   ├── services/api.ts      (API integration)
    │   └── components/          (UI components)
    └── dist/                    (Built files)
         ↓
client/                          (Express Backend)
    ├── server.js               (API endpoints)
    └── public/                 (Served frontend)
```

## Quick Start

### 1. Development Mode (Run Both Separately)
```bash
# Run both frontend and backend in dev mode
./run-dev.sh

# Frontend: http://localhost:5173
# Backend: http://localhost:8080
```

### 2. Production Build (Integrated)
```bash
# Build frontend and integrate with backend
./integrate-dashboard.sh

# Run integrated app
cd client
npm start

# Visit: http://localhost:8080
```

### 3. Deploy to Azure
```bash
cd client
npm run deploy:smart

# Your app will be live at:
# https://tbwa-dashboard-app.azurewebsites.net
```

## API Endpoints

The frontend expects these endpoints from the backend:

- `GET /api/health` - Health check
- `GET /api/dashboard` - All dashboard data
- `GET /api/kpis` - KPI metrics
- `GET /api/transactions` - Recent transactions
- `GET /api/brands` - Brand performance

## Data Flow

1. **Frontend** makes API calls to backend
2. **Backend** serves data (currently mock data)
3. **Frontend** transforms data for display
4. **Auto-refresh** every 30 seconds

## Customization

### Change API URL
Edit `.env` in retail-insight-pilot-project:
```env
# Local development
VITE_API_URL=http://localhost:8080/api

# Production
VITE_API_URL=https://your-api.azurewebsites.net/api
```

### Add Real Data
Replace mock data in `client/server.js` with:
```javascript
// Connect to your database
const data = await fetchFromDatabase();

app.get('/api/dashboard', (req, res) => {
  res.json(data);
});
```

## Troubleshooting

### Frontend not connecting to backend?
1. Check `.env` file has correct API URL
2. Ensure backend is running on port 8080
3. Check browser console for CORS errors

### Build fails?
1. Run `npm install` in both directories
2. Check Node version >= 20.0.0
3. Clear node_modules and reinstall

### Azure deployment fails?
1. Run validation: `npm run validate`
2. Check for Icon files: `find . -name "Icon*"`
3. Use enhanced deployment: `npm run deploy:smart`

## Next Steps

1. **Connect Real Database**
   - Azure SQL
   - Databricks
   - Or any REST API

2. **Add Authentication**
   - Azure AD
   - Custom auth

3. **Enhance Features**
   - Real-time updates
   - Export functionality
   - Advanced analytics

## Support

For issues or questions:
- Check console logs
- Run health check: `curl http://localhost:8080/api/health`
- Review API responses in Network tab