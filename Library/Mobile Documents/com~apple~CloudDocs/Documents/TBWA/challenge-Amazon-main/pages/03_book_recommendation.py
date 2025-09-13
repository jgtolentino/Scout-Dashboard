import dash
from dash import callback, dcc, html, Output, Input, State, dash_table
import dash_bootstrap_components as dbc
import pandas as pd
import requests
import json
from utils.data_access import get_data_client
from utils.i18n import translate
from utils.filters import scout_filters, get_filter_values_from_store, build_filter_dict

dash.register_page(
    __name__,
    suppress_callback_exceptions=True,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    path="/book_recommendation",
)

# Supabase Edge Function URLs
SARI_SARI_EXPERT_URL = "https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/sari-sari-expert-advanced"
SARI_SARI_RAG_URL = "https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/sari-sari-rag"

# dataset - Scout transaction data via DAL
client = get_data_client()
df = client.transactions()

# Ensure required columns exist with fallbacks for user recommendations
if 'customer_id' in df.columns:
    df['Survey ResponseID'] = df['customer_id']
else:
    df['Survey ResponseID'] = range(len(df))  # fallback

# Create grouped purchase data structure similar to original JSON
grouped_data = []
for customer_id in df['Survey ResponseID'].unique()[:10]:  # Top 10 customers
    customer_data = df[df['Survey ResponseID'] == customer_id]
    if len(customer_data) > 0:
        # Create demographic info
        demographic = {
            "customer_id": customer_id,
            "region": customer_data['region'].iloc[0] if 'region' in customer_data.columns else 'Unknown',
            "category_preference": customer_data['category'].value_counts().index[0] if 'category' in customer_data.columns else 'General'
        }
        
        # Create purchase history
        purchases = []
        for _, row in customer_data.iterrows():
            purchase = {
                "title": row.get('product_name', f"Product {row.get('product_id', 'Unknown')}"),
                "authors": row.get('brand', 'Unknown Brand'),
                "categories": row.get('category', 'General')
            }
            purchases.append(purchase)
        
        grouped_data.append({
            "Survey ResponseID": customer_id,
            "demographic": demographic,
            "books": purchases
        })

# Convert to DataFrame format expected by the UI
df = pd.DataFrame(grouped_data)


# extract personal user information
def get_user_info(user_id):
    try:
        user_row = df.loc[df["Survey ResponseID"] == user_id]
        if user_row.empty:
            print(f"User ID {user_id} not found.")
            return None

        user_info = user_row.iloc[0].to_dict()
        return user_info
    except Exception as e:
        print(f"Error fetching user info: {e}")
        return None


# extract user book purchases
def create_books_table(purchases):
    data = [
        {
            "Title": book["title"],
            "Author": book["authors"],
            "Category": book["categories"],
        }
        for book in purchases
    ]

    table = dash_table.DataTable(
        columns=[
            {"name": "Title", "id": "Title"},
            {"name": "Author", "id": "Author"},
            {"name": "Category", "id": "Category"},
        ],
        data=data,
        cell_selectable=False,
        filter_action="native",
        sort_action="native",
        sort_by=[
            {"column_id": "Title", "direction": "asc"},
            {"column_id": "Author", "direction": "asc"},
            {"column_id": "Category", "direction": "asc"},
        ],
        page_size=5,
        style_header={
            "fontFamily": "Inter, sans-serif",
            "font-size": "14px",
            "textAlign": "right",
            "fontWeight": "bold",
            "color": "#3a4552",
        },
        style_cell={
            "fontFamily": "Inter, sans-serif",
            "font-size": "14px",
            "textAlign": "left",
            "padding": "5px",
            "border": "1px solid #ececec",
            "whiteSpace": "normal",
            "overflow": "hidden",
            "textOverflow": "ellipsis",
        },
        style_cell_conditional=[
            {
                "if": {"column_id": "Title"},
                "width": "225px",
            },
            {
                "if": {"column_id": "Author"},
                "width": "225px",
            },
            {
                "if": {"column_id": "Category"},
                "width": "150px",
            },
        ],
        style_filter={
            "color": "#fff",  # filter icon
            "backgroundColor": "#fff",  # filter cell
        },
    )

    return table


