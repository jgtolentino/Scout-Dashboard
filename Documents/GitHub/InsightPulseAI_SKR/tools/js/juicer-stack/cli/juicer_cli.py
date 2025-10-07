#!/usr/bin/env python3
"""
Juicer CLI - Command-line interface for Databricks-Pulser integration
Enables seamless AI-BI functionality with InsightPulseAI

Author: InsightPulseAI Team
Version: 1.0
"""

import argparse
import json
import os
import sys
import requests
from datetime import datetime
import time
import textwrap
import re

# Ensure compatibility with Python 3.6+
from typing import Dict, List, Any, Optional, Union
from rich.console import Console
from rich.table import Table
from rich.syntax import Syntax
from rich.panel import Panel
from rich import box
from rich.progress import Progress, SpinnerColumn, TextColumn

# Constants
CONFIG_FILE = os.path.expanduser("~/.pulser/juicer_config.json")
DEFAULT_CONFIG = {
    "workspace_url": "https://adb-123456789.0.azuredatabricks.net",
    "api_token": "",
    "default_cluster_id": "",
    "notebooks_path": "/juicer",
    "local_api_url": "http://localhost:3001/api"
}

# Initialize rich console
console = Console()

def load_config():
    """Load configuration from file or create default"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            console.print(f"[yellow]Warning: Error loading config file: {e}[/]")
            console.print("[yellow]Using default configuration[/]")
            return DEFAULT_CONFIG
    else:
        console.print("[yellow]No configuration file found. Using default settings.[/]")
        console.print(f"[yellow]Configuration file will be created at: {CONFIG_FILE}[/]")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        
        # Save default config
        with open(CONFIG_FILE, 'w') as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        
        return DEFAULT_CONFIG

def save_config(config):
    """Save configuration to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        console.print(f"[green]Configuration saved to {CONFIG_FILE}[/]")
        return True
    except Exception as e:
        console.print(f"[red]Error saving configuration: {e}[/]")
        return False

def execute_query(sql, options=None):
    """Execute a SQL query via local API proxy"""
    try:
        config = load_config()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]Executing query..."),
            transient=True,
        ) as progress:
            progress.add_task("", total=None)
            
            # Call local API endpoint
            response = requests.post(
                f"{config['local_api_url']}/command",
                json={
                    "command": "juicer",
                    "args": {
                        "action": "query",
                        "sql": sql,
                        "options": options or {},
                        "visualize": True
                    }
                },
                timeout=120
            )
            
            if response.status_code != 200:
                console.print(f"[red]Error: HTTP {response.status_code}[/]")
                console.print(f"[red]{response.text}[/]")
                return None
            
            result = response.json()
            
            if not result.get("success", False):
                console.print(f"[red]Error: {result.get('message', 'Unknown error')}[/]")
                return None
            
            return result["data"]
    
    except Exception as e:
        console.print(f"[red]Error executing query: {e}[/]")
        return None

def run_notebook(path, params=None):
    """Run a Databricks notebook via local API proxy"""
    try:
        config = load_config()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]Running notebook..."),
            transient=True,
        ) as progress:
            progress.add_task("", total=None)
            
            # Call local API endpoint
            response = requests.post(
                f"{config['local_api_url']}/command",
                json={
                    "command": "juicer",
                    "args": {
                        "action": "notebook",
                        "path": path,
                        "params": params or {}
                    }
                },
                timeout=300
            )
            
            if response.status_code != 200:
                console.print(f"[red]Error: HTTP {response.status_code}[/]")
                console.print(f"[red]{response.text}[/]")
                return None
            
            result = response.json()
            
            if not result.get("success", False):
                console.print(f"[red]Error: {result.get('message', 'Unknown error')}[/]")
                return None
            
            return result["data"]
    
    except Exception as e:
        console.print(f"[red]Error running notebook: {e}[/]")
        return None

