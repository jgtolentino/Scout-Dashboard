/**
 * TBWA Chart Themes - Dashboard Integration
 * Consistent chart styling that aligns with TBWA brand identity
 * Compatible with Chart.js and ECharts
 */

(function() {
  // Get CSS variables from root
  function getCssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name).trim();
  }
  
  // Core palette
  const palette = {
    navy: getCssVar('--tbwa-navy') || '#002B49',
    yellow: getCssVar('--tbwa-yellow') || '#FFE600',
    cyan: getCssVar('--tbwa-cyan') || '#00AEEF',
    orange: getCssVar('--tbwa-orange') || '#FF6B00',
    red: getCssVar('--tbwa-red') || '#E11900',
    grey100: getCssVar('--tbwa-grey-100') || '#F8F8F8',
    grey700: getCssVar('--tbwa-grey-700') || '#4A4A4A',
    grey900: getCssVar('--tbwa-grey-900') || '#1A1A1A'
  };
  
  // Chart color sequences
  const colorSequence = [
    palette.navy,
    palette.yellow,
    palette.cyan,
    palette.orange,
    palette.red,
    '#7E57C2', // Additional colors for extended palettes
    '#26A69A',
    '#EC407A'
  ];
  
  // Font settings
  const fontFamily = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
  
  // ============================================
  // Chart.js Theme Configuration
  // ============================================
  if (typeof Chart !== 'undefined') {
    const tbwaChartTheme = {
      // Default colors
      color: colorSequence,
      
      // Global defaults
      defaults: {
        font: {
          family: fontFamily,
          size: 12
        },
        color: palette.grey900,
        
        // Global border settings
        borderColor: palette.grey100,
        
        // All charts
        elements: {
          line: {
            borderWidth: 2,
            tension: 0.1, // Slight curve
            borderColor: palette.navy
          },
          point: {
            borderWidth: 2,
            backgroundColor: '#fff',
            hoverRadius: 5,
            hoverBorderWidth: 2
          },
          bar: {
            backgroundColor: palette.navy,
            borderWidth: 0,
            borderRadius: 2,
            hoverBackgroundColor: palette.cyan
          },
          arc: {
            borderWidth: 1,
            borderColor: '#fff'
          }
        },
        
        // Responsive settings
        responsive: true,
        maintainAspectRatio: false,
        
        // Hover settings
        hover: {
          mode: 'index',
          intersect: false
        },
        
        // Tooltip settings
        tooltip: {
          backgroundColor: palette.grey900,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: palette.yellow,
          borderWidth: 1,
          cornerRadius: 4,
          displayColors: true,
          boxPadding: 4,
          titleFont: {
            weight: 'bold',
            size: 13
          }
        },
        
        // Legend settings
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            padding: 15
          }
        },
        
        // Scale settings
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              padding: 8
            }
          },
          y: {
            grid: {
              color: 'rgba(0,0,0,0.05)',
              z: -1
            },
            ticks: {
              padding: 8
            },
            beginAtZero: true
          }
        }
      }
    };
    
    // Apply theme if Chart.js is available
    if (Chart.defaults) {
      Object.assign(Chart.defaults, tbwaChartTheme.defaults);
      
      // Add a helper method to apply the theme to a specific chart
      Chart.applyTbwaTheme = function(chart) {
        if (!chart || !chart.options) return;
        
        // Apply default chart options
        Object.assign(chart.options, tbwaChartTheme.defaults);
        
        // Update the chart if it's already rendered
        if (chart.update) {
          chart.update();
        }
        
        return chart;
      };
    }
    
    // Extend chart types with TBWA styling
    if (Chart.overrides) {
      // Bar charts
      Chart.overrides.bar = Chart.overrides.bar || {};
      Object.assign(Chart.overrides.bar, {
        plugins: {
          title: {
            color: palette.grey900
          }
        }
      });
      
      // Line charts
      Chart.overrides.line = Chart.overrides.line || {};
      Object.assign(Chart.overrides.line, {
        plugins: {
          title: {
            color: palette.grey900
          }
        }
      });
      
      // Doughnut/Pie charts
      Chart.overrides.doughnut = Chart.overrides.doughnut || {};
      Object.assign(Chart.overrides.doughnut, {
        plugins: {
          title: {
            color: palette.grey900
          }
        },
        cutout: '70%'
      });
    }
    
    console.log('TBWA theme applied to Chart.js');
  }
  
  // ============================================
  // ECharts Theme Configuration
  // ============================================
  if (typeof echarts !== 'undefined') {
    const tbwaEchartsTheme = {
      // Standard palette
      color: colorSequence,
      
      // Background
      backgroundColor: 'transparent',
      
      // Global text style
      textStyle: {
        fontFamily: fontFamily,
        color: palette.grey900
      },
      
      // Title
      title: {
        textStyle: {
          color: palette.grey900,
          fontSize: 14,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: palette.grey700,
          fontSize: 12
        }
      },
      
      // Legend
      legend: {
        textStyle: {
          color: palette.grey900
        }
      },
      
      // Grid
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '55',
        containLabel: true
      },
      
      // Tooltip
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: palette.yellow
          },
          crossStyle: {
            color: palette.yellow
          },
          shadowStyle: {
            color: 'rgba(0,0,0,0.1)'
          },
          label: {
            backgroundColor: palette.grey900
          }
        },
        backgroundColor: palette.grey900,
        textStyle: {
          color: '#fff'
        },
        borderWidth: 1,
        borderColor: palette.yellow
      },
      
      // Axis
      xAxis: {
        axisLine: {
          lineStyle: {
            color: palette.grey700
          }
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          color: palette.grey700
        }
      },
      yAxis: {
        axisLine: {
          lineStyle: {
            color: palette.grey700
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.05)'
          }
        },
        axisLabel: {
          color: palette.grey700
        }
      },
      
      // Area style
      areaStyle: {
        opacity: 0.3
      },
      
      // Line style
      lineStyle: {
        width: 2
      },
      
      // Symbol style
      symbolSize: 7,
      symbol: 'circle',
      
      // Category Axis
      categoryAxis: {
        axisLine: {
          show: true,
          lineStyle: {
            color: palette.grey700
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      
      // Value Axis
      valueAxis: {
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(0,0,0,0.05)'
          }
        }
      },
      
      // Timeline
      timeline: {
        lineStyle: {
          color: palette.navy
        },
        controlStyle: {
          color: palette.navy,
          borderColor: palette.navy
        },
        label: {
          color: palette.grey900
        }
      },
      
      // Toolbox
      toolbox: {
        iconStyle: {
          normal: {
            borderColor: palette.grey900
          },
          emphasis: {
            borderColor: palette.cyan
          }
        }
      },
      
      // Data zoom
      dataZoom: {
        handleStyle: {
          color: palette.navy
        },
        textStyle: {
          color: palette.grey900
        }
      },
      
      // Visual map
      visualMap: {
        textStyle: {
          color: palette.grey900
        }
      }
    };
    
    // Register the TBWA theme
    echarts.registerTheme('tbwa', tbwaEchartsTheme);
    
    console.log('TBWA theme registered for ECharts as "tbwa"');
  }
  
  // Export theme data for other uses
  window.TBWA_THEME = {
    palette: palette,
    colors: colorSequence,
    fontFamily: fontFamily,
    
    // Helper to apply TBWA styling to any chart
    apply: function(chart) {
      if (!chart) return null;
      
      // Handle Chart.js
      if (chart.canvas && typeof Chart !== 'undefined') {
        return Chart.applyTbwaTheme(chart);
      }
      
      // Handle ECharts
      if (chart.setOption && typeof echarts !== 'undefined') {
        chart.setOption({}, { notMerge: false });
        return chart;
      }
      
      return chart;
    },
    
    // Generate a gradient using TBWA colors
    gradient: function(ctx, startColor, endColor) {
      if (!ctx || !ctx.createLinearGradient) return startColor || palette.navy;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, startColor || palette.navy);
      gradient.addColorStop(1, endColor || palette.cyan);
      return gradient;
    }
  };
})();