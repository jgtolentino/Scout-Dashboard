#!/usr/bin/env python3
"""
ETL MONITORING DASHBOARD AND HEALTH CHECK SYSTEM
Provides real-time monitoring, alerting, and analytics for the unified ETL pipeline
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor

# FastAPI for web dashboard
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
import uvicorn

# Database and monitoring
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Prometheus metrics
try:
    from prometheus_client import Counter, Histogram, Gauge, start_http_server, generate_latest
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

# Slack notifications
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ETLMonitoring')


@dataclass
class HealthMetric:
    """Health check metric"""
    name: str
    value: float
    status: str
    details: Dict[str, Any]
    timestamp: datetime
    threshold_warning: float = 0.0
    threshold_critical: float = 0.0


@dataclass
class AlertRule:
    """Alert rule configuration"""
    metric_name: str
    condition: str  # 'greater_than', 'less_than', 'equals'
    threshold: float
    severity: str  # 'info', 'warning', 'critical'
    channels: List[str]  # ['slack', 'email', 'webhook']
    cooldown_minutes: int = 30
    last_triggered: Optional[datetime] = None


class PrometheusMetrics:
    """Prometheus metrics collector"""

    def __init__(self):
        if not PROMETHEUS_AVAILABLE:
            logger.warning("Prometheus client not available")
            return

        # ETL pipeline metrics
        self.etl_syncs_total = Counter(
            'etl_syncs_total',
            'Total number of ETL syncs',
            ['sync_type', 'status']
        )

        self.etl_duration_seconds = Histogram(
            'etl_duration_seconds',
            'ETL sync duration in seconds',
            ['sync_type']
        )

        self.etl_records_processed = Counter(
            'etl_records_processed_total',
            'Total records processed',
            ['sync_type', 'table_name']
        )

        # Column mapping metrics
        self.column_mappings_total = Counter(
            'column_mappings_total',
            'Total column mappings performed',
            ['strategy', 'sheet_source']
        )

        self.column_mapping_confidence = Histogram(
            'column_mapping_confidence',
            'Column mapping confidence scores',
            ['strategy']
        )

        # Data quality metrics
        self.data_quality_checks = Counter(
            'data_quality_checks_total',
            'Total data quality checks',
            ['metric_name', 'status']
        )

        self.data_quality_score = Gauge(
            'data_quality_score',
            'Current data quality score',
            ['sheet_name', 'metric_name']
        )

        # System health metrics
        self.etl_health_score = Gauge('etl_health_score', 'Overall ETL health score')
        self.last_sync_minutes_ago = Gauge('etl_last_sync_minutes_ago', 'Minutes since last sync')

    def record_etl_sync(self, sync_type: str, status: str, duration: float):
        """Record ETL sync metrics"""
        if not PROMETHEUS_AVAILABLE:
            return
        self.etl_syncs_total.labels(sync_type=sync_type, status=status).inc()
        self.etl_duration_seconds.labels(sync_type=sync_type).observe(duration)

    def record_column_mapping(self, strategy: str, confidence: float, sheet_source: str = None):
        """Record column mapping metrics"""
        if not PROMETHEUS_AVAILABLE:
            return
        self.column_mappings_total.labels(
            strategy=strategy,
            sheet_source=sheet_source or 'unknown'
        ).inc()
        self.column_mapping_confidence.labels(strategy=strategy).observe(confidence)

    def record_data_quality(self, metric_name: str, status: str, score: float, sheet_name: str = None):
        """Record data quality metrics"""
        if not PROMETHEUS_AVAILABLE:
            return
        self.data_quality_checks.labels(metric_name=metric_name, status=status).inc()
        if sheet_name:
            self.data_quality_score.labels(
                sheet_name=sheet_name,
                metric_name=metric_name
            ).set(score)

    def update_health_metrics(self, health_score: float, minutes_since_last_sync: float):
        """Update system health metrics"""
        if not PROMETHEUS_AVAILABLE:
            return
        self.etl_health_score.set(health_score)
        self.last_sync_minutes_ago.set(minutes_since_last_sync)


class AlertManager:
    """Manages alerts and notifications"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.alert_rules = self._load_alert_rules()
        self.alert_history = []

    def _load_alert_rules(self) -> List[AlertRule]:
        """Load alert rules from configuration"""
        rules = []
        alert_config = self.config.get('alerts', {})

        # Default alert rules
        default_rules = [
            AlertRule(
                metric_name='minutes_since_last_sync',
                condition='greater_than',
                threshold=30,
                severity='warning',
                channels=['slack'],
                cooldown_minutes=30
            ),
            AlertRule(
                metric_name='minutes_since_last_sync',
                condition='greater_than',
                threshold=60,
                severity='critical',
                channels=['slack', 'email'],
                cooldown_minutes=15
            ),
            AlertRule(
                metric_name='success_rate_24h',
                condition='less_than',
                threshold=80,
                severity='warning',
                channels=['slack'],
                cooldown_minutes=60
            ),
            AlertRule(
                metric_name='data_quality_pass_rate',
                condition='less_than',
                threshold=70,
                severity='critical',
                channels=['slack', 'email'],
                cooldown_minutes=30
            )
        ]

        rules.extend(default_rules)

        # Load custom rules from config
        for rule_config in alert_config.get('rules', []):
            rule = AlertRule(**rule_config)
            rules.append(rule)

        return rules

    def check_alerts(self, metrics: List[HealthMetric]):
        """Check metrics against alert rules"""
        for metric in metrics:
            for rule in self.alert_rules:
                if rule.metric_name == metric.name:
                    self._evaluate_rule(rule, metric)

    def _evaluate_rule(self, rule: AlertRule, metric: HealthMetric):
        """Evaluate a single alert rule"""
        # Check cooldown
        if rule.last_triggered:
            time_since_last = datetime.now() - rule.last_triggered
            if time_since_last.total_seconds() < rule.cooldown_minutes * 60:
                return

        # Evaluate condition
        triggered = False
        if rule.condition == 'greater_than' and metric.value > rule.threshold:
            triggered = True
        elif rule.condition == 'less_than' and metric.value < rule.threshold:
            triggered = True
        elif rule.condition == 'equals' and metric.value == rule.threshold:
            triggered = True

        if triggered:
            self._send_alert(rule, metric)
            rule.last_triggered = datetime.now()

    def _send_alert(self, rule: AlertRule, metric: HealthMetric):
        """Send alert through configured channels"""
        alert_data = {
            'metric_name': metric.name,
            'metric_value': metric.value,
            'threshold': rule.threshold,
            'severity': rule.severity,
            'status': metric.status,
            'details': metric.details,
            'timestamp': metric.timestamp.isoformat()
        }

        for channel in rule.channels:
            if channel == 'slack':
                self._send_slack_alert(alert_data)
            elif channel == 'email':
                self._send_email_alert(alert_data)
            elif channel == 'webhook':
                self._send_webhook_alert(alert_data)

        # Store in history
        self.alert_history.append({
            'rule': asdict(rule),
            'metric': asdict(metric),
            'timestamp': datetime.now()
        })

        # Keep only last 1000 alerts
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]

    def _send_slack_alert(self, alert_data: Dict[str, Any]):
        """Send alert to Slack"""
        webhook_url = self.config.get('alerts', {}).get('slack', {}).get('webhook_url')
        if not webhook_url:
            logger.warning("Slack webhook URL not configured")
            return

        severity_colors = {
            'info': '#36a64f',
            'warning': '#ffcc00',
            'critical': '#ff0000'
        }

        severity_emojis = {
            'info': ':information_source:',
            'warning': ':warning:',
            'critical': ':rotating_light:'
        }

        color = severity_colors.get(alert_data['severity'], '#cccccc')
        emoji = severity_emojis.get(alert_data['severity'], ':bell:')

        payload = {
            'text': f"{emoji} ETL Pipeline Alert",
            'attachments': [{
                'color': color,
                'fields': [
                    {
                        'title': 'Metric',
                        'value': alert_data['metric_name'],
                        'short': True
                    },
                    {
                        'title': 'Value',
                        'value': f"{alert_data['metric_value']:.2f}",
                        'short': True
                    },
                    {
                        'title': 'Threshold',
                        'value': f"{alert_data['threshold']:.2f}",
                        'short': True
                    },
                    {
                        'title': 'Severity',
                        'value': alert_data['severity'].upper(),
                        'short': True
                    },
                    {
                        'title': 'Status',
                        'value': alert_data['status'],
                        'short': True
                    },
                    {
                        'title': 'Time',
                        'value': alert_data['timestamp'],
                        'short': True
                    }
                ]
            }]
        }

        try:
            response = requests.post(webhook_url, json=payload, timeout=10)
            response.raise_for_status()
            logger.info(f"Slack alert sent for {alert_data['metric_name']}")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    def _send_email_alert(self, alert_data: Dict[str, Any]):
        """Send email alert (placeholder)"""
        logger.info(f"Email alert would be sent for {alert_data['metric_name']}")

    def _send_webhook_alert(self, alert_data: Dict[str, Any]):
        """Send webhook alert (placeholder)"""
        logger.info(f"Webhook alert would be sent for {alert_data['metric_name']}")


