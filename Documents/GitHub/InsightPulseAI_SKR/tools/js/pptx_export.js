/**
 * PowerPoint Export Functionality for Client360 Dashboard
 * Implements PRD requirement F3 for PPTX export
 * 
 * Uses pptxgenjs library to generate PowerPoint presentations from dashboard data
 * https://gitbrent.github.io/PptxGenJS/
 */

// IIFE to avoid global namespace pollution
(function() {
  // Initialize when the script is loaded
  function initPPTXExport() {
    // Load the pptxgenjs library dynamically
    loadPptxGenJS()
      .then(() => {
        // Initialize export buttons
        setupExportButtons();
        console.log('PPTX Export functionality initialized');
      })
      .catch(error => {
        console.error('Failed to load PPTX export functionality:', error);
      });
  }

  /**
   * Load the pptxgenjs library dynamically
   * @returns {Promise} - Resolves when library is loaded
   */
  function loadPptxGenJS() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.PptxGenJS) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.11.0/dist/pptxgen.bundle.js';
      script.integrity = 'sha384-NlNEgzVtxnN5D7yzDcIT6PO9+RlXEHRbEOUVQS/9//xpiXvj7MIq/9did0SP6t1n';
      script.crossOrigin = 'anonymous';
      
      // Set callbacks
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load pptxgenjs library'));
      
      // Add to document
      document.head.appendChild(script);
    });
  }

  /**
   * Set up export buttons throughout the dashboard
   */
  function setupExportButtons() {
    // Find all CSV export buttons and add PPTX option next to them
    document.querySelectorAll('[data-export="csv"]').forEach(csvButton => {
      // Create PPTX button with similar styling
      const pptxButton = document.createElement('button');
      pptxButton.setAttribute('data-export', 'pptx');
      pptxButton.setAttribute('data-section', csvButton.getAttribute('data-section') || 'dashboard');
      pptxButton.className = csvButton.className; // Inherit styling
      pptxButton.innerHTML = '<i class="fas fa-file-powerpoint"></i> PPTX';
      
      // Add tooltip
      pptxButton.setAttribute('title', 'Export to PowerPoint');
      
      // Add click handler
      pptxButton.addEventListener('click', handlePptxExport);
      
      // Insert after CSV button
      csvButton.parentNode.insertBefore(pptxButton, csvButton.nextSibling);
    });
    
    // Add main export button if it doesn't exist
    const exportContainer = document.querySelector('.export-buttons');
    if (exportContainer) {
      // Check if main PPTX button already exists
      if (!exportContainer.querySelector('[data-export="pptx"][data-section="dashboard"]')) {
        const mainPptxButton = document.createElement('button');
        mainPptxButton.setAttribute('data-export', 'pptx');
        mainPptxButton.setAttribute('data-section', 'dashboard');
        mainPptxButton.className = 'btn btn-secondary';
        mainPptxButton.innerHTML = '<i class="fas fa-file-powerpoint"></i> Export to PPTX';
        mainPptxButton.addEventListener('click', handlePptxExport);
        exportContainer.appendChild(mainPptxButton);
      }
    }
  }

  /**
   * Handle click on PPTX export button
   * @param {Event} event - Click event
   */
  function handlePptxExport(event) {
    // Get section to export
    const section = event.currentTarget.getAttribute('data-section') || 'dashboard';
    
    // Show loading indicator
    showLoading(event.currentTarget);
    
    // Generate and download PPTX
    try {
      if (section === 'dashboard') {
        exportFullDashboard();
      } else {
        exportSection(section);
      }
    } catch (error) {
      console.error('Error exporting to PPTX:', error);
      alert('Failed to export to PowerPoint. Please try again.');
    } finally {
      // Hide loading indicator
      hideLoading(event.currentTarget);
    }
  }

  /**
   * Show loading indicator on button
   * @param {HTMLElement} button - Button element
   */
  function showLoading(button) {
    // Store original content
    button._originalContent = button.innerHTML;
    
    // Replace with spinner
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    button.disabled = true;
  }

  /**
   * Hide loading indicator on button
   * @param {HTMLElement} button - Button element
   */
  function hideLoading(button) {
    // Restore original content
    if (button._originalContent) {
      button.innerHTML = button._originalContent;
    }
    button.disabled = false;
  }

  /**
   * Export full dashboard to PPTX
   */
  function exportFullDashboard() {
    // Create new presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Client360 Dashboard - ' + new Date().toLocaleDateString();
    pptx.subject = 'Exported from Client360 Dashboard';
    pptx.author = 'TBWA Client360';
    
    // Add title slide
    addTitleSlide(pptx);
    
    // Add KPI summary slide
    addKpiSlide(pptx);
    
    // Add store map slide
    addMapSlide(pptx);
    
    // Add regional performance slide
    addRegionalPerformanceSlide(pptx);
    
    // Add brand performance slide
    addBrandPerformanceSlide(pptx);
    
    // Add insights slide
    addInsightsSlide(pptx);
    
    // Save the presentation
    const filename = 'Client360_Dashboard_' + formatDateForFilename(new Date()) + '.pptx';
    pptx.writeFile({ fileName: filename })
      .catch(error => {
        console.error('Error saving PPTX:', error);
        alert('Failed to generate PowerPoint file. Please try again.');
      });
  }

  /**
   * Export specific section to PPTX
   * @param {string} sectionId - Section identifier
   */
  function exportSection(sectionId) {
    // Create new presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    
    // Get section element
    const sectionElement = document.getElementById(sectionId) || 
                          document.querySelector(`[data-section="${sectionId}"]`);
    
    if (!sectionElement) {
      console.error(`Section not found: ${sectionId}`);
      alert('Failed to export section: Section not found');
      return;
    }
    
    // Get section title
    const sectionTitle = getSectionTitle(sectionElement, sectionId);
    
    // Set presentation metadata
    pptx.title = `${sectionTitle} - Client360 Dashboard`;
    pptx.subject = 'Exported from Client360 Dashboard';
    pptx.author = 'TBWA Client360';
    
    // Add title slide
    const titleSlide = pptx.addSlide();
    
    // Add title
    titleSlide.addText(sectionTitle, {
      x: 0.5,
      y: 1.5,
      w: '90%',
      h: 1.5,
      fontSize: 36,
      color: '0052CC',
      bold: true,
      align: 'center'
    });
    
    // Add subtitle
    titleSlide.addText('Client360 Dashboard', {
      x: 0.5,
      y: 3.0,
      w: '90%',
      h: 0.75,
      fontSize: 20,
      color: '505F79',
      align: 'center'
    });
    
    // Add timestamp
    titleSlide.addText(`Exported on ${new Date().toLocaleString()}`, {
      x: 0.5,
      y: 3.75,
      w: '90%',
      h: 0.5,
      fontSize: 14,
      color: '7A869A',
      align: 'center'
    });
    
    // Handle different section types
    switch (sectionId) {
      case 'kpi-summary':
        addKpiSlide(pptx, sectionElement);
        break;
      case 'store-map':
        addMapSlide(pptx, sectionElement);
        break;
      case 'regional-performance':
        addRegionalPerformanceSlide(pptx, sectionElement);
        break;
      case 'brand-performance':
        addBrandPerformanceSlide(pptx, sectionElement);
        break;
      case 'ai-insights':
        addInsightsSlide(pptx, sectionElement);
        break;
      default:
        // Generic section export
        addGenericSectionSlide(pptx, sectionElement, sectionTitle);
    }
    
    // Save the presentation
    const filename = `Client360_${formatSectionIdForFilename(sectionId)}_${formatDateForFilename(new Date())}.pptx`;
    pptx.writeFile({ fileName: filename })
      .catch(error => {
        console.error('Error saving PPTX:', error);
        alert('Failed to generate PowerPoint file. Please try again.');
      });
  }

  /**
   * Add title slide to presentation
   * @param {object} pptx - PptxGenJS instance
   */
  function addTitleSlide(pptx) {
    const slide = pptx.addSlide();
    
    // Add TBWA logo
    if (window.CLIENT360_CONFIG && window.CLIENT360_CONFIG.logoUrl) {
      slide.addImage({
        path: window.CLIENT360_CONFIG.logoUrl,
        x: 0.5,
        y: 0.5,
        w: 2.5,
        h: 0.75
      });
    }
    
    // Add title
    slide.addText('Client360 Dashboard', {
      x: 0.5,
      y: 2.0,
      w: '90%',
      h: 1.5,
      fontSize: 44,
      color: '0052CC',
      bold: true,
      align: 'center'
    });
    
    // Add subtitle
    slide.addText('Retail Analytics & Store Performance', {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.75,
      fontSize: 24,
      color: '505F79',
      align: 'center'
    });
    
    // Add date range if available
    const dateRangeElement = document.querySelector('[data-date-range]');
    const dateRange = dateRangeElement ? dateRangeElement.textContent : 'Current Period';
    
    slide.addText(`${dateRange}`, {
      x: 0.5,
      y: 4.25,
      w: '90%',
      h: 0.6,
      fontSize: 18,
      color: '7A869A',
      align: 'center'
    });
    
    // Add timestamp
    slide.addText(`Exported on ${new Date().toLocaleString()}`, {
      x: 0.5,
      y: 5.0,
      w: '90%',
      h: 0.5,
      fontSize: 14,
      color: '7A869A',
      align: 'center'
    });
  }

  /**
   * Add KPI summary slide
   * @param {object} pptx - PptxGenJS instance
   * @param {HTMLElement} [sectionElement] - Optional section element
   */
  function addKpiSlide(pptx, sectionElement) {
    const slide = pptx.addSlide();
    
    // Add slide title
    slide.addText('Key Performance Indicators', {
      x: 0.5,
      y: 0.5,
      w: '95%',
      h: 0.75,
      fontSize: 24,
      color: '0052CC',
      bold: true
    });
    
    // Get KPI data
    const kpiTiles = [];
    const kpiElements = (sectionElement || document).querySelectorAll('[data-kpi]');
    
    kpiElements.forEach(element => {
      const kpiId = element.getAttribute('data-kpi');
      const titleElement = element.querySelector('.kpi-title');
      const valueElement = element.querySelector('.kpi-value');
      const changeElement = element.querySelector('.kpi-change');
      
      if (titleElement && valueElement) {
        kpiTiles.push({
          id: kpiId,
          title: titleElement.textContent.trim(),
          value: valueElement.textContent.trim(),
          change: changeElement ? changeElement.textContent.trim() : null,
          positive: changeElement ? changeElement.classList.contains('positive') : false,
          negative: changeElement ? changeElement.classList.contains('negative') : false
        });
      }
    });
    
    // Add KPI tiles to slide
    if (kpiTiles.length > 0) {
      const rows = Math.ceil(kpiTiles.length / 2);
      const tileHeight = 2.0;
      const tileWidth = 4.5;
      const startY = 1.5;
      
      kpiTiles.forEach((kpi, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        
        const tileX = 0.5 + (col * (tileWidth + 0.5));
        const tileY = startY + (row * (tileHeight + 0.3));
        
        // Add tile background
        slide.addShape(pptx.ShapeType.rect, {
          x: tileX,
          y: tileY,
          w: tileWidth,
          h: tileHeight,
          fill: { color: 'FFFFFF' },
          line: { color: 'DFE1E6', width: 1 },
          shadow: { type: 'outer', angle: 45, blur: 3, offset: 2, color: '000000', opacity: 0.2 }
        });
        
        // Add KPI title
        slide.addText(kpi.title, {
          x: tileX + 0.2,
          y: tileY + 0.2,
          w: tileWidth - 0.4,
          h: 0.4,
          fontSize: 14,
          color: '505F79',
          bold: true
        });
        
        // Add KPI value
        slide.addText(kpi.value, {
          x: tileX + 0.2,
          y: tileY + 0.7,
          w: tileWidth - 0.4,
          h: 0.6,
          fontSize: 28,
          color: '0052CC',
          bold: true
        });
        
        // Add change percentage if available
        if (kpi.change) {
          const changeColor = kpi.positive ? '36B37E' : (kpi.negative ? 'FF5630' : '7A869A');
          
          slide.addText(kpi.change, {
            x: tileX + 0.2,
            y: tileY + 1.4,
            w: tileWidth - 0.4,
            h: 0.4,
            fontSize: 14,
            color: changeColor
          });
        }
      });
    } else {
      // No KPI data found
      slide.addText('No KPI data available', {
        x: 0.5,
        y: 2.5,
        w: '95%',
        h: 0.75,
        fontSize: 18,
        color: '7A869A',
        align: 'center'
      });
    }
    
    // Add timestamp
    addTimestamp(slide);
  }

  /**
   * Add store map slide
   * @param {object} pptx - PptxGenJS instance
   * @param {HTMLElement} [sectionElement] - Optional section element
   */
  function addMapSlide(pptx, sectionElement) {
    const slide = pptx.addSlide();
    
    // Add slide title
    slide.addText('Geospatial Store Performance', {
      x: 0.5,
      y: 0.5,
      w: '95%',
      h: 0.75,
      fontSize: 24,
      color: '0052CC',
      bold: true
    });
    
    // Try to capture map as image
    const mapElement = (sectionElement || document).querySelector('[data-qa="store-map"]');
    
    if (mapElement) {
      // Get map container dimensions
      const mapWidth = mapElement.offsetWidth;
      const mapHeight = mapElement.offsetHeight;
      
      // Use html2canvas to capture map (if available)
      if (window.html2canvas) {
        try {
          html2canvas(mapElement).then(canvas => {
            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/png');
            
            // Add map image to slide
            slide.addImage({
              data: dataUrl,
              x: 0.5,
              y: 1.5,
              w: 9.0,
              h: 5.0
            });
            
            // Update the slide
            pptx.writeFile();
          });
        } catch (error) {
          console.error('Failed to capture map image:', error);
          addMapFallback(slide);
        }
      } else {
        addMapFallback(slide);
      }
    } else {
      addMapFallback(slide);
    }
    
    // Add timestamp
    addTimestamp(slide);
  }

  /**
   * Add fallback content for map slide when image capture fails
   * @param {object} slide - PptxGenJS slide instance
   */
  function addMapFallback(slide) {
    // Add note about map
    slide.addText('Store Performance Map', {
      x: 0.5,
      y: 2.5,
      w: 9.0,
      h: 0.75,
      fontSize: 18,
      color: '505F79',
      align: 'center',
      bold: true
    });
    
    slide.addText('Interactive map showing store performance by region', {
      x: 0.5,
      y: 3.25,
      w: 9.0,
      h: 0.5,
      fontSize: 14,
      color: '7A869A',
      align: 'center'
    });
    
    // Add placeholder shape
    slide.addShape(pptx.ShapeType.rect, {
      x: 1.5,
      y: 4.0,
      w: 7.0,
      h: 2.5,
      fill: { color: 'F4F5F7' },
      line: { color: 'DFE1E6', width: 1 },
      shadow: { type: 'outer', angle: 45, blur: 3, offset: 2, color: '000000', opacity: 0.1 }
    });
    
    // Add note to view interactive map
    slide.addText('For interactive map with all store details, please view the online dashboard', {
      x: 1.5,
      y: 5.0,
      w: 7.0,
      h: 0.5,
      fontSize: 14,
      color: '7A869A',
      align: 'center'
    });
  }

  /**
   * Add regional performance slide
   * @param {object} pptx - PptxGenJS instance
   * @param {HTMLElement} [sectionElement] - Optional section element
   */
  function addRegionalPerformanceSlide(pptx, sectionElement) {
    const slide = pptx.addSlide();
    
    // Add slide title
    slide.addText('Regional Performance', {
      x: 0.5,
      y: 0.5,
      w: '95%',
      h: 0.75,
      fontSize: 24,
      color: '0052CC',
      bold: true
    });
    
    // Try to get regional data
    const regionalData = [];
    const tableElement = (sectionElement || document).querySelector('[data-table="regional-performance"]');
    
    if (tableElement) {
      // Extract data from table
      const rows = tableElement.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          regionalData.push({
            region: cells[0].textContent.trim(),
            stores: cells[1].textContent.trim(),
            sales: cells[2].textContent.trim(),
            growth: cells[3].textContent.trim()
          });
        }
      });
      
      // Add chart with regional data
      if (regionalData.length > 0) {
        // Add table with regional data
        const tableData = [
          [
            { text: 'Region', options: { bold: true, color: '505F79' } },
            { text: 'Stores', options: { bold: true, color: '505F79' } },
            { text: 'Sales', options: { bold: true, color: '505F79' } },
            { text: 'Growth', options: { bold: true, color: '505F79' } }
          ]
        ];
        
        regionalData.forEach(region => {
          tableData.push([
            { text: region.region },
            { text: region.stores },
            { text: region.sales },
            { text: region.growth }
          ]);
        });
        
        slide.addTable(tableData, {
          x: 0.5,
          y: 1.5,
          w: 9.0,
          h: 2.5,
          fontSize: 14,
          color: '1D1D1D',
          border: { color: 'DFE1E6', pt: 1 }
        });
        
        // Add bar chart for sales by region
        slide.addChart(pptx.ChartType.bar, {
          title: 'Sales by Region',
          x: 0.5,
          y: 4.5,
          w: 9.0,
          h: 2.5,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: ['0052CC', '2684FF', '36B37E', 'FFAB00'],
          dataBorder: { pt: 1, color: 'F4F5F7' },
          dataLabelColor: '1D1D1D',
          showLegend: true,
          legendPos: 'r',
          showTitle: true,
          titleColor: '505F79',
          titleFontSize: 14,
          valAxisMaxVal: 100,
          catAxisLabelColor: '505F79',
          valAxisLabelColor: '505F79',
          dataLabelFormatCode: '$#,##0',
          valAxisMajorUnit: 20,
          dataLabelPosition: 'outEnd',
          
          // Chart data
          categoryNames: regionalData.map(item => item.region),
          data: [
            {
              name: 'Sales Performance',
              // Convert sales values to numbers
              values: regionalData.map(item => {
                // Extract numeric value from formatted string (e.g., "$10,000" -> 10000)
                const value = item.sales.replace(/[^0-9.]/g, '');
                return parseFloat(value) || 0;
              })
            }
          ]
        });
      } else {
        addNoDataMessage(slide);
      }
    } else {
      addNoDataMessage(slide);
    }
    
    // Add timestamp
    addTimestamp(slide);
  }

  /**
   * Add brand performance slide
   * @param {object} pptx - PptxGenJS instance
   * @param {HTMLElement} [sectionElement] - Optional section element
   */
  function addBrandPerformanceSlide(pptx, sectionElement) {
    const slide = pptx.addSlide();
    
    // Add slide title
    slide.addText('Brand Performance', {
      x: 0.5,
      y: 0.5,
      w: '95%',
      h: 0.75,
      fontSize: 24,
      color: '0052CC',
      bold: true
    });
    
    // Try to get brand data
    const brandData = [];
    const tableElement = (sectionElement || document).querySelector('[data-table="brand-performance"]');
    
    if (tableElement) {
      // Extract data from table
      const rows = tableElement.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          brandData.push({
            brand: cells[0].textContent.trim(),
            mentions: parseInt(cells[1].textContent.trim().replace(/[^0-9]/g, '')) || 0,
            sentiment: parseFloat(cells[2].textContent.trim().replace(/[^0-9.-]/g, '')) || 0
          });
        }
      });
      
      // Sort by mentions (descending)
      brandData.sort((a, b) => b.mentions - a.mentions);
      
      // Take top 8 brands for the chart
      const topBrands = brandData.slice(0, 8);
      
      // Add pie chart for brand mentions
      if (topBrands.length > 0) {
        slide.addChart(pptx.ChartType.pie, {
          title: 'Brand Mentions',
          x: 0.5,
          y: 1.5,
          w: 4.5,
          h: 3.5,
          chartColors: [
            '0052CC', '2684FF', '4C9AFF', '85B8FF', 
            '36B37E', '57D9A3', 'FFAB00', 'FF8B00'
          ],
          dataBorder: { pt: 1, color: 'F4F5F7' },
          dataLabelColor: 'FFFFFF',
          showLegend: true,
          legendPos: 'b',
          showTitle: true,
          titleColor: '505F79',
          titleFontSize: 14,
          
          // Chart data
          data: topBrands.map(brand => ({
            name: brand.brand,
            value: brand.mentions
          }))
        });
        
        // Add bar chart for brand sentiment
        slide.addChart(pptx.ChartType.bar, {
          title: 'Brand Sentiment',
          x: 5.5,
          y: 1.5,
          w: 4.5,
          h: 3.5,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: topBrands.map(brand => 
            brand.sentiment > 0 ? '36B37E' : (brand.sentiment < 0 ? 'FF5630' : 'FFAB00')
          ),
          dataBorder: { pt: 1, color: 'F4F5F7' },
          dataLabelColor: '1D1D1D',
          showLegend: false,
          showTitle: true,
          titleColor: '505F79',
          titleFontSize: 14,
          valAxisMaxVal: 100,
          catAxisLabelColor: '505F79',
          valAxisLabelColor: '505F79',
          dataLabelFormatCode: '0.0',
          
          // Chart data
          categoryNames: topBrands.map(brand => brand.brand),
          data: [
            {
              name: 'Sentiment Score',
              values: topBrands.map(brand => brand.sentiment)
            }
          ]
        });
        
        // Add table with all brand data
        const tableData = [
          [
            { text: 'Brand', options: { bold: true, color: '505F79' } },
            { text: 'Mentions', options: { bold: true, color: '505F79' } },
            { text: 'Sentiment', options: { bold: true, color: '505F79' } }
          ]
        ];
        
        brandData.forEach(brand => {
          tableData.push([
            { text: brand.brand },
            { text: brand.mentions.toString() },
            { text: brand.sentiment.toFixed(1) }
          ]);
        });
        
        slide.addTable(tableData, {
          x: 0.5,
          y: 5.3,
          w: 9.0,
          h: 2.0,
          fontSize: 12,
          color: '1D1D1D',
          border: { color: 'DFE1E6', pt: 1 }
        });
      } else {
        addNoDataMessage(slide);
      }
    } else {
      addNoDataMessage(slide);
    }
    
    // Add timestamp
    addTimestamp(slide);
  }

  /**
   * Add insights slide
   * @param {object} pptx - PptxGenJS instance
   * @param {HTMLElement} [sectionElement] - Optional section element
   */
  function addInsightsSlide(pptx, sectionElement) {
    const slide = pptx.addSlide();
    
    // Add slide title
    slide.addText('AI-Generated Insights', {
      x: 0.5,
      y: 0.5,
      w: '95%',
      h: 0.75,
      fontSize: 24,
      color: '0052CC',
      bold: true
    });
    
    // Try to get insights data
    const insights = [];
    const insightElements = (sectionElement || document).querySelectorAll('[data-insight]');
    
    insightElements.forEach(element => {
      const titleElement = element.querySelector('.insight-title');
      const textElement = element.querySelector('.insight-text');
      
      if (titleElement && textElement) {
        insights.push({
          title: titleElement.textContent.trim(),
          text: textElement.textContent.trim()
        });
      }
    });
    
    // Add insights to slide
    if (insights.length > 0) {
      const startY = 1.5;
      const insightHeight = 1.6;
      
      insights.forEach((insight, index) => {
        const y = startY + (index * (insightHeight + 0.2));
        
        // Add insight container
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.5,
          y: y,
          w: 9.0,
          h: insightHeight,
          fill: { color: 'FFFFFF' },
          line: { color: 'DFE1E6', width: 1 },
          shadow: { type: 'outer', angle: 45, blur: 3, offset: 2, color: '000000', opacity: 0.1 }
        });
        
        // Add lightbulb icon
        slide.addText('💡', {
          x: 0.7,
          y: y + 0.2,
          w: 0.5,
          h: 0.5,
          fontSize: 16
        });
        
        // Add insight title
        slide.addText(insight.title, {
          x: 1.3,
          y: y + 0.2,
          w: 8.0,
          h: 0.4,
          fontSize: 16,
          color: '0052CC',
          bold: true
        });
        
        // Add insight text
        slide.addText(insight.text, {
          x: 1.3,
          y: y + 0.6,
          w: 8.0,
          h: 0.9,
          fontSize: 12,
          color: '505F79'
        });
      });
    } else {
      addNoDataMessage(slide);
    }
    
    // Add note about AI-generated content
    slide.addText('Insights are generated using AI analysis of store performance data, customer interactions, and trends.', {
      x: 0.5,
      y: 6.5,
      w: 9.0,
      h: 0.4,
      fontSize: 10,
      color: '7A869A',
      italic: true
    });
    
    // Add timestamp
    addTimestamp(slide);
  }

  /**
   * Add generic section slide
   * @param {object} pptx - PptxGenJS instance
   * @param {HTMLElement} sectionElement - Section element
   * @param {string} sectionTitle - Section title
   */
  function addGenericSectionSlide(pptx, sectionElement, sectionTitle) {
    const slide = pptx.addSlide();
    
    // Add slide title
    slide.addText(sectionTitle, {
      x: 0.5,
      y: 0.5,
      w: '95%',
      h: 0.75,
      fontSize: 24,
      color: '0052CC',
      bold: true
    });
    
    // Add note about viewing in dashboard
    slide.addText('For interactive data visualization, please view the online dashboard', {
      x: 0.5,
      y: 3.5,
      w: 9.0,
      h: 0.5,
      fontSize: 16,
      color: '505F79',
      align: 'center'
    });
    
    // Add timestamp
    addTimestamp(slide);
  }

  /**
   * Add no data message to slide
   * @param {object} slide - PptxGenJS slide instance
   */
  function addNoDataMessage(slide) {
    slide.addText('No data available for this section', {
      x: 0.5,
      y: 3.0,
      w: 9.0,
      h: 0.75,
      fontSize: 16,
      color: '7A869A',
      align: 'center'
    });
  }

  /**
   * Add timestamp to slide
   * @param {object} slide - PptxGenJS slide instance
   */
  function addTimestamp(slide) {
    slide.addText(`Exported: ${new Date().toLocaleString()}`, {
      x: 0.5,
      y: 7.0,
      w: 9.0,
      h: 0.3,
      align: 'center',
      fontSize: 8,
      color: '7A869A'
    });
  }

  /**
   * Get section title from element or ID
   * @param {HTMLElement} sectionElement - Section element
   * @param {string} sectionId - Section ID
   * @returns {string} Section title
   */
  function getSectionTitle(sectionElement, sectionId) {
    // Try to get title from heading element
    const headingElement = sectionElement.querySelector('h1, h2, h3, h4');
    if (headingElement) {
      return headingElement.textContent.trim();
    }
    
    // Format section ID as title
    return sectionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format date for filename
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}`;
  }

  /**
   * Format section ID for filename
   * @param {string} sectionId - Section ID
   * @returns {string} Formatted section ID
   */
  function formatSectionIdForFilename(sectionId) {
    return sectionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPPTXExport);
  } else {
    initPPTXExport();
  }
})();