/**
 * TBWA Chart Theme
 * Applies consistent TBWA branding to all Chart.js charts
 */

document.addEventListener('DOMContentLoaded', function() {
  // TBWA Brand Colors
  const TBWA_COLORS = {
    primary: '#ffc300', // Yellow
    secondary: '#005bbb', // Blue
    accent: '#ff6f61', // Coral
    success: '#28a745', // Green
    warning: '#ffa500', // Orange
    danger: '#dc3545', // Red
    info: '#17a2b8', // Teal
    light: '#f8f9fa', // Light Gray
    dark: '#343a40', // Dark Gray
    muted: '#6c757d', // Medium Gray
    
    // Additional chart colors for sequences
    chartColors: [
      '#005bbb', // TBWA Blue
      '#ffc300', // TBWA Yellow
      '#ff6f61', // Coral
      '#28a745', // Green
      '#7b68ee', // Medium Slate Blue
      '#17a2b8', // Teal
      '#fd7e14', // Orange
      '#6f42c1', // Purple
      '#20c997', // Teal Green
      '#e83e8c'  // Pink
    ]
  };
  
  // Helper to get alpha versions of colors
  function getAlphaColor(color, alpha) {
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Global Chart.js defaults
  if (window.Chart) {
    Chart.defaults.font.family = "'Inter', Arial, sans-serif";
    Chart.defaults.color = TBWA_COLORS.dark;
    Chart.defaults.borderColor = getAlphaColor(TBWA_COLORS.muted, 0.1);
    Chart.defaults.plugins.tooltip.titleFont.weight = 'bold';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    
    // Default dataset colors for different chart types
    const chartTypeDefaults = {
      line: {
        borderColor: TBWA_COLORS.secondary,
        backgroundColor: getAlphaColor(TBWA_COLORS.secondary, 0.1),
        pointBackgroundColor: TBWA_COLORS.secondary,
        tension: 0.4
      },
      bar: {
        backgroundColor: TBWA_COLORS.primary,
        hoverBackgroundColor: getAlphaColor(TBWA_COLORS.primary, 0.8)
      },
      doughnut: {
        backgroundColor: TBWA_COLORS.chartColors
      },
      pie: {
        backgroundColor: TBWA_COLORS.chartColors
      }
    };
    
    // Apply defaults to existing charts
    const applyTBWAThemeToChart = (chart) => {
      if (!chart.config || !chart.config.type) return;
      
      const type = chart.config.type;
      const defaults = chartTypeDefaults[type];
      
      if (!defaults) return;
      
      // Apply defaults to datasets
      chart.data.datasets.forEach((dataset, i) => {
        if (type === 'line' || type === 'bar') {
          Object.keys(defaults).forEach(key => {
            if (dataset[key] === undefined || 
                (key === 'backgroundColor' && dataset[key] === 'rgba(0, 0, 0, 0.1)') ||
                (key === 'borderColor' && dataset[key] === 'rgba(0, 0, 0, 0.1)')) {
              if (key === 'backgroundColor' || key === 'borderColor' || key === 'pointBackgroundColor') {
                // Use color sequence for multiple datasets
                if (chart.data.datasets.length > 1) {
                  dataset[key] = TBWA_COLORS.chartColors[i % TBWA_COLORS.chartColors.length];
                  
                  // If it's background, make it semi-transparent
                  if (key === 'backgroundColor') {
                    dataset[key] = getAlphaColor(dataset[key], 0.1);
                  }
                } else {
                  dataset[key] = defaults[key];
                }
              } else {
                dataset[key] = defaults[key];
              }
            }
          });
        } else if (type === 'doughnut' || type === 'pie') {
          if (!dataset.backgroundColor || dataset.backgroundColor.length === 0) {
            dataset.backgroundColor = defaults.backgroundColor;
          }
        }
      });
      
      chart.update();
    };
    
    // Hook into Chart creation to apply themes
    const originalChartInit = Chart.prototype.initialize;
    Chart.prototype.initialize = function() {
      originalChartInit.apply(this, arguments);
      applyTBWAThemeToChart(this);
    };
    
    // Apply to any existing charts
    setTimeout(() => {
      if (Chart.instances) {
        Object.values(Chart.instances).forEach(chart => {
          applyTBWAThemeToChart(chart);
        });
      }
    }, 500);
  }
  
  // Apply TBWA colors to ApexCharts if available
  if (window.ApexCharts) {
    ApexCharts.defaultOptions = {
      ...ApexCharts.defaultOptions,
      colors: TBWA_COLORS.chartColors,
      chart: {
        ...ApexCharts.defaultOptions.chart,
        fontFamily: "'Inter', Arial, sans-serif"
      },
      tooltip: {
        ...ApexCharts.defaultOptions.tooltip,
        style: {
          fontFamily: "'Inter', Arial, sans-serif"
        }
      }
    };
  }
  
  console.log('TBWA chart theme applied');
});