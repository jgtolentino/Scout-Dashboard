/**
 * QA Overlay Toggle for Client360 Dashboard
 * Implements PRD requirement for diagnostic overlay (Alt+Shift+D)
 */

// Self-executing function to avoid global namespace pollution
(function() {
  // Configuration
  const KEY_COMBO = { alt: true, shift: true, key: 'd' };
  const OVERLAY_ID = 'client360-qa-overlay';
  const Z_INDEX = 10000;
  
  // State management
  let isOverlayVisible = false;
  let overlayElement = null;
  
  /**
   * Initialize QA overlay functionality
   */
  function initQAOverlay() {
    // Listen for key combination
    document.addEventListener('keydown', handleKeyPress);
    
    // Create overlay element (hidden initially)
    createOverlayElement();
    
    // Log initialization
    console.log('QA Overlay initialized (toggle with Alt+Shift+D)');
  }
  
  /**
   * Handle keypress events to detect the toggle combination
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyPress(event) {
    // Check if the key combination matches
    if (event.altKey === KEY_COMBO.alt && 
        event.shiftKey === KEY_COMBO.shift && 
        event.key.toLowerCase() === KEY_COMBO.key) {
      
      // Toggle overlay visibility
      toggleOverlay();
      
      // Prevent default browser behavior
      event.preventDefault();
    }
  }
  
  /**
   * Toggle overlay visibility
   */
  function toggleOverlay() {
    isOverlayVisible = !isOverlayVisible;
    
    if (isOverlayVisible) {
      showOverlay();
    } else {
      hideOverlay();
    }
  }
  
  /**
   * Create the overlay element
   */
  function createOverlayElement() {
    // Create element if it doesn't exist
    if (!overlayElement) {
      overlayElement = document.createElement('div');
      overlayElement.id = OVERLAY_ID;
      
      // Style the overlay
      Object.assign(overlayElement.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '20px',
        boxSizing: 'border-box',
        zIndex: Z_INDEX,
        overflowY: 'auto',
        display: 'none'
      });
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close Overlay (Alt+Shift+D)';
      closeButton.style.position = 'fixed';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#ff5630';
      closeButton.style.color = '#fff';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', toggleOverlay);
      
      overlayElement.appendChild(closeButton);
      
      // Add to DOM
      document.body.appendChild(overlayElement);
    }
  }
  
  /**
   * Show the overlay and populate with diagnostic information
   */
  function showOverlay() {
    if (!overlayElement) return;
    
    // Update content with current diagnostic information
    updateOverlayContent();
    
    // Show the overlay
    overlayElement.style.display = 'block';
  }
  
  /**
   * Hide the overlay
   */
  function hideOverlay() {
    if (!overlayElement) return;
    
    // Hide the overlay
    overlayElement.style.display = 'none';
  }
  
  /**
   * Update overlay content with diagnostic information
   */
  function updateOverlayContent() {
    if (!overlayElement) return;
    
    // Create content container (replaces existing content except close button)
    const contentContainer = document.createElement('div');
    contentContainer.style.marginTop = '50px';
    
    // Clear existing content
    while (overlayElement.childNodes.length > 1) {
      overlayElement.removeChild(overlayElement.lastChild);
    }
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Client360 Dashboard - QA Diagnostic Overlay';
    title.style.marginBottom = '20px';
    contentContainer.appendChild(title);
    
    // Add dashboard info section
    addDashboardInfoSection(contentContainer);
    
    // Add data source info section
    addDataSourceInfoSection(contentContainer);
    
    // Add component info section
    addComponentInfoSection(contentContainer);
    
    // Add to overlay
    overlayElement.appendChild(contentContainer);
  }
  
  /**
   * Add dashboard general information section
   * @param {HTMLElement} container - Container element
   */
  function addDashboardInfoSection(container) {
    const section = createSection('Dashboard Information');
    
    // Get version info
    const version = window.CLIENT360_VERSION || 'Unknown';
    const buildTime = window.CLIENT360_BUILD_TIME || new Date().toISOString();
    const environment = window.CLIENT360_ENVIRONMENT || 'development';
    
    // Add info table
    const infoTable = [
      ['Version', version],
      ['Build Time', buildTime],
      ['Environment', environment],
      ['User Agent', navigator.userAgent],
      ['Viewport', `${window.innerWidth}x${window.innerHeight}`],
      ['URL', window.location.href],
      ['Timestamp', new Date().toISOString()]
    ];
    
    section.appendChild(createTable(infoTable));
    container.appendChild(section);
  }
  
  /**
   * Add data source information section
   * @param {HTMLElement} container - Container element
   */
  function addDataSourceInfoSection(container) {
    const section = createSection('Data Source Information');
    
    // Get data source info
    const dataSourceElement = document.querySelector('[data-source-toggle]');
    const dataSource = dataSourceElement ? dataSourceElement.getAttribute('data-source') : 'Unknown';
    const isSimulation = dataSource === 'simulation' || false;
    
    // Get last updated info
    const lastUpdatedElement = document.querySelector('[data-last-updated]');
    const lastUpdated = lastUpdatedElement ? lastUpdatedElement.getAttribute('data-last-updated') : 'Unknown';
    
    // Add info table
    const infoTable = [
      ['Data Source', dataSource],
      ['Simulation Mode', String(isSimulation)],
      ['Last Updated', lastUpdated]
    ];
    
    // Add database connection info if available
    if (window.CLIENT360_DB_INFO) {
      const dbInfo = window.CLIENT360_DB_INFO;
      infoTable.push(['DB Host', dbInfo.host || 'Unknown']);
      infoTable.push(['DB Connection', dbInfo.status || 'Unknown']);
      infoTable.push(['Queries Executed', String(dbInfo.queries || 0)]);
      infoTable.push(['Cache Hits', String(dbInfo.cacheHits || 0)]);
    }
    
    section.appendChild(createTable(infoTable));
    container.appendChild(section);
  }
  
  /**
   * Add component information section
   * @param {HTMLElement} container - Container element
   */
  function addComponentInfoSection(container) {
    const section = createSection('Component Information');
    
    // Collect components with data attributes
    const components = [];
    
    // KPI Tiles
    document.querySelectorAll('[data-kpi]').forEach(element => {
      components.push({
        type: 'KPI Tile',
        id: element.getAttribute('data-kpi'),
        value: element.textContent.trim(),
        lastUpdated: element.getAttribute('data-timestamp') || 'Unknown'
      });
    });
    
    // Charts
    document.querySelectorAll('[data-chart]').forEach(element => {
      components.push({
        type: 'Chart',
        id: element.getAttribute('data-chart'),
        dataPoints: element.getAttribute('data-points') || 'Unknown',
        renderTime: element.getAttribute('data-render-time') || 'Unknown'
      });
    });
    
    // Store Map
    const mapElement = document.querySelector('[data-qa="store-map"]');
    if (mapElement) {
      components.push({
        type: 'Store Map',
        storesCount: mapElement.getAttribute('data-stores-count') || 'Unknown',
        mapLoaded: mapElement.querySelector('.leaflet-container') ? 'Yes' : 'No'
      });
    }
    
    // Create component table
    const componentTable = document.createElement('table');
    componentTable.style.width = '100%';
    componentTable.style.borderCollapse = 'collapse';
    componentTable.style.marginTop = '10px';
    
    // Add table header
    const tableHeader = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Type', 'ID/Name', 'Details', 'Status'].forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      th.style.padding = '8px';
      th.style.textAlign = 'left';
      th.style.borderBottom = '1px solid #444';
      headerRow.appendChild(th);
    });
    
    tableHeader.appendChild(headerRow);
    componentTable.appendChild(tableHeader);
    
    // Add table body
    const tableBody = document.createElement('tbody');
    
    components.forEach(component => {
      const row = document.createElement('tr');
      
      // Type cell
      const typeCell = document.createElement('td');
      typeCell.textContent = component.type;
      typeCell.style.padding = '8px';
      typeCell.style.borderBottom = '1px solid #333';
      row.appendChild(typeCell);
      
      // ID cell
      const idCell = document.createElement('td');
      idCell.textContent = component.id || 'N/A';
      idCell.style.padding = '8px';
      idCell.style.borderBottom = '1px solid #333';
      row.appendChild(idCell);
      
      // Details cell
      const detailsCell = document.createElement('td');
      if (component.type === 'KPI Tile') {
        detailsCell.textContent = `Value: ${component.value}`;
      } else if (component.type === 'Chart') {
        detailsCell.textContent = `Data Points: ${component.dataPoints}`;
      } else if (component.type === 'Store Map') {
        detailsCell.textContent = `Stores: ${component.storesCount}`;
      }
      detailsCell.style.padding = '8px';
      detailsCell.style.borderBottom = '1px solid #333';
      row.appendChild(detailsCell);
      
      // Status cell
      const statusCell = document.createElement('td');
      if (component.type === 'KPI Tile') {
        statusCell.textContent = `Updated: ${component.lastUpdated}`;
      } else if (component.type === 'Chart') {
        statusCell.textContent = `Render Time: ${component.renderTime}ms`;
      } else if (component.type === 'Store Map') {
        statusCell.textContent = component.mapLoaded;
      }
      statusCell.style.padding = '8px';
      statusCell.style.borderBottom = '1px solid #333';
      row.appendChild(statusCell);
      
      tableBody.appendChild(row);
    });
    
    componentTable.appendChild(tableBody);
    section.appendChild(componentTable);
    container.appendChild(section);
  }
  
  /**
   * Create a section with heading
   * @param {string} title - Section title
   * @returns {HTMLElement} Section element
   */
  function createSection(title) {
    const section = document.createElement('div');
    section.style.marginBottom = '30px';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.style.borderBottom = '1px solid #666';
    heading.style.paddingBottom = '8px';
    heading.style.marginBottom = '10px';
    
    section.appendChild(heading);
    return section;
  }
  
  /**
   * Create a table from a 2D array of data
   * @param {Array<Array<string>>} data - Table data (rows of key-value pairs)
   * @returns {HTMLElement} Table element
   */
  function createTable(data) {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    data.forEach(([key, value]) => {
      const row = document.createElement('tr');
      
      // Key cell
      const keyCell = document.createElement('td');
      keyCell.textContent = key;
      keyCell.style.padding = '8px';
      keyCell.style.borderBottom = '1px solid #333';
      keyCell.style.fontWeight = 'bold';
      keyCell.style.width = '180px';
      row.appendChild(keyCell);
      
      // Value cell
      const valueCell = document.createElement('td');
      valueCell.textContent = value;
      valueCell.style.padding = '8px';
      valueCell.style.borderBottom = '1px solid #333';
      row.appendChild(valueCell);
      
      table.appendChild(row);
    });
    
    return table;
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQAOverlay);
  } else {
    initQAOverlay();
  }
})();