/**
 * Draw.io Diagram Updater for GenAI Insights Integration
 * 
 * This script updates the Project Scout draw.io diagram 
 * to include GenAI insights components.
 * 
 * Usage: node update_drawio.js <input-diagram-path> <output-diagram-path>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DOMParser, XMLSerializer } = require('xmldom');

// Configuration
const INPUT_DIAGRAM = process.argv[2] || '/Users/tbwa/Downloads/Worked_project_scout_official_icons.drawio';
const OUTPUT_DIAGRAM = process.argv[3] || '/Users/tbwa/Downloads/Updated_project_scout_with_genai.drawio';

// GenAI Components to add
const COMPONENTS = {
  PLATINUM_LAYER: {
    id: 'platinum-layer',
    value: 'Platinum Layer',
    description: 'AI-driven insights & analysis layer',
    style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#FF9F78;strokeColor=#6c8ebf;shadow=1;',
    x: 700,
    y: 170,
    width: 140,
    height: 60
  },
  
  GENAI_INSIGHTS_COMPONENT: {
    id: 'genai-insights',
    value: 'GenAI Insights',
    description: 'LLM-powered insights generation',
    style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFCC99;strokeColor=#6c8ebf;dashed=1;',
    x: 700,
    y: 280,
    width: 140,
    height: 60
  },
  
  INSIGHTS_DB: {
    id: 'insights-db',
    value: 'Insights DB',
    description: 'Storage for generated insights',
    style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#f8cecc;strokeColor=#b85450;',
    x: 860,
    y: 280,
    width: 80,
    height: 60
  },
  
  INSIGHTS_DASHBOARD: {
    id: 'insights-dashboard',
    value: 'Insights Dashboard',
    description: 'Visualization of generated insights',
    style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFCC99;strokeColor=#6c8ebf;',
    x: 700,
    y: 390,
    width: 140,
    height: 60
  }
};

// Arrows to connect components
const CONNECTIONS = [
  {
    from: 'gold-layer', // Expected existing node ID
    to: 'platinum-layer',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;entryX=0;entryY=0.5;',
    value: 'Data Flow'
  },
  {
    from: 'platinum-layer',
    to: 'genai-insights',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=1;entryX=0.5;entryY=0;',
    value: ''
  },
  {
    from: 'genai-insights',
    to: 'insights-db',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.5;entryX=0;entryY=0.5;',
    value: 'Store'
  },
  {
    from: 'genai-insights',
    to: 'insights-dashboard',
    style: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=1;entryX=0.5;entryY=0;',
    value: 'Visualize'
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
    
    // Find the last cell ID to ensure new cells have unique IDs
    let maxId = 0;
    const cells = root.getElementsByTagName('mxCell');
    for (let i = 0; i < cells.length; i++) {
      const id = parseInt(cells[i].getAttribute('id'));
      if (!isNaN(id) && id > maxId) {
        maxId = id;
      }
    }
    
    console.log(`Found ${cells.length} existing cells, max ID: ${maxId}`);
    
    // Add new components
    let nextId = maxId + 1;
    const addedCells = {};
    
    // Add component nodes
    for (const [key, component] of Object.entries(COMPONENTS)) {
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
      
      addedCells[component.id] = nextId++;
      console.log(`Added component: ${component.value} (ID: ${component.id})`);
    }
    
    // Add connections between nodes
    for (const connection of CONNECTIONS) {
      const cell = xmlDoc.createElement('mxCell');
      const edgeId = `edge-${nextId}`;
      cell.setAttribute('id', edgeId);
      cell.setAttribute('value', connection.value);
      cell.setAttribute('style', connection.style);
      cell.setAttribute('edge', '1');
      cell.setAttribute('parent', '1');
      cell.setAttribute('source', connection.from);
      cell.setAttribute('target', connection.to);
      
      const geometry = xmlDoc.createElement('mxGeometry');
      geometry.setAttribute('relative', '1');
      geometry.setAttribute('as', 'geometry');
      
      cell.appendChild(geometry);
      root.appendChild(cell);
      
      nextId++;
      console.log(`Added connection from ${connection.from} to ${connection.to}`);
    }
    
    // Serialize the updated XML
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    
    // Write the updated diagram
    fs.writeFileSync(OUTPUT_DIAGRAM, updatedXml);
    console.log(`Updated diagram saved to: ${OUTPUT_DIAGRAM}`);
    
    // Try to open the updated diagram
    try {
      console.log('Attempting to open the updated diagram...');
      if (process.platform === 'darwin') {
        execSync(`open "${OUTPUT_DIAGRAM}"`);
      } else if (process.platform === 'win32') {
        execSync(`start "" "${OUTPUT_DIAGRAM}"`);
      } else {
        execSync(`xdg-open "${OUTPUT_DIAGRAM}"`);
      }
    } catch (error) {
      console.log(`Could not automatically open the diagram: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`Error updating diagram: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
console.log('Starting draw.io diagram update for GenAI Insights integration...');
updateDiagram();