# extract product recommendations using Supabase Edge Functions
def get_recommendation(query, user_info):
    try:
        demographic_info = user_info["demographic"]
        product_info = user_info["books"]  # Still called "books" for UI compatibility

        user_context = " ".join(
            [f"{key}: {value}" for key, value in demographic_info.items()]
        )

        purchased_products = " ".join(
            [
                f"{product['title']} by {product['authors']} ({product['categories']})"
                for product in product_info
            ]
        )

        # Create user context for the recommendation system
        query_with_context = f"User profile: {user_context}. Previous purchases: {purchased_products}. Recommendation request: {query}"

        # Try the expert function first
        payload = {
            "query": query_with_context,
            "user_context": {
                "demographic": demographic_info,
                "purchase_history": product_info
            }
        }

        try:
            # Call Sari-Sari Expert Advanced function
            expert_response = requests.post(
                SARI_SARI_EXPERT_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if expert_response.status_code == 200:
                expert_data = expert_response.json()
                if 'recommendation' in expert_data:
                    return expert_data['recommendation']
                elif 'response' in expert_data:
                    return expert_data['response']
                elif 'data' in expert_data:
                    return expert_data['data']
                else:
                    return expert_data.get('message', str(expert_data))
            
        except requests.RequestException as e:
            print(f"Expert function failed: {e}")
            
        # Fallback to RAG function
        try:
            rag_response = requests.post(
                SARI_SARI_RAG_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if rag_response.status_code == 200:
                rag_data = rag_response.json()
                if 'recommendation' in rag_data:
                    return rag_data['recommendation']
                elif 'response' in rag_data:
                    return rag_data['response']
                elif 'data' in rag_data:
                    return rag_data['data']
                else:
                    return rag_data.get('message', str(rag_data))
                    
        except requests.RequestException as e:
            print(f"RAG function failed: {e}")
            
        # If both functions fail, provide a fallback response
        return "I apologize, but our recommendation system is currently unavailable. Please try again later."
        
    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        return "Sorry, I couldn't process your request."


# layout
layout = dbc.Container(
    [
        html.Div(
            [
                dbc.Row(
                    [
                        dbc.Col(
                            html.H2(
                                [
                                    translate("Book recommendation Chatbot"),
                                    html.Span(
                                        html.I(
                                            className="fa fa-info-circle",
                                            style={
                                                "fontSize": "18px",
                                                "color": "#f79500",
                                            },
                                        ),
                                        id="info-button",
                                        title="Click here for more information",
                                        style={
                                            "margin-left": "12px",
                                            "cursor": "pointer",
                                        },
                                    ),
                                ],
                                className="title",
                                style={
                                    "display": "flex",
                                    "align-items": "center",
                                },
                            ),
                            width=12,
                        ),
                    ]
                ),
                # Scout filter panel
                scout_filters.create_filter_panel("recommendation"),
                dbc.Tooltip(
                    translate("This page offers personalized product suggestions generated by our AI recommendation system, which analyzes each customer's profile and purchase history. To demonstrate how the recommendations work, we selected the 10 customers with the highest transaction volumes."),
                    target="info-button",
                    placement="right",
                    trigger="click",
                    className="tooltip-inner",
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    html.H4(
                                        translate("Instructions"),
                                        className="subtitle-medium",
                                    ),
                                    html.Br(),
                                    html.H3(
                                        translate("1. Select Customer"),
                                        className="subtitle-small",
                                    ),
                                    dbc.Row(
                                        [
                                            dbc.Col(
                                                [
                                                    dcc.Dropdown(
                                                        id="user-id-dropdown",
                                                        options=[
                                                            {
                                                                "label": f"Customer {user_id}",
                                                                "value": user_id,
                                                            }
                                                            for user_id in df[
                                                                "Survey ResponseID"
                                                            ]
                                                        ],
                                                        placeholder="Customer ID",
                                                        className="custom-dropdown",
                                                    ),
                                                ],
                                                width=3,
                                            ),
                                        ]
                                    ),
                                    html.Br(),
                                    html.Br(),
                                    html.H3(
                                        children=[
                                            "2. Please start your query with the word ",
                                            html.Span(
                                                "Book", style={"fontWeight": "bold"}
                                            ),
                                            ". For example:",
                                        ],
                                        className="subtitle-small",
                                    ),
                                    dcc.Markdown(
                                        """
                                        - Book like The Chronicles of Narnia
                                        - Book written by George Orwell
                                        - Book with a plot twist ending
                                        - Book adapted into a movie
                                        - Book translated into multiple languages
                                        - Book that won the Nobel Prize in Literature
                                        """,
                                        className="subtitle-small",
                                    ),
                                    dbc.Row(
                                        [
                                            dbc.Col(
                                                [
                                                    dcc.Input(
                                                        id="query-input",
                                                        placeholder="Ask me for book recommendations",
                                                        className="search-input",
                                                    ),
                                                ],
                                            ),
                                        ]
                                    ),
                                    html.Br(),
                                    html.Br(),
                                    html.Button(
                                        [
                                            "Search",
                                            html.I(
                                                className="fa fa-search",
                                                style={"margin-left": "10px"},
                                            ),
                                        ],
                                        id="submit-button",
                                        n_clicks=0,
                                        className="btn-custom",
                                    ),
                                ],
                                className="card",
                                style={"padding": "25px"},
                            ),
                            width=12,
                        ),
                    ],
                ),
                html.Br(),
                dcc.Loading(
                    id="loading-recommendations",
                    type="circle",
                    color="#f79500",
                    children=[
                        html.Div(
                            id="user-info-output",
                            style={"padding": "0px 25px 15px 25px"},
                        ),
                        html.Div(
                            id="books-output",
                            style={"padding": "25px 25px 0px 25px"},
                        ),
                    ],
                ),
                html.Div(
                    id="recommendations-output",
                    style={"padding": "25px 25px 20px 25px"},
                ),
            ],
            className="page-content",
        )
    ],
    fluid=True,
)