def generate_visualization(data):
    """Generate a visualization from data"""
    try:
        config = load_config()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]Generating visualization..."),
            transient=True,
        ) as progress:
            progress.add_task("", total=None)
            
            # Call local API endpoint
            response = requests.post(
                f"{config['local_api_url']}/command",
                json={
                    "command": "juicer",
                    "args": {
                        "action": "visualize",
                        "data": data
                    }
                },
                timeout=60
            )
            
            if response.status_code != 200:
                console.print(f"[red]Error: HTTP {response.status_code}[/]")
                console.print(f"[red]{response.text}[/]")
                return None
            
            result = response.json()
            
            if not result.get("success", False):
                console.print(f"[red]Error: {result.get('message', 'Unknown error')}[/]")
                return None
            
            return result["data"]
    
    except Exception as e:
        console.print(f"[red]Error generating visualization: {e}[/]")
        return None

def display_query_results(result):
    """Display query results in a formatted table"""
    if not result or "data" not in result:
        console.print("[red]No data returned[/]")
        return
    
    data = result["data"]
    
    if not data or not isinstance(data, list) or len(data) == 0:
        console.print("[yellow]Query returned 0 rows[/]")
        return
    
    # Create table
    table = Table(box=box.MINIMAL_HEAVY_HEAD)
    
    # Add columns
    sample_row = data[0]
    for key in sample_row.keys():
        table.add_column(key, style="cyan")
    
    # Add rows
    for row in data:
        values = []
        for key in sample_row.keys():
            value = row.get(key, "")
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            values.append(str(value))
        table.add_row(*values)
    
    # Print table
    console.print(f"\n[bold green]Results: {len(data)} rows[/]")
    console.print(table)
    
    # Check for visualization
    if "visualization" in result and result["visualization"].get("success", False):
        viz_id = result["visualization"]["jobId"]
        viz_url = result["visualization"]["statusUrl"].replace("/api/", "/")
        console.print(f"\n[bold green]Visualization generated:[/] {viz_url}")
        console.print(f"[green]Visualization ID:[/] {viz_id}")

def wait_for_visualization(viz_result):
    """Poll for visualization status and display when ready"""
    if not viz_result or not viz_result.get("success", False):
        console.print("[red]No visualization result available[/]")
        return
    
    job_id = viz_result.get("jobId")
    status_url = viz_result.get("statusUrl")
    
    if not job_id or not status_url:
        console.print("[red]Invalid visualization result[/]")
        return
    
    config = load_config()
    full_status_url = f"{config['local_api_url']}{status_url.replace('/api/', '/')}"
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]Waiting for visualization..."),
        transient=True,
    ) as progress:
        task = progress.add_task("", total=None)
        
        # Poll for status
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                response = requests.get(full_status_url)
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success", False) and result.get("data", {}).get("status") == "completed":
                        break
                
                # Wait before next attempt
                time.sleep(1)
            
            except Exception:
                time.sleep(1)
        
        # Check if visualization is ready
        try:
            response = requests.get(f"{config['local_api_url']}/sketch_generate/preview/{job_id}")
            if response.status_code == 200:
                result = response.json()
                if result.get("success", False) and "data" in result:
                    svg_content = result["data"].get("svgContent", "")
                    if svg_content:
                        # Save SVG to temp file
                        temp_file = f"/tmp/juicer_viz_{job_id}.svg"
                        with open(temp_file, "w") as f:
                            f.write(svg_content)
                        
                        console.print(f"\n[bold green]Visualization saved to:[/] {temp_file}")
                        console.print("[yellow]Use a browser or SVG viewer to view the visualization[/]")
                    else:
                        console.print("[yellow]Visualization generated but no SVG content available[/]")
                else:
                    console.print("[yellow]Visualization preview not available[/]")
            else:
                console.print("[yellow]Unable to retrieve visualization preview[/]")
        
        except Exception as e:
            console.print(f"[yellow]Error retrieving visualization: {e}[/]")

