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
    dev_tools_silence_routes_logging=True,
)
server = app.server

# Import Scout DAL functions (with error handling for missing modules)
try:
    from scout.dal import trend, top, geo, ai
    from scout.spec_validate import validate_spec
    SCOUT_AVAILABLE = True
except ImportError:
    SCOUT_AVAILABLE = False
    print("⚠️ Scout DAL not available - install dependencies: pip install jsonschema requests")

# --- JSON Prompting API (InsightSpec / RecommendationSpec)
@server.route("/api/ai", methods=["POST"])
def api_ai():
    if not SCOUT_AVAILABLE:
        return jsonify({"error": "Scout DAL not available"}), 503
    try:
        payload = request.get_json(force=True, silent=False)
        ok, errs = validate_spec(payload or {})
        if not ok:
            return jsonify({"error":"invalid_spec","details":errs}), 400
        return jsonify(ai(payload))
    except Exception as e:
        return jsonify({"error":str(e)}), 500

# --- Thin read APIs backing callbacks
@server.route("/api/trend", methods=["POST"])
def api_trend():
    if not SCOUT_AVAILABLE:
        return jsonify({"error": "Scout DAL not available"}), 503
    return jsonify(trend(request.get_json(force=True) or {}))

@server.route("/api/top", methods=["POST"])  
def api_top():
    if not SCOUT_AVAILABLE:
        return jsonify({"error": "Scout DAL not available"}), 503
    return jsonify(top(request.get_json(force=True) or {}))

@server.route("/api/geo", methods=["POST"])
def api_geo():
    if not SCOUT_AVAILABLE:
        return jsonify({"error": "Scout DAL not available"}), 503
    return jsonify(geo(request.get_json(force=True) or {}))

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
