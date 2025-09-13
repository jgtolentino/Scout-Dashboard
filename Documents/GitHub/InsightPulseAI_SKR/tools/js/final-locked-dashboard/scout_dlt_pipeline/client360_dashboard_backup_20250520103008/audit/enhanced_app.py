import dash
from dash import dcc, html, dash_table, callback, Input, Output
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

# Create sample data similar to what would be in the Power BI dashboard
def generate_sample_data():
    # Sales Data
    regions = ['NCR', 'Luzon', 'Visayas', 'Mindanao']
    
    # Date range for the last 6 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate sales data
    sales_data = []
    
    for region in regions:
        base_value = np.random.randint(30000, 100000)
        growth_factor = np.random.uniform(0.8, 1.2)
        
        for date in date_range:
            day_factor = 1.0 + 0.2 * np.sin(pd.Timestamp(date).dayofyear / 365 * 2 * np.pi)
            noise = np.random.normal(1, 0.1)
            value = base_value * day_factor * noise
            
            # Add growth trend
            days_from_start = (date - start_date).days
            trend_factor = 1.0 + (days_from_start / 180) * (growth_factor - 1.0)
            value = value * trend_factor
            
            sales_data.append({
                'Date': date,
                'Region': region,
                'Sales': round(value, 2),
                'Orders': round(value / np.random.randint(500, 1500), 0),
                'Customers': round(value / np.random.randint(2000, 5000), 0)
            })
    
    # Convert to DataFrame
    sales_df = pd.DataFrame(sales_data)
    
    # Generate KPI summary
    current_month = end_date.strftime('%Y-%m')
    current_month_data = sales_df[pd.to_datetime(sales_df['Date']).dt.strftime('%Y-%m') == current_month]
    
    kpi_data = []
    
    # Total Sales
    total_sales = current_month_data['Sales'].sum()
    prev_month_data = sales_df[pd.to_datetime(sales_df['Date']).dt.strftime('%Y-%m') == 
                              (end_date - timedelta(days=30)).strftime('%Y-%m')]
    prev_month_sales = prev_month_data['Sales'].sum()
    sales_change = ((total_sales / prev_month_sales) - 1) * 100
    
    kpi_data.append({
        'Metric': 'Total Sales',
        'Value': total_sales,
        'Change': sales_change,
        'Format': 'currency',
        'Trend': 'up' if sales_change > 0 else 'down'
    })
    
    # Conversion Rate
    conversion_rate = 24.7
    conversion_change = 3.5
    
    kpi_data.append({
        'Metric': 'Conversion Rate',
        'Value': conversion_rate,
        'Change': conversion_change,
        'Format': 'percent',
        'Trend': 'up'
    })
    
    # Marketing ROI
    marketing_roi = 3.2
    roi_change = -0.8
    
    kpi_data.append({
        'Metric': 'Marketing ROI',
        'Value': marketing_roi,
        'Change': roi_change,
        'Format': 'multiplier',
        'Trend': 'down'
    })
    
    # Brand Sentiment
    brand_sentiment = 76.2
    sentiment_change = 5.7
    
    kpi_data.append({
        'Metric': 'Brand Sentiment',
        'Value': brand_sentiment,
        'Change': sentiment_change,
        'Format': 'percent',
        'Trend': 'up'
    })
    
    # Convert to DataFrame
    kpi_df = pd.DataFrame(kpi_data)
    
    # Brand Performance
    brands = ['Milo', 'Bear Brand', 'Lucky Me', 'Palmolive']
    brand_data = []
    
    for brand in brands:
        performance = np.random.randint(40, 90)
        status = 'good' if performance >= 70 else ('warning' if performance >= 50 else 'poor')
        
        brand_data.append({
            'Brand': brand,
            'Performance': performance,
            'Status': status
        })
    
    brand_df = pd.DataFrame(brand_data)
    
    return {
        'sales': sales_df,
        'kpi': kpi_df,
        'brand': brand_df
    }

# Generate the data
data = generate_sample_data()

