import dash
from dash import callback, dcc, html, Output, Input, State
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.express as px
from utils.data_access import get_data_client
from utils.i18n import translate
from utils.filters import scout_filters, get_filter_values_from_store, build_filter_dict
import json

dash.register_page(
    __name__,
    suppress_callback_exceptions=True,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    path="/customer_demographics",
)

# dataset - Scout demographics via DAL
client = get_data_client()
df = client.demographics()  # This will use scout.gold_demographic_bins_v

# Load geojson data
with open('data/geo/ph_regions.geojson', 'r') as f:
    geojson = json.load(f)

# Create region mapping for demographics
if 'region' not in df.columns:
    df['region'] = 'Metro Manila'  # fallback
if 'gender' not in df.columns:
    df['gender'] = df.get('Q-demos-gender', 'Female')  # fallback with existing Amazon column
if 'age_bracket' not in df.columns:
    df['age_bracket'] = df.get('Q-demos-age', '25 - 34')  # fallback
if 'education' not in df.columns:
    df['education'] = df.get('Q-demos-education', "Bachelor's degree")  # fallback

# layout
layout = dbc.Container(
    [
        html.Div(
            [
                html.H2(
                    translate("Customer demographics"),  # title
                    className="title",
                ),
                # Scout filter panel
                scout_filters.create_filter_panel("demographics"),
                html.H3(
                    id="customer-count-display",  # dynamic count from filtered data
                    className="subtitle-small",
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dcc.Loading(
                                dcc.Graph(
                                    id="gender-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "280px"},
                                ),
                                type="circle",
                                color="#f79500",
                            ),
                            width=4,
                        ),
                        dbc.Col(
                            dcc.Loading(
                                dcc.Graph(
                                    id="age-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "280px"},
                                ),
                                type="circle",
                                color="#f79500",
                            ),
                            width=4,
                        ),
                        dbc.Col(
                            dcc.Loading(
                                dcc.Graph(
                                    id="education-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "280px"},
                                ),
                                type="circle",
                                color="#f79500",
                            ),
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
                                    id="region-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "337px"},
                                ),
                                type="circle",
                                color="#f79500",
                            ),
                            width=6,
                        ),
                        dbc.Col(
                            dcc.Loading(
                                dcc.Graph(
                                    id="income-chart",
                                    config={"displayModeBar": False},
                                    className="chart-card",
                                    style={"height": "337px"},
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
        Input("demographics-date-range", "start_date"),
        Input("demographics-date-range", "end_date"),
        Input("demographics-region", "value"),
        Input("demographics-category", "value"),
        Input("demographics-brand", "value"),
        Input("demographics-store", "value"),
        Input("demographics-global-filters", "value"),
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
        Output("demographics-date-range", "start_date"),
        Output("demographics-date-range", "end_date"),
        Output("demographics-region", "value"),
        Output("demographics-category", "value"),
        Output("demographics-brand", "value"),
        Output("demographics-store", "value"),
    ],
    Input("demographics-clear-filters", "n_clicks"),
    prevent_initial_call=True
)
def clear_filters(n_clicks):
    if n_clicks:
        return None, None, None, None, None, None
    return dash.no_update

# Load filters from session on page load
@callback(
    [
        Output("demographics-date-range", "start_date", allow_duplicate=True),
        Output("demographics-date-range", "end_date", allow_duplicate=True),
        Output("demographics-region", "value", allow_duplicate=True),
        Output("demographics-category", "value", allow_duplicate=True),
        Output("demographics-brand", "value", allow_duplicate=True),
        Output("demographics-store", "value", allow_duplicate=True),
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

# callback cards and graphs
@callback(
    [
        Output("customer-count-display", "children"),
        Output("gender-chart", "figure"),
        Output("age-chart", "figure"),
        Output("education-chart", "figure"),
        Output("region-chart", "figure"),
        Output("income-chart", "figure"),
    ],
    [
        Input("demographics-date-range", "start_date"),
        Input("demographics-date-range", "end_date"),
        Input("demographics-region", "value"),
        Input("demographics-category", "value"),
        Input("demographics-brand", "value"),
        Input("demographics-store", "value"),
    ],
)
def update_chart(start_date, end_date, regions, categories, brands, stores):

    # Apply Scout dimension filters to get demographic data
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
    
    # Get filtered demographic data
    df = client.demographics(**filter_kwargs)
    
    # Ensure fallback columns exist
    if 'region' not in df.columns:
        df['region'] = 'Metro Manila'
    if 'gender' not in df.columns:
        df['gender'] = df.get('Q-demos-gender', 'Female')
    if 'age_bracket' not in df.columns:
        df['age_bracket'] = df.get('Q-demos-age', '25 - 34')
    if 'education' not in df.columns:
        df['education'] = df.get('Q-demos-education', "Bachelor's degree")
    if 'Q-demos-income' not in df.columns:
        df['Q-demos-income'] = 'Under $25K'
    
    customer_count = f"{len(df):,} Customers"

    # gender
    gender_chart = px.pie(
        df,
        names="gender",
        hole=0.4,
        color="gender",
        title=translate("Gender Distribution"),
        color_discrete_map={
            "Female": "#f79500",
            "Male": "#b05611",
            "Other": "#5e2d07",
            "Prefer not to say": "#5e2d07",
        },
    )

    gender_chart.update_traces(
        textposition="outside",
        textinfo="percent+label",
        rotation=180,
        showlegend=False,
        texttemplate="%{label}<br>%{percent:.1%}",
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{label}</b><br>Value: %{value:,}<br>",
    )

    gender_chart.update_layout(
        yaxis=dict(showticklabels=False), margin=dict(l=15, r=15, t=60, b=15)
    )

    # age
    age_counts = df["age_bracket"].value_counts().reset_index()
    age_counts.columns = ["age_bracket", "Count"]

    age_order = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
    age_counts["age_bracket"] = pd.Categorical(
        age_counts["age_bracket"], categories=age_order, ordered=True
    )

    age_counts = age_counts.sort_values(by="age_bracket")

    age_chart = px.bar(
        age_counts,
        x="age_bracket",
        y="Count",
        text_auto=".2s",
        text="Count",
        title=translate("Age Distribution"),
    )

    age_chart.update_traces(
        marker_color="#b05611",
        textposition="auto",
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{x}</b><br>Value: %{y:,}<extra></extra>",
    )

    age_chart.update_layout(
        xaxis_title=None,
        yaxis_title=None,
        plot_bgcolor="rgba(0, 0, 0, 0)",
        yaxis=dict(showticklabels=False),
        margin=dict(l=15, r=15, t=60, b=15),
    )

    # education
    education_counts = df["education"].value_counts().reset_index()
    education_counts.columns = ["education", "Count"]

    education_order = [
        "Elementary",
        "High School",
        "Vocational",
        "Bachelor's",
        "Master's",
        "Doctoral",
        "Other"
    ]
    education_counts["education"] = pd.Categorical(
        education_counts["education"], categories=education_order, ordered=True
    )

    education_counts = education_counts.sort_values(by="education")

    education_chart = px.bar(
        education_counts,
        y="education",
        x="Count",
        text_auto=".2s",
        text="Count",
        title=translate("Most Popular Categories"),
    )

    education_chart.update_traces(
        marker_color="#f79500",
        textposition="auto",
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{y}</b><br>Value: %{x:,}<extra></extra>",
    )

    education_chart.update_layout(
        xaxis_title=None,
        yaxis_title=None,
        plot_bgcolor="rgba(0, 0, 0, 0)",
        xaxis=dict(showticklabels=False),
        margin=dict(l=15, r=15, t=60, b=15),
    )

    # region (Philippines choropleth)
    df_filtered = df.dropna(subset=['region'])

    region_counts = df_filtered["region"].value_counts().reset_index()
    region_counts.columns = ["region", "Customers"]

    # Map region names to GeoJSON properties
    region_counts['region_key'] = region_counts['region'].map({
        'Metro Manila': 'NCR',
        'National Capital Region': 'NCR',
        'Ilocos Region': 'Region I',
        'Cagayan Valley': 'Region II',
        'Central Luzon': 'Region III',
        'CALABARZON': 'Region IV-A',
        'MIMAROPA': 'Region IV-B',
        'Bicol Region': 'Region V',
        'Western Visayas': 'Region VI',
        'Central Visayas': 'Region VII',
        'Eastern Visayas': 'Region VIII',
        'Zamboanga Peninsula': 'Region IX',
        'Northern Mindanao': 'Region X',
        'Davao Region': 'Region XI',
        'SOCCSKSARGEN': 'Region XII',
        'Caraga': 'Region XIII',
        'ARMM': 'ARMM',
        'CAR': 'CAR'
    }).fillna('NCR')

    custom_colorscale = [(0, "#ffb803"), (0.5, "#cb7721"), (1, "#803f0c")]

    region_chart = px.choropleth(
        region_counts,
        geojson=geojson,
        locations='region_key',
        featureidkey='properties.region_abbr',
        color='Customers',
        color_continuous_scale=custom_colorscale,
        title=translate("Users by State"),
        hover_data=['region'],
    )

    region_chart.update_geos(
        visible=False,
        fitbounds="locations"
    )

    region_chart.update_traces(
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{customdata[0]}</b><br>Customers: %{z:,}<extra></extra>",
    )

    region_chart.update_layout(
        margin=dict(l=15, r=15, t=60, b=15),
    )

    # income
    income_counts = df["Q-demos-income"].value_counts().reset_index()
    income_counts.columns = ["Q-demos-income", "Count"]

    income_order = [
        "Prefer not to say",
        "Over $150K",
        "$100 - $149.9K",
        "$75 - $99.9K",
        "$50 - $74.9K",
        "$25 - $49.9K",
        "Under $25K",
    ]
    income_counts["Q-demos-income"] = pd.Categorical(
        income_counts["Q-demos-income"], categories=income_order, ordered=True
    )

    income_counts = income_counts.sort_values(by="Q-demos-income")

    income_chart = px.bar(
        income_counts,
        y="Q-demos-income",
        x="Count",
        text_auto=".2s",
        text="Count",
        title="Household Income",
    )

    income_chart.update_traces(
        marker_color="#b05611",
        textposition="auto",
        hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.1)", font_size=12),
        hovertemplate="<b>%{y}</b><br>Value: %{x:,}<extra></extra>",
    )

    income_chart.update_layout(
        xaxis_title=None,
        yaxis_title=None,
        plot_bgcolor="rgba(0, 0, 0, 0)",
        xaxis=dict(showticklabels=False),
        margin=dict(l=15, r=15, t=60, b=15),
    )

    return (
        gender_chart,
        age_chart,
        education_chart,
        region_chart,
        income_chart,
    )
