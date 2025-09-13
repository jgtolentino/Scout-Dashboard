#!/usr/bin/env python3
"""
monitor_insights_quality.py - Monitor and analyze quality metrics for Juicer GenAI Insights

This script connects to the Databricks workspace, queries insights from the Platinum layer,
and generates quality metrics and reports. It can be scheduled to run regularly to track
insight quality over time.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

# Configuration
DEFAULT_CONFIG = {
    "keyvault_name": "juicer-insights-kv",
    "databricks_host_secret": "DATABRICKS-HOST",
    "databricks_token_secret": "DATABRICKS-TOKEN",
    "lookback_days": 30,
    "min_confidence_threshold": 0.7,
    "output_dir": "./quality_reports",
    "alert_threshold": 0.6,  # Alert if average confidence drops below this
    "notification_webhook": None  # MS Teams webhook URL
}

def get_secret_from_keyvault(keyvault_name, secret_name):
    """Retrieve a secret from Azure Key Vault"""
    try:
        # Create a credential using DefaultAzureCredential
        credential = DefaultAzureCredential()
        
        # Create a secret client
        keyvault_url = f"https://{keyvault_name}.vault.azure.net"
        client = SecretClient(vault_url=keyvault_url, credential=credential)
        
        # Get the secret
        secret = client.get_secret(secret_name)
        return secret.value
    except Exception as e:
        print(f"Error retrieving secret from Key Vault: {str(e)}")
        return None

def query_databricks(host, token, query):
    """Execute a SQL query against Databricks SQL warehouse"""
    api_url = f"https://{host}/api/2.0/sql/statements"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "statement": query,
        "warehouse_id": None,  # Will use the default SQL warehouse
        "format": "JSON"
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=data)
        response.raise_for_status()
        
        # The API returns a statement ID that we need to poll for results
        statement_id = response.json().get("statement_id")
        
        # Poll for results
        result_url = f"https://{host}/api/2.0/sql/statements/{statement_id}"
        
        while True:
            result_response = requests.get(result_url, headers=headers)
            result_response.raise_for_status()
            
            result = result_response.json()
            status = result.get("status", {}).get("state")
            
            if status == "FINISHED":
                # Extract the data
                columns = [col["name"] for col in result.get("manifest", {}).get("schema", [])]
                data = result.get("result", {}).get("data_array", [])
                df = pd.DataFrame(data, columns=columns)
                return df
            elif status in ["FAILED", "CANCELED", "CLOSED"]:
                error_message = result.get("status", {}).get("error", {}).get("message", "Unknown error")
                raise Exception(f"Query failed: {error_message}")
            
            # Wait before polling again
            time.sleep(1)
    except Exception as e:
        print(f"Error executing Databricks query: {str(e)}")
        return None

def get_insights_quality_metrics(host, token, days=30):
    """Query insights from Databricks and calculate quality metrics"""
    query = f"""
    SELECT 
      insight_type,
      insight_title,
      confidence_score,
      generated_by,
      model_name,
      time_period,
      processing_timestamp
    FROM
      insight_pulse_ai.platinum.genai_insights
    WHERE
      processing_timestamp >= CURRENT_DATE - INTERVAL {days} DAY
    ORDER BY
      processing_timestamp DESC
    """
    
    # Execute query
    insights_df = query_databricks(host, token, query)
    
    if insights_df is None or insights_df.empty:
        print("No insights found for the specified period")
        return None
    
    # Convert processing_timestamp to datetime
    insights_df['processing_timestamp'] = pd.to_datetime(insights_df['processing_timestamp'])
    
    # Calculate metrics
    metrics = {
        "total_insights": len(insights_df),
        "avg_confidence": insights_df['confidence_score'].mean(),
        "high_confidence": (insights_df['confidence_score'] >= 0.8).sum(),
        "medium_confidence": ((insights_df['confidence_score'] >= 0.5) & (insights_df['confidence_score'] < 0.8)).sum(),
        "low_confidence": (insights_df['confidence_score'] < 0.5).sum(),
        "by_type": insights_df.groupby('insight_type')['confidence_score'].agg(['count', 'mean']).to_dict(),
        "by_model": insights_df.groupby('model_name')['confidence_score'].agg(['count', 'mean']).to_dict(),
        "by_provider": insights_df.groupby('generated_by')['confidence_score'].agg(['count', 'mean']).to_dict(),
        "timestamp": datetime.now().isoformat()
    }
    
    # Calculate daily trends
    insights_df['date'] = insights_df['processing_timestamp'].dt.date
    daily_metrics = insights_df.groupby('date')['confidence_score'].agg(['count', 'mean']).reset_index()
    daily_metrics['date'] = daily_metrics['date'].astype(str)
    metrics['daily_trends'] = daily_metrics.to_dict(orient='records')
    
    return metrics, insights_df

def generate_quality_report(metrics, insights_df, output_dir, min_confidence=0.7):
    """Generate quality report with visualizations"""
    if metrics is None or insights_df is None:
        print("No data available to generate report")
        return None
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Create report timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_dir = os.path.join(output_dir, f"quality_report_{timestamp}")
    os.makedirs(report_dir, exist_ok=True)
    
    # Save metrics as JSON
    with open(os.path.join(report_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    
    # Generate visualizations
    
    # 1. Confidence distribution
    plt.figure(figsize=(10, 6))
    plt.hist(insights_df['confidence_score'], bins=20, alpha=0.7, color='blue')
    plt.axvline(x=min_confidence, color='red', linestyle='--', 
                label=f'Min Threshold ({min_confidence})')
    plt.xlabel('Confidence Score')
    plt.ylabel('Count')
    plt.title('Distribution of Insight Confidence Scores')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(report_dir, "confidence_distribution.png"))
    plt.close()
    
    # 2. Confidence by insight type
    insights_by_type = insights_df.groupby('insight_type')['confidence_score'].agg(['mean', 'count']).reset_index()
    plt.figure(figsize=(10, 6))
    bars = plt.bar(insights_by_type['insight_type'], insights_by_type['mean'], alpha=0.7)
    
    # Color bars based on confidence
    for i, bar in enumerate(bars):
        if insights_by_type['mean'].iloc[i] >= 0.8:
            bar.set_color('green')
        elif insights_by_type['mean'].iloc[i] >= 0.5:
            bar.set_color('orange')
        else:
            bar.set_color('red')
    
    plt.axhline(y=min_confidence, color='red', linestyle='--', 
                label=f'Min Threshold ({min_confidence})')
    plt.xlabel('Insight Type')
    plt.ylabel('Average Confidence Score')
    plt.title('Average Confidence Score by Insight Type')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(report_dir, "confidence_by_type.png"))
    plt.close()
    
    # 3. Confidence by LLM provider
    insights_by_provider = insights_df.groupby('generated_by')['confidence_score'].agg(['mean', 'count']).reset_index()
    plt.figure(figsize=(10, 6))
    bars = plt.bar(insights_by_provider['generated_by'], insights_by_provider['mean'], alpha=0.7)
    
    # Color bars based on confidence
    for i, bar in enumerate(bars):
        if insights_by_provider['mean'].iloc[i] >= 0.8:
            bar.set_color('green')
        elif insights_by_provider['mean'].iloc[i] >= 0.5:
            bar.set_color('orange')
        else:
            bar.set_color('red')
    
    plt.axhline(y=min_confidence, color='red', linestyle='--', 
                label=f'Min Threshold ({min_confidence})')
    plt.xlabel('LLM Provider')
    plt.ylabel('Average Confidence Score')
    plt.title('Average Confidence Score by LLM Provider')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(report_dir, "confidence_by_provider.png"))
    plt.close()
    
    # 4. Time series of daily confidence
    daily_df = pd.DataFrame(metrics['daily_trends'])
    plt.figure(figsize=(12, 6))
    plt.plot(daily_df['date'], daily_df['mean'], marker='o', linestyle='-', color='blue')
    plt.axhline(y=min_confidence, color='red', linestyle='--', 
                label=f'Min Threshold ({min_confidence})')
    plt.xlabel('Date')
    plt.ylabel('Average Confidence Score')
    plt.title('Daily Average Confidence Score Trend')
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(report_dir, "confidence_trend.png"))
    plt.close()
    
    # Generate HTML report
    html_report = generate_html_report(metrics, min_confidence, report_dir)
    with open(os.path.join(report_dir, "report.html"), "w") as f:
        f.write(html_report)
    
    print(f"Quality report generated: {report_dir}")
    return report_dir

def generate_html_report(metrics, min_confidence, report_dir):
    """Generate HTML report from metrics"""
    # Calculate percent of insights meeting threshold
    total = metrics['total_insights']
    above_threshold = metrics['high_confidence'] + metrics['medium_confidence']
    if metrics['medium_confidence'] > 0:
        pct_above = (above_threshold / total) * 100 if total > 0 else 0
    else:
        pct_above = (metrics['high_confidence'] / total) * 100 if total > 0 else 0
    
    # Format dates for display
    now = datetime.now()
    end_date = now.strftime("%Y-%m-%d")
    start_date = (now - timedelta(days=metrics.get('lookback_days', 30))).strftime("%Y-%m-%d")
    
    # Create HTML report
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Juicer GenAI Insights Quality Report</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
            }}
            
            .header {{
                background-color: #002b49;
                color: white;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }}
            
            .summary {{
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 20px;
            }}
            
            .summary-box {{
                flex: 1;
                padding: 15px;
                border-radius: 5px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            
            .summary-box h3 {{
                margin-top: 0;
            }}
            
            .summary-box.total {{
                background-color: #002b49;
                color: white;
            }}
            
            .summary-box.high {{
                background-color: #28a745;
                color: white;
            }}
            
            .summary-box.medium {{
                background-color: #ffc107;
                color: black;
            }}
            
            .summary-box.low {{
                background-color: #dc3545;
                color: white;
            }}
            
            .chart-container {{
                margin-bottom: 30px;
            }}
            
            .chart-title {{
                margin-bottom: 10px;
                color: #002b49;
            }}
            
            .chart-image {{
                max-width: 100%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 5px;
            }}
            
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            
            th, td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            
            th {{
                background-color: #f5f5f5;
            }}
            
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}

            .alert {{
                background-color: #f8d7da;
                color: #721c24;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 20px;
                border: 1px solid #f5c6cb;
            }}
            
            .alert-title {{
                font-weight: bold;
                margin-bottom: 5px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Juicer GenAI Insights Quality Report</h1>
            <p>Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
            <p>Date Range: {start_date} to {end_date}</p>
        </div>
        
        <!-- Overall Quality Alert -->
        {f'''
        <div class="alert">
            <div class="alert-title">⚠️ Quality Alert</div>
            <p>The average confidence score of {metrics['avg_confidence']:.2f} is below the minimum threshold of {min_confidence}.</p>
            <p>Only {pct_above:.1f}% of insights meet or exceed the confidence threshold.</p>
        </div>
        ''' if metrics['avg_confidence'] < min_confidence else ''}
        
        <!-- Summary Cards -->
        <div class="summary">
            <div class="summary-box total">
                <h3>Total Insights</h3>
                <h2>{metrics['total_insights']}</h2>
            </div>
            <div class="summary-box high">
                <h3>High Confidence</h3>
                <h2>{metrics['high_confidence']} ({(metrics['high_confidence']/total*100):.1f}%)</h2>
            </div>
            <div class="summary-box medium">
                <h3>Medium Confidence</h3>
                <h2>{metrics['medium_confidence']} ({(metrics['medium_confidence']/total*100):.1f}%)</h2>
            </div>
            <div class="summary-box low">
                <h3>Low Confidence</h3>
                <h2>{metrics['low_confidence']} ({(metrics['low_confidence']/total*100):.1f}%)</h2>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="chart-container">
            <h2 class="chart-title">Confidence Score Distribution</h2>
            <img class="chart-image" src="confidence_distribution.png" alt="Confidence Distribution">
        </div>
        
        <div class="chart-container">
            <h2 class="chart-title">Confidence by Insight Type</h2>
            <img class="chart-image" src="confidence_by_type.png" alt="Confidence by Type">
        </div>
        
        <div class="chart-container">
            <h2 class="chart-title">Confidence by LLM Provider</h2>
            <img class="chart-image" src="confidence_by_provider.png" alt="Confidence by Provider">
        </div>
        
        <div class="chart-container">
            <h2 class="chart-title">Daily Confidence Trend</h2>
            <img class="chart-image" src="confidence_trend.png" alt="Confidence Trend">
        </div>
        
        <!-- Insight Type Breakdown -->
        <h2>Insight Type Breakdown</h2>
        <table>
            <tr>
                <th>Insight Type</th>
                <th>Count</th>
                <th>Avg. Confidence</th>
            </tr>
            {''.join([f'''
            <tr>
                <td>{insight_type}</td>
                <td>{metrics['by_type']['count'][insight_type]}</td>
                <td>{metrics['by_type']['mean'][insight_type]:.2f}</td>
            </tr>
            ''' for insight_type in metrics['by_type']['count'].keys()])}
        </table>
        
        <!-- LLM Provider Breakdown -->
        <h2>LLM Provider Breakdown</h2>
        <table>
            <tr>
                <th>Provider</th>
                <th>Count</th>
                <th>Avg. Confidence</th>
            </tr>
            {''.join([f'''
            <tr>
                <td>{provider}</td>
                <td>{metrics['by_provider']['count'][provider]}</td>
                <td>{metrics['by_provider']['mean'][provider]:.2f}</td>
            </tr>
            ''' for provider in metrics['by_provider']['count'].keys()])}
        </table>
        
        <!-- LLM Model Breakdown -->
        <h2>LLM Model Breakdown</h2>
        <table>
            <tr>
                <th>Model</th>
                <th>Count</th>
                <th>Avg. Confidence</th>
            </tr>
            {''.join([f'''
            <tr>
                <td>{model}</td>
                <td>{metrics['by_model']['count'][model]}</td>
                <td>{metrics['by_model']['mean'][model]:.2f}</td>
            </tr>
            ''' for model in metrics['by_model']['count'].keys()])}
        </table>
        
        <footer>
            <p>This report was generated automatically by the Juicer GenAI Insights Quality Monitor.</p>
        </footer>
    </body>
    </html>
    """
    
    return html