def handle_natural_language_query(query):
    """Process natural language query and convert to SQL"""
    # In a production environment, this would use AI to convert natural language to SQL
    # For now, we'll use a simple keyword-based approach
    
    query_lower = query.lower()
    
    # Define some simple patterns
    brand_pattern = re.compile(r'brand(?:s)?\s+(?:mention(?:s|ed)?)?.*?(jollibee|mcdonalds|kfc|burger\s+king|wendy\'?s|taco\s+bell|pizza\s+hut)', re.IGNORECASE)
    time_pattern = re.compile(r'(last|past|previous)\s+(\d+)\s+(day|week|month|year)s?', re.IGNORECASE)
    
    # Extract brand if mentioned
    brand_match = brand_pattern.search(query_lower)
    brand = brand_match.group(1) if brand_match else None
    
    # Extract time period if mentioned
    time_match = time_pattern.search(query_lower)
    time_amount = int(time_match.group(2)) if time_match else 7
    time_unit = time_match.group(3) if time_match else "day"
    
    # Build appropriate SQL based on query content
    if "sentiment" in query_lower or "feeling" in query_lower:
        if brand:
            sql = f"""
            SELECT 
              entity_normalized AS brand, 
              COUNT(*) AS mention_count,
              ROUND(AVG(sentiment_score) * 100, 1) AS avg_sentiment_pct
            FROM 
              insight_pulse_ai.silver.transcript_entity_mentions
            WHERE 
              entity_type = 'BRAND'
              AND entity_normalized LIKE '%{brand}%'
              AND detection_timestamp >= CURRENT_DATE - INTERVAL {time_amount} {time_unit}
            GROUP BY 
              brand
            ORDER BY 
              mention_count DESC
            """
        else:
            sql = f"""
            SELECT 
              entity_normalized AS brand, 
              COUNT(*) AS mention_count,
              ROUND(AVG(sentiment_score) * 100, 1) AS avg_sentiment_pct
            FROM 
              insight_pulse_ai.silver.transcript_entity_mentions
            WHERE 
              entity_type = 'BRAND'
              AND detection_timestamp >= CURRENT_DATE - INTERVAL {time_amount} {time_unit}
            GROUP BY 
              brand
            ORDER BY 
              avg_sentiment_pct DESC
            LIMIT 10
            """
    elif "agent" in query_lower or "performance" in query_lower:
        sql = f"""
        WITH agent_brands AS (
          SELECT 
            a.agent_id,
            b.entity_normalized AS brand, 
            COUNT(*) AS mention_count,
            AVG(b.sentiment_score) AS avg_sentiment
          FROM 
            insight_pulse_ai.silver.transcripts a
            JOIN insight_pulse_ai.silver.transcript_entity_mentions b ON a.transcript_id = b.transcript_id
          WHERE 
            b.entity_type = 'BRAND'
            AND b.detection_timestamp >= CURRENT_DATE - INTERVAL {time_amount} {time_unit}
            {"AND b.entity_normalized LIKE '%" + brand + "%'" if brand else ""}
          GROUP BY 
            a.agent_id, b.entity_normalized
        )
        SELECT 
          agent_id,
          SUM(mention_count) AS total_brand_mentions,
          ROUND(AVG(avg_sentiment) * 100, 1) AS avg_sentiment_pct,
          COUNT(DISTINCT brand) AS unique_brands_mentioned
        FROM 
          agent_brands
        GROUP BY 
          agent_id
        ORDER BY 
          total_brand_mentions DESC
        """
    else:
        # Default query - brand mention counts
        if brand:
            sql = f"""
            SELECT 
              entity_normalized AS brand, 
              COUNT(*) AS mention_count,
              MAX(detection_timestamp) AS last_mentioned
            FROM 
              insight_pulse_ai.silver.transcript_entity_mentions
            WHERE 
              entity_type = 'BRAND'
              AND entity_normalized LIKE '%{brand}%'
              AND detection_timestamp >= CURRENT_DATE - INTERVAL {time_amount} {time_unit}
            GROUP BY 
              brand
            ORDER BY 
              mention_count DESC
            """
        else:
            sql = f"""
            SELECT 
              entity_normalized AS brand, 
              COUNT(*) AS mention_count,
              MAX(detection_timestamp) AS last_mentioned
            FROM 
              insight_pulse_ai.silver.transcript_entity_mentions
            WHERE 
              entity_type = 'BRAND'
              AND detection_timestamp >= CURRENT_DATE - INTERVAL {time_amount} {time_unit}
            GROUP BY 
              brand
            ORDER BY 
              mention_count DESC
            LIMIT 10
            """
    
    return sql.strip()

