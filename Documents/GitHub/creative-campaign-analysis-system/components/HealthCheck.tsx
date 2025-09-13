'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Cloud, Shield, RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
  campaign_tables: string;
  services: {
    azure_sql: string;
    azure_openai: string;
    google_drive: string;
  };
  system_type: string;
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        setHealth(data);
      } else {
        setError(data.error || 'Health check failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
      case 'ready':
      case 'configured':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
      case 'disconnected':
      case 'missing':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
      case 'ready':
      case 'configured':
        return '✅';
      case 'unhealthy':
      case 'disconnected':
      case 'missing':
        return '❌';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            System Health Monitor
          </h3>
          
          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Overall System Status</h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
              {getStatusIcon(health.status)} {health.status.toUpperCase()}
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">System Type:</span>
              <p className="font-medium">{health.system_type}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Check:</span>
              <p className="font-medium">{new Date(health.timestamp).toLocaleTimeString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Database:</span>
              <p className={`font-medium ${getStatusColor(health.database)}`}>
                {getStatusIcon(health.database)} {health.database}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Campaign Tables:</span>
              <p className={`font-medium ${getStatusColor(health.campaign_tables)}`}>
                {getStatusIcon(health.campaign_tables)} {health.campaign_tables}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Services Status */}
      {health && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <Cloud className="mr-2 h-5 w-5" />
            Service Dependencies
          </h4>
          
          <div className="grid gap-4">
            {/* Azure SQL */}
            <div className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center">
                <Database className="mr-3 h-5 w-5 text-blue-500" />
                <div>
                  <h5 className="font-medium">Azure SQL Database</h5>
                  <p className="text-sm text-gray-600">Campaign data storage and analytics</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.azure_sql)}`}>
                {getStatusIcon(health.services.azure_sql)} {health.services.azure_sql}
              </div>
            </div>

            {/* Azure OpenAI */}
            <div className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center">
                <Shield className="mr-3 h-5 w-5 text-purple-500" />
                <div>
                  <h5 className="font-medium">Azure OpenAI</h5>
                  <p className="text-sm text-gray-600">Creative insights and embeddings</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.azure_openai)}`}>
                {getStatusIcon(health.services.azure_openai)} {health.services.azure_openai}
              </div>
            </div>

            {/* Google Drive */}
            <div className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center">
                <Cloud className="mr-3 h-5 w-5 text-green-500" />
                <div>
                  <h5 className="font-medium">Google Drive API</h5>
                  <p className="text-sm text-gray-600">Campaign file extraction</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.google_drive)}`}>
                {getStatusIcon(health.services.google_drive)} {health.services.google_drive}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h4 className="text-lg font-medium text-red-800 mb-2">❌ Health Check Failed</h4>
          <p className="text-red-600">{error}</p>
          
          <div className="mt-4 bg-red-50 rounded p-4">
            <h5 className="font-medium text-red-800 text-sm mb-2">Troubleshooting Steps:</h5>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Check that environment variables are configured</li>
              <li>• Verify Azure SQL Database connection</li>
              <li>• Ensure Azure OpenAI API key is valid</li>
              <li>• Confirm Google Drive service account credentials</li>
              <li>• Check network connectivity</li>
            </ul>
          </div>
        </div>
      )}

      {/* Environment Setup Guide */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <h4 className="text-lg font-medium mb-4">🔧 Environment Setup</h4>
        
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-sm mb-2">Required Environment Variables:</h5>
            <div className="bg-white rounded border p-3 font-mono text-xs space-y-1">
              <div>CES_AZURE_SQL_SERVER=your-server.database.windows.net</div>
              <div>CES_AZURE_SQL_DATABASE=your-database</div>
              <div>CES_AZURE_SQL_USER=your-username</div>
              <div>CES_AZURE_SQL_PASSWORD=your-password</div>
              <div>AZURE_OPENAI_API_KEY=your-openai-key</div>
              <div>AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com</div>
              <div>AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment</div>
              <div>GOOGLE_SERVICE_ACCOUNT_KEY={"{"}"type":"service_account",...{"}"}</div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> Create a <code>.env.local</code> file in your project root with these variables.</p>
          </div>
        </div>
      </div>
    </div>
  );
}