# callback personal user information, user book purchases and books recommendations
@callback(
    [
        Output("user-info-output", "children"),
        Output("books-output", "children"),
        Output("recommendations-output", "children"),
    ],
    [
        Input("submit-button", "n_clicks"),
        Input("recommendation-date-range", "start_date"),
        Input("recommendation-date-range", "end_date"),
        Input("recommendation-region", "value"),
        Input("recommendation-category", "value"),
        Input("recommendation-brand", "value"),
        Input("recommendation-store", "value"),
    ],
    [
        State("query-input", "value"),
        State("user-id-dropdown", "value"),
    ],
)
def update_recommendations(n_clicks, start_date, end_date, regions, categories, brands, stores, query, user_id):
    if n_clicks > 0:
        warnings = []

        # check if the user is selected
        user_warning = "Please select a User."
        if user_id is None:
            warnings.append(
                html.P(
                    user_warning,
                    className="text-danger",
                )
            )

        # check if there is a query and if it starts with "Book"
        query_warning = "Please start your query with the word 'Book'."
        if not query or not query.lower().startswith("book"):
            warnings.append(
                html.P(
                    query_warning,
                    className="text-danger",
                )
            )

        # add a combined warning if both conditions are met
        if user_id is None and (not query or not query.lower().startswith("book")):
            combined_warning = (
                "Please select a User and start your query with the word 'Book'."
            )
            warnings = [
                html.P(
                    combined_warning,
                    className="text-danger",
                )
            ]

        # if there are warnings, return them and skip further processing
        if warnings:
            return warnings, "", ""

        # Apply Scout dimension filters to get filtered transaction data
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
        filtered_df = client.transactions(**filter_kwargs)
        
        # Regenerate grouped data based on filtered transactions
        if len(filtered_df) > 0:
            # Ensure required columns exist with fallbacks
            if 'customer_id' in filtered_df.columns:
                filtered_df['Survey ResponseID'] = filtered_df['customer_id']
            else:
                filtered_df['Survey ResponseID'] = range(len(filtered_df))
            
            # Create grouped purchase data for filtered results
            filtered_grouped_data = []
            available_customers = filtered_df['Survey ResponseID'].unique()
            
            # Check if selected user is in filtered data
            if user_id not in available_customers:
                warnings.append(
                    html.P(
                        f"Customer {user_id} has no transactions matching the current filters.",
                        className="text-warning",
                    )
                )
                return warnings, "", ""
            
            # Get data for the selected customer from filtered results
            customer_data = filtered_df[filtered_df['Survey ResponseID'] == user_id]
            if len(customer_data) > 0:
                # Create demographic info
                demographic = {
                    "customer_id": user_id,
                    "region": customer_data['region'].iloc[0] if 'region' in customer_data.columns else 'Unknown',
                    "category_preference": customer_data['category'].value_counts().index[0] if 'category' in customer_data.columns else 'General'
                }
                
                # Create purchase history
                purchases = []
                for _, row in customer_data.iterrows():
                    purchase = {
                        "title": row.get('product_name', f"Product {row.get('product_id', 'Unknown')}"),
                        "authors": row.get('brand', 'Unknown Brand'),
                        "categories": row.get('category', 'General')
                    }
                    purchases.append(purchase)
                
                user_info = {
                    "Survey ResponseID": user_id,
                    "demographic": demographic,
                    "books": purchases
                }
        else:
            # No data matches filters
            warnings.append(
                html.P(
                    "No transactions match the current filter criteria.",
                    className="text-warning",
                )
            )
            return warnings, "", ""

        # process personal user information and user book purchases
        demographic_info = user_info["demographic"]
        book_info = user_info["books"]

        # add title for personal user information
        user_info_title = html.H3("User Profile", className="subtitle-small-color")

        # format personal user information as a list of paragraphs
        user_info_display = [
            html.P(f"{key}: {value}", className="user-info-text")
            for key, value in demographic_info.items()
        ]

        # combine title and user book purchases
        books_info_title = html.H3(
            "User's Book Purchase History", className="subtitle-small-color"
        )
        books_table = create_books_table(book_info)
        books_info_display = html.Div([books_info_title, books_table])

        recommendations = get_recommendation(query, user_info)

        if recommendations.startswith("Sorry"):
            return (
                warnings + [user_info_title] + user_info_display,
                books_info_display,
                html.Pre(recommendations, className="text-recommendations"),
            )

        # return books recommendations
        return (
            warnings + [user_info_title] + user_info_display,
            books_info_display,
            html.Pre(recommendations, className="text-recommendations"),
        )

    return "", "", ""


