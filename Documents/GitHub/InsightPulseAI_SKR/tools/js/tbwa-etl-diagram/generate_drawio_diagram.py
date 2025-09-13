#!/usr/bin/env python3
"""
Project Scout Medallion Architecture - draw.io Generator
Generates a diagram in draw.io XML format showing a three-layer medallion architecture.
"""

import xml.etree.ElementTree as ET
import base64
import math
import uuid
import sys
from datetime import datetime

# Configuration
DIAGRAM_NAME = "Project Scout - Medallion Architecture"
DIAGRAM_WIDTH = 1400
DIAGRAM_HEIGHT = 800

# Colors
BRONZE_COLOR = "#EFDABC"  # Light bronze
SILVER_COLOR = "#E6E8E9"  # Light silver
GOLD_COLOR = "#FAF1D1"    # Light gold
BORDER_COLOR = "#D1D5DB"  # Light gray
TEXT_COLOR = "#333333"    # Dark gray
CONNECTOR_COLOR = "#6B7280"  # Medium gray
WHITE = "#FFFFFF"

# Styles
SWIMLANE_STYLE = f"shape=swimlane;startSize=30;whiteSpace=wrap;html=1;fillColor={{color}};strokeColor={BORDER_COLOR};fontColor={TEXT_COLOR};fontSize=12;fontStyle=1;align=left;"
COMPONENT_STYLE = f"shape=image;aspect=fixed;image=data:image/svg+xml,{{icon}};labelPosition=center;verticalLabelPosition=bottom;verticalAlign=top;whiteSpace=wrap;html=1;fontSize=12;fontColor={TEXT_COLOR};fillColor={WHITE};strokeColor={BORDER_COLOR};"
CONNECTOR_STYLE = f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;exitX=1;exitY=0.5;entryX=0;entryY=0.5;endArrow=classic;strokeColor={CONNECTOR_COLOR};strokeWidth=2;fontSize=10;fontColor={CONNECTOR_COLOR};"
DASHED_CONNECTOR_STYLE = f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;exitX=0.5;exitY=1;entryX=0.5;entryY=0;endArrow=classic;strokeColor={CONNECTOR_COLOR};strokeWidth=2;fontSize=10;fontColor={CONNECTOR_COLOR};dashed=1;"
VERTICAL_CONNECTOR_STYLE = f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;exitX=0.5;exitY=1;entryX=0.5;entryY=0;endArrow=classic;strokeColor={CONNECTOR_COLOR};strokeWidth=2;fontSize=10;fontColor={CONNECTOR_COLOR};"
FOLDER_STYLE = f"shape=mxgraph.azure.file;fillColor={WHITE};strokeColor={CONNECTOR_COLOR};dashed=1;fontColor={TEXT_COLOR};fontSize=12;"

# Azure icons - Base64 encoded SVG (minimal placeholders for this script)
AZURE_DATA_FACTORY = base64.b64encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="#0078D4" d="M0 0h18v18H0z"/><path fill="#FFF" d="M9 4l5 5-5 5-5-5 5-5z"/></svg>'.encode()).decode()
AZURE_DATA_LAKE = base64.b64encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="#0078D4" d="M0 0h18v18H0z"/><path fill="#FFF" d="M9 2l7 14H2L9 2z"/></svg>'.encode()).decode()
AZURE_DATABRICKS = base64.b64encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="#FF3621" d="M0 0h18v18H0z"/><path fill="#FFF" d="M9 2l4 7-4 7-4-7 4-7z"/></svg>'.encode()).decode()
AZURE_SQL = base64.b64encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="#0078D4" d="M0 0h18v18H0z"/><path fill="#FFF" d="M9 3c3 0 5 1 5 2v8c0 1-2 2-5 2s-5-1-5-2V5c0-1 2-2 5-2z"/></svg>'.encode()).decode()
AZURE_COGNITIVE_SEARCH = base64.b64encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="#0078D4" d="M0 0h18v18H0z"/><path fill="#FFF" d="M11 7c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2zM6 6l1 6H5L4 6h2z"/></svg>'.encode()).decode()
AZURE_POWER_BI = base64.b64encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"><path fill="#F2C811" d="M0 0h18v18H0z"/><path fill="#FFF" d="M5 8h2v6H5V8zm3-2h2v8H8V6zm3-3h2v11h-2V3z"/></svg>'.encode()).decode()

