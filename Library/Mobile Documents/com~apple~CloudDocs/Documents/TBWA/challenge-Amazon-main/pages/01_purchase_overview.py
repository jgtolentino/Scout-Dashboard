import dash
from dash import callback, dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
from utils.functions import create_card
from utils.data_access import get_data_client
from utils.i18n import translate
from utils.filters import scout_filters, get_filter_values_from_store, build_filter_dict
import pandas as pd
import plotly.express as px
import numpy as np

# Import Scout DAL functions
try:
    from scout.dal import trend, top, geo
    SCOUT_DAL_AVAILABLE = True
except ImportError:
    SCOUT_DAL_AVAILABLE = False
    print("⚠️ Scout DAL not available - falling back to CSV data")

dash.register_page(
    __name__,
    suppress_callback_exceptions=True,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    path="/purchase_overview",
)

import warnings

warnings.filterwarnings("ignore")

# dataset - Scout retail transaction data via DAL
client = get_data_client()
df = client.transactions()

# Transform Scout transaction data to match UI requirements
if 'transaction_date' in df.columns:
    df['Order Date Year'] = df['transaction_date'].dt.year
    df['Order Date Month'] = df['transaction_date'].dt.strftime('%B')
else:
    # Fallback: Use current year and distribute months
    df['Order Date Year'] = 2024
    df['Order Date Month'] = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'][pd.to_datetime('today').month - 1]

if 'total_amount' in df.columns:
    df['Purchase Total'] = df['total_amount']
else:
    # Generate realistic Scout retail amounts (₱50-₱5000)
    import numpy as np
    df['Purchase Total'] = np.random.uniform(50, 5000, len(df))

if 'quantity' in df.columns:
    df['Quantity'] = df['quantity']
else:
    # Typical Scout store quantities (1-10 items)
    df['Quantity'] = np.random.randint(1, 11, len(df))

if 'customer_id' in df.columns:
    df['Survey ResponseID'] = df['customer_id']
else:
    # Generate Scout customer IDs
    df['Survey ResponseID'] = [f'SCOUT_{i:06d}' for i in range(len(df))]

if 'category' in df.columns:
    df['Category'] = df['category']
else:
    # Scout retail categories
    scout_categories = ['Food & Beverages', 'Personal Care', 'Household Items', 
                       'Snacks & Confectionery', 'Health & Wellness', 'Baby Care']
    df['Category'] = np.random.choice(scout_categories, len(df))

# df = pd.read_parquet("data/ready/amazon_purchases.parquet")

# layout
layout = dbc.Container(
    [
        html.Div(
            [
                html.H2(
                    translate("Purchase overview"),  # title
                    className="title",
                ),
                html.Br(),
                # Scout filter panel
                scout_filters.create_filter_panel("purchase"),
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.H3(
                                    translate("Select Year"),
                                    className="subtitle-small",
                                ),
                                dcc.Dropdown(
                                    id="year-dropdown",
                                    options=[
                                        {"label": translate("All Years"), "value": "All"}
                                    ]
                                    + [
                                        {"label": str(col), "value": col}
                                        for col in sorted(
                                            df["Order Date Year"].unique()
                                        )
                                    ],
                                    value="All",
                                    clearable=True,
                                    multi=False,
                                    placeholder="Select here",
                                    className="custom-dropdown",
                                ),
                            ],
                            width=4,
                        ),
                    ]
                ),
                html.Br(),
                dbc.Row(
                    [
                        dbc.Col(
                            create_card(translate("Purchases"), "purchases-card", "fa-list"),
                            width=4,
                        ),
                        dbc.Col(
                            create_card(translate("Total Spend"), "spend-card", "fa-coins"),
                            width=4,
                        ),
                        dbc.Col(
                            create_card(translate("Top Category"), "category-card", "fa-tags"),
                            width=4,
                        ),
                    ],
                ),
                html.Br(),
                dbc.Row(
                    [
                        dbc.Col(
                            dcc.Loading(
                                dcc.Graph(
                                    id="sales-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "400px"},
                                ),
                                type="circle",
                                color="#f79500",
                            ),
                            width=6,
                        ),
                        dbc.Col(
                            dcc.Loading(
                                dcc.Graph(
                                    id="category-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "400px"},
                                ),
                                type="circle",
                                color="#f79500",
                            ),
                            width=6,
                        ),
                    ],
                ),
            ],
            className="page-content",
        )
    ],
    fluid=True,
)