class ETLMonitoringDashboard:
    """Main monitoring dashboard class"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.supabase_client = None
        self.prometheus_metrics = PrometheusMetrics()
        self.alert_manager = AlertManager(config)
        self.health_cache = {}
        self.last_health_check = None

        # Initialize database connection
        if SUPABASE_AVAILABLE:
            try:
                self.supabase_client = create_client(
                    config.get('supabase_url'),
                    config.get('supabase_key')
                )
                logger.info("Connected to Supabase for monitoring")
            except Exception as e:
                logger.error(f"Failed to connect to Supabase: {e}")

        # Initialize FastAPI app
        self.app = FastAPI(title="ETL Monitoring Dashboard", version="1.0.0")
        self._setup_routes()

        # Start background tasks
        self.monitoring_thread = None
        self.start_monitoring()

    def _setup_routes(self):
        """Setup FastAPI routes"""

        @self.app.get("/", response_class=HTMLResponse)
        async def dashboard_home():
            """Main dashboard page"""
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <title>ETL Monitoring Dashboard</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                    .container { max-width: 1200px; margin: 0 auto; }
                    .metric-card { background: white; padding: 20px; margin: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .metric-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
                    .status-healthy { color: #28a745; }
                    .status-warning { color: #ffc107; }
                    .status-critical { color: #dc3545; }
                    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ETL Pipeline Monitoring Dashboard</h1>
                        <p>Real-time monitoring of Scout ETL operations</p>
                    </div>
                    <div id="metrics-grid" class="grid">
                        <!-- Metrics will be loaded here -->
                    </div>
                </div>
                <script>
                    async function loadMetrics() {
                        try {
                            const response = await fetch('/api/health');
                            const metrics = await response.json();

                            const grid = document.getElementById('metrics-grid');
                            grid.innerHTML = '';

                            metrics.forEach(metric => {
                                const card = document.createElement('div');
                                card.className = 'metric-card';
                                card.innerHTML = `
                                    <h3>${metric.name.replace(/_/g, ' ').toUpperCase()}</h3>
                                    <div class="metric-value status-${metric.status}">
                                        ${metric.value.toFixed(2)}
                                    </div>
                                    <div class="status-${metric.status}">
                                        Status: ${metric.status.toUpperCase()}
                                    </div>
                                    <small>Updated: ${new Date(metric.timestamp).toLocaleString()}</small>
                                `;
                                grid.appendChild(card);
                            });
                        } catch (error) {
                            console.error('Failed to load metrics:', error);
                        }
                    }

                    // Load metrics on page load
                    loadMetrics();

                    // Refresh every 30 seconds
                    setInterval(loadMetrics, 30000);
                </script>
            </body>
            </html>
            """

        @self.app.get("/api/health")
        async def get_health_metrics():
            """Get current health metrics"""
            metrics = await self.get_health_metrics()
            return [asdict(metric) for metric in metrics]

        @self.app.get("/api/metrics")
        async def get_prometheus_metrics():
            """Get Prometheus metrics in text format"""
            if PROMETHEUS_AVAILABLE:
                return generate_latest()
            else:
                raise HTTPException(status_code=503, detail="Prometheus not available")

        @self.app.get("/api/alerts")
        async def get_recent_alerts():
            """Get recent alerts"""
            recent_alerts = self.alert_manager.alert_history[-50:]  # Last 50 alerts
            return recent_alerts

        @self.app.get("/api/etl-performance")
        async def get_etl_performance():
            """Get ETL performance statistics"""
            if not self.supabase_client:
                raise HTTPException(status_code=503, detail="Database not available")

            try:
                # Get performance data from view
                response = self.supabase_client.table('v_etl_performance_dashboard').select('*').limit(30).execute()
                return response.data
            except Exception as e:
                logger.error(f"Error fetching ETL performance: {e}")
                raise HTTPException(status_code=500, detail="Failed to fetch performance data")

        @self.app.get("/api/column-mappings")
        async def get_column_mapping_stats():
            """Get column mapping effectiveness statistics"""
            if not self.supabase_client:
                raise HTTPException(status_code=503, detail="Database not available")

            try:
                response = self.supabase_client.table('v_column_mapping_effectiveness').select('*').execute()
                return response.data
            except Exception as e:
                logger.error(f"Error fetching column mapping stats: {e}")
                raise HTTPException(status_code=500, detail="Failed to fetch mapping data")

        @self.app.post("/api/test-alert")
        async def test_alert():
            """Test alert system"""
            test_metric = HealthMetric(
                name="test_metric",
                value=100,
                status="critical",
                details={"test": True},
                timestamp=datetime.now()
            )

            test_rule = AlertRule(
                metric_name="test_metric",
                condition="greater_than",
                threshold=50,
                severity="info",
                channels=["slack"]
            )

            self.alert_manager._send_alert(test_rule, test_metric)
            return {"message": "Test alert sent"}

    async def get_health_metrics(self) -> List[HealthMetric]:
        """Get current health metrics from database"""
        # Use cache if recent
        if (self.last_health_check and
                (datetime.now() - self.last_health_check).seconds < 60):
            return list(self.health_cache.values())

        metrics = []

        if self.supabase_client:
            try:
                # Call the health check function
                response = self.supabase_client.rpc('etl_health_check').execute()

                for row in response.data:
                    metric = HealthMetric(
                        name=row['metric_name'],
                        value=float(row['metric_value'] or 0),
                        status=row['status'],
                        details=row.get('details', {}),
                        timestamp=datetime.now()
                    )
                    metrics.append(metric)

                # Update cache
                self.health_cache = {m.name: m for m in metrics}
                self.last_health_check = datetime.now()

                # Update Prometheus metrics
                for metric in metrics:
                    if metric.name == 'minutes_since_last_sync':
                        self.prometheus_metrics.update_health_metrics(
                            self._calculate_health_score(metrics),
                            metric.value
                        )

            except Exception as e:
                logger.error(f"Error getting health metrics: {e}")

        return metrics

    def _calculate_health_score(self, metrics: List[HealthMetric]) -> float:
        """Calculate overall health score from individual metrics"""
        if not metrics:
            return 0.0

        healthy_count = sum(1 for m in metrics if m.status == 'healthy')
        warning_count = sum(1 for m in metrics if m.status == 'warning')
        critical_count = sum(1 for m in metrics if m.status == 'critical')

        total = len(metrics)
        score = (healthy_count * 1.0 + warning_count * 0.5 + critical_count * 0.0) / total
        return score * 100

    def start_monitoring(self):
        """Start background monitoring tasks"""
        def monitoring_loop():
            while True:
                try:
                    # Get health metrics
                    asyncio.run(self._periodic_health_check())
                    time.sleep(60)  # Check every minute
                except Exception as e:
                    logger.error(f"Error in monitoring loop: {e}")
                    time.sleep(60)

        self.monitoring_thread = threading.Thread(target=monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        logger.info("Monitoring thread started")

    async def _periodic_health_check(self):
        """Periodic health check and alerting"""
        metrics = await self.get_health_metrics()

        # Check alerts
        self.alert_manager.check_alerts(metrics)

        # Log health status
        health_score = self._calculate_health_score(metrics)
        logger.info(f"ETL Health Score: {health_score:.1f}%")

        for metric in metrics:
            if metric.status != 'healthy':
                logger.warning(f"Metric {metric.name}: {metric.value} ({metric.status})")

    def run_server(self, host: str = "0.0.0.0", port: int = 8080):
        """Run the dashboard server"""
        logger.info(f"Starting ETL monitoring dashboard on {host}:{port}")

        # Start Prometheus metrics server if available
        if PROMETHEUS_AVAILABLE:
            prometheus_port = self.config.get('prometheus_port', 9090)
            try:
                start_http_server(prometheus_port)
                logger.info(f"Prometheus metrics server started on port {prometheus_port}")
            except Exception as e:
                logger.error(f"Failed to start Prometheus server: {e}")

        # Run FastAPI server
        uvicorn.run(self.app, host=host, port=port, log_level="info")


def load_config() -> Dict[str, Any]:
    """Load configuration from environment and files"""
    config = {
        'supabase_url': os.getenv('SUPABASE_URL'),
        'supabase_key': os.getenv('SUPABASE_KEY'),
        'prometheus_port': int(os.getenv('PROMETHEUS_PORT', '9090')),
        'dashboard_port': int(os.getenv('DASHBOARD_PORT', '8080')),
        'alerts': {
            'slack': {
                'webhook_url': os.getenv('SLACK_WEBHOOK_URL')
            },
            'email': {
                'enabled': False
            }
        }
    }

    # Load config file if exists
    config_file = Path('/app/config/monitoring.json')
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            logger.error(f"Error loading config file: {e}")

    return config


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='ETL Monitoring Dashboard')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to')
    parser.add_argument('--config', help='Configuration file path')

    args = parser.parse_args()

    # Load configuration
    config = load_config()

    if args.config and Path(args.config).exists():
        with open(args.config, 'r') as f:
            custom_config = json.load(f)
            config.update(custom_config)

    # Create and run dashboard
    dashboard = ETLMonitoringDashboard(config)
    dashboard.run_server(host=args.host, port=args.port)


if __name__ == "__main__":
    main()