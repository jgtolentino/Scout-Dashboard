import dash
import dash_bootstrap_components as dbc
from dash import Dash, dcc, html
from flask import request, jsonify

app = Dash(
    __name__,
    use_pages=True,
    title="Amazon Dashboard",
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
)
server = app.server

# Import Scout DAL functions (with error handling for missing modules)
try:
    from scout.dal import trend, top, geo, recommend
    SCOUT_AVAILABLE = True
except ImportError:
    SCOUT_AVAILABLE = False
    print("⚠️ Scout DAL not available - install dependencies: pip install jsonschema requests")

# --- Scout API Routes: Only proxy to Edge Functions with CSV fallback
@server.route("/api/scout/insights", methods=["POST"])
def api_insights():
    if not SCOUT_AVAILABLE:
        return jsonify({"error": "Scout DAL not available"}), 503
    
    payload = request.get_json(force=True) or {}
    try:
        mode = payload.get("mode")
        if mode == "top":
            return jsonify(top(payload))
        if mode == "geo":
            return jsonify(geo(payload))
        return jsonify(trend(payload))
    except Exception as e:
        # Optional CSV fallback if you pass a loader
        return jsonify({"error": str(e)}), 502

@server.route("/api/scout/recommend", methods=["POST"])
def api_recommend():
    if not SCOUT_AVAILABLE:
        return jsonify({"error": "Scout DAL not available"}), 503
    
    payload = request.get_json(force=True) or {}
    try:
        return jsonify(recommend(payload))
    except Exception as e:
        return jsonify({"error": str(e)}), 502

# sidebar
sidebar = html.Div(
    [
        dbc.Row(
            [html.Img(src="assets/logos/amazon.svg", style={"height": "35px"})],
            className="sidebar-logo",
        ),
        html.Hr(),
        dbc.Nav(
            [
                dbc.NavLink(
                    "Purchase Overview", href="/purchase_overview", active="exact"
                ),
                dbc.NavLink(
                    "Customer demographics",
                    href="/customer_demographics",
                    active="exact",
                ),
                dbc.NavLink(
                    "Book recommendation", href="/book_recommendation", active="exact"
                ),
            ],
            vertical=True,
            pills=True,
        ),
        html.Div(
            [
                html.Span("Created by "),
                html.A(
                    "Mayara Daher",
                    href="https://github.com/mayaradaher",
                    target="_blank",
                ),
                html.Br(),
                html.Span("Data Source "),
                html.A(
                    "MIT Publication",
                    href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/YGLYDY",
                    target="_blank",
                ),
            ],
            className="subtitle-sidebar",
            style={"position": "absolute", "bottom": "10px", "width": "100%"},
        ),
    ],
    className="sidebar",
)


content = html.Div(
    className="page-content",
)

# defining font-awesome (icons) and fonts
app.index_string = """
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        {%css%}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        <link rel="icon" href="/assets/logos/favicon.svg" type="image/x-icon">
    </head>
    <body>
        {%app_entry%}
        {%config%}
        {%scripts%}
        {%renderer%}
    </body>
</html>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
</style>
"""

# layout with session storage for cross-page filters
app.layout = html.Div(
    [
        dcc.Location(id="url", pathname="/purchase_overview"),
        # Session storage for cross-page filter persistence
        dcc.Store(id="session-filters", storage_type="session", data={}),
        sidebar,
        content,
        dash.page_container,
    ]
)

if __name__ == "__main__":
    app.run_server(debug=False)