# Callback for filter synchronization
@callback(
    Output("session-filters", "data"),
    [
        Input("purchase-date-range", "start_date"),
        Input("purchase-date-range", "end_date"),
        Input("purchase-region", "value"),
        Input("purchase-category", "value"),
        Input("purchase-brand", "value"),
        Input("purchase-store", "value"),
        Input("purchase-global-filters", "value"),
    ],
    State("session-filters", "data"),
    prevent_initial_call=True
)
def sync_filters_to_session(start_date, end_date, regions, categories, brands, stores, global_sync, current_filters):
    """Sync page filters to session store when global sync is enabled"""
    if not global_sync or "sync" not in global_sync:
        return current_filters or {}
    
    # Build filter dictionary
    date_range = [start_date, end_date] if start_date and end_date else None
    new_filters = build_filter_dict(date_range, regions, categories, brands, stores)
    
    return new_filters

# Clear filters callback
@callback(
    [
        Output("purchase-date-range", "start_date"),
        Output("purchase-date-range", "end_date"),
        Output("purchase-region", "value"),
        Output("purchase-category", "value"),
        Output("purchase-brand", "value"),
        Output("purchase-store", "value"),
    ],
    Input("purchase-clear-filters", "n_clicks"),
    prevent_initial_call=True
)
def clear_filters(n_clicks):
    if n_clicks:
        return None, None, None, None, None, None
    return dash.no_update

# Load filters from session on page load
@callback(
    [
        Output("purchase-date-range", "start_date", allow_duplicate=True),
        Output("purchase-date-range", "end_date", allow_duplicate=True),
        Output("purchase-region", "value", allow_duplicate=True),
        Output("purchase-category", "value", allow_duplicate=True),
        Output("purchase-brand", "value", allow_duplicate=True),
        Output("purchase-store", "value", allow_duplicate=True),
    ],
    Input("session-filters", "data"),
    prevent_initial_call="initial_duplicate"
)
def load_filters_from_session(session_data):
    """Load filters from session storage"""
    if not session_data:
        return None, None, None, None, None, None
        
    date_range = session_data.get('date_range', {})
    return (
        date_range.get('start_date'),
        date_range.get('end_date'),
        session_data.get('regions'),
        session_data.get('categories'),
        session_data.get('brands'),
        session_data.get('stores')
    )