def create_drawio_diagram():
    """Create the draw.io diagram as an XML structure."""
    # Create diagram root
    root = ET.Element("mxfile", {
        "host": "app.diagrams.net",
        "modified": datetime.now().isoformat(),
        "agent": "Python Script",
        "version": "14.6.13",
        "type": "device"
    })
    
    diagram = ET.SubElement(root, "diagram", {
        "id": str(uuid.uuid4()),
        "name": DIAGRAM_NAME
    })
    
    mx_graph_model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1422",
        "dy": "798",
        "grid": "1",
        "gridSize": "10",
        "guides": "1",
        "tooltips": "1",
        "connect": "1",
        "arrows": "1",
        "fold": "1",
        "page": "1",
        "pageScale": "1",
        "pageWidth": str(DIAGRAM_WIDTH),
        "pageHeight": str(DIAGRAM_HEIGHT),
        "math": "0",
        "shadow": "0"
    })
    
    root_element = ET.SubElement(mx_graph_model, "root")
    cell1 = ET.SubElement(root_element, "mxCell", {"id": "0"})
    cell2 = ET.SubElement(root_element, "mxCell", {"id": "1", "parent": "0"})
    
    # Add swimlanes
    swimlane_width = 1200
    swimlane_height = 160
    swimlane_x = 120
    swimlane_y = 80
    
    bronze_swimlane = ET.SubElement(root_element, "mxCell", {
        "id": "bronze_swimlane",
        "value": "Bronze Layer (Raw Data)",
        "style": SWIMLANE_STYLE.format(color=BRONZE_COLOR),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(bronze_swimlane, "mxGeometry", {
        "x": str(swimlane_x),
        "y": str(swimlane_y),
        "width": str(swimlane_width),
        "height": str(swimlane_height),
        "as": "geometry"
    })
    
    silver_swimlane = ET.SubElement(root_element, "mxCell", {
        "id": "silver_swimlane",
        "value": "Silver Layer (Processed Data)",
        "style": SWIMLANE_STYLE.format(color=SILVER_COLOR),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(silver_swimlane, "mxGeometry", {
        "x": str(swimlane_x),
        "y": str(swimlane_y + swimlane_height + 40),
        "width": str(swimlane_width),
        "height": str(swimlane_height),
        "as": "geometry"
    })
    
    gold_swimlane = ET.SubElement(root_element, "mxCell", {
        "id": "gold_swimlane",
        "value": "Gold Layer (Analytics Ready)",
        "style": SWIMLANE_STYLE.format(color=GOLD_COLOR),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(gold_swimlane, "mxGeometry", {
        "x": str(swimlane_x),
        "y": str(swimlane_y + 2 * (swimlane_height + 40)),
        "width": str(swimlane_width),
        "height": str(swimlane_height),
        "as": "geometry"
    })
    
    # Add Bronze Layer components
    icon_width = 60
    icon_height = 60
    
    bronze_x = swimlane_x + 100
    bronze_y = swimlane_y + 60
    
    data_factory = ET.SubElement(root_element, "mxCell", {
        "id": "data_factory",
        "value": "Data Ingestion",
        "style": COMPONENT_STYLE.format(icon=AZURE_DATA_FACTORY),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(data_factory, "mxGeometry", {
        "x": str(bronze_x),
        "y": str(bronze_y),
        "width": str(icon_width),
        "height": str(icon_height),
        "as": "geometry"
    })
    
    data_lake = ET.SubElement(root_element, "mxCell", {
        "id": "data_lake",
        "value": "Raw Transcript Store",
        "style": COMPONENT_STYLE.format(icon=AZURE_DATA_LAKE),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(data_lake, "mxGeometry", {
        "x": str(bronze_x + 250),
        "y": str(bronze_y),
        "width": str(icon_width),
        "height": str(icon_height),
        "as": "geometry"
    })
    
    # Bronze connector
    ingest_connector = ET.SubElement(root_element, "mxCell", {
        "id": "ingest_connector",
        "value": "Ingest",
        "style": CONNECTOR_STYLE,
        "edge": "1",
        "parent": "1",
        "source": "data_factory",
        "target": "data_lake"
    })
    ET.SubElement(ingest_connector, "mxGeometry", {
        "relative": "1",
        "as": "geometry"
    })
    
    # Add Silver Layer components
    silver_x = bronze_x
    silver_y = swimlane_y + swimlane_height + 100
    
    databricks = ET.SubElement(root_element, "mxCell", {
        "id": "databricks",
        "value": "Data Cleaning & Chunking",
        "style": COMPONENT_STYLE.format(icon=AZURE_DATABRICKS),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(databricks, "mxGeometry", {
        "x": str(silver_x),
        "y": str(silver_y),
        "width": str(icon_width),
        "height": str(icon_height),
        "as": "geometry"
    })
    
    sql_database = ET.SubElement(root_element, "mxCell", {
        "id": "sql_database",
        "value": "Processed Storage",
        "style": COMPONENT_STYLE.format(icon=AZURE_SQL),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(sql_database, "mxGeometry", {
        "x": str(silver_x + 250),
        "y": str(silver_y),
        "width": str(icon_width),
        "height": str(icon_height),
        "as": "geometry"
    })
    
    # Silver layer internal connector
    store_connector = ET.SubElement(root_element, "mxCell", {
        "id": "store_connector",
        "value": "Store",
        "style": CONNECTOR_STYLE,
        "edge": "1",
        "parent": "1",
        "source": "databricks",
        "target": "sql_database"
    })
    ET.SubElement(store_connector, "mxGeometry", {
        "relative": "1",
        "as": "geometry"
    })
    
    # Audit Log in Silver layer
    audit_log = ET.SubElement(root_element, "mxCell", {
        "id": "audit_log",
        "value": "Audit Log",
        "style": FOLDER_STYLE,
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(audit_log, "mxGeometry", {
        "x": str(silver_x + 250),
        "y": str(silver_y + 100),
        "width": str(icon_width),
        "height": str(icon_height * 0.7),
        "as": "geometry"
    })
    
    # Audit connector
    audit_connector = ET.SubElement(root_element, "mxCell", {
        "id": "audit_connector",
        "value": "",
        "style": DASHED_CONNECTOR_STYLE,
        "edge": "1",
        "parent": "1",
        "source": "sql_database",
        "target": "audit_log"
    })
    ET.SubElement(audit_connector, "mxGeometry", {
        "relative": "1",
        "as": "geometry"
    })
    
    # Add Gold Layer components
    gold_x = bronze_x
    gold_y = swimlane_y + 2 * swimlane_height + 140
    
    cognitive_search = ET.SubElement(root_element, "mxCell", {
        "id": "cognitive_search",
        "value": "Embedding Store",
        "style": COMPONENT_STYLE.format(icon=AZURE_COGNITIVE_SEARCH),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(cognitive_search, "mxGeometry", {
        "x": str(gold_x),
        "y": str(gold_y),
        "width": str(icon_width),
        "height": str(icon_height),
        "as": "geometry"
    })
    
    power_bi = ET.SubElement(root_element, "mxCell", {
        "id": "power_bi",
        "value": "Dashboard",
        "style": COMPONENT_STYLE.format(icon=AZURE_POWER_BI),
        "vertex": "1",
        "parent": "1"
    })
    ET.SubElement(power_bi, "mxGeometry", {
        "x": str(gold_x + 250),
        "y": str(gold_y),
        "width": str(icon_width),
        "height": str(icon_height),
        "as": "geometry"
    })
    
    # Gold layer connector
    serve_connector = ET.SubElement(root_element, "mxCell", {
        "id": "serve_connector",
        "value": "Serve",
        "style": CONNECTOR_STYLE,
        "edge": "1",
        "parent": "1",
        "source": "cognitive_search",
        "target": "power_bi"
    })
    ET.SubElement(serve_connector, "mxGeometry", {
        "relative": "1",
        "as": "geometry"
    })
    
    # Vertical Connectors
    # Bronze to Silver (Data Lake to Databricks)
    transform_connector = ET.SubElement(root_element, "mxCell", {
        "id": "transform_connector",
        "value": "Transform",
        "style": VERTICAL_CONNECTOR_STYLE,
        "edge": "1",
        "parent": "1",
        "source": "data_lake",
        "target": "databricks"
    })
    ET.SubElement(transform_connector, "mxGeometry", {
        "relative": "1",
        "as": "geometry",
        "points": [
            {"x": str(bronze_x + 280), "y": str(bronze_y + 100)},
            {"x": str(silver_x + 30), "y": str(silver_y - 30)}
        ]
    })
    
    # Silver to Gold (SQL DB to Cognitive Search)
    embed_connector = ET.SubElement(root_element, "mxCell", {
        "id": "embed_connector",
        "value": "Embed",
        "style": VERTICAL_CONNECTOR_STYLE,
        "edge": "1",
        "parent": "1",
        "source": "sql_database",
        "target": "cognitive_search"
    })
    ET.SubElement(embed_connector, "mxGeometry", {
        "relative": "1",
        "as": "geometry",
        "points": [
            {"x": str(silver_x + 280), "y": str(silver_y + 80)},
            {"x": str(gold_x + 30), "y": str(gold_y - 30)}
        ]
    })
    
    # Convert to string
    xml_string = ET.tostring(root, encoding='utf-8')
    return xml_string

def save_diagram(xml_data, filename='project_scout_medallion.drawio'):
    """Save the XML data to a .drawio file."""
    with open(filename, 'wb') as f:
        f.write(xml_data)
    print(f"Diagram saved to {filename}")

if __name__ == "__main__":
    # Default filename
    output_file = "project_scout_medallion.drawio"
    
    # Check if filename provided via command line
    if len(sys.argv) > 1:
        output_file = sys.argv[1]
    
    # Generate and save the diagram
    diagram_xml = create_drawio_diagram()
    save_diagram(diagram_xml, output_file)
    print("Done!")