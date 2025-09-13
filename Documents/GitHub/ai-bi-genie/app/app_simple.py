"""
AI-BI Genie - Simple Demo Version
Simplified Streamlit Application for Local Testing
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
from datetime import datetime, timedelta

# Page configuration
st.set_page_config(
    page_title="AI-BI Genie Demo",
    page_icon="🧞",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(120deg, #1e3c72, #2a5298);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        padding: 2rem 0;
    }
    .kpi-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }
    .insight-box {
        background-color: #e8f4fd;
        border-left: 4px solid #3498db;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def generate_sample_data():
    """Generate sample data for demonstration"""
    # Revenue trend data
    dates = pd.date_range(start=datetime.now() - timedelta(days=90), end=datetime.now(), freq='D')
    revenue_data = pd.DataFrame({
        'date': dates,
        'revenue': np.random.normal(50000, 10000, len(dates)).cumsum() + 1000000
    })
    
    # Regional sales data
    regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa']
    region_data = pd.DataFrame({
        'region': regions,
        'sales': np.random.uniform(100000, 500000, len(regions))
    })
    
    # Category sales data
    categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Beauty']
    category_data = pd.DataFrame({
        'category': categories,
        'sales': np.random.uniform(80000, 300000, len(categories))
    })
    
    return revenue_data, region_data, category_data

def main():
    """Main application function"""
    
    # Header
    st.markdown('<h1 class="main-header">🧞 AI-BI Genie Demo</h1>', unsafe_allow_html=True)
    st.markdown(
        '<p style="text-align: center; font-size: 1.2rem; color: #7f8c8d;">Your Intelligent Business Intelligence Assistant</p>',
        unsafe_allow_html=True
    )
    
    # Sidebar
    with st.sidebar:
        st.image("https://via.placeholder.com/150x75/0078d4/ffffff?text=AI-BI+Genie", width=150)
        
        st.markdown("### 📊 Navigation")
        page = st.selectbox(
            "Select Page",
            ["Executive Dashboard", "Analytics Deep Dive", "AI Insights", "Settings"]
        )
        
        st.markdown("### 🔍 Filters")
        
        # Date range filter
        date_range = st.date_input(
            "Date Range",
            value=(datetime.now() - timedelta(days=30), datetime.now()),
            max_value=datetime.now().date()
        )
        
        # Region filter
        regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa']
        selected_regions = st.multiselect(
            "Regions",
            options=regions,
            default=regions
        )
        
        # AI Assistant
        st.markdown("### 🤖 AI Assistant")
        user_query = st.text_area(
            "Ask a question:",
            placeholder="e.g., What are the top performing products this month?"
        )
        
        if st.button("🔮 Get AI Insights"):
            with st.spinner("Analyzing..."):
                st.session_state.ai_response = f"Based on your query '{user_query}', here are key insights: Revenue is trending upward with a 12% increase. {selected_regions[0] if selected_regions else 'North America'} shows strong performance."
    
    # Main content based on selected page
    if page == "Executive Dashboard":
        render_executive_dashboard()
    elif page == "Analytics Deep Dive":
        render_analytics_dashboard()
    elif page == "AI Insights":
        render_ai_insights()
    else:
        render_settings()

def render_executive_dashboard():
    """Render the executive dashboard"""
    st.markdown("## 📊 Executive Dashboard")
    
    # Generate sample data
    revenue_data, region_data, category_data = generate_sample_data()
    
    # KPI Cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(
            '<div class="kpi-card"><h4>Total Revenue</h4><h2>$2.5M</h2><p style="color: green;">↑ 12.5%</p></div>',
            unsafe_allow_html=True
        )
    
    with col2:
        st.markdown(
            '<div class="kpi-card"><h4>Active Customers</h4><h2>18.2K</h2><p style="color: green;">↑ 8.3%</p></div>',
            unsafe_allow_html=True
        )
    
    with col3:
        st.markdown(
            '<div class="kpi-card"><h4>Avg Order Value</h4><h2>$127.50</h2><p style="color: orange;">↓ 2.1%</p></div>',
            unsafe_allow_html=True
        )
    
    with col4:
        st.markdown(
            '<div class="kpi-card"><h4>Customer Satisfaction</h4><h2>4.6/5</h2><p style="color: green;">↑ 0.3</p></div>',
            unsafe_allow_html=True
        )
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 📈 Revenue Trend")
        fig_revenue = px.line(revenue_data, x='date', y='revenue', 
                             title='Monthly Revenue Trend')
        fig_revenue.update_layout(template='plotly_white')
        st.plotly_chart(fig_revenue, use_container_width=True)
    
    with col2:
        st.markdown("### 🌍 Sales by Region")
        fig_region = px.pie(region_data, values='sales', names='region',
                           title='Sales Distribution by Region')
        fig_region.update_layout(template='plotly_white')
        st.plotly_chart(fig_region, use_container_width=True)
    
    # Category Performance
    st.markdown("### 📦 Sales by Category")
    fig_category = px.bar(category_data, x='category', y='sales',
                         title='Sales by Product Category')
    fig_category.update_layout(template='plotly_white')
    st.plotly_chart(fig_category, use_container_width=True)
    
    # AI Insights
    if 'ai_response' in st.session_state:
        st.markdown("### 🤖 AI-Generated Insights")
        st.markdown(
            f'<div class="insight-box">{st.session_state.ai_response}</div>',
            unsafe_allow_html=True
        )

def render_analytics_dashboard():
    """Render analytics deep dive"""
    st.markdown("## 🔍 Analytics Deep Dive")
    
    # Generate more detailed sample data
    dates = pd.date_range(start=datetime.now() - timedelta(days=30), end=datetime.now(), freq='D')
    
    # Sales metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Sales", "$2.5M", "12.5%")
    with col2:
        st.metric("Units Sold", "15,234", "8.3%")
    with col3:
        st.metric("Conversion Rate", "3.2%", "0.5%")
    
    # Time series analysis
    st.markdown("### 📊 Sales Performance Over Time")
    
    # Generate sample time series data
    time_series_data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(80000, 15000, len(dates)),
        'orders': np.random.poisson(200, len(dates)),
        'visitors': np.random.normal(5000, 1000, len(dates))
    })
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=time_series_data['date'], y=time_series_data['sales'],
                            mode='lines', name='Sales', line=dict(color='#0078d4')))
    fig.update_layout(title='Daily Sales Trend', template='plotly_white')
    st.plotly_chart(fig, use_container_width=True)
    
    # Cohort analysis
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 👥 Customer Segmentation")
        segments = ['Enterprise', 'SMB', 'Consumer', 'Government']
        segment_values = [35, 28, 25, 12]
        fig_segments = px.donut(values=segment_values, names=segments,
                               title='Customer Segments')
        st.plotly_chart(fig_segments, use_container_width=True)
    
    with col2:
        st.markdown("### 📈 Growth Metrics")
        metrics_data = pd.DataFrame({
            'metric': ['Revenue Growth', 'User Growth', 'Retention Rate', 'Churn Rate'],
            'value': [12.5, 8.3, 85.2, 4.1],
            'target': [15.0, 10.0, 90.0, 3.0]
        })
        fig_metrics = px.bar(metrics_data, x='metric', y=['value', 'target'],
                            title='Actual vs Target Metrics', barmode='group')
        st.plotly_chart(fig_metrics, use_container_width=True)

def render_ai_insights():
    """Render AI insights page"""
    st.markdown("## 🧠 AI-Powered Insights")
    
    st.markdown("""
    ### 🔮 Ask AI Anything About Your Data
    
    Our AI assistant can help you understand your business data with natural language queries.
    """)
    
    # Sample insights
    insights = [
        {
            "title": "Revenue Optimization Opportunity",
            "description": "AI has identified a 23% revenue increase opportunity by optimizing the product mix in the Electronics category.",
            "confidence": 0.89,
            "impact": "High"
        },
        {
            "title": "Customer Churn Risk",
            "description": "142 enterprise customers show early churn indicators. Proactive engagement could retain 85% of them.",
            "confidence": 0.76,
            "impact": "Medium"
        },
        {
            "title": "Market Expansion",
            "description": "Asia Pacific region shows 34% higher conversion rates than other regions, suggesting expansion opportunity.",
            "confidence": 0.82,
            "impact": "High"
        }
    ]
    
    for insight in insights:
        with st.expander(f"💡 {insight['title']} (Confidence: {insight['confidence']:.0%})"):
            st.write(insight['description'])
            st.write(f"**Expected Impact:** {insight['impact']}")
            
            col1, col2 = st.columns(2)
            with col1:
                st.button(f"👍 Helpful", key=f"helpful_{insight['title']}")
            with col2:
                st.button(f"👎 Not Helpful", key=f"not_helpful_{insight['title']}")

def render_settings():
    """Render settings page"""
    st.markdown("## ⚙️ Settings")
    
    st.markdown("### 👤 User Preferences")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.selectbox("Theme", ["Light", "Dark", "Auto"])
        st.selectbox("Language", ["English", "Spanish", "French", "German"])
        st.checkbox("Enable Email Notifications")
        
    with col2:
        st.selectbox("Default Dashboard", ["Executive", "Analytics", "AI Insights"])
        st.selectbox("Refresh Interval", ["5 minutes", "15 minutes", "30 minutes", "1 hour"])
        st.checkbox("Show Advanced Features")
    
    st.markdown("### 🔌 Data Connections")
    
    connections = [
        {"name": "Primary Database", "status": "Connected", "last_sync": "2 minutes ago"},
        {"name": "CRM System", "status": "Connected", "last_sync": "5 minutes ago"},
        {"name": "Analytics API", "status": "Disconnected", "last_sync": "2 hours ago"}
    ]
    
    for conn in connections:
        col1, col2, col3, col4 = st.columns([3, 2, 2, 1])
        with col1:
            st.write(f"**{conn['name']}**")
        with col2:
            color = "green" if conn['status'] == "Connected" else "red"
            st.markdown(f"<span style='color: {color}'>{conn['status']}</span>", unsafe_allow_html=True)
        with col3:
            st.write(conn['last_sync'])
        with col4:
            st.button("⚙️", key=f"config_{conn['name']}")

if __name__ == "__main__":
    main()