# Callback for filter synchronization
@callback(
    Output("session-filters", "data"),
    [
        Input("recommendation-date-range", "start_date"),
        Input("recommendation-date-range", "end_date"),
        Input("recommendation-region", "value"),
        Input("recommendation-category", "value"),
        Input("recommendation-brand", "value"),
        Input("recommendation-store", "value"),
        Input("recommendation-global-filters", "value"),
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
        Output("recommendation-date-range", "start_date"),
        Output("recommendation-date-range", "end_date"),
        Output("recommendation-region", "value"),
        Output("recommendation-category", "value"),
        Output("recommendation-brand", "value"),
        Output("recommendation-store", "value"),
    ],
    Input("recommendation-clear-filters", "n_clicks"),
    prevent_initial_call=True
)
def clear_filters(n_clicks):
    if n_clicks:
        return None, None, None, None, None, None
    return dash.no_update

# Load filters from session on page load
@callback(
    [
        Output("recommendation-date-range", "start_date", allow_duplicate=True),
        Output("recommendation-date-range", "end_date", allow_duplicate=True),
        Output("recommendation-region", "value", allow_duplicate=True),
        Output("recommendation-category", "value", allow_duplicate=True),
        Output("recommendation-brand", "value", allow_duplicate=True),
        Output("recommendation-store", "value", allow_duplicate=True),
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
