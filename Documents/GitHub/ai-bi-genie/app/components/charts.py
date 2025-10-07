"""
Chart building utilities for AI-BI-Genie Streamlit app
"""

import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from typing import Dict, Any

class ChartBuilder:
    """Chart builder for creating interactive visualizations"""
    
    def __init__(self):
        self.color_scheme = {
            'primary': '#0078d4',
            'secondary': '#106ebe',
            'accent': '#005a9e',
            'success': '#107c10',
            'warning': '#ff8c00',
            'error': '#d13438'
        }
    
    def create_line_chart(self, data: pd.DataFrame, x: str, y: str, title: str) -> go.Figure:
        """Create a line chart"""
        try:
            fig = px.line(data, x=x, y=y, title=title,
                         color_discrete_sequence=[self.color_scheme['primary']])
            fig.update_layout(
                template='plotly_white',
                title_font_size=16,
                title_x=0.5,
                showlegend=True
            )
            return fig
        except Exception as e:
            # Return empty figure on error
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_pie_chart(self, data: pd.DataFrame, values: str, names: str, title: str) -> go.Figure:
        """Create a pie chart"""
        try:
            fig = px.pie(data, values=values, names=names, title=title)
            fig.update_layout(
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_bar_chart(self, data: pd.DataFrame, x: str, y: str, title: str) -> go.Figure:
        """Create a bar chart"""
        try:
            fig = px.bar(data, x=x, y=y, title=title,
                        color_discrete_sequence=[self.color_scheme['secondary']])
            fig.update_layout(
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_horizontal_bar_chart(self, data: pd.DataFrame, x: str, y: str, title: str) -> go.Figure:
        """Create a horizontal bar chart"""
        try:
            fig = px.bar(data, x=x, y=y, orientation='h', title=title,
                        color_discrete_sequence=[self.color_scheme['accent']])
            fig.update_layout(
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_time_series_chart(self, data: pd.DataFrame, title: str) -> go.Figure:
        """Create a time series chart"""
        try:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=data.index if hasattr(data, 'index') else range(len(data)),
                y=data.iloc[:, 0] if len(data.columns) > 0 else [],
                mode='lines+markers',
                name='Time Series',
                line=dict(color=self.color_scheme['primary'])
            ))
            fig.update_layout(
                title=title,
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_funnel_chart(self, data: pd.DataFrame, title: str) -> go.Figure:
        """Create a funnel chart"""
        try:
            fig = go.Figure(go.Funnel(
                y=['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
                x=[100, 80, 60, 40],
                textinfo="value+percent initial"
            ))
            fig.update_layout(
                title=title,
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_sunburst_chart(self, data: pd.DataFrame, title: str) -> go.Figure:
        """Create a sunburst chart"""
        try:
            fig = go.Figure(go.Sunburst(
                labels=['Root', 'A', 'B', 'C', 'A1', 'A2', 'B1', 'B2'],
                parents=['', 'Root', 'Root', 'Root', 'A', 'A', 'B', 'B'],
                values=[10, 5, 3, 2, 2, 3, 1, 2]
            ))
            fig.update_layout(
                title=title,
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_sankey_diagram(self, data: pd.DataFrame, title: str) -> go.Figure:
        """Create a sankey diagram"""
        try:
            fig = go.Figure(data=[go.Sankey(
                node=dict(
                    pad=15,
                    thickness=20,
                    line=dict(color="black", width=0.5),
                    label=["Source A", "Source B", "Target A", "Target B"],
                    color="blue"
                ),
                link=dict(
                    source=[0, 1, 0, 2],
                    target=[2, 3, 3, 1],
                    value=[8, 4, 2, 8]
                )
            )])
            fig.update_layout(
                title_text=title,
                font_size=10,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig
    
    def create_heatmap(self, data: pd.DataFrame, title: str) -> go.Figure:
        """Create a heatmap"""
        try:
            import numpy as np
            # Generate sample heatmap data
            z = np.random.randn(10, 10)
            fig = go.Figure(data=go.Heatmap(z=z, colorscale='Viridis'))
            fig.update_layout(
                title=title,
                template='plotly_white',
                title_font_size=16,
                title_x=0.5
            )
            return fig
        except Exception as e:
            fig = go.Figure()
            fig.add_annotation(text=f"Error loading chart: {str(e)}", 
                             x=0.5, y=0.5, showarrow=False)
            return fig