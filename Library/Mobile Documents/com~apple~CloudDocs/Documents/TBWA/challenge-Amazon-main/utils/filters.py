import dash_bootstrap_components as dbc
from dash import dcc, html, Input, Output, State, callback
import pandas as pd
from typing import Dict, Any, Optional, List
from utils.data_access import get_data_client
from utils.i18n import translate

# Filter component factory for Scout dashboard
class ScoutFilterComponents:
    """Centralized filter components for Scout retail dashboard"""
    
    def __init__(self):
        self.client = get_data_client()
        self._filter_options = None
    
    def _get_filter_options(self) -> Dict[str, List[str]]:
        """Get unique values for all filter dimensions from data"""
        if self._filter_options is None:
            try:
                # Get enriched data to extract unique values
                df = self.client.transactions()
                
                self._filter_options = {
                    'regions': sorted(df['region'].dropna().unique()) if 'region' in df.columns else [],
                    'categories': sorted(df['category'].dropna().unique()) if 'category' in df.columns else [],
                    'brands': sorted(df['brand'].dropna().unique()) if 'brand' in df.columns else [],
                    'stores': sorted(df['store_name'].dropna().unique()) if 'store_name' in df.columns else [],
                    'customer_segments': sorted(df['customer_segment'].dropna().unique()) if 'customer_segment' in df.columns else []
                }
                
                # Ensure we have at least some options for demo
                if not self._filter_options['regions']:
                    self._filter_options['regions'] = ['NCR', 'Region III', 'Region IV-A', 'Region VII']
                if not self._filter_options['categories']:
                    self._filter_options['categories'] = ['Food & Beverages', 'Personal Care', 'Household Items']
                if not self._filter_options['brands']:
                    self._filter_options['brands'] = ['Lucky Me', 'Palmolive', 'Nestle', 'Unilever']
                    
            except Exception as e:
                print(f"Warning: Could not load filter options: {e}")
                # Fallback options
                self._filter_options = {
                    'regions': ['NCR', 'Region III', 'Region IV-A', 'Region VII', 'Region XI'],
                    'categories': ['Food & Beverages', 'Personal Care', 'Household Items', 'Snacks & Confectionery'],
                    'brands': ['Lucky Me', 'Palmolive', 'Nestle', 'Unilever', 'Colgate'],
                    'stores': ['Scout Store Manila', 'Scout Store Cebu', 'Scout Store Davao'],
                    'customer_segments': ['Regular', 'Premium', 'VIP', 'New']
                }
        
        return self._filter_options
    
    def create_date_range_filter(self, filter_id: str = "date-range-filter") -> dbc.Col:
        """Create date range picker component"""
        options = self._get_filter_options()
        
        return dbc.Col([
            html.Label(translate("Date Range"), className="filter-label"),
            dcc.DatePickerRange(
                id=filter_id,
                start_date="2024-06-01",
                end_date="2024-08-31",
                display_format="MMM DD, YYYY",
                style={"width": "100%"}
            )
        ], width=12, lg=6)
    
    def create_region_filter(self, filter_id: str = "region-filter") -> dbc.Col:
        """Create region dropdown component"""
        options = self._get_filter_options()
        
        return dbc.Col([
            html.Label(translate("Region"), className="filter-label"),
            dcc.Dropdown(
                id=filter_id,
                options=[{"label": region, "value": region} for region in options['regions']],
                multi=True,
                placeholder=translate("Select regions..."),
                className="custom-dropdown"
            )
        ], width=12, lg=6)
    
    def create_category_filter(self, filter_id: str = "category-filter") -> dbc.Col:
        """Create category dropdown component"""
        options = self._get_filter_options()
        
        return dbc.Col([
            html.Label(translate("Category"), className="filter-label"),
            dcc.Dropdown(
                id=filter_id,
                options=[{"label": cat, "value": cat} for cat in options['categories']],
                multi=True,
                placeholder=translate("Select categories..."),
                className="custom-dropdown"
            )
        ], width=12, lg=6)
    
    def create_brand_filter(self, filter_id: str = "brand-filter") -> dbc.Col:
        """Create brand dropdown component"""
        options = self._get_filter_options()
        
        return dbc.Col([
            html.Label(translate("Brand"), className="filter-label"),
            dcc.Dropdown(
                id=filter_id,
                options=[{"label": brand, "value": brand} for brand in options['brands']],
                multi=True,
                placeholder=translate("Select brands..."),
                className="custom-dropdown"
            )
        ], width=12, lg=6)
    
    def create_store_filter(self, filter_id: str = "store-filter") -> dbc.Col:
        """Create store dropdown component"""
        options = self._get_filter_options()
        
        return dbc.Col([
            html.Label(translate("Store"), className="filter-label"),
            dcc.Dropdown(
                id=filter_id,
                options=[{"label": store, "value": store} for store in options['stores']],
                multi=True,
                placeholder=translate("Select stores..."),
                className="custom-dropdown"
            )
        ], width=12, lg=6)
    
    def create_filter_panel(self, page_name: str = "general") -> dbc.Card:
        """Create complete filter panel for a page"""
        return dbc.Card([
            dbc.CardHeader([
                html.H5(translate("Filters"), className="mb-0"),
                dbc.Button(
                    translate("Clear All"),
                    id=f"{page_name}-clear-filters",
                    color="outline-secondary",
                    size="sm",
                    className="ms-2"
                )
            ], className="d-flex justify-content-between align-items-center"),
            dbc.CardBody([
                dbc.Row([
                    self.create_date_range_filter(f"{page_name}-date-range"),
                    self.create_region_filter(f"{page_name}-region"),
                ], className="mb-3"),
                dbc.Row([
                    self.create_category_filter(f"{page_name}-category"),
                    self.create_brand_filter(f"{page_name}-brand"),
                ], className="mb-3"),
                dbc.Row([
                    self.create_store_filter(f"{page_name}-store"),
                    dbc.Col([
                        html.Label(translate("Apply to All Pages"), className="filter-label"),
                        dcc.Checklist(
                            id=f"{page_name}-global-filters",
                            options=[{"label": translate("Sync filters across pages"), "value": "sync"}],
                            value=["sync"],  # Default to synced
                            className="form-check"
                        )
                    ], width=12, lg=6)
                ])
            ])
        ], className="mb-4 filter-panel")


def get_filter_values_from_store(filter_store: Dict[str, Any]) -> Dict[str, Any]:
    """Extract filter values from dcc.Store data"""
    if not filter_store:
        return {}
    
    return {
        'date_gte': filter_store.get('date_range', {}).get('start_date'),
        'date_lte': filter_store.get('date_range', {}).get('end_date'),
        'region': filter_store.get('regions'),
        'category': filter_store.get('categories'),
        'brand': filter_store.get('brands'),
        'store': filter_store.get('stores')
    }


def build_filter_dict(date_range=None, regions=None, categories=None, brands=None, stores=None) -> Dict[str, Any]:
    """Build filter dictionary for storage"""
    filter_dict = {}
    
    if date_range and date_range[0] and date_range[1]:
        filter_dict['date_range'] = {
            'start_date': date_range[0],
            'end_date': date_range[1]
        }
    
    if regions:
        filter_dict['regions'] = regions if isinstance(regions, list) else [regions]
    
    if categories:
        filter_dict['categories'] = categories if isinstance(categories, list) else [categories]
        
    if brands:
        filter_dict['brands'] = brands if isinstance(brands, list) else [brands]
        
    if stores:
        filter_dict['stores'] = stores if isinstance(stores, list) else [stores]
    
    return filter_dict


# Create shared filter component instance
scout_filters = ScoutFilterComponents()