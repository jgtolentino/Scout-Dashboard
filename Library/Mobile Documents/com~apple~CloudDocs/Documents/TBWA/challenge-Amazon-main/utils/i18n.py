"""
Internationalization and text token mapping for Amazon → Scout retarget
Preserves UI layout while changing domain-specific labels
"""

# Text token mappings: Amazon → Scout equivalents
TOKENS = {
    # Page titles
    "Purchase overview": "Transaction Overview",
    "Customer demographics": "Customer Demographics",
    "Book recommendation": "AI Recommendation Panel",
    
    # Navigation labels
    "Purchase Overview": "Transaction Overview",
    "Customer demographics": "Customer Demographics", 
    "Book recommendation": "AI Recommendation Panel",
    
    # Card titles and metrics
    "Purchases": "Transactions",
    "Total Spend": "Total Revenue",
    "Top Category": "Top Category",
    
    # Chart titles
    "Total Monthly Spend": "Total Monthly Revenue",
    "Monthly Sales Revenue": "Monthly Sales Revenue",
    "Top 5 Purchase Categories": "Top 5 Transaction Categories",
    "Top 5 Product Categories": "Top 5 Product Categories",
    
    # Form labels and inputs
    "Select Year": "Select Year",
    "All (2018-2022)": "All (2022-2024)",
    "All Years": "All Years",
    
    # Demographics labels
    "Users by State": "Customers by Region", 
    "Age Distribution": "Age Distribution",
    "Gender Distribution": "Gender Distribution",
    "Most Popular Categories": "Most Popular Categories",
    
    # Recommendation system
    "Book recommendation Chatbot": "AI Recommendation Assistant",
    "Book Recommendations": "Product Recommendations",
    "Search for books": "Search for products",
    "Based on your preferences": "Based on your transaction history",
    "Rating": "Popularity Score",
    "Reviews": "Sales Count",
    "Pages": "Units Sold",
    "Author": "Brand",
    "Published": "Last Ordered",
    "Instructions": "Instructions",
    "1. Select User": "1. Select Customer",
    "2. Please start your query with the word ": "2. Please start your query with the word ",
    "Product": "Product",
    
    # Data source attribution
    "MIT Publication": "Scout Analytics",
    "Amazon Purchases Dataset": "Scout Transaction Dataset",
    "Created by": "Created by",
    "Data Source": "Data Source"
}

# Reverse mapping for lookups
REVERSE_TOKENS = {v: k for k, v in TOKENS.items()}

def translate(text: str, reverse: bool = False) -> str:
    """
    Translate text tokens from Amazon to Scout domain
    
    Args:
        text: Input text to translate
        reverse: If True, translate from Scout back to Amazon
        
    Returns:
        Translated text, or original if no mapping exists
    """
    token_map = REVERSE_TOKENS if reverse else TOKENS
    return token_map.get(text, text)

def translate_dict(data: dict, reverse: bool = False) -> dict:
    """
    Recursively translate dictionary keys and string values
    
    Args:
        data: Dictionary to translate
        reverse: If True, translate from Scout back to Amazon
        
    Returns:
        Dictionary with translated strings
    """
    if isinstance(data, dict):
        return {
            translate(k, reverse): translate_dict(v, reverse) 
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [translate_dict(item, reverse) for item in data]
    elif isinstance(data, str):
        return translate(data, reverse)
    else:
        return data

def get_page_config() -> dict:
    """Get Scout-specific page configuration"""
    return {
        "app_title": "Scout Analytics Dashboard",
        "page_titles": {
            "purchase_overview": "Transaction Overview",
            "customer_demographics": "Customer Demographics",
            "book_recommendation": "AI Recommendation Panel"
        },
        "navigation": [
            {"label": "Transaction Overview", "href": "/transaction_overview"},
            {"label": "Customer Demographics", "href": "/customer_demographics"}, 
            {"label": "AI Recommendation Panel", "href": "/ai_recommendations"}
        ],
        "data_source": {
            "name": "Scout Analytics",
            "url": "https://scout-analytics.com/dataset",
            "description": "Retail transaction and customer behavior dataset"
        },
        "branding": {
            "company": "Scout Analytics",
            "logo_path": "assets/logos/scout.svg",
            "favicon_path": "assets/logos/scout_favicon.svg"
        }
    }

def get_chart_config() -> dict:
    """Get Scout-specific chart configuration"""
    return {
        "color_scheme": {
            "primary": "#f79500",  # Preserve Amazon orange for UI consistency
            "secondary": "#3a4552",
            "success": "#28a745", 
            "warning": "#ffc107",
            "danger": "#dc3545"
        },
        "chart_titles": {
            "sales_trend": "Monthly Revenue Trend",
            "category_breakdown": "Category Performance",
            "geographic_distribution": "Regional Sales Distribution",
            "demographic_analysis": "Customer Demographics"
        },
        "metric_formats": {
            "currency": "₱{:,.0f}",  # Philippine Peso
            "percentage": "{:.1f}%",
            "count": "{:,}",
            "decimal": "{:.2f}"
        }
    }

# Geographic region mappings for Philippines
REGION_MAPPINGS = {
    "NCR": "National Capital Region",
    "Region I": "Ilocos Region", 
    "Region II": "Cagayan Valley",
    "Region III": "Central Luzon",
    "Region IV-A": "CALABARZON",
    "Region IV-B": "MIMAROPA",
    "Region V": "Bicol Region",
    "Region VI": "Western Visayas",
    "Region VII": "Central Visayas",
    "Region VIII": "Eastern Visayas",
    "Region IX": "Zamboanga Peninsula",
    "Region X": "Northern Mindanao",
    "Region XI": "Davao Region",
    "Region XII": "SOCCSKSARGEN",
    "Region XIII": "Caraga",
    "ARMM": "Autonomous Region in Muslim Mindanao",
    "CAR": "Cordillera Administrative Region"
}