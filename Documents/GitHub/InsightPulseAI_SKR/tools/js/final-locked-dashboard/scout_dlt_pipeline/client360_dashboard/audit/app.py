import dash
from dash import dcc, html
import plotly.express as px
import pandas as pd

# 1. Fetch the same data source as Power BI (e.g. from Databricks SQL endpoint)
#    Replace with your own connection logic
df = pd.read_csv('https://<your-storage>/data/kpi_tiles.csv')

app = dash.Dash(__name__)
server = app.server

app.layout = html.Div([
    html.H1("Power BI vs Dash Parity Audit"),
    html.Div([
        html.Div([
            html.H3("Power BI Snapshot"),
            html.Img(src="https://<powerbi-snapshot-url>/tile.png", style={'width':'100%'}),
        ], style={'width':'48%','display':'inline-block','vertical-align':'top'}),
        html.Div([
            html.H3("Dash Live"),
            dcc.Graph(
                figure=px.bar(df, x='Metric', y='Value', title='Total Sales')
            )
        ], style={'width':'48%','display':'inline-block','vertical-align':'top','marginLeft':'4%'})
    ])
])

if __name__ == "__main__":
    app.run_server(debug=False, host='0.0.0.0', port=8080)