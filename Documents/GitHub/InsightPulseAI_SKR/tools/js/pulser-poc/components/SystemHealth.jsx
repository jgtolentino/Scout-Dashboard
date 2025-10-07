import React, { useState, useEffect } from 'react';

/**
 * SystemHealth Component for Dashboard Integration
 * 
 * A plug-and-play React component that displays real-time system health
 * for the Brand Performance API. Perfect for MockifyCreator dashboards.
 * 
 * Usage:
 * <SystemHealth 
 *   apiUrl="http://127.0.0.1:7072"
 *   refreshInterval={60000}
 *   showDetails={true}
 * />
 */

const SystemHealth = ({ 
  apiUrl = 'http://127.0.0.1:7072',
  refreshInterval = 60000, // 60 seconds
  showDetails = true,
  className = '',
  onStatusChange = null
}) => {
  const [status, setStatus] = useState('loading');
  const [metrics, setMetrics] = useState({
    p99: null,
    errorRate: null,
    cacheHitRate: null,
    uptime: null
  });
  const [issues, setIssues] = useState([]);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setStatus(data.status);
      setMetrics(data.metrics);
      setIssues(data.issues || []);
      setLastChecked(new Date(data.lastChecked));
      setError(null);
      
      // Notify parent component of status changes
      if (onStatusChange) {
        onStatusChange(data.status, data.metrics, data.issues);
      }
      
    } catch (err) {
      console.error('SystemHealth: Failed to fetch status:', err);
      setStatus('error');
      setError(err.message);
      setMetrics({
        p99: null,
        errorRate: null,
        cacheHitRate: null,
        uptime: null
      });
      setIssues(['Failed to connect to API']);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatus();
    
    // Set up polling interval
    const interval = setInterval(fetchStatus, refreshInterval);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [apiUrl, refreshInterval]);

  // Status indicator colors and icons
  const getStatusConfig = (status) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✅',
          label: 'Healthy'
        };
      case 'degraded':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⚠️',
          label: 'Degraded'
        };
      case 'error':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '❌',
          label: 'Error'
        };
      case 'loading':
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '⏳',
          label: 'Loading...'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  // Format metrics for display
  const formatMetric = (value, suffix = '') => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      return Math.round(value) + suffix;
    }
    return value;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`system-health-widget ${className}`}>
      <div className={`p-4 rounded-lg border-2 ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 rounded-full ${statusConfig.color}`}></span>
            <span className={`font-semibold ${statusConfig.textColor}`}>
              {statusConfig.icon} System Health
            </span>
          </div>
          <span className={`text-sm font-medium ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Metrics Grid */}
        {showDetails && status !== 'loading' && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatMetric(metrics.p99, 'ms')}
              </div>
              <div className="text-xs text-gray-600">P99 Latency</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatMetric(metrics.errorRate * 100, '%')}
              </div>
              <div className="text-xs text-gray-600">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatMetric(metrics.cacheHitRate * 100, '%')}
              </div>
              <div className="text-xs text-gray-600">Cache Hit</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatUptime(metrics.uptime)}
              </div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
          </div>
        )}

        {/* Issues */}
        {issues.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Issues:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              {issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-red-500">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
            <strong>Connection Error:</strong> {error}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : '—'}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;

// Alternative compact version for smaller spaces
export const SystemHealthCompact = ({ 
  apiUrl = 'http://127.0.0.1:7072',
  refreshInterval = 60000,
  className = '',
  onStatusChange = null
}) => {
  const [status, setStatus] = useState('loading');
  const [metrics, setMetrics] = useState({});
  const [lastChecked, setLastChecked] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/status`);
      const data = await response.json();
      
      setStatus(data.status);
      setMetrics(data.metrics);
      setLastChecked(new Date(data.lastChecked));
      
      if (onStatusChange) {
        onStatusChange(data.status, data.metrics, data.issues);
      }
    } catch (err) {
      setStatus('error');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [apiUrl, refreshInterval]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
      <span className="text-sm font-medium text-gray-700">
        API {status === 'loading' ? 'Loading...' : status}
      </span>
      {metrics.p99 && (
        <span className="text-xs text-gray-500">
          {Math.round(metrics.p99)}ms
        </span>
      )}
    </div>
  );
};

// CSS styles (if not using Tailwind)
export const systemHealthStyles = `
.system-health-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.system-health-widget .status-healthy {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.system-health-widget .status-degraded {
  background-color: #fefce8;
  border-color: #fde047;
  color: #a16207;
}

.system-health-widget .status-error {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.system-health-widget .status-loading {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #374151;
}
`;
