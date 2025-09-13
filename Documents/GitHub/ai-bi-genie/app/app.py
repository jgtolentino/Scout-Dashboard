"""
AI-BI Genie - Intelligent Business Intelligence Dashboard
Main Streamlit Application
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

# Import custom modules
from app.utils.database import DatabaseConnection
from app.utils.azure_client import AzureClient
from app.utils.analytics import AnalyticsEngine
from app.components.charts import ChartBuilder
from app.components.filters import FilterPanel
from app.components.kpi_cards import KPICards

# Page configuration
st.set_page_config(
    page_title="AI-BI Genie",
    page_icon="🧞",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': 'https://github.com/yourusername/ai-bi-genie',
        'Report a bug': "https://github.com/yourusername/ai-bi-genie/issues",
        'About': "AI-BI Genie - Intelligent Business Intelligence Platform"
    }
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
        transition: transform 0.3s ease;
    }
    .kpi-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .section-header {
        font-size: 1.8rem;
        font-weight: 600;
        color: #2c3e50;
        margin: 2rem 0 1rem 0;
        border-bottom: 3px solid #3498db;
        padding-bottom: 0.5rem;
    }
    .filter-section {
        background-color: #ecf0f1;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
    }
    .chart-container {
        background-color: white;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1.5rem;
    }
    .insight-box {
        background-color: #e8f4fd;
        border-left: 4px solid #3498db;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }
    .recommendation-box {
        background-color: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)


class AIBIGenieApp:
    """Main application class for AI-BI Genie"""
    
    def __init__(self):
        self.init_session_state()
        self.setup_connections()
        
    def init_session_state(self):
        """Initialize session state variables"""
        if 'authenticated' not in st.session_state:
            st.session_state.authenticated = False
        if 'user' not in st.session_state:
            st.session_state.user = None
        if 'selected_date_range' not in st.session_state:
            st.session_state.selected_date_range = (
                datetime.now() - timedelta(days=30),
                datetime.now()
            )
        if 'selected_metrics' not in st.session_state:
            st.session_state.selected_metrics = []
        if 'data_cache' not in st.session_state:
            st.session_state.data_cache = {}
            
    def setup_connections(self):
        """Setup database and Azure connections"""
        try:
            self.db = DatabaseConnection()
            self.azure_client = AzureClient()
            self.analytics = AnalyticsEngine(self.db, self.azure_client)
            self.chart_builder = ChartBuilder()
        except Exception as e:
            st.error(f"Failed to initialize connections: {str(e)}")
            st.stop()
            
    def render_header(self):
        """Render application header"""
        st.markdown('<h1 class="main-header">🧞 AI-BI Genie</h1>', unsafe_allow_html=True)
        st.markdown(
            '<p style="text-align: center; font-size: 1.2rem; color: #7f8c8d;">Your Intelligent Business Intelligence Assistant</p>',
            unsafe_allow_html=True
        )
        
    def render_sidebar(self):
        """Render sidebar with filters and navigation"""
        with st.sidebar:
            st.image("public/images/logo.png", width=150)
            
            st.markdown("### 📊 Navigation")
            page = st.selectbox(
                "Select Page",
                ["Executive Dashboard", "Sales Analytics", "Customer Insights", 
                 "Product Performance", "Financial Analysis", "Predictive Analytics",
                 "Custom Reports", "Settings"]
            )
            
            st.markdown("### 🔍 Global Filters")
            
            # Date range filter
            date_range = st.date_input(
                "Date Range",
                value=(st.session_state.selected_date_range[0], 
                       st.session_state.selected_date_range[1]),
                max_value=datetime.now().date()
            )
            
            if len(date_range) == 2:
                st.session_state.selected_date_range = date_range
            
            # Region filter
            regions = self.db.get_regions()
            selected_regions = st.multiselect(
                "Regions",
                options=regions,
                default=regions
            )
            
            # Product category filter
            categories = self.db.get_product_categories()
            selected_categories = st.multiselect(
                "Product Categories",
                options=categories,
                default=categories
            )
            
            # Customer segment filter
            segments = self.db.get_customer_segments()
            selected_segments = st.multiselect(
                "Customer Segments",
                options=segments,
                default=segments
            )
            
            st.markdown("### 🤖 AI Assistant")
            user_query = st.text_area(
                "Ask a question about your data:",
                placeholder="e.g., What are the top performing products this month?"
            )
            
            if st.button("🔮 Get AI Insights"):
                with st.spinner("Analyzing..."):
                    insights = self.analytics.get_ai_insights(
                        user_query,
                        date_range,
                        selected_regions,
                        selected_categories,
                        selected_segments
                    )
                    st.session_state.ai_insights = insights
            
            st.markdown("---")
            st.markdown("### 📥 Export Options")
            export_format = st.selectbox(
                "Export Format",
                ["PDF", "Excel", "PowerPoint", "CSV"]
            )
            
            if st.button("📥 Export Dashboard"):
                self.export_dashboard(export_format)
                
            return page, selected_regions, selected_categories, selected_segments
    
    def render_executive_dashboard(self, filters):
        """Render executive dashboard"""
        st.markdown('<h2 class="section-header">Executive Dashboard</h2>', unsafe_allow_html=True)
        
        # KPI Cards
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            revenue = self.analytics.get_total_revenue(filters)
            KPICards.render_card("Total Revenue", f"${revenue:,.2f}", "↑ 12.5%", "success")
            
        with col2:
            customers = self.analytics.get_total_customers(filters)
            KPICards.render_card("Active Customers", f"{customers:,}", "↑ 8.3%", "success")
            
        with col3:
            avg_order = self.analytics.get_avg_order_value(filters)
            KPICards.render_card("Avg Order Value", f"${avg_order:,.2f}", "↓ 2.1%", "warning")
            
        with col4:
            satisfaction = self.analytics.get_customer_satisfaction(filters)
            KPICards.render_card("Customer Satisfaction", f"{satisfaction:.1f}/5", "↑ 0.3", "success")
        
        # Revenue Trend Chart
        st.markdown("### 📈 Revenue Trend")
        revenue_data = self.analytics.get_revenue_trend(filters)
        fig_revenue = self.chart_builder.create_line_chart(
            revenue_data,
            x='date',
            y='revenue',
            title='Monthly Revenue Trend'
        )
        st.plotly_chart(fig_revenue, use_container_width=True)
        
        # Sales by Region and Category
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 🌍 Sales by Region")
            region_data = self.analytics.get_sales_by_region(filters)
            fig_region = self.chart_builder.create_pie_chart(
                region_data,
                values='sales',
                names='region',
                title='Sales Distribution by Region'
            )
            st.plotly_chart(fig_region, use_container_width=True)
            
        with col2:
            st.markdown("### 📦 Sales by Category")
            category_data = self.analytics.get_sales_by_category(filters)
            fig_category = self.chart_builder.create_bar_chart(
                category_data,
                x='category',
                y='sales',
                title='Sales by Product Category'
            )
            st.plotly_chart(fig_category, use_container_width=True)
        
        # AI Insights
        if 'ai_insights' in st.session_state:
            st.markdown("### 🤖 AI-Generated Insights")
            st.markdown(
                f'<div class="insight-box">{st.session_state.ai_insights}</div>',
                unsafe_allow_html=True
            )
        
        # Recommendations
        st.markdown("### 💡 AI Recommendations")
        recommendations = self.analytics.get_recommendations(filters)
        for rec in recommendations:
            st.markdown(
                f'<div class="recommendation-box"><strong>{rec["title"]}</strong><br>{rec["description"]}</div>',
                unsafe_allow_html=True
            )
    
    def render_sales_analytics(self, filters):
        """Render sales analytics page"""
        st.markdown('<h2 class="section-header">Sales Analytics</h2>', unsafe_allow_html=True)
        
        # Sales metrics
        col1, col2, col3 = st.columns(3)
        
        with col1:
            total_sales = self.analytics.get_total_sales(filters)
            st.metric("Total Sales", f"${total_sales:,.2f}", "12.5%")
            
        with col2:
            units_sold = self.analytics.get_units_sold(filters)
            st.metric("Units Sold", f"{units_sold:,}", "8.3%")
            
        with col3:
            conversion_rate = self.analytics.get_conversion_rate(filters)
            st.metric("Conversion Rate", f"{conversion_rate:.1%}", "2.1%")
        
        # Detailed analytics charts
        st.markdown("### Sales Performance Analysis")
        
        # Time series analysis
        sales_trend = self.analytics.get_detailed_sales_trend(filters)
        fig = self.chart_builder.create_time_series_chart(
            sales_trend,
            title="Sales Trend Analysis"
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Product performance
        st.markdown("### Top Performing Products")
        product_data = self.analytics.get_top_products(filters, limit=10)
        fig_products = self.chart_builder.create_horizontal_bar_chart(
            product_data,
            x='sales',
            y='product_name',
            title='Top 10 Products by Sales'
        )
        st.plotly_chart(fig_products, use_container_width=True)
        
        # Sales funnel
        st.markdown("### Sales Funnel Analysis")
        funnel_data = self.analytics.get_sales_funnel(filters)
        fig_funnel = self.chart_builder.create_funnel_chart(
            funnel_data,
            title='Sales Conversion Funnel'
        )
        st.plotly_chart(fig_funnel, use_container_width=True)
    
    def render_customer_insights(self, filters):
        """Render customer insights page"""
        st.markdown('<h2 class="section-header">Customer Insights</h2>', unsafe_allow_html=True)
        
        # Customer metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            new_customers = self.analytics.get_new_customers(filters)
            st.metric("New Customers", f"{new_customers:,}", "↑ 15.2%")
            
        with col2:
            retention_rate = self.analytics.get_retention_rate(filters)
            st.metric("Retention Rate", f"{retention_rate:.1%}", "↑ 3.5%")
            
        with col3:
            ltv = self.analytics.get_customer_ltv(filters)
            st.metric("Average LTV", f"${ltv:,.2f}", "↑ 8.7%")
            
        with col4:
            churn_rate = self.analytics.get_churn_rate(filters)
            st.metric("Churn Rate", f"{churn_rate:.1%}", "↓ 2.1%")
        
        # Customer segmentation
        st.markdown("### Customer Segmentation")
        segment_data = self.analytics.get_customer_segments_analysis(filters)
        fig_segments = self.chart_builder.create_sunburst_chart(
            segment_data,
            title='Customer Segmentation Analysis'
        )
        st.plotly_chart(fig_segments, use_container_width=True)
        
        # Customer journey
        st.markdown("### Customer Journey Analytics")
        journey_data = self.analytics.get_customer_journey(filters)
        fig_journey = self.chart_builder.create_sankey_diagram(
            journey_data,
            title='Customer Journey Flow'
        )
        st.plotly_chart(fig_journey, use_container_width=True)
        
        # Cohort analysis
        st.markdown("### Cohort Analysis")
        cohort_data = self.analytics.get_cohort_analysis(filters)
        fig_cohort = self.chart_builder.create_heatmap(
            cohort_data,
            title='Customer Retention Cohort Analysis'
        )
        st.plotly_chart(fig_cohort, use_container_width=True)
    
    def export_dashboard(self, format):
        """Export dashboard in specified format"""
        with st.spinner(f"Generating {format} export..."):
            try:
                if format == "PDF":
                    file_path = self.analytics.export_to_pdf()
                elif format == "Excel":
                    file_path = self.analytics.export_to_excel()
                elif format == "PowerPoint":
                    file_path = self.analytics.export_to_powerpoint()
                else:  # CSV
                    file_path = self.analytics.export_to_csv()
                
                with open(file_path, "rb") as file:
                    st.download_button(
                        label=f"Download {format}",
                        data=file.read(),
                        file_name=f"ai_bi_genie_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format.lower()}",
                        mime=f"application/{format.lower()}"
                    )
                st.success(f"{format} export generated successfully!")
            except Exception as e:
                st.error(f"Export failed: {str(e)}")
    
    def run(self):
        """Run the main application"""
        self.render_header()
        
        # Get filters from sidebar
        page, regions, categories, segments = self.render_sidebar()
        
        filters = {
            'date_range': st.session_state.selected_date_range,
            'regions': regions,
            'categories': categories,
            'segments': segments
        }
        
        # Render selected page
        if page == "Executive Dashboard":
            self.render_executive_dashboard(filters)
        elif page == "Sales Analytics":
            self.render_sales_analytics(filters)
        elif page == "Customer Insights":
            self.render_customer_insights(filters)
        elif page == "Product Performance":
            self.render_product_performance(filters)
        elif page == "Financial Analysis":
            self.render_financial_analysis(filters)
        elif page == "Predictive Analytics":
            self.render_predictive_analytics(filters)
        elif page == "Custom Reports":
            self.render_custom_reports(filters)
        elif page == "Settings":
            self.render_settings()
        
        # Footer
        st.markdown("---")
        st.markdown(
            '<p style="text-align: center; color: #95a5a6;">AI-BI Genie © 2024 | Powered by Azure AI</p>',
            unsafe_allow_html=True
        )
    
    def render_product_performance(self, filters):
        """Render product performance page"""
        st.markdown('<h2 class="section-header">Product Performance</h2>', unsafe_allow_html=True)
        st.info("Product Performance dashboard - Implementation in progress")
        
    def render_financial_analysis(self, filters):
        """Render financial analysis page"""
        st.markdown('<h2 class="section-header">Financial Analysis</h2>', unsafe_allow_html=True)
        st.info("Financial Analysis dashboard - Implementation in progress")
        
    def render_predictive_analytics(self, filters):
        """Render predictive analytics page"""
        st.markdown('<h2 class="section-header">Predictive Analytics</h2>', unsafe_allow_html=True)
        st.info("Predictive Analytics dashboard - Implementation in progress")
        
    def render_custom_reports(self, filters):
        """Render custom reports page"""
        st.markdown('<h2 class="section-header">Custom Reports</h2>', unsafe_allow_html=True)
        st.info("Custom Reports builder - Implementation in progress")
        
    def render_settings(self):
        """Render settings page"""
        st.markdown('<h2 class="section-header">Settings</h2>', unsafe_allow_html=True)
        st.info("Settings page - Implementation in progress")


def main():
    """Main entry point"""
    app = AIBIGenieApp()
    app.run()


if __name__ == "__main__":
    main()