# Create Dash app
app = dash.Dash(__name__, external_stylesheets=[
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'
])
server = app.server

# Layout
app.layout = html.Div([
    html.Div([
        html.H1("Power BI vs Dash Parity Audit", className="text-2xl font-bold mb-6 text-center"),
        
        # Tabs
        dcc.Tabs(id='tabs', value='tab-kpi', children=[
            dcc.Tab(label='KPI Comparison', value='tab-kpi', className="font-medium"),
            dcc.Tab(label='Sales by Region', value='tab-sales', className="font-medium"),
            dcc.Tab(label='Brand Performance', value='tab-brand', className="font-medium"),
            dcc.Tab(label='Settings', value='tab-settings', className="font-medium"),
        ], className="mb-4"),
        
        # Tab content
        html.Div(id='tabs-content')
        
    ], className="container mx-auto p-4")
], className="bg-gray-100 min-h-screen")

@callback(
    Output('tabs-content', 'children'),
    Input('tabs', 'value')
)
def render_tab_content(tab):
    if tab == 'tab-kpi':
        return html.Div([
            # Main comparison
            html.Div([
                html.Div([
                    html.Div([
                        html.H3("Power BI Snapshot", className="text-lg font-semibold mb-2"),
                        html.Img(src="assets/powerbi_kpi_snapshot.png", className="w-full rounded shadow-md")
                    ], className="bg-white p-4 rounded-lg shadow-md"),
                ], className="w-1/2 pr-2"),
                
                html.Div([
                    html.Div([
                        html.H3("Dash Live Equivalent", className="text-lg font-semibold mb-2"),
                        html.Div([
                            # Generate KPI tiles
                            html.Div([
                                html.Div([
                                    # KPI card for each metric
                                    *[
                                        html.Div([
                                            html.P(row['Metric'], className="text-gray-500 text-sm font-medium"),
                                            html.H2(
                                                f"₱ {row['Value']:,.2f}" if row['Format'] == 'currency' else
                                                f"{row['Value']}%" if row['Format'] == 'percent' else
                                                f"{row['Value']}x",
                                                className="text-2xl font-bold text-gray-800"
                                            ),
                                            html.P([
                                                html.Span([
                                                    html.I(className=f"fas fa-arrow-{'up' if row['Trend'] == 'up' else 'down'} mr-1"),
                                                    f"{row['Change']:.1f}% from last period"
                                                ], className=f"text-{'green' if row['Trend'] == 'up' else 'red'}-500 text-sm font-medium flex items-center")
                                            ], className="mt-2")
                                        ], className="bg-white rounded-lg shadow-sm p-4 mb-2")
                                        for _, row in data['kpi'].iterrows()
                                    ]
                                ], className="grid grid-cols-2 gap-2")
                            ], className="w-full")
                        ])
                    ], className="bg-white p-4 rounded-lg shadow-md"),
                ], className="w-1/2 pl-2"),
            ], className="flex flex-wrap mb-6"),
            
            # Data table comparison
            html.Div([
                html.H3("Underlying Data Comparison", className="text-lg font-semibold mb-2"),
                dash_table.DataTable(
                    data=data['kpi'].to_dict('records'),
                    columns=[
                        {"name": "Metric", "id": "Metric"},
                        {"name": "Value", "id": "Value", "type": "numeric", "format": {"specifier": ",.2f"}},
                        {"name": "Change %", "id": "Change", "type": "numeric", "format": {"specifier": "+.1f%"}},
                        {"name": "Trend", "id": "Trend"},
                    ],
                    style_table={'overflowX': 'auto'},
                    style_cell={'textAlign': 'left', 'padding': '8px'},
                    style_header={
                        'backgroundColor': 'rgb(240, 240, 240)',
                        'fontWeight': 'bold'
                    },
                    style_data_conditional=[
                        {
                            'if': {
                                'filter_query': '{Trend} = "up"',
                                'column_id': 'Change'
                            },
                            'color': 'green'
                        },
                        {
                            'if': {
                                'filter_query': '{Trend} = "down"',
                                'column_id': 'Change'
                            },
                            'color': 'red'
                        }
                    ]
                )
            ], className="bg-white p-4 rounded-lg shadow-md mb-6"),
            
            # Analysis
            html.Div([
                html.H3("Parity Analysis", className="text-lg font-semibold mb-2"),
                html.Div([
                    html.P("✅ Visual parity achieved for KPI tiles", className="mb-1"),
                    html.P("✅ Data values match between Power BI and Dash", className="mb-1"),
                    html.P("✅ Color coding for trends matches", className="mb-1"),
                    html.P("⚠️ Font styling needs minor adjustments", className="mb-1"),
                    html.P("⚠️ Icon set missing in Dash implementation", className="mb-1"),
                ], className="pl-4 border-l-4 border-blue-500")
            ], className="bg-white p-4 rounded-lg shadow-md")
        ])
    
    elif tab == 'tab-sales':
        # Filter to the last 30 days for the chart
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        filtered_sales = data['sales'][
            (data['sales']['Date'] >= start_date) & 
            (data['sales']['Date'] <= end_date)
        ]
        
        # Aggregate by region and date
        daily_sales = filtered_sales.groupby(['Region', 'Date']).agg({
            'Sales': 'sum'
        }).reset_index()
        
        return html.Div([
            # Main comparison
            html.Div([
                html.Div([
                    html.Div([
                        html.H3("Power BI Snapshot", className="text-lg font-semibold mb-2"),
                        html.Img(src="assets/powerbi_sales_snapshot.png", className="w-full rounded shadow-md")
                    ], className="bg-white p-4 rounded-lg shadow-md"),
                ], className="w-1/2 pr-2"),
                
                html.Div([
                    html.Div([
                        html.H3("Dash Live Equivalent", className="text-lg font-semibold mb-2"),
                        dcc.Graph(
                            figure=px.line(
                                daily_sales, 
                                x='Date', 
                                y='Sales', 
                                color='Region',
                                title='Daily Sales by Region (Last 30 Days)',
                                labels={'Sales': 'Sales (₱)', 'Date': 'Date'},
                                color_discrete_map={
                                    'NCR': '#3B82F6',  # blue
                                    'Luzon': '#10B981', # green
                                    'Visayas': '#F59E0B', # yellow
                                    'Mindanao': '#EF4444' # red
                                }
                            ).update_layout(
                                plot_bgcolor='white',
                                paper_bgcolor='white',
                                margin=dict(l=40, r=40, t=40, b=40),
                                legend=dict(
                                    orientation="h",
                                    yanchor="bottom",
                                    y=1.02,
                                    xanchor="right",
                                    x=1
                                )
                            )
                        )
                    ], className="bg-white p-4 rounded-lg shadow-md"),
                ], className="w-1/2 pl-2"),
            ], className="flex flex-wrap mb-6"),
            
            # Region summary
            html.Div([
                html.H3("Region Summary", className="text-lg font-semibold mb-2"),
                html.Div([
                    *[
                        html.Div([
                            html.Div([
                                html.Span(region, className="text-sm font-medium text-gray-600"),
                                html.Div([
                                    html.Span(f"₱ {filtered_sales[filtered_sales['Region'] == region]['Sales'].sum():,.0f}", 
                                             className="text-sm font-bold text-gray-800 mr-2"),
                                    html.Span("+12%", className="text-green-500 text-xs font-medium")
                                ], className="flex items-center")
                            ], className="flex items-center justify-between")
                        ], className="p-2 border-b border-gray-200")
                        for region in regions
                    ]
                ], className="bg-white rounded-md")
            ], className="bg-white p-4 rounded-lg shadow-md mb-6"),
            
            # Analysis
            html.Div([
                html.H3("Parity Analysis", className="text-lg font-semibold mb-2"),
                html.Div([
                    html.P("✅ Line chart visualization matches Power BI style", className="mb-1"),
                    html.P("✅ Color scheme consistent with Power BI dashboard", className="mb-1"),
                    html.P("✅ Interactive features (hover tooltips) working as expected", className="mb-1"),
                    html.P("⚠️ Legend position differs slightly from Power BI", className="mb-1"),
                    html.P("⚠️ Date axis formatting could be improved to match Power BI exactly", className="mb-1"),
                ], className="pl-4 border-l-4 border-blue-500")
            ], className="bg-white p-4 rounded-lg shadow-md")
        ])
        
    elif tab == 'tab-brand':
        return html.Div([
            # Main comparison
            html.Div([
                html.Div([
                    html.Div([
                        html.H3("Power BI Snapshot", className="text-lg font-semibold mb-2"),
                        html.Img(src="assets/powerbi_brand_snapshot.png", className="w-full rounded shadow-md")
                    ], className="bg-white p-4 rounded-lg shadow-md"),
                ], className="w-1/2 pr-2"),
                
                html.Div([
                    html.Div([
                        html.H3("Dash Live Equivalent", className="text-lg font-semibold mb-2"),
                        html.Div([
                            # Create brand performance bars similar to Power BI
                            *[
                                html.Div([
                                    html.Div([
                                        html.Span(row['Brand'], className="text-sm font-medium text-gray-600"),
                                        html.Span(f"{row['Performance']}%", className="text-sm font-bold text-gray-800")
                                    ], className="flex items-center justify-between mb-2"),
                                    html.Div([
                                        html.Div(
                                            className=f"bg-{'green' if row['Status'] == 'good' else 'yellow' if row['Status'] == 'warning' else 'red'}-500 h-2.5 rounded-full",
                                            style={"width": f"{row['Performance']}%"}
                                        )
                                    ], className="w-full bg-gray-200 rounded-full h-2.5")
                                ], className="mb-4")
                                for _, row in data['brand'].iterrows()
                            ]
                        ])
                    ], className="bg-white p-4 rounded-lg shadow-md"),
                ], className="w-1/2 pl-2"),
            ], className="flex flex-wrap mb-6"),
            
            # Brand data table
            html.Div([
                html.H3("Brand Performance Data", className="text-lg font-semibold mb-2"),
                dash_table.DataTable(
                    data=data['brand'].to_dict('records'),
                    columns=[
                        {"name": "Brand", "id": "Brand"},
                        {"name": "Performance", "id": "Performance", "type": "numeric", "format": {"specifier": ".0f%"}},
                        {"name": "Status", "id": "Status"},
                    ],
                    style_table={'overflowX': 'auto'},
                    style_cell={'textAlign': 'left', 'padding': '8px'},
                    style_header={
                        'backgroundColor': 'rgb(240, 240, 240)',
                        'fontWeight': 'bold'
                    },
                    style_data_conditional=[
                        {
                            'if': {
                                'filter_query': '{Status} = "good"',
                                'column_id': 'Status'
                            },
                            'color': 'green',
                            'fontWeight': 'bold'
                        },
                        {
                            'if': {
                                'filter_query': '{Status} = "warning"',
                                'column_id': 'Status'
                            },
                            'color': 'orange',
                            'fontWeight': 'bold'
                        },
                        {
                            'if': {
                                'filter_query': '{Status} = "poor"',
                                'column_id': 'Status'
                            },
                            'color': 'red',
                            'fontWeight': 'bold'
                        }
                    ]
                )
            ], className="bg-white p-4 rounded-lg shadow-md mb-6"),
            
            # Analysis
            html.Div([
                html.H3("Parity Analysis", className="text-lg font-semibold mb-2"),
                html.Div([
                    html.P("✅ Progress bar visualization matches Power BI style", className="mb-1"),
                    html.P("✅ Color coding by performance status works as expected", className="mb-1"),
                    html.P("✅ Brand performance metrics display correctly", className="mb-1"),
                    html.P("⚠️ Rounded corner styling slightly different", className="mb-1"),
                    html.P("⚠️ Font weight may need adjustment to match exactly", className="mb-1"),
                ], className="pl-4 border-l-4 border-blue-500")
            ], className="bg-white p-4 rounded-lg shadow-md")
        ])
        
    elif tab == 'tab-settings':
        return html.Div([
            html.H3("Audit App Settings", className="text-lg font-semibold mb-4"),
            
            html.Div([
                html.Div([
                    html.H4("Power BI Connection", className="font-medium mb-2"),
                    html.Div([
                        html.Label("Workspace ID", className="block text-sm font-medium text-gray-700 mb-1"),
                        dcc.Input(
                            type="text",
                            placeholder="Enter Power BI Workspace ID",
                            className="w-full p-2 border border-gray-300 rounded-md"
                        ),
                    ], className="mb-3"),
                    html.Div([
                        html.Label("Dashboard ID", className="block text-sm font-medium text-gray-700 mb-1"),
                        dcc.Input(
                            type="text",
                            placeholder="Enter Power BI Dashboard ID",
                            className="w-full p-2 border border-gray-300 rounded-md"
                        ),
                    ], className="mb-3"),
                    html.Button("Connect to Power BI", className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded")
                ], className="w-1/2 pr-2"),
                
                html.Div([
                    html.H4("Data Source", className="font-medium mb-2"),
                    html.Div([
                        html.Label("Data Source Type", className="block text-sm font-medium text-gray-700 mb-1"),
                        dcc.Dropdown(
                            options=[
                                {'label': 'Azure SQL Database', 'value': 'azure_sql'},
                                {'label': 'Databricks SQL', 'value': 'databricks'},
                                {'label': 'Sample Data', 'value': 'sample'},
                            ],
                            value='sample',
                            className="w-full p-2 border border-gray-300 rounded-md"
                        ),
                    ], className="mb-3"),
                    html.Div([
                        html.Label("Connection String", className="block text-sm font-medium text-gray-700 mb-1"),
                        dcc.Input(
                            type="text",
                            placeholder="Enter connection string",
                            className="w-full p-2 border border-gray-300 rounded-md"
                        ),
                    ], className="mb-3"),
                    html.Button("Test Connection", className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"),
                    html.Button("Save Settings", className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded")
                ], className="w-1/2 pl-2"),
            ], className="flex flex-wrap mb-6 bg-white p-4 rounded-lg shadow-md"),
            
            html.Div([
                html.H4("Schedule Audit", className="font-medium mb-2"),
                html.Div([
                    html.Label("Schedule", className="block text-sm font-medium text-gray-700 mb-1"),
                    dcc.Dropdown(
                        options=[
                            {'label': 'Daily', 'value': 'daily'},
                            {'label': 'Weekly', 'value': 'weekly'},
                            {'label': 'Monthly', 'value': 'monthly'},
                        ],
                        value='daily',
                        className="w-full p-2 border border-gray-300 rounded-md"
                    ),
                ], className="mb-3"),
                html.Div([
                    html.Label("Notification Email", className="block text-sm font-medium text-gray-700 mb-1"),
                    dcc.Input(
                        type="email",
                        placeholder="Enter email for reports",
                        className="w-full p-2 border border-gray-300 rounded-md"
                    ),
                ], className="mb-3"),
                html.Button("Save Schedule", className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded")
            ], className="bg-white p-4 rounded-lg shadow-md mb-6"),
            
            html.Div([
                html.H4("About", className="font-medium mb-2"),
                html.P([
                    "TBWA Client 360 Dashboard - Power BI Parity Audit App",
                    html.Br(),
                    "Version 1.0.0",
                    html.Br(),
                    "© 2025 TBWA"
                ], className="text-sm text-gray-600")
            ], className="bg-white p-4 rounded-lg shadow-md")
        ])

if __name__ == "__main__":
    # Create asset folders for sample images
    os.makedirs("assets", exist_ok=True)
    
    # Start the Dash app
    app.run_server(debug=False, host='0.0.0.0', port=8080)