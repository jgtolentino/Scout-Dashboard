/**
 * Draw.io Diagram Updater for Project Scout Medallion Architecture
 * 
 * This script updates the Project Scout draw.io diagram to:
 * 1. Rename and recolor medallion layers
 * 2. Add orchestration row above the medallions
 * 3. Convert hard-coded text labels to data-driven classes
 * 4. Annotate connectors as batch or stream
 * 
 * Usage: node update_medallion_drawio.js <input-diagram-path> <output-diagram-path>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DOMParser, XMLSerializer } = require('xmldom');

// Configuration
const INPUT_DIAGRAM = process.argv[2] || '/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/docs/diagrams/project_scout_with_genai.drawio';
const OUTPUT_DIAGRAM = process.argv[3] || '/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/docs/diagrams/project_scout_with_genai_updated.drawio';

// Color configuration for medallion layers
const COLORS = {
  RAW_INGEST: '#FFCF00', // amber
  STAGING: '#4B5563',    // slate
  CURATED: '#FFD700',    // gold
  FEATURE_STORE: '#14B8A6', // teal
  DASHBOARD: '#10B981',  // green
};

// Medallion layer updates
const MEDALLION_UPDATES = {
  'bronze_layer': {
    newValue: '🏺 Raw Ingestion',
    newFillColor: COLORS.RAW_INGEST,
    addClass: 'raw-ingest'
  },
  'silver_layer': {
    newValue: '🥈 Staging & Cleansing',
    newFillColor: COLORS.STAGING,
    addClass: 'staging'
  },
  'gold_layer': {
    newValue: '🏆 Curated Business Tables',
    newFillColor: COLORS.CURATED,
    addClass: 'curation'
  },
  'platinum-layer': {
    newValue: '💎 Feature Store & RAG',
    newFillColor: COLORS.FEATURE_STORE,
    addClass: 'feature-store'
  },
  'insights-dashboard': {
    newValue: 'Dashboard & BI',
    newFillColor: COLORS.DASHBOARD,
    addClass: 'dashboard-bi'
  }
};

// Orchestration components to add
const ORCHESTRATION_COMPONENTS = [
  {
    id: 'orchestration_layer',
    value: '⚙️ Data Orchestration',
    style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;align=left;verticalAlign=top;fontStyle=1;class=orchestration;',
    x: 100,
    y: 50,
    width: 700,
    height: 80
  },
  {
    id: 'data_factory',
    value: 'Azure Data Factory',
    style: 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#0078d4;strokeColor=#0078d4;fontColor=#FFFFFF;fontSize=10;',
    x: 150,
    y: 60,
    width: 130,
    height: 50
  },
  {
    id: 'event_hubs',
    value: 'Azure Event Hubs',
    style: 'shape=rhombus;perimeter=rhombusPerimeter;whiteSpace=wrap;html=1;align=center;fillColor=#5ea0ef;strokeColor=#0078d4;fontColor=#FFFFFF;fontSize=10;',
    x: 350,
    y: 60,
    width: 130,
    height: 50
  },
  {
    id: 'blob_storage',
    value: 'Azure Blob Storage',
    style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#0078d4;strokeColor=#0078d4;fontColor=#FFFFFF;fontSize=10;',
    x: 550,
    y: 60,
    width: 130,
    height: 50
  }
];

// Connections between orchestration and medallion layers
const ORCHESTRATION_CONNECTIONS = [
  {
    id: 'data_factory_to_bronze',
    source: 'data_factory',
    target: 'bronze_layer',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=1;entryX=0.2;entryY=0;class=batch-connector;',
    value: 'batch'
  },
  {
    id: 'event_hubs_to_bronze',
    source: 'event_hubs',
    target: 'bronze_layer',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=1;entryX=0.5;entryY=0;class=stream-connector;dashed=1;',
    value: 'stream'
  },
  {
    id: 'blob_storage_to_bronze',
    source: 'blob_storage',
    target: 'bronze_layer',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=1;entryX=0.7;entryY=0;class=batch-connector;',
    value: 'batch'
  }
];

// Process and update the diagram
function updateDiagram() {
  try {
    console.log(`Reading diagram from: ${INPUT_DIAGRAM}`);
    const diagramXml = fs.readFileSync(INPUT_DIAGRAM, 'utf-8');
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(diagramXml, 'text/xml');
    
    // Find the main graph/model element
    const models = xmlDoc.getElementsByTagName('mxGraphModel');
    if (models.length === 0) {
      throw new Error('No mxGraphModel found in the diagram');
    }
    
    const model = models[0];
    const root = model.getElementsByTagName('root')[0];
    
    if (!root) {
      throw new Error('No root element found in the diagram');
    }
    
    // Step 1: Update medallion layer names and colors
    const cells = root.getElementsByTagName('mxCell');
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id');
      
      if (MEDALLION_UPDATES[id]) {
        const update = MEDALLION_UPDATES[id];
        
        // Update cell value (name)
        cell.setAttribute('value', update.newValue);
        
        // Update color in style
        let style = cell.getAttribute('style');
        
        // Replace fillColor
        style = style.replace(/fillColor=#[^;]+/, `fillColor=${update.newFillColor}33`);
        style = style.replace(/strokeColor=#[^;]+/, `strokeColor=${update.newFillColor}`);
        
        // Add class
        if (update.addClass && !style.includes('class=')) {
          style += `;class=${update.addClass}`;
        } else if (update.addClass) {
          style = style.replace(/class=[^;]+/, `class=${update.addClass}`);
        }
        
        cell.setAttribute('style', style);
        
        console.log(`Updated medallion layer: ${id} -> ${update.newValue}`);
      }
    }
    
    // Step 2: Add orchestration row
    let nextId = findMaxId(cells) + 1;
    
    // Add orchestration components
    for (const component of ORCHESTRATION_COMPONENTS) {
      const cell = xmlDoc.createElement('mxCell');
      cell.setAttribute('id', component.id);
      cell.setAttribute('value', component.value);
      cell.setAttribute('style', component.style);
      cell.setAttribute('vertex', '1');
      cell.setAttribute('parent', '1');
      
      const geometry = xmlDoc.createElement('mxGeometry');
      geometry.setAttribute('x', component.x);
      geometry.setAttribute('y', component.y);
      geometry.setAttribute('width', component.width);
      geometry.setAttribute('height', component.height);
      geometry.setAttribute('as', 'geometry');
      
      cell.appendChild(geometry);
      root.appendChild(cell);
      
      console.log(`Added orchestration component: ${component.value}`);
      nextId++;
    }
    
    // Step 3: Connect orchestration to medallion layers
    for (const connection of ORCHESTRATION_CONNECTIONS) {
      const cell = xmlDoc.createElement('mxCell');
      cell.setAttribute('id', connection.id);
      cell.setAttribute('value', connection.value);
      cell.setAttribute('style', connection.style);
      cell.setAttribute('edge', '1');
      cell.setAttribute('parent', '1');
      cell.setAttribute('source', connection.source);
      cell.setAttribute('target', connection.target);
      
      const geometry = xmlDoc.createElement('mxGeometry');
      geometry.setAttribute('relative', '1');
      geometry.setAttribute('as', 'geometry');
      
      cell.appendChild(geometry);
      root.appendChild(cell);
      
      console.log(`Added connection from ${connection.source} to ${connection.target}`);
      nextId++;
    }
    
    // Step 4: Add CSS style definitions for data-driven classes
    const styleSheet = xmlDoc.createElement('mxStylesheet');
    styleSheet.setAttribute('id', 'medallion-styles');
    
    const styleElement = xmlDoc.createElement('mxCellStyle');
    styleElement.setAttribute('for', 'raw-ingest staging curation feature-store dashboard-bi orchestration batch-connector stream-connector');
    styleElement.setAttribute('styles', 
      `raw-ingest=fillColor=${COLORS.RAW_INGEST}33;strokeColor=${COLORS.RAW_INGEST};
      staging=fillColor=${COLORS.STAGING}33;strokeColor=${COLORS.STAGING};
      curation=fillColor=${COLORS.CURATED}33;strokeColor=${COLORS.CURATED};
      feature-store=fillColor=${COLORS.FEATURE_STORE}33;strokeColor=${COLORS.FEATURE_STORE};
      dashboard-bi=fillColor=${COLORS.DASHBOARD}33;strokeColor=${COLORS.DASHBOARD};
      orchestration=fillColor=#dae8fc;strokeColor=#6c8ebf;
      batch-connector=strokeWidth=2;
      stream-connector=strokeWidth=2;strokeDasharray=3 3;`);
    
    styleSheet.appendChild(styleElement);
    
    // Add the stylesheet if it doesn't exist
    const diagrams = xmlDoc.getElementsByTagName('diagram');
    if (diagrams.length > 0) {
      const diagram = diagrams[0];
      let existingStylesheet = false;
      
      for (let i = 0; i < diagram.childNodes.length; i++) {
        if (diagram.childNodes[i].nodeName === 'mxStylesheet') {
          existingStylesheet = true;
          break;
        }
      }
      
      if (!existingStylesheet) {
        diagram.appendChild(styleSheet);
        console.log('Added stylesheet for data-driven classes');
      }
    }
    
    // Serialize the updated XML
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    
    // Write the updated diagram
    fs.writeFileSync(OUTPUT_DIAGRAM, updatedXml);
    console.log(`Updated diagram saved to: ${OUTPUT_DIAGRAM}`);
    
    return true;
    
  } catch (error) {
    console.error(`Error updating diagram: ${error.message}`);
    return false;
  }
}

// Helper function to find max ID
function findMaxId(cells) {
  let maxId = 0;
  for (let i = 0; i < cells.length; i++) {
    const id = parseInt(cells[i].getAttribute('id'));
    if (!isNaN(id) && id > maxId) {
      maxId = id;
    }
  }
  return maxId;
}

// Main execution
console.log('Starting medallion diagram update...');
const success = updateDiagram();

if (success) {
  console.log('Diagram update completed successfully!');
  
  // Try to export SVG/PNG if we have the right tools
  try {
    console.log('Attempting to export diagram...');
    if (process.platform === 'darwin') {
      try {
        execSync(`which drawio`);
        console.log('Found drawio CLI, exporting...');
        
        const svgPath = OUTPUT_DIAGRAM.replace('.drawio', '.svg');
        const pngPath = OUTPUT_DIAGRAM.replace('.drawio', '.png');
        
        execSync(`drawio --export --format svg --output "${svgPath}" "${OUTPUT_DIAGRAM}"`);
        execSync(`drawio --export --format png --output "${pngPath}" "${OUTPUT_DIAGRAM}"`);
        
        console.log(`Exported to SVG: ${svgPath}`);
        console.log(`Exported to PNG: ${pngPath}`);
      } catch (error) {
        console.log('drawio CLI not found. Unable to export automatically.');
        console.log('To export manually, open the diagram in draw.io and use File > Export');
      }
    }
  } catch (error) {
    console.log(`Error during export: ${error.message}`);
  }
  
  process.exit(0);
} else {
  console.error('Diagram update failed!');
  process.exit(1);
}