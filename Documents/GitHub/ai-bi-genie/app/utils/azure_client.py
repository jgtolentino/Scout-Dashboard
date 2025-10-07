"""
Azure client utilities for AI-BI-Genie
"""

import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class AzureClient:
    """Azure services client for AI-BI-Genie"""
    
    def __init__(self):
        self.subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID', 'local-development')
        self.resource_group = os.getenv('RESOURCE_GROUP', 'ai-bi-genie-local')
        self.application_insights_key = os.getenv('APPLICATION_INSIGHTS_KEY', 'local-dev-key')
        
    def get_resource_metrics(self, resource_id: str, metric_name: str) -> Dict[str, Any]:
        """Get metrics for an Azure resource"""
        try:
            # For local development, return mock data
            return {
                'resource_id': resource_id,
                'metric_name': metric_name,
                'value': 42.0,
                'unit': 'percent',
                'timestamp': '2024-01-01T00:00:00Z'
            }
        except Exception as e:
            logger.error(f"Failed to get resource metrics: {str(e)}")
            return {}
    
    def query_application_insights(self, query: str) -> List[Dict[str, Any]]:
        """Query Application Insights for telemetry data"""
        try:
            # For local development, return mock data
            return [
                {
                    'timestamp': '2024-01-01T00:00:00Z',
                    'value': 100,
                    'metric': 'requests'
                }
            ]
        except Exception as e:
            logger.error(f"Failed to query Application Insights: {str(e)}")
            return []
    
    def get_cost_data(self, scope: str) -> Dict[str, Any]:
        """Get cost data for Azure resources"""
        try:
            # For local development, return mock data
            return {
                'total_cost': 1234.56,
                'currency': 'USD',
                'period': 'month',
                'breakdown': [
                    {'service': 'Compute', 'cost': 500.00},
                    {'service': 'Storage', 'cost': 200.00},
                    {'service': 'Network', 'cost': 100.00},
                    {'service': 'Database', 'cost': 434.56}
                ]
            }
        except Exception as e:
            logger.error(f"Failed to get cost data: {str(e)}")
            return {}