def cmd_query(args):
    """Handle SQL query command"""
    if args.natural_language:
        # Handle natural language query
        nl_query = args.sql
        console.print(f"[bold blue]Processing natural language query:[/] {nl_query}")
        
        # Convert to SQL
        sql = handle_natural_language_query(nl_query)
        
        console.print("[bold blue]Translated to SQL:[/]")
        console.print(Syntax(sql, "sql", theme="monokai", word_wrap=True))
        
        if not args.dry_run:
            # Confirm with user
            if not args.yes and not console.input("[bold yellow]Execute this query? [y/N] [/]").lower().startswith('y'):
                console.print("[yellow]Query cancelled[/]")
                return
            
            # Execute query
            result = execute_query(sql, {"visualize": True})
            
            if result:
                display_query_results(result)
                
                # Check for visualization
                if "visualization" in result and result["visualization"].get("success", False):
                    wait_for_visualization(result["visualization"])
    else:
        # Execute SQL directly
        if args.file:
            try:
                with open(args.sql, 'r') as f:
                    sql = f.read()
            except Exception as e:
                console.print(f"[red]Error reading SQL file: {e}[/]")
                return
        else:
            sql = args.sql
        
        console.print("[bold blue]Executing SQL query:[/]")
        console.print(Syntax(sql, "sql", theme="monokai", word_wrap=True))
        
        if not args.dry_run:
            # Execute query
            result = execute_query(sql, {"visualize": True})
            
            if result:
                display_query_results(result)
                
                # Check for visualization
                if "visualization" in result and result["visualization"].get("success", False):
                    wait_for_visualization(result["visualization"])

def cmd_notebook(args):
    """Handle notebook execution command"""
    path = args.path
    
    # Parse parameters
    params = {}
    if args.params:
        for param in args.params:
            if '=' in param:
                key, value = param.split('=', 1)
                params[key.strip()] = value.strip()
            else:
                console.print(f"[yellow]Warning: Ignoring invalid parameter format: {param}[/]")
    
    console.print(f"[bold blue]Running notebook:[/] {path}")
    console.print(f"[bold blue]Parameters:[/] {json.dumps(params, indent=2)}")
    
    if not args.dry_run:
        # Execute notebook
        result = run_notebook(path, params)
        
        if result:
            console.print(f"[bold green]Notebook execution successful![/]")
            console.print(f"[bold blue]Execution ID:[/] {result.get('executionId', 'N/A')}")
            console.print(f"[bold blue]Status:[/] {result.get('status', 'N/A')}")
            console.print(f"[bold blue]Time taken:[/] {result.get('executionTimeMs', 0) / 1000:.2f} seconds")
            
            # Display outputs if available
            if "output" in result and "outputs" in result["output"]:
                console.print("\n[bold blue]Notebook Outputs:[/]")
                for output in result["output"]["outputs"]:
                    output_type = output.get("type", "")
                    output_data = output.get("data", "")
                    
                    if output_type == "TEXT":
                        console.print(Panel(output_data, title="Text Output", border_style="blue"))
                    elif output_type == "TABLE":
                        console.print(Panel(json.dumps(output_data, indent=2), title="Table Output", border_style="blue"))
                    else:
                        console.print(Panel(json.dumps(output_data, indent=2), title=f"{output_type} Output", border_style="blue"))

def cmd_config(args):
    """Handle configuration command"""
    config = load_config()
    
    if args.show:
        # Show current configuration
        console.print("[bold blue]Current Configuration:[/]")
        console.print(json.dumps(config, indent=2))
        return
    
    if args.set:
        # Set configuration keys
        for kv in args.set:
            if '=' in kv:
                key, value = kv.split('=', 1)
                if key in config:
                    config[key] = value
                    console.print(f"[green]Updated {key} = {value}[/]")
                else:
                    console.print(f"[yellow]Warning: Unknown configuration key: {key}[/]")
            else:
                console.print(f"[yellow]Warning: Invalid format for --set: {kv}[/]")
        
        # Save updated configuration
        save_config(config)

