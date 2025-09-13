"""
Response Formatter

This module handles formatting LLM responses, including generating
visualizations and tables to enhance the user experience.
"""

import logging
import re
import json
from typing import Dict, Any, List, Optional

logger = logging.getLogger("juicer.formatter")

def format_response(answer: str, data: List[Dict[str, Any]] = None, sql: str = None) -> Dict[str, Any]:
    """
    Format the LLM response with enhanced visualization recommendations
    
    Args:
        answer: Text answer from LLM
        data: Query results data
        sql: SQL query used (if any)
        
    Returns:
        Dictionary with formatted response
    """
    logger.info("Formatting response")
    
    formatted_response = {
        "answer": answer,
        "charts": []
    }
    
    # Only generate chart recommendations if we have data
    if data and len(data) > 0:
        charts = generate_chart_recommendations(data, answer)
        formatted_response["charts"] = charts
    
    # Format numbers in the answer
    formatted_response["answer"] = _format_numbers_in_text(answer)
    
    return formatted_response

def _format_numbers_in_text(text: str) -> str:
    """
    Format numbers in text for better readability
    
    Args:
        text: Text containing numbers
        
    Returns:
        Text with formatted numbers
    """
    # Format large numbers with commas
    def format_number(match):
        number = match.group(0)
        try:
            if '.' in number:
                # Handle decimal numbers
                parts = number.split('.')
                return f"{int(parts[0]):,}.{parts[1]}"
            else:
                # Integer
                return f"{int(number):,}"
        except:
            # If conversion fails, return original
            return number
    
    # Find numbers over 999 and format them
    formatted_text = re.sub(r'\b\d{4,}(?:\.\d+)?\b', format_number, text)
    
    return formatted_text

def generate_chart_recommendations(data: List[Dict[str, Any]], answer: str) -> List[Dict[str, Any]]:
    """
    Generate chart recommendations based on data and answer
    
    Args:
        data: Query results data
        answer: Text answer from LLM
        
    Returns:
        List of chart recommendation dictionaries
    """
    logger.info(f"Generating chart recommendations for {len(data)} data points")
    
    # Skip if not enough data
    if len(data) < 2:
        return []
    
    charts = []
    columns = list(data[0].keys())
    
    # Analyze columns to identify metrics and dimensions
    metrics = []
    dimensions = []
    
    for col in columns:
        # Check first row to determine type
        sample_value = data[0][col]
        if isinstance(sample_value, (int, float)):
            metrics.append(col)
        else:
            dimensions.append(col)
    
    # Check if we have comparison data (good for bar chart)
    if len(dimensions) >= 1 and len(metrics) >= 1:
        # Recommend bar chart for comparison
        unique_dimension_values = len(set(item[dimensions[0]] for item in data))
        if 2 <= unique_dimension_values <= 10:  # Good number of categories for a bar chart
            charts.append({
                "type": "bar",
                "title": f"{metrics[0]} by {dimensions[0]}",
                "x_axis": dimensions[0],
                "y_axis": metrics[0],
                "data": data,
                "priority": 1
            })
    
    # Check if we have multiple metrics for comparison
    if len(metrics) >= 2 and len(dimensions) >= 1:
        charts.append({
            "type": "multi-bar",
            "title": f"{metrics[0]} and {metrics[1]} by {dimensions[0]}",
            "x_axis": dimensions[0],
            "y_axes": metrics[:2],
            "data": data,
            "priority": 2
        })
    
    # Check if we have time series data (good for line chart)
    time_columns = [col for col in dimensions if any(time_kw in col.lower() for time_kw in ["date", "time", "month", "year", "day", "week"])]
    if time_columns and metrics:
        charts.append({
            "type": "line",
            "title": f"{metrics[0]} over {time_columns[0]}",
            "x_axis": time_columns[0],
            "y_axis": metrics[0],
            "data": data,
            "priority": time_columns[0].lower().endswith("date") and "trend" in answer.lower()
        })
    
    # Recommend pie chart if appropriate
    if len(dimensions) >= 1 and len(metrics) >= 1:
        unique_dimension_values = len(set(item[dimensions[0]] for item in data))
        if 2 <= unique_dimension_values <= 7:  # Good number of categories for a pie chart
            charts.append({
                "type": "pie",
                "title": f"Distribution of {metrics[0]} by {dimensions[0]}",
                "dimension": dimensions[0],
                "metric": metrics[0],
                "data": data,
                "priority": 3
            })
    
    # Ensure we don't have too many charts
    return sorted(charts, key=lambda x: x.get("priority", 99))[:3]