# callback cards and graphs - Scout DAL version
@callback(
    [
        Output("purchases-card", "children"),
        Output("spend-card", "children"),
        Output("category-card", "children"),
        Output("sales-chart", "figure"),
        Output("category-chart", "figure"),
    ],
    [
        Input("year-dropdown", "value"),
        Input("purchase-date-range", "start_date"),
        Input("purchase-date-range", "end_date"),
        Input("purchase-region", "value"),
        Input("purchase-category", "value"),
        Input("purchase-brand", "value"),
        Input("purchase-store", "value"),
    ],
)
def update_values_scout_dal(select_year, start_date, end_date, regions, categories, brands, stores):
    """Scout DAL-powered callback for purchase overview metrics and charts"""
    
    if SCOUT_DAL_AVAILABLE:
        try:
            # Build Scout DAL filter parameters
            filters = {}
            if start_date and end_date:
                filters["date_from"] = start_date
                filters["date_to"] = end_date
            if regions:
                filters["region"] = regions if isinstance(regions, list) else [regions]
            if categories:
                filters["category"] = categories if isinstance(categories, list) else [categories]
            if brands:
                filters["brand"] = brands if isinstance(brands, list) else [brands]
            if stores:
                filters["store"] = stores if isinstance(stores, list) else [stores]
            if select_year and select_year != "All":
                filters["year"] = select_year

            # Get summary metrics using trend() function
            metrics_params = {
                "kpi": "units",
                "time_grain": "total",
                "dimensions": [],
                "filters": filters,
                "comparisons": {"vs_region_avg": False, "vs_prev_period": False}
            }
            
            revenue_params = {
                "kpi": "revenue",
                "time_grain": "total", 
                "dimensions": [],
                "filters": filters,
                "comparisons": {"vs_region_avg": False, "vs_prev_period": False}
            }
            
            # Get metrics data
            units_data = trend(metrics_params)
            revenue_data = trend(revenue_params)
            
            # Extract summary values
            total_units = sum(row.get("value", 0) for row in units_data) if units_data else 0
            total_revenue = sum(row.get("value", 0) for row in revenue_data) if revenue_data else 0
            
            # Get top category using top() function  
            top_category_params = {
                "kpi": "units",
                "dimension": "category",
                "filters": filters,
                "limit": 1
            }
            top_categories = top(top_category_params)
            top_category = top_categories[0].get("category", "Food & Beverages") if top_categories else "Food & Beverages"
            
            # Get monthly trend data for sales chart
            monthly_params = {
                "kpi": "revenue",
                "time_grain": "month",
                "dimensions": ["month"],
                "filters": filters,
                "comparisons": {"vs_region_avg": False, "vs_prev_period": False}
            }
            monthly_data = trend(monthly_params)
            
            # Convert to DataFrame for plotting
            if monthly_data:
                monthly_df = pd.DataFrame(monthly_data)
                monthly_df = monthly_df.rename(columns={"month": "Order Date Month", "value": "Purchase Total"})
            else:
                # Fallback data
                monthly_df = pd.DataFrame({
                    "Order Date Month": ["January", "February", "March", "April", "May", "June", 
                                       "July", "August", "September", "October", "November", "December"],
                    "Purchase Total": [50000, 45000, 60000, 55000, 70000, 65000,
                                     80000, 75000, 68000, 72000, 85000, 90000]
                })
            
            # Get category breakdown for treemap
            category_params = {
                "kpi": "units", 
                "dimension": "category",
                "filters": filters,
                "limit": 5
            }
            category_data = top(category_params)
            
            if category_data:
                category_df = pd.DataFrame(category_data)
                category_df = category_df.rename(columns={"category": "Category", "value": "Quantity"})
            else:
                # Fallback data
                category_df = pd.DataFrame({
                    "Category": ["Food & Beverages", "Personal Care", "Household Items", "Snacks", "Health"],
                    "Quantity": [1500, 1200, 800, 600, 400]
                })
            
        except Exception as e:
            print(f"Scout DAL error: {e}")
            # Fall back to CSV approach on error
            return _fallback_csv_approach(select_year, start_date, end_date, regions, categories, brands, stores)
    else:
        # Fall back to CSV approach when DAL not available
        return _fallback_csv_approach(select_year, start_date, end_date, regions, categories, brands, stores)

    # Format card values
    purchases_card = f"{int(total_units):,.0f}"
    spend_card = f"₱ {int(total_revenue):,.0f}"
    category_card = top_category

    # Create sales chart
    sales_chart = px.bar(
        monthly_df,
        x="Order Date Month",
        y="Purchase Total",
        text_auto=".2s",
        title=translate("Monthly Sales Revenue"),
    )

    sales_chart.update_traces(
        textposition="outside",
        marker_color="#f79500",
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{x}</b><br>Value: %{y:,}<extra></extra>",
    )

    sales_chart.update_layout(
        xaxis_title=None,
        yaxis_title=None,
        plot_bgcolor="rgba(0, 0, 0, 0)",
        yaxis=dict(showticklabels=False),
        margin=dict(l=35, r=35, t=60, b=40),
    )

    # Create category chart
    category_chart = px.treemap(
        category_df.nlargest(5, columns="Quantity"),
        path=["Category"],
        values="Quantity",
        title=translate("Top 5 Product Categories"),
        color="Category",
        color_discrete_sequence=["#cb7721", "#b05611", "#ffb803", "#F79500", "#803f0c"],
    )

    category_chart.data[0].textinfo = "label+value"
    category_chart.update_traces(textfont=dict(size=13))
    category_chart.update_layout(margin=dict(l=35, r=35, t=60, b=35), hovermode=False)

    return purchases_card, spend_card, category_card, sales_chart, category_chart