def cmd_dashboard(args):
    """Handle dashboard command"""
    try:
        config = load_config()
        
        # Call local API endpoint
        response = requests.post(
            f"{config['local_api_url']}/command",
            json={
                "command": "juicer",
                "args": {
                    "action": "dashboard",
                    "id": args.id
                }
            },
            timeout=30
        )
        
        if response.status_code != 200:
            console.print(f"[red]Error: HTTP {response.status_code}[/]")
            console.print(f"[red]{response.text}[/]")
            return
        
        result = response.json()
        
        if not result.get("success", False):
            console.print(f"[red]Error: {result.get('message', 'Unknown error')}[/]")
            return
        
        # Display available dashboards
        if "data" in result and "dashboards" in result["data"]:
            dashboards = result["data"]["dashboards"]
            
            if not dashboards:
                console.print("[yellow]No dashboards available[/]")
                return
            
            table = Table(title="Available Dashboards")
            table.add_column("ID", style="cyan")
            table.add_column("Name", style="green")
            table.add_column("URL", style="blue")
            
            for dashboard in dashboards:
                table.add_row(
                    dashboard.get("id", ""),
                    dashboard.get("name", ""),
                    dashboard.get("url", "")
                )
            
            console.print(table)
            
            console.print("\n[yellow]Use 'juicer dashboard --id <dashboard_id>' to open a specific dashboard[/]")
        else:
            console.print("[yellow]No dashboard information available[/]")
    
    except Exception as e:
        console.print(f"[red]Error accessing dashboards: {e}[/]")

def main():
    """Main entry point for the CLI"""
    parser = argparse.ArgumentParser(
        description="Juicer CLI - Databricks-Pulser integration for AI-BI analytics",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        Examples:
          juicer query "SELECT * FROM insight_pulse_ai.silver.transcript_entity_mentions LIMIT 10"
          juicer query --nl "Show brand mentions for Jollibee last 7 days"
          juicer notebook --path "/juicer/juicer_enrich_silver" --params date=2023-05-10 env=dev
          juicer config --show
          juicer config --set workspace_url=https://adb-123456789.0.azuredatabricks.net
          juicer dashboard
        """)
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Query command
    query_parser = subparsers.add_parser("query", help="Execute SQL query")
    query_parser.add_argument("sql", help="SQL query string or file path if --file is specified")
    query_parser.add_argument("--file", "-f", action="store_true", help="Treat SQL argument as a file path")
    query_parser.add_argument("--natural-language", "--nl", action="store_true", help="Process as natural language query")
    query_parser.add_argument("--dry-run", "-d", action="store_true", help="Show SQL but don't execute")
    query_parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation for natural language queries")
    
    # Notebook command
    notebook_parser = subparsers.add_parser("notebook", help="Run Databricks notebook")
    notebook_parser.add_argument("path", help="Path to notebook")
    notebook_parser.add_argument("--params", "-p", nargs="+", help="Parameters as key=value pairs")
    notebook_parser.add_argument("--dry-run", "-d", action="store_true", help="Show notebook info but don't execute")
    
    # Dashboard command
    dashboard_parser = subparsers.add_parser("dashboard", help="View Databricks dashboards")
    dashboard_parser.add_argument("--id", help="Dashboard ID to view")
    
    # Config command
    config_parser = subparsers.add_parser("config", help="Configure Juicer CLI")
    config_parser.add_argument("--show", action="store_true", help="Show current configuration")
    config_parser.add_argument("--set", nargs="+", help="Set configuration values as key=value pairs")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Execute command
    if args.command == "query":
        cmd_query(args)
    elif args.command == "notebook":
        cmd_notebook(args)
    elif args.command == "dashboard":
        cmd_dashboard(args)
    elif args.command == "config":
        cmd_config(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user[/]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Error: {e}[/]")
        sys.exit(1)