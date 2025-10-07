# Client360 Dashboard Wireframe

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         GLOBAL HEADER                         ┃
┃  Logo    | Title ("Client360 Dashboard")  | Date Picker | Export  ┃
┃  Search bar  | Data-Source Toggle (Sim/Real) | Feedback/UAT  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                          FILTER BAR                           ┃
┃  [Organization ▼]  [Region ▼]  [Category ▼]  [Channel ▼] [Tags]┃
┃  (cascades to every chart)                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         KPI TILE ROW                          ┃
┃  [ Total Sales 💰 ]  [ Conversion 🎯 ]  [ Fulfillment 📦 ]      ┃
┃  [ Inventory 🔄 ]   [ Uptime ⚙️ ]     [ Latency 🌐 ]           ┃
┃  (clickable—opens Drill-Down Drawer)                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        VISUAL GRID A                          ┃
┃  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓         ┃
┃  ┃ Brand Perf   ┃  ┃ Competitor   ┃  ┃ Retail ROI   ┃  …      ┃
┃  ┃ (gauge)      ┃  ┃ Analysis     ┃  ┃ (sparkline)  ┃         ┃
┃  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛         ┃
┃                                                                ┃
┃                        VISUAL GRID B                          ┃
┃  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓         ┃
┃  ┃ Daily Orders ┃  ┃ Stockouts    ┃  ┃ HandlingTime ┃         ┃
┃  ┃ vs SLA       ┃  ┃ (geomap)     ┃  ┃ (line+band)  ┃         ┃
┃  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛         ┃
┃                                                                ┃
┃                        VISUAL GRID C                          ┃
┃  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓                           ┃
┃  ┃ Device Health┃  ┃ Edge Latency ┃                           ┃
┃  ┃ (icon grid)  ┃  ┃ (box-whisker)┃                           ┃
┃  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        GEOSPATIAL MAP                         ┃
┃      (full-width Mapbox/D3 view of `stores.geojson`)          ┃
┃      • Hover tooltips: store_id, uptime, latency              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   AI-POWERED INSIGHT PANEL                    ┃
┃   Top 3 Actionable Recommendations   │  "View All Insights"   ┃
┃   – Brand Dictionary                  │                        ┃
┃   – Emotional & Contextual Analysis   │                        ┃
┃   – Bundling Opportunities            │                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     DRILL-DOWN DRAWER (hidden)                ┃
┃  Slides out when any KPI or chart is clicked:                 ┃
┃  • Detailed charts & presets                                  ┃
┃  • "Apply to all" toggle                                      ┃
┃  • Export current view                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                      FOOTER & DIAGNOSTICS                     ┃
┃  Legend of icons & colors  |  Last updated: YYYY-MM-DD hh:mm  ┃
┃  QA overlay toggle (Alt+Shift+D)                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## SQL Connection Configuration

The Client360 Dashboard connects to our consolidated SQL server:

```javascript
const config = {
  user: process.env.DB_USER || 'client360_dashboard_user',
  password: process.env.DB_PASSWORD,
  server: 'sqltbwaprojectscoutserver.database.windows.net',
  database: 'TBWA_ProjectScout_DB', // Default database
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};
```

All dashboard components retrieve data from the appropriate databases on the consolidated server:

- Business KPIs: TBWA_ProjectScout_DB
- Retail Analytics: RetailAdvisorDB
- Device Health: RetailAdvisor

## Frontend Implementation Notes

1. The dashboard utilizes a connection manager to handle database switching:
   ```javascript
   // Connection manager that selects appropriate database based on data type
   class SqlConnectionManager {
     getConnectionConfig(dataType) {
       const baseConfig = {...config};
       
       switch(dataType) {
         case 'retail':
           baseConfig.database = 'RetailAdvisorDB';
           break;
         case 'device':
           baseConfig.database = 'RetailAdvisor';
           break;
         default:
           baseConfig.database = 'TBWA_ProjectScout_DB';
       }
       
       return baseConfig;
     }
   }
   ```

2. Cross-database queries for comprehensive views:
   ```javascript
   // Example cross-database query function
   async function getComprehensiveStoreAnalytics(storeId) {
     const query = `
       SELECT 
         s.StoreID,
         s.StoreName,
         s.Region,
         t.TotalSales,
         t.Conversion,
         a.VisitorCount,
         d.UptimePercentage,
         d.LatencyMs
       FROM 
         TBWA_ProjectScout_DB.Store.Locations s
       LEFT JOIN 
         TBWA_ProjectScout_DB.Analytics.StoreSummary t ON s.StoreID = t.StoreID
       LEFT JOIN 
         RetailAdvisorDB.Analytics.StoreTraffic a ON s.StoreID = a.StoreID
       LEFT JOIN 
         RetailAdvisor.Monitoring.DevicePerformance d ON s.StoreID = d.StoreID
       WHERE 
         s.StoreID = @storeId
     `;
     
     // Execute query and return results
     return executeQuery(query, { storeId });
   }
   ```

3. Geospatial map integration:
   ```javascript
   function initializeGeospatialMap() {
     // Load stores.geojson for base map
     fetch('/data/stores.geojson')
       .then(response => response.json())
       .then(storeData => {
         // Fetch real-time status data from SQL
         getStoreHealthData().then(healthData => {
           // Merge GeoJSON with health data
           const enhancedData = mergeGeoJsonWithHealth(storeData, healthData);
           // Render the map with the merged data
           renderMap(enhancedData);
         });
       });
   }
   ```