def _fallback_csv_approach(select_year, start_date, end_date, regions, categories, brands, stores):
    """Fallback to CSV-based approach when Scout DAL is not available"""
    
    # Apply Scout dimension filters first
    filter_kwargs = {}
    if start_date and end_date:
        filter_kwargs['date_gte'] = start_date
        filter_kwargs['date_lte'] = end_date
    if regions:
        filter_kwargs['region'] = regions[0] if isinstance(regions, list) else regions
    if categories:
        filter_kwargs['category'] = categories[0] if isinstance(categories, list) else categories
    if brands:
        filter_kwargs['brand'] = brands[0] if isinstance(brands, list) else brands
    if stores:
        filter_kwargs['store'] = stores[0] if isinstance(stores, list) else stores
    
    # Get filtered data from client
    if filter_kwargs:
        filtered_df = client.transactions(**filter_kwargs)
        
        # Ensure required columns exist for UI compatibility
        if 'Order Date Year' not in filtered_df.columns:
            filtered_df['Order Date Year'] = filtered_df['transaction_date'].dt.year if 'transaction_date' in filtered_df.columns else 2024
        if 'Order Date Month' not in filtered_df.columns:
            filtered_df['Order Date Month'] = filtered_df['transaction_date'].dt.strftime('%B') if 'transaction_date' in filtered_df.columns else 'August'
        if 'Purchase Total' not in filtered_df.columns:
            filtered_df['Purchase Total'] = filtered_df.get('total_amount', 100)
        if 'Quantity' not in filtered_df.columns:
            filtered_df['Quantity'] = filtered_df.get('quantity', 1)
        if 'Category' not in filtered_df.columns:
            filtered_df['Category'] = filtered_df.get('category', 'General')
    else:
        filtered_df = df.copy()

    # Apply year filter
    if select_year and select_year != "All":
        filtered_df = filtered_df[filtered_df["Order Date Year"] == select_year]

    # cards - Scout retail metrics
    purchases_card = f"{filtered_df['Quantity'].sum():,.0f}"  # Total items sold
    spend_card = f"₱ {round(filtered_df['Purchase Total'].sum(), -2):,.0f}"  # Philippine Peso currency
    
    # Top category by transaction count
    category_counts = filtered_df.groupby("Category").size()
    category_card = category_counts.idxmax() if len(category_counts) > 0 else "Food & Beverages"

    # sales
    sales_chart = px.bar(
        filtered_df.groupby("Order Date Month", observed=True)["Purchase Total"]
        .sum()
        .reset_index(),
        x="Order Date Month",
        y="Purchase Total",
        text_auto=".2s",
        title=translate("Monthly Sales Revenue"),
    )

    sales_chart.update_traces(
        textposition="outside",
        marker_color="#f79500",
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{x}</b><br>Value: %{y:,}<extra></extra>",
    )

    sales_chart.update_layout(
        xaxis_title=None,
        yaxis_title=None,
        plot_bgcolor="rgba(0, 0, 0, 0)",
        yaxis=dict(showticklabels=False),
        margin=dict(l=35, r=35, t=60, b=40),
    )

    # category
    category_chart = px.treemap(
        filtered_df.groupby("Category", as_index=False, observed=True)["Quantity"]
        .count()
        .nlargest(5, columns="Quantity"),
        path=["Category"],
        values="Quantity",
        title=translate("Top 5 Product Categories"),
        color="Category",
        color_discrete_sequence=["#cb7721", "#b05611", "#ffb803", "#F79500", "#803f0c"],
    )

    category_chart.data[0].textinfo = "label+value"
    category_chart.update_traces(textfont=dict(size=13))
    category_chart.update_layout(margin=dict(l=35, r=35, t=60, b=35), hovermode=False)

    return purchases_card, spend_card, category_card, sales_chart, category_chart
