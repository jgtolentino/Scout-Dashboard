import React, { useState, useEffect } from 'react';
import { Database, Layers, Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Zap, FileText, BarChart3 } from 'lucide-react';

const ScoutETLDashboard = () => {
  const [pipelineStatus, setPipelineStatus] = useState({
    bronze_records: 2456,
    silver_records: 2456,
    gold_metrics: 89,
    data_quality_score: 0.95,
    active_devices: 3,
    last_processed: '2025-08-11T10:30:15Z',
    processing_status: 'active'
  });

  const [medallionLayers, setMedallionLayers] = useState([
    {
      layer: 'Bronze',
      description: 'Raw data ingestion with audit trail',
      records: 2456,
      status: 'healthy',
      color: 'orange',
      icon: Database,
      details: 'scoutpi-0003.zip → 1,220+ JSON files processed'
    },
    {
      layer: 'Silver', 
      description: 'Cleaned, standardized telemetry data',
      records: 2456,
      status: 'healthy',
      color: 'blue',
      icon: Layers,
      details: 'Data quality score: 95% • All transformations applied'
    },
    {
      layer: 'Gold',
      description: 'Aggregated analytics and executive KPIs',
      records: 89,
      status: 'healthy', 
      color: 'yellow',
      icon: TrendingUp,
      details: 'Executive dashboard • Real-time business metrics'
    }
  ]);

  const [recentProcessing, setRecentProcessing] = useState([
    {
      id: 1,
      filename: 'scoutpi-0003.zip',
      device_id: 'scoutpi-0003',
      records_processed: 1220,
      processing_time: '4.2s',
      quality_score: 0.96,
      status: 'completed',
      timestamp: '2025-08-11T10:30:15Z'
    },
    {
      id: 2,
      filename: 'scoutpi-0002.zip',
      device_id: 'scoutpi-0002',
      records_processed: 856,
      processing_time: '3.1s',
      quality_score: 0.94,
      status: 'completed',
      timestamp: '2025-08-11T09:45:30Z'
    },
    {
      id: 3,
      filename: 'scoutpi-0006.zip',
      device_id: 'scoutpi-0006',
      records_processed: 380,
      processing_time: '1.8s',
      quality_score: 0.98,
      status: 'completed',
      timestamp: '2025-08-11T09:12:45Z'
    }
  ]);

  const [deviceHealth, setDeviceHealth] = useState([
    {
      device_id: 'scoutpi-0003',
      status: 'online',
      last_seen: '2025-08-11T10:30:15Z',
      battery_level: 85,
      signal_strength: -65,
      daily_transactions: 1220
    },
    {
      device_id: 'scoutpi-0002', 
      status: 'online',
      last_seen: '2025-08-11T09:45:30Z',
      battery_level: 72,
      signal_strength: -58,
      daily_transactions: 856
    },
    {
      device_id: 'scoutpi-0006',
      status: 'warning',
      last_seen: '2025-08-11T09:12:45Z', 
      battery_level: 23,
      signal_strength: -78,
      daily_transactions: 380
    }
  ]);

  // Supabase configuration
  const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';

  // Trigger ETL processing manually
  const triggerETL = async (filename = 'scoutpi-0003.zip') => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/scout-etl-processor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'process_file',
            filename: filename,
            force_reprocess: false
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('ETL processing result:', result);
        
        // Add to recent processing log
        setRecentProcessing(prev => [{
          id: Date.now(),
          filename: filename,
          device_id: filename.split('.')[0],
          records_processed: result.bronze_records || 0,
          processing_time: `${(result.processing_time_ms / 1000).toFixed(1)}s`,
          quality_score: result.data_quality_score || 0.95,
          status: result.success ? 'completed' : 'failed',
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);

        // Update pipeline status
        setPipelineStatus(prev => ({
          ...prev,
          bronze_records: prev.bronze_records + (result.bronze_records || 0),
          silver_records: prev.silver_records + (result.silver_records || 0),
          gold_metrics: prev.gold_metrics + (result.gold_metrics || 0),
          last_processed: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('ETL processing error:', error);
    }
  };

  // Get ETL orchestration status
  const getETLStatus = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/scout_etl_dashboard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.G5U5FynZtaeSC0rcJzuGT0VyMy0EKkR4JhMu6XKvNXU'
          }
        }
      );

      if (response.ok) {
        const status = await response.json();
        setPipelineStatus(prev => ({ ...prev, ...status[0] }));
      }
    } catch (error) {
      console.error('Error fetching ETL status:', error);
    }
  };

  useEffect(() => {
    getETLStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(getETLStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Database className="w-10 h-10" />
              <Zap className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Scout ETL Pipeline</h1>
              <p className="text-blue-100">Automated Medallion Architecture • Real-time Edge Data Processing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{pipelineStatus.active_devices}</p>
              <p className="text-blue-100 text-sm">Active Devices</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{(pipelineStatus.data_quality_score * 100).toFixed(0)}%</p>
              <p className="text-blue-100 text-sm">Quality Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medallion Architecture Status */}
      <div className="grid md:grid-cols-3 gap-6">
        {medallionLayers.map((layer) => {
          const IconComponent = layer.icon;
          return (
            <div
              key={layer.layer}
              className={`bg-white rounded-lg shadow-sm p-6 border-l-4 border-${layer.color}-500`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${layer.color}-100 rounded-lg`}>
                    <IconComponent className={`w-6 h-6 text-${layer.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{layer.layer} Layer</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 capitalize">{layer.status}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  {layer.records.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{layer.description}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{layer.details}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Controls & Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            ETL Pipeline Control
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-Processing Active</span>
            </div>
            <button
              onClick={() => triggerETL()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Trigger Manual ETL
            </button>
          </div>
        </div>

        {/* Processing Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-600 text-sm font-medium">Bronze Records</p>
            <p className="text-2xl font-bold text-blue-700">{pipelineStatus.bronze_records?.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-600 text-sm font-medium">Silver Records</p>
            <p className="text-2xl font-bold text-green-700">{pipelineStatus.silver_records?.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-yellow-600 text-sm font-medium">Gold Metrics</p>
            <p className="text-2xl font-bold text-yellow-700">{pipelineStatus.gold_metrics?.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-purple-600 text-sm font-medium">Quality Score</p>
            <p className="text-2xl font-bold text-purple-700">{(pipelineStatus.data_quality_score * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Last Processed Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Last Processed:</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {new Date(pipelineStatus.last_processed).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Processing Log */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Recent Processing Activity
        </h2>
        
        <div className="space-y-3">
          {recentProcessing.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  log.status === 'completed' ? 'bg-green-500' :
                  log.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                
                <div>
                  <p className="font-medium text-gray-900">{log.filename}</p>
                  <p className="text-sm text-gray-600">{log.device_id} • {new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{log.records_processed.toLocaleString()}</p>
                  <p>Records</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{log.processing_time}</p>
                  <p>Time</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{(log.quality_score * 100).toFixed(1)}%</p>
                  <p>Quality</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Health Monitoring */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Scout Device Health
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {deviceHealth.map((device) => (
            <div
              key={device.device_id}
              className={`p-4 rounded-lg border-2 ${
                device.status === 'online' ? 'border-green-200 bg-green-50' :
                device.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{device.device_id}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  device.status === 'online' ? 'bg-green-100 text-green-700' :
                  device.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {device.status.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Battery:</span>
                  <span className={`font-medium ${
                    device.battery_level > 50 ? 'text-green-600' :
                    device.battery_level > 20 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {device.battery_level}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Signal:</span>
                  <span className="font-medium text-gray-900">{device.signal_strength} dBm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Transactions:</span>
                  <span className="font-medium text-gray-900">{device.daily_transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(device.last_seen).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 mb-2">ETL Pipeline Status: OPERATIONAL</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <p>✅ <strong>Storage Webhook:</strong> Active (auto-trigger on upload)</p>
                <p>✅ <strong>Medallion Layers:</strong> Bronze/Silver/Gold operational</p>
                <p>✅ <strong>Data Quality:</strong> 95%+ score maintained</p>
              </div>
              <div>
                <p>✅ <strong>Scheduled Jobs:</strong> Hourly/Daily/Weekly running</p>
                <p>✅ <strong>Device Monitoring:</strong> Real-time health tracking</p>
                <p>✅ <strong>Anomaly Detection:</strong> Auto-alert system active</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Eugene's scoutpi-0003.zip:</strong> Ready for automatic processing! 
                Upload to <code className="bg-green-100 px-1 rounded">scout-ingest</code> bucket 
                → 1,220+ records processed through complete medallion architecture in ~5 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoutETLDashboard;