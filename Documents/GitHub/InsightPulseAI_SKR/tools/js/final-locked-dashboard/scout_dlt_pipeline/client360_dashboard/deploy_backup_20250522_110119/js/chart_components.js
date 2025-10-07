/**
 * Client360 Dashboard - Chart Components
 * Implements advanced chart visualizations based on Chart.js
 * Supports all required chart types from PRD F7
 */

// Initialize chart components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Chart components initializing...');
  initializeChartComponents();
});

/**
 * Initialize all chart components
 */
function initializeChartComponents() {
  // Create a registry of chart types for easy access
  window.chartRegistry = {
    gauge: createGaugeChart,
    bullet: createBulletChart,
    sparkline: createSparklineChart,
    donut: createDonutChart,
    bar: createBarChart,
    line: createLineChart,
    boxWhisker: createBoxWhiskerChart
  };
  
  // Find chart containers and initialize them
  const chartContainers = document.querySelectorAll('[data-chart-type]');
  
  if (chartContainers.length === 0) {
    console.log('No chart containers found, deferring initialization');
    // Create a MutationObserver to watch for chart containers being added to the DOM
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          const newChartContainers = document.querySelectorAll('[data-chart-type]:not([data-chart-initialized])');
          if (newChartContainers.length > 0) {
            console.log(`Found ${newChartContainers.length} new chart containers`);
            initializeChartContainers(newChartContainers);
          }
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    return;
  }
  
  initializeChartContainers(chartContainers);
}

/**
 * Initialize chart containers based on their data attributes
 */
function initializeChartContainers(containers) {
  containers.forEach(container => {
    const chartType = container.getAttribute('data-chart-type');
    const chartId = container.getAttribute('id');
    
    if (!chartId) {
      console.warn('Chart container missing ID, skipping initialization');
      return;
    }
    
    if (!chartType || !window.chartRegistry[chartType]) {
      console.warn(`Unknown chart type: ${chartType}`);
      return;
    }
    
    try {
      // Mark as initialized to prevent double-initialization
      container.setAttribute('data-chart-initialized', 'true');
      
      // Get chart options from data attributes
      const chartOptions = getChartOptionsFromAttributes(container);
      
      // Create the chart
      window.chartRegistry[chartType](chartId, chartOptions);
      console.log(`Chart initialized: ${chartId} (${chartType})`);
    } catch (error) {
      console.error(`Failed to initialize chart ${chartId}:`, error);
    }
  });
}

/**
 * Extract chart options from data attributes
 */
function getChartOptionsFromAttributes(container) {
  const options = {};
  
  // Data source
  options.dataSource = container.getAttribute('data-source') || null;
  
  // Chart dimensions
  options.height = parseInt(container.getAttribute('data-height')) || null;
  options.width = parseInt(container.getAttribute('data-width')) || null;
  
  // Chart colors
  options.colors = container.getAttribute('data-colors')?.split(',') || null;
  
  // Chart title
  options.title = container.getAttribute('data-title') || null;
  
  // Chart labels
  options.labels = container.getAttribute('data-labels')?.split(',') || null;
  
  // Min/Max values
  options.min = parseFloat(container.getAttribute('data-min')) || null;
  options.max = parseFloat(container.getAttribute('data-max')) || null;
  
  // Target value (for bullet charts)
  options.target = parseFloat(container.getAttribute('data-target')) || null;
  
  // Thresholds (for gauge charts)
  options.thresholds = container.getAttribute('data-thresholds')?.split(',').map(t => parseFloat(t)) || null;
  
  // Animation
  options.animate = container.getAttribute('data-animate') !== 'false';
  
  // Data values (inline data)
  const dataValues = container.getAttribute('data-values');
  if (dataValues) {
    options.data = dataValues.split(',').map(v => parseFloat(v));
  }
  
  return options;
}

/**
 * Load chart data from a specified data source
 */
async function loadChartData(dataSource) {
  if (!dataSource) {
    console.warn('No data source specified');
    return null;
  }
  
  try {
    const response = await fetch(dataSource);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load chart data from ${dataSource}:`, error);
    return null;
  }
}

/**
 * Create a gauge chart
 */
function createGaugeChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options
  const chartOptions = {
    data: options.data || [75],
    min: options.min !== null ? options.min : 0,
    max: options.max !== null ? options.max : 100,
    thresholds: options.thresholds || [33, 66],
    colors: options.colors || ['#ef4444', '#f59e0b', '#10b981'],
    title: options.title || 'Gauge Chart',
    animate: options.animate !== false
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.value !== undefined) {
        updateGaugeChart(chart, data.value);
      }
    });
  }
  
  // Create gauge chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [chartOptions.data[0], chartOptions.max - chartOptions.data[0]],
        backgroundColor: [getColorForValue(chartOptions.data[0], chartOptions), '#e5e7eb'],
        circumference: 180,
        rotation: 270,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        },
        title: {
          display: !!chartOptions.title,
          text: chartOptions.title,
          position: 'bottom',
          padding: {
            top: 10,
            bottom: 0
          }
        }
      }
    },
    plugins: [{
      id: 'gaugeNeedle',
      afterDatasetDraw(chart) {
        const { ctx, data, chartArea, scales } = chart;
        const value = data.datasets[0].data[0];
        const angle = Math.PI + (value / chartOptions.max) * Math.PI;
        const cx = chartArea.width / 2 + chartArea.left;
        const cy = chartArea.bottom;
        const needleLength = chartArea.height * 0.8;
        
        // Draw needle
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(needleLength, 0);
        ctx.lineTo(0, 5);
        ctx.fillStyle = '#334155';
        ctx.fill();
        
        // Draw hub
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#334155';
        ctx.fill();
        
        ctx.restore();
        
        // Draw value text
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#334155';
        ctx.fillText(value, cx, cy - 30);
      }
    }]
  });
  
  // Helper function to determine color based on value and thresholds
  function getColorForValue(value, options) {
    const { min, max, thresholds, colors } = options;
    const normalizedValue = (value - min) / (max - min);
    
    if (normalizedValue <= thresholds[0] / 100) return colors[0];
    if (normalizedValue <= thresholds[1] / 100) return colors[1];
    return colors[2];
  }
  
  // Function to update gauge value
  function updateGaugeChart(chart, value) {
    chart.data.datasets[0].data[0] = value;
    chart.data.datasets[0].data[1] = chartOptions.max - value;
    chart.data.datasets[0].backgroundColor[0] = getColorForValue(value, chartOptions);
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (value) => updateGaugeChart(chart, value);
  
  return chart;
}

/**
 * Create a bullet chart (similar to a horizontal bar chart with targets)
 */
function createBulletChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options
  const chartOptions = {
    data: options.data || [60],
    target: options.target || 75,
    min: options.min !== null ? options.min : 0,
    max: options.max !== null ? options.max : 100,
    colors: options.colors || ['#3b82f6', '#dc2626'],
    title: options.title || 'Bullet Chart',
    animate: options.animate !== false
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.value !== undefined) {
        updateBulletChart(chart, data.value, data.target || chartOptions.target);
      }
    });
  }
  
  // Create bullet chart (custom implementation based on bar chart)
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [chartOptions.title],
      datasets: [
        {
          // Background ranges (light gray bar)
          label: 'Range',
          data: [chartOptions.max],
          backgroundColor: '#f3f4f6',
          borderWidth: 0,
          barPercentage: 0.9,
        },
        {
          // Actual value
          label: 'Value',
          data: [chartOptions.data[0]],
          backgroundColor: chartOptions.colors[0],
          borderWidth: 0,
          barPercentage: 0.6,
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: chartOptions.min,
          max: chartOptions.max,
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 1) {
                return `Value: ${context.raw}`;
              } else {
                return `Range: 0-${context.raw}`;
              }
            }
          }
        }
      }
    },
    plugins: [{
      id: 'bulletTarget',
      afterDatasetDraw(chart) {
        const { ctx, data, chartArea, scales } = chart;
        const target = chartOptions.target;
        
        // Draw target line
        const x = scales.x.getPixelForValue(target);
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = chartOptions.colors[1];
        ctx.stroke();
        
        // Draw target marker
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top - 10);
        ctx.lineTo(x - 5, chartArea.top);
        ctx.lineTo(x + 5, chartArea.top);
        ctx.closePath();
        ctx.fillStyle = chartOptions.colors[1];
        ctx.fill();
        
        ctx.restore();
      }
    }]
  });
  
  // Function to update bullet chart
  function updateBulletChart(chart, value, target) {
    chart.data.datasets[1].data[0] = value;
    chartOptions.target = target;
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (value, target) => updateBulletChart(chart, value, target || chartOptions.target);
  
  return chart;
}

/**
 * Create a sparkline chart (simplified line chart showing trends)
 */
function createSparklineChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options
  const chartOptions = {
    data: options.data || [10, 25, 18, 35, 30, 38, 40],
    colors: options.colors || ['#3b82f6'],
    title: options.title || 'Sparkline',
    animate: options.animate !== false
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.values) {
        updateSparklineChart(chart, data.values);
      }
    });
  }
  
  // Create sparkline chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(chartOptions.data.length).fill(''),
      datasets: [{
        data: chartOptions.data,
        borderColor: chartOptions.colors[0],
        backgroundColor: hexToRgba(chartOptions.colors[0], 0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          displayColors: false,
          callbacks: {
            title: () => null,
            label: (context) => `Value: ${context.parsed.y}`
          }
        },
        title: {
          display: false
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      },
      animation: {
        duration: chartOptions.animate ? 1000 : 0
      }
    }
  });
  
  // Add title below chart if specified
  if (chartOptions.title) {
    const titleElement = document.createElement('div');
    titleElement.className = 'sparkline-title';
    titleElement.textContent = chartOptions.title;
    container.appendChild(titleElement);
  }
  
  // Function to update sparkline
  function updateSparklineChart(chart, values) {
    chart.data.labels = Array(values.length).fill('');
    chart.data.datasets[0].data = values;
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (values) => updateSparklineChart(chart, values);
  
  return chart;
}

/**
 * Create a donut chart
 */
function createDonutChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options
  const chartOptions = {
    data: options.data || [30, 40, 20, 10],
    labels: options.labels || ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
    colors: options.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    title: options.title || 'Donut Chart',
    animate: options.animate !== false
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.values && data.labels) {
        updateDonutChart(chart, data.values, data.labels);
      }
    });
  }
  
  // Create donut chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartOptions.labels,
      datasets: [{
        data: chartOptions.data,
        backgroundColor: chartOptions.colors,
        borderWidth: 1,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: {
          display: !!chartOptions.title,
          text: chartOptions.title,
          padding: {
            top: 10,
            bottom: 10
          }
        }
      },
      animation: {
        duration: chartOptions.animate ? 1000 : 0
      }
    },
    plugins: [{
      id: 'donutCenterText',
      beforeDraw: function(chart) {
        const width = chart.width;
        const height = chart.height;
        const ctx = chart.ctx;
        
        ctx.restore();
        const fontSize = (height / 150).toFixed(2);
        ctx.font = `${fontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        
        const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const text = total.toString();
        const textX = Math.round((width - ctx.measureText(text).width) / 2);
        const textY = height / 2;
        
        ctx.fillStyle = '#6b7280';
        ctx.fillText(text, textX, textY);
        ctx.save();
      }
    }]
  });
  
  // Function to update donut chart
  function updateDonutChart(chart, values, labels) {
    chart.data.labels = labels || chart.data.labels;
    chart.data.datasets[0].data = values;
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (values, labels) => updateDonutChart(chart, values, labels);
  
  return chart;
}

/**
 * Create a bar chart
 */
function createBarChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options
  const chartOptions = {
    data: options.data || [65, 59, 80, 81, 56, 55, 40],
    labels: options.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    colors: options.colors || ['#3b82f6'],
    title: options.title || 'Bar Chart',
    animate: options.animate !== false,
    horizontal: options.horizontal || false
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.values && data.labels) {
        updateBarChart(chart, data.values, data.labels);
      }
    });
  }
  
  // Create bar chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartOptions.labels,
      datasets: [{
        label: chartOptions.title,
        data: chartOptions.data,
        backgroundColor: chartOptions.colors[0],
        borderWidth: 0,
        barPercentage: 0.7,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: chartOptions.horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: !!chartOptions.title,
          text: chartOptions.title,
          padding: {
            top: 10,
            bottom: 10
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: chartOptions.animate ? 1000 : 0
      }
    }
  });
  
  // Function to update bar chart
  function updateBarChart(chart, values, labels) {
    chart.data.labels = labels || chart.data.labels;
    chart.data.datasets[0].data = values;
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (values, labels) => updateBarChart(chart, values, labels);
  
  return chart;
}

/**
 * Create a line chart
 */
function createLineChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options
  const chartOptions = {
    data: options.data || [65, 59, 80, 81, 56, 55, 40],
    labels: options.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    colors: options.colors || ['#3b82f6'],
    title: options.title || 'Line Chart',
    animate: options.animate !== false,
    fill: options.fill !== undefined ? options.fill : false,
    tension: options.tension !== undefined ? options.tension : 0.4
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.values && data.labels) {
        updateLineChart(chart, data.values, data.labels);
      }
    });
  }
  
  // Create line chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartOptions.labels,
      datasets: [{
        label: chartOptions.title,
        data: chartOptions.data,
        borderColor: chartOptions.colors[0],
        backgroundColor: chartOptions.fill ? hexToRgba(chartOptions.colors[0], 0.1) : 'transparent',
        fill: chartOptions.fill,
        tension: chartOptions.tension,
        pointBackgroundColor: chartOptions.colors[0],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: !!chartOptions.title,
          text: chartOptions.title,
          padding: {
            top: 10,
            bottom: 10
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: chartOptions.animate ? 1000 : 0
      }
    }
  });
  
  // Function to update line chart
  function updateLineChart(chart, values, labels) {
    chart.data.labels = labels || chart.data.labels;
    chart.data.datasets[0].data = values;
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (values, labels) => updateLineChart(chart, values, labels);
  
  return chart;
}

/**
 * Create a box-whisker chart
 */
function createBoxWhiskerChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Default options with demo data
  // Each dataset needs: min, q1, median, q3, max
  const chartOptions = {
    datasets: options.datasets || [
      { label: 'A', data: [10, 20, 30, 40, 50] },
      { label: 'B', data: [15, 25, 35, 45, 55] },
      { label: 'C', data: [5, 15, 25, 35, 45] }
    ],
    labels: options.labels || ['Dataset A', 'Dataset B', 'Dataset C'],
    colors: options.colors || ['#3b82f6', '#10b981', '#f59e0b'],
    title: options.title || 'Box-Whisker Chart',
    animate: options.animate !== false
  };
  
  // Load data from source if specified
  if (options.dataSource) {
    loadChartData(options.dataSource).then(data => {
      if (data && data.datasets) {
        updateBoxWhiskerChart(chart, data.datasets, data.labels);
      }
    });
  }
  
  // Create box-whisker chart using custom implementation
  // Since Chart.js doesn't have a built-in box-whisker type
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartOptions.labels,
      datasets: [{
        data: chartOptions.datasets.map(() => 0),
        backgroundColor: 'transparent',
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: !!chartOptions.title,
          text: chartOptions.title,
          padding: {
            top: 10,
            bottom: 10
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => {
              const dataset = chartOptions.datasets[context.dataIndex];
              return [
                `Min: ${dataset.data[0]}`,
                `Q1: ${dataset.data[1]}`,
                `Median: ${dataset.data[2]}`,
                `Q3: ${dataset.data[3]}`,
                `Max: ${dataset.data[4]}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: chartOptions.animate ? 1000 : 0
      }
    },
    plugins: [{
      id: 'boxWhiskerPlugin',
      afterDraw: function(chart) {
        const { ctx, scales, data } = chart;
        const { x, y } = scales;
        const datasets = chartOptions.datasets;
        
        datasets.forEach((dataset, i) => {
          const [min, q1, median, q3, max] = dataset.data;
          const xPos = x.getPixelForValue(i);
          const yMin = y.getPixelForValue(min);
          const yQ1 = y.getPixelForValue(q1);
          const yMedian = y.getPixelForValue(median);
          const yQ3 = y.getPixelForValue(q3);
          const yMax = y.getPixelForValue(max);
          
          const boxWidth = x.getPixelForValue(1) - x.getPixelForValue(0);
          const boxHalfWidth = boxWidth * 0.3;
          
          const color = chartOptions.colors[i % chartOptions.colors.length];
          
          // Draw whiskers (min to q1, q3 to max)
          ctx.beginPath();
          ctx.moveTo(xPos, yMin);
          ctx.lineTo(xPos, yQ1);
          ctx.moveTo(xPos, yQ3);
          ctx.lineTo(xPos, yMax);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw min and max horizontal lines
          ctx.beginPath();
          ctx.moveTo(xPos - boxHalfWidth, yMin);
          ctx.lineTo(xPos + boxHalfWidth, yMin);
          ctx.moveTo(xPos - boxHalfWidth, yMax);
          ctx.lineTo(xPos + boxHalfWidth, yMax);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw box (q1 to q3)
          ctx.fillStyle = hexToRgba(color, 0.3);
          ctx.fillRect(xPos - boxHalfWidth, yQ3, boxHalfWidth * 2, yQ1 - yQ3);
          
          // Draw median line
          ctx.beginPath();
          ctx.moveTo(xPos - boxHalfWidth, yMedian);
          ctx.lineTo(xPos + boxHalfWidth, yMedian);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    }]
  });
  
  // Function to update box-whisker chart
  function updateBoxWhiskerChart(chart, datasets, labels) {
    chartOptions.datasets = datasets;
    chartOptions.labels = labels || chartOptions.labels;
    chart.data.labels = chartOptions.labels;
    chart.update();
  }
  
  // Store update function for external access
  container.updateChart = (datasets, labels) => updateBoxWhiskerChart(chart, datasets, labels);
  
  return chart;
}

/**
 * Helper function to convert hex to rgba
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Export chart registry for external use
window.createChart = function(type, containerId, options) {
  if (window.chartRegistry && window.chartRegistry[type]) {
    return window.chartRegistry[type](containerId, options);
  }
  console.error(`Unknown chart type: ${type}`);
  return null;
};