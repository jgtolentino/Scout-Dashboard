"""
KPI card components for AI-BI-Genie Streamlit app
"""

import streamlit as st
from typing import Union

class KPICards:
    """KPI card components for displaying key metrics"""
    
    @staticmethod
    def render_card(title: str, value: Union[str, int, float], 
                   change: str = "", change_type: str = "neutral") -> None:
        """Render a KPI card"""
        try:
            # Determine change color based on type
            change_colors = {
                "success": "#107c10",
                "warning": "#ff8c00", 
                "error": "#d13438",
                "neutral": "#666666"
            }
            
            change_color = change_colors.get(change_type, "#666666")
            
            # Create the card HTML
            card_html = f"""
            <div style="
                background-color: #ffffff;
                padding: 1rem;
                border-radius: 8px;
                border: 1px solid #e1e5e9;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                text-align: center;
                min-height: 120px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            ">
                <h4 style="
                    color: #323130;
                    margin: 0 0 0.5rem 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                ">{title}</h4>
                <div style="
                    color: #323130;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin: 0.5rem 0;
                ">{value}</div>
                {f'<div style="color: {change_color}; font-size: 0.8rem; font-weight: 500;">{change}</div>' if change else ''}
            </div>
            """
            
            st.markdown(card_html, unsafe_allow_html=True)
            
        except Exception as e:
            # Fallback to simple metric display
            st.metric(label=title, value=value, delta=change)
    
    @staticmethod
    def render_metric_card(title: str, value: Union[str, int, float],
                          delta: Union[str, int, float] = None,
                          delta_color: str = "normal") -> None:
        """Render a metric card using Streamlit's built-in metric"""
        try:
            st.metric(
                label=title,
                value=value,
                delta=delta,
                delta_color=delta_color
            )
        except Exception:
            # Simple fallback
            st.write(f"**{title}**: {value}")
            if delta:
                st.write(f"Change: {delta}")
    
    @staticmethod
    def render_progress_card(title: str, value: float, max_value: float = 100,
                           format_str: str = "{:.1f}%") -> None:
        """Render a progress card with progress bar"""
        try:
            progress_percentage = min(value / max_value, 1.0) if max_value > 0 else 0
            
            # Create progress card HTML
            card_html = f"""
            <div style="
                background-color: #ffffff;
                padding: 1rem;
                border-radius: 8px;
                border: 1px solid #e1e5e9;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                text-align: center;
                min-height: 120px;
            ">
                <h4 style="
                    color: #323130;
                    margin: 0 0 1rem 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                ">{title}</h4>
                <div style="
                    color: #323130;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                ">{format_str.format(value)}</div>
                <div style="
                    background-color: #f3f2f1;
                    border-radius: 10px;
                    height: 10px;
                    overflow: hidden;
                    margin: 0.5rem 0;
                ">
                    <div style="
                        background-color: #0078d4;
                        height: 100%;
                        width: {progress_percentage * 100}%;
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
            """
            
            st.markdown(card_html, unsafe_allow_html=True)
            
        except Exception:
            # Fallback to simple display
            st.write(f"**{title}**: {format_str.format(value)}")
            st.progress(value / max_value if max_value > 0 else 0)