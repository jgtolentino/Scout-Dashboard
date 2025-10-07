import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryPowerBIData, convertToPowerBIFilters } from '../utils/powerBIIntegration';

/**
 * Enhanced data store with Power BI integration capabilities
 * Supports both simulated data and direct Power BI dataset queries
 */
export const usePowerBIDataStore = create(
  persist(
    (set, get) => ({
      // State
      dataSource: 'simulated', // 'simulated', 'realtime', or 'powerbi'
      isLoading: false,
      data: null,
      error: null,
      lastRefreshed: null,
      apiUrl: import.meta.env.VITE_REALTIME_API || 'https://api.example.com/data',
      
      // Power BI specific state
      isEmbedded: false,
      embeddedReport: null,
      
      // Filter state with default values
      filters: {
        date: 'last30days',
        region: 'all',
        category: 'all',
        brand: 'all',
        product: 'all',
      },
      
      // Dashboard view state
      viewState: {
        focusedChart: null,
        expandedCards: [],
        visualizations: ['salesByRegion', 'salesByCategory', 'salesTrend', 'kpis'],
        chartTypes: {
          salesByRegion: 'bar',
          salesByCategory: 'doughnut',
          salesTrend: 'line',
        },
      },
      
      // Power BI queries
      queries: {
        salesByRegion: `
          EVALUATE
          SUMMARIZECOLUMNS(
            'Region'[RegionName],
            "SalesAmount", SUM(Sales[SalesAmount])
          )
          ORDER BY [SalesAmount] DESC
        `,
        salesByCategory: `
          EVALUATE
          SUMMARIZECOLUMNS(
            'Category'[CategoryName],
            "SalesAmount", SUM(Sales[SalesAmount])
          )
          ORDER BY [SalesAmount] DESC
        `,
        salesTrend: `
          EVALUATE
          SUMMARIZECOLUMNS(
            'Date'[MonthName],
            "SalesAmount", SUM(Sales[SalesAmount])
          )
          ORDER BY 'Date'[MonthIndex] ASC
        `,
        kpis: `
          EVALUATE
          ROW(
            "TotalSales", [Total Sales],
            "AverageOrder", [Average Order Value],
            "CustomerCount", [Total Customers],
            "ConversionRate", [Conversion Rate]
          )
        `,
      },
      
      // Actions
      setDataSource: async (source) => {
        set({ dataSource: source, isLoading: true });
        
        try {
          let newData;
          let powerbiReport = null;
          
          if (source === 'simulated') {
            // Use timeout for simulated data to mimic network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            newData = generateSimulatedData();
          } 
          else if (source === 'realtime') {
            // Fetch from real API endpoint
            const response = await fetch(get().apiUrl);
            if (!response.ok) {
              throw new Error(`API responded with status: ${response.status}`);
            }
            newData = await response.json();
          }
          else if (source === 'powerbi') {
            // Query each visualization from Power BI
            const queries = get().queries;
            const filters = convertToPowerBIFilters(get().filters);
            
            // Perform multiple queries in parallel
            const [
              salesByRegion,
              salesByCategory,
              salesTrend,
              kpis
            ] = await Promise.all([
              queryPowerBIData(queries.salesByRegion, filters),
              queryPowerBIData(queries.salesByCategory, filters),
              queryPowerBIData(queries.salesTrend, filters),
              queryPowerBIData(queries.kpis, filters),
            ]);
            
            // Combine results into a unified data structure
            newData = {
              salesByRegion: salesByRegion.map(row => ({
                region: row.RegionName,
                value: row.SalesAmount
              })),
              salesByCategory: salesByCategory.map(row => ({
                category: row.CategoryName,
                value: row.SalesAmount
              })),
              salesTrend: salesTrend.map(row => ({
                month: row.MonthName,
                value: row.SalesAmount
              })),
              kpis: {
                totalSales: kpis.TotalSales,
                averageOrder: kpis.AverageOrder,
                customerCount: kpis.CustomerCount,
                conversionRate: kpis.ConversionRate
              }
            };
          }
          
          set({ 
            data: newData, 
            isLoading: false, 
            error: null,
            lastRefreshed: new Date(),
            embeddedReport: powerbiReport
          });
          
          // Store user's preference in localStorage
          localStorage.setItem('preferredDataSource', source);
          
        } catch (error) {
          console.error(`Error fetching ${source} data:`, error);
          
          set({ 
            error: error.message, 
            isLoading: false 
          });
          
          // Only fall back to simulated data if not already using it
          if (source !== 'simulated') {
            console.warn(`Falling back to simulated data due to error: ${error.message}`);
            set({ 
              dataSource: 'simulated',
              data: generateSimulatedData(),
              isLoading: false
            });
          }
        }
      },
      
      setFilter: (filterType, value) => {
        // Update filter in state
        set(state => ({
          filters: {
            ...state.filters,
            [filterType]: value
          },
          isLoading: true
        }));
        
        // Reload data with new filter
        const state = get();
        const { dataSource } = state;
        
        if (dataSource === 'simulated') {
          // Use simulated data with delay
          setTimeout(() => {
            set({
              data: generateSimulatedData(state.filters),
              isLoading: false,
              lastRefreshed: new Date()
            });
          }, 400);
        } 
        else if (dataSource === 'realtime') {
          // Build query params for API
          const queryParams = new URLSearchParams();
          Object.entries(state.filters).forEach(([key, value]) => {
            queryParams.append(key, value);
          });
          
          // Fetch from real API with filters
          fetch(`${state.apiUrl}?${queryParams.toString()}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
              }
              return res.json();
            })
            .then(data => {
              set({ 
                data: data, 
                isLoading: false, 
                error: null,
                lastRefreshed: new Date()
              });
            })
            .catch(error => {
              console.error('API filter error:', error);
              set({ 
                error: error.message, 
                isLoading: false 
              });
            });
        }
        else if (dataSource === 'powerbi') {
          // Apply filters directly to Power BI report if embedded
          const { embeddedReport } = state;
          if (embeddedReport) {
            const powerbiFilters = convertToPowerBIFilters(state.filters);
            embeddedReport.setFilters(powerbiFilters)
              .then(() => {
                set({ isLoading: false, lastRefreshed: new Date() });
              })
              .catch(error => {
                console.error('Error applying Power BI filters:', error);
                set({ error: error.message, isLoading: false });
              });
          } else {
            // Fetch new data with filters if not embedded
            get().setDataSource('powerbi');
          }
        }
      },
      
      refreshData: () => {
        // Re-fetch data with current settings
        const { dataSource } = get();
        get().setDataSource(dataSource);
      },
      
      exportData: (format = 'csv') => {
        const state = get();
        const { data } = state;
        
        if (!data) return;
        
        // Track export in analytics
        console.log(`Exporting data in ${format} format`);
        
        if (format === 'csv') {
          const csvContent = convertToCSV(data);
          downloadFile(csvContent, 'tbwa-dashboard-data.csv', 'text/csv');
        } else if (format === 'json') {
          const jsonContent = JSON.stringify(data, null, 2);
          downloadFile(jsonContent, 'tbwa-dashboard-data.json', 'application/json');
        } else if (format === 'excel') {
          // In a real app, you'd use a library like xlsx to generate Excel files
          alert('Excel export would be implemented here with xlsx library');
        } else if (format === 'powerbi') {
          // Generate Power BI .pbix file or dataset schema
          const pbixSchema = generatePowerBISchema(data);
          downloadFile(JSON.stringify(pbixSchema, null, 2), 'tbwa-dashboard-schema.json', 'application/json');
        }
      },
      
      // Power BI visualization controls
      toggleChartFocus: (chartId) => {
        set(state => ({
          viewState: {
            ...state.viewState,
            focusedChart: state.viewState.focusedChart === chartId ? null : chartId
          }
        }));
      },
      
      toggleCardExpansion: (cardId) => {
        set(state => {
          const expandedCards = [...state.viewState.expandedCards];
          const index = expandedCards.indexOf(cardId);
          
          if (index >= 0) {
            expandedCards.splice(index, 1);
          } else {
            expandedCards.push(cardId);
          }
          
          return {
            viewState: {
              ...state.viewState,
              expandedCards
            }
          };
        });
      },
      
      changeChartType: (chartId, chartType) => {
        set(state => ({
          viewState: {
            ...state.viewState,
            chartTypes: {
              ...state.viewState.chartTypes,
              [chartId]: chartType
            }
          }
        }));
      },
      
      setEmbeddedReport: (report) => {
        set({ embeddedReport: report, isEmbedded: !!report });
      }
    }),
    {
      name: 'tbwa-powerbi-dashboard-store',
      getStorage: () => localStorage,
      partialize: (state) => ({
        filters: state.filters,
        dataSource: state.dataSource,
        viewState: state.viewState
      }),
    }
  )
);

// Initialize data on store creation
if (typeof window !== 'undefined') {
  // Load user's preferred data source from localStorage if available
  const preferredDataSource = localStorage.getItem('preferredDataSource') || 'simulated';
  setTimeout(() => {
    usePowerBIDataStore.getState().setDataSource(preferredDataSource);
  }, 0);
}

// Helper functions
function generateSimulatedData(filters = {}) {
  // Generate more Power BI-like detailed data
  return {
    salesByRegion: [
      { region: 'North', value: Math.floor(Math.random() * 5000) + 2000 },
      { region: 'South', value: Math.floor(Math.random() * 4000) + 1000 },
      { region: 'East', value: Math.floor(Math.random() * 6000) + 3000 },
      { region: 'West', value: Math.floor(Math.random() * 7000) + 4000 },
    ],
    salesByCategory: [
      { category: 'Electronics', value: Math.floor(Math.random() * 8000) + 5000 },
      { category: 'Clothing', value: Math.floor(Math.random() * 6000) + 3000 },
      { category: 'Food', value: Math.floor(Math.random() * 4000) + 2000 },
      { category: 'Home', value: Math.floor(Math.random() * 5000) + 1000 },
    ],
    salesTrend: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
      value: Math.floor(Math.random() * 10000) + 5000
    })),
    kpis: {
      totalSales: Math.floor(Math.random() * 1000000) + 500000,
      averageOrder: Math.floor(Math.random() * 200) + 50,
      customerCount: Math.floor(Math.random() * 50000) + 10000,
      conversionRate: (Math.random() * 10 + 2).toFixed(2)
    },
    // Additional Power BI-like metadata
    metadata: {
      refreshedAt: new Date().toISOString(),
      dataSource: 'Simulated',
      rowCount: 24 + 12, // Total rows in dataset
      filterState: JSON.stringify(filters),
    }
  };
}

function convertToCSV(data) {
  // Enhanced CSV conversion with Power BI-like formatting
  let csv = '';
  
  // Add metadata header
  csv += '# TBWA Retail Advisor Dashboard Data Export\n';
  csv += `# Generated: ${new Date().toISOString()}\n`;
  csv += '# Data Source: Power BI Integration\n\n';
  
  // KPIs
  csv += 'KPI,Value\n';
  for (const [key, value] of Object.entries(data.kpis)) {
    csv += `${key},${value}\n`;
  }
  csv += '\n';
  
  // Sales by Region
  csv += 'Region,Sales\n';
  data.salesByRegion.forEach(item => {
    csv += `${item.region},${item.value}\n`;
  });
  csv += '\n';
  
  // Sales by Category
  csv += 'Category,Sales\n';
  data.salesByCategory.forEach(item => {
    csv += `${item.category},${item.value}\n`;
  });
  csv += '\n';
  
  // Sales Trend
  csv += 'Month,Sales\n';
  data.salesTrend.forEach(item => {
    csv += `${item.month},${item.value}\n`;
  });
  
  return csv;
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function generatePowerBISchema(data) {
  // Generate a schema compatible with Power BI
  return {
    version: "1.0",
    dataSchema: {
      tables: [
        {
          name: "SalesByRegion",
          columns: [
            { name: "Region", dataType: "string" },
            { name: "SalesAmount", dataType: "decimal" }
          ],
          rows: data.salesByRegion.map(item => [item.region, item.value])
        },
        {
          name: "SalesByCategory",
          columns: [
            { name: "Category", dataType: "string" },
            { name: "SalesAmount", dataType: "decimal" }
          ],
          rows: data.salesByCategory.map(item => [item.category, item.value])
        },
        {
          name: "SalesTrend",
          columns: [
            { name: "Month", dataType: "string" },
            { name: "SalesAmount", dataType: "decimal" }
          ],
          rows: data.salesTrend.map(item => [item.month, item.value])
        },
        {
          name: "KPIs",
          columns: [
            { name: "KPI", dataType: "string" },
            { name: "Value", dataType: "decimal" }
          ],
          rows: [
            ["TotalSales", data.kpis.totalSales],
            ["AverageOrder", data.kpis.averageOrder],
            ["CustomerCount", data.kpis.customerCount],
            ["ConversionRate", data.kpis.conversionRate]
          ]
        }
      ],
      relationships: [
        // Sample relationships would be defined here
      ]
    },
    visualElements: [
      {
        type: "barChart",
        dataTable: "SalesByRegion",
        title: "Sales by Region",
        settings: {
          xAxis: "Region",
          yAxis: "SalesAmount"
        }
      },
      {
        type: "pieChart", // Power BI would use donutChart
        dataTable: "SalesByCategory",
        title: "Sales by Category",
        settings: {
          category: "Category",
          values: "SalesAmount"
        }
      },
      {
        type: "lineChart",
        dataTable: "SalesTrend",
        title: "Monthly Sales Trend",
        settings: {
          xAxis: "Month",
          yAxis: "SalesAmount"
        }
      }
    ]
  };
}

export default usePowerBIDataStore;