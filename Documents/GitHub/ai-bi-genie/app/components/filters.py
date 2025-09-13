"""
Filter panel components for AI-BI-Genie Streamlit app
"""

import streamlit as st
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

class FilterPanel:
    """Filter panel for dashboard controls"""
    
    @staticmethod
    def render_date_filter(key: str = "date_filter") -> Tuple[datetime, datetime]:
        """Render date range filter"""
        try:
            default_start = datetime.now() - timedelta(days=30)
            default_end = datetime.now()
            
            date_range = st.date_input(
                "Date Range",
                value=(default_start.date(), default_end.date()),
                max_value=datetime.now().date(),
                key=key
            )
            
            if len(date_range) == 2:
                return (
                    datetime.combine(date_range[0], datetime.min.time()),
                    datetime.combine(date_range[1], datetime.max.time())
                )
            else:
                return (default_start, default_end)
        except Exception:
            return (datetime.now() - timedelta(days=30), datetime.now())
    
    @staticmethod
    def render_multiselect_filter(label: str, options: List[str], 
                                 default: List[str] = None, key: str = None) -> List[str]:
        """Render multiselect filter"""
        try:
            if default is None:
                default = options
            
            return st.multiselect(
                label,
                options=options,
                default=default,
                key=key
            )
        except Exception:
            return options if options else []
    
    @staticmethod
    def render_selectbox_filter(label: str, options: List[str], 
                               default: str = None, key: str = None) -> str:
        """Render selectbox filter"""
        try:
            if default is None and options:
                default = options[0]
            
            return st.selectbox(
                label,
                options=options,
                index=options.index(default) if default in options else 0,
                key=key
            )
        except Exception:
            return options[0] if options else ""
    
    @staticmethod
    def render_slider_filter(label: str, min_value: float, max_value: float,
                           default: float = None, step: float = 1.0, key: str = None) -> float:
        """Render slider filter"""
        try:
            if default is None:
                default = (min_value + max_value) / 2
            
            return st.slider(
                label,
                min_value=min_value,
                max_value=max_value,
                value=default,
                step=step,
                key=key
            )
        except Exception:
            return default if default is not None else min_value
    
    @staticmethod
    def render_checkbox_filter(label: str, default: bool = False, key: str = None) -> bool:
        """Render checkbox filter"""
        try:
            return st.checkbox(label, value=default, key=key)
        except Exception:
            return default