def send_notification(webhook_url, metrics, min_confidence, report_url=None):
    """Send notification to MS Teams webhook if quality drops below threshold"""
    if webhook_url is None:
        return
    
    if metrics['avg_confidence'] >= min_confidence:
        return  # No alert needed
    
    # Calculate metrics for notification
    total = metrics['total_insights']
    below_threshold = metrics['low_confidence']
    pct_below = (below_threshold / total) * 100 if total > 0 else 0
    
    # Create message card for MS Teams
    card = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": "Juicer GenAI Insights Quality Alert",
        "sections": [{
            "activityTitle": "⚠️ Juicer GenAI Insights Quality Alert",
            "activitySubtitle": f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "facts": [
                {
                    "name": "Average Confidence",
                    "value": f"{metrics['avg_confidence']:.2f} (threshold: {min_confidence})"
                },
                {
                    "name": "Total Insights",
                    "value": str(metrics['total_insights'])
                },
                {
                    "name": "Low Confidence Insights",
                    "value": f"{below_threshold} ({pct_below:.1f}%)"
                },
                {
                    "name": "Most Affected Type",
                    "value": min(metrics['by_type']['mean'].items(), key=lambda x: x[1])[0]
                }
            ],
            "markdown": True
        }]
    }
    
    # Add report link if available
    if report_url:
        card["potentialAction"] = [{
            "@type": "OpenUri",
            "name": "View Report",
            "targets": [{
                "os": "default",
                "uri": report_url
            }]
        }]
    
    # Send notification
    try:
        response = requests.post(webhook_url, json=card)
        response.raise_for_status()
        print("Notification sent successfully")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Monitor Juicer GenAI Insights quality metrics')
    parser.add_argument('--config', type=str, help='Path to configuration file')
    parser.add_argument('--keyvault', type=str, help='Azure Key Vault name')
    parser.add_argument('--days', type=int, help='Number of days to look back')
    parser.add_argument('--min-confidence', type=float, help='Minimum confidence threshold')
    parser.add_argument('--output-dir', type=str, help='Output directory for reports')
    parser.add_argument('--webhook', type=str, help='MS Teams webhook URL for notifications')
    
    args = parser.parse_args()
    
    # Load configuration
    config = DEFAULT_CONFIG.copy()
    if args.config:
        try:
            with open(args.config, 'r') as f:
                config.update(json.load(f))
        except Exception as e:
            print(f"Error loading configuration file: {str(e)}")
    
    # Override config with command line arguments
    if args.keyvault:
        config['keyvault_name'] = args.keyvault
    if args.days:
        config['lookback_days'] = args.days
    if args.min_confidence:
        config['min_confidence_threshold'] = args.min_confidence
    if args.output_dir:
        config['output_dir'] = args.output_dir
    if args.webhook:
        config['notification_webhook'] = args.webhook
    
    # Get secrets from Key Vault
    keyvault_name = config['keyvault_name']
    databricks_host = get_secret_from_keyvault(keyvault_name, config['databricks_host_secret'])
    databricks_token = get_secret_from_keyvault(keyvault_name, config['databricks_token_secret'])
    
    if not databricks_host or not databricks_token:
        print("Error: Could not retrieve Databricks credentials from Key Vault")
        sys.exit(1)
    
    # Get insights quality metrics
    metrics, insights_df = get_insights_quality_metrics(
        databricks_host, 
        databricks_token, 
        config['lookback_days']
    )
    
    if metrics is None:
        print("Error: Failed to retrieve insights metrics")
        sys.exit(1)
    
    # Add config values to metrics
    metrics['lookback_days'] = config['lookback_days']
    
    # Generate quality report
    report_dir = generate_quality_report(
        metrics, 
        insights_df, 
        config['output_dir'],
        config['min_confidence_threshold']
    )
    
    # Send notification if quality is below threshold
    if metrics['avg_confidence'] < config['alert_threshold']:
        report_url = None  # In a real environment, this would be a URL to the report
        send_notification(
            config['notification_webhook'],
            metrics,
            config['min_confidence_threshold'],
            report_url
        )
    
    # Print summary to console
    print("\nQuality Metrics Summary:")
    print(f"Total Insights: {metrics['total_insights']}")
    print(f"Average Confidence: {metrics['avg_confidence']:.2f}")
    print(f"High Confidence: {metrics['high_confidence']} ({(metrics['high_confidence']/metrics['total_insights']*100 if metrics['total_insights'] > 0 else 0):.1f}%)")
    print(f"Medium Confidence: {metrics['medium_confidence']} ({(metrics['medium_confidence']/metrics['total_insights']*100 if metrics['total_insights'] > 0 else 0):.1f}%)")
    print(f"Low Confidence: {metrics['low_confidence']} ({(metrics['low_confidence']/metrics['total_insights']*100 if metrics['total_insights'] > 0 else 0):.1f}%)")
    
    status = "PASS" if metrics['avg_confidence'] >= config['min_confidence_threshold'] else "ALERT"
    print(f"\nOverall Quality Status: {status}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())