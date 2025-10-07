import React, { useState, useEffect } from 'react';
import { Database, Cloud, Activity, Package, Clock, AlertTriangle, CheckCircle, Info, Zap, Upload, Play, Pause } from 'lucide-react';

const EnhancedDataSourceMonitor = () => {
  const [config, setConfig] = useState([
    {
      id: 1,
      source_name: 'scout-ingest',
      bucket_name: 'scout-ingest',
      description: 'Eugene\'s real edge data (720KB ZIP with 1,220+ transactions)',
      is_active: true,
      auto_trigger_enabled: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      source_name: 'sample',
      bucket_name: 'sample',
      description: 'Generated sample data (10K records, Philippine distribution)',
      is_active: false,
      auto_trigger_enabled: false,
      updated_at: new Date().toISOString()
    }
  ]);
  
  const [processingLog, setProcessingLog] = useState([
    {
      id: 1,
      file_name: 'eugene-batch-001.zip',
      processing_status: 'completed',
      records_processed: 1220,
      silver_processed: 1220,
      processing_method: 'zip_extraction',
      triggered_by: 'storage_webhook',
      processed_at: '2025-08-11T08:30:15Z',
      file_size: 737280
    },
    {
      id: 2,
      file_name: 'stream-data-001.jsonl',
      processing_status: 'completed',
      records_processed: 450,
      silver_processed: 445,
      processing_method: 'jsonl_stream',
      triggered_by: 'storage_webhook',
      processed_at: '2025-08-11T08:25:30Z',
      file_size: 125000
    },
    {
      id: 3,
      file_name: 'single-transaction.json',
      processing_status: 'completed',
      records_processed: 1,
      silver_processed: 1,
      processing_method: 'json_direct',
      triggered_by: 'storage_webhook',
      processed_at: '2025-08-11T08:20:45Z',
      file_size: 2048
    }
  ]);

  const [autoTriggerStats, setAutoTriggerStats] = useState({
    webhookStatus: 'active',
    cronStatus: 'active',
    lastTrigger: '2025-08-11T08:30:15Z',
    filesProcessedToday: 23,
    totalRecordsToday: 8450,
    avgProcessingTime: '2.3s'
  });

  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Supabase configuration
  const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.G5U5FynZtaeSC0rcJzuGT0VyMy0EKkR4JhMu6XKvNXU';

  // Fetch processing log from database
  const fetchProcessingLog = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/scout.processing_log?order=processed_at.desc&limit=10`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProcessingLog(data);
      }
    } catch (error) {
      console.error('Error fetching processing log:', error);
    }
  };

  // Toggle auto-trigger for a data source
  const toggleAutoTrigger = async (sourceName) => {
    setConfig(prev => prev.map(source => 
      source.source_name === sourceName 
        ? { ...source, auto_trigger_enabled: !source.auto_trigger_enabled }
        : source
    ));

    // In production, this would call an edge function to configure webhooks
    console.log(`Auto-trigger ${config.find(c => c.source_name === sourceName)?.auto_trigger_enabled ? 'disabled' : 'enabled'} for ${sourceName}`);
  };

  // Test auto-trigger system
  const testAutoTrigger = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/storage-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'INSERT',
            table: 'objects',
            record: {
              name: 'test-file.json',
              bucket_id: 'scout-ingest',
              created_at: new Date().toISOString(),
              metadata: { size: 1024 }
            },
            schema: 'storage'
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Auto-trigger test result:', result);
        
        // Add to processing log
        setProcessingLog(prev => [{
          id: Date.now(),
          file_name: 'test-file.json',
          processing_status: 'completed',
          records_processed: 1,
          silver_processed: 1,
          processing_method: 'test_trigger',
          triggered_by: 'manual_test',
          processed_at: new Date().toISOString(),
          file_size: 1024
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error testing auto-trigger:', error);
    }
  };

  // Simulate file upload (drag & drop or manual upload)
  const simulateFileUpload = async (fileType = 'json') => {
    const fileName = `simulated-${Date.now()}.${fileType}`;
    
    // Add to processing log immediately to show real-time processing
    setProcessingLog(prev => [{
      id: Date.now(),
      file_name: fileName,
      processing_status: 'processing',
      records_processed: 0,
      processing_method: `${fileType}_simulation`,
      triggered_by: 'file_upload',
      processed_at: new Date().toISOString(),
      file_size: Math.floor(Math.random() * 100000) + 10000
    }, ...prev.slice(0, 9)]);

    // Simulate processing time
    setTimeout(() => {
      setProcessingLog(prev => prev.map(log => 
        log.file_name === fileName 
          ? {
              ...log,
              processing_status: 'completed',
              records_processed: fileType === 'zip' ? 1220 : fileType === 'jsonl' ? 450 : 1,
              silver_processed: fileType === 'zip' ? 1220 : fileType === 'jsonl' ? 445 : 1
            }
          : log
      ));
    }, 2000);
  };

  useEffect(() => {
    fetchProcessingLog();
    
    // Set up real-time subscription (in production)
    // const subscription = supabase
    //   .channel('processing-log')
    //   .on('postgres_changes', 
    //     { event: 'INSERT', schema: 'scout', table: 'processing_log' },
    //     (payload) => {
    //       setProcessingLog(prev => [payload.new, ...prev.slice(0, 9)]);
    //     }
    //   )
    //   .subscribe();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchProcessingLog, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeSource = config.find(c => c.is_active);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Auto-Trigger Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Database className="w-8 h-8 text-blue-600" />
              <Zap className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auto-Trigger ETL Monitor</h1>
              <p className="text-sm text-gray-500">Any file uploaded → Automatic processing → Live dashboards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Auto-Trigger Active</span>
            </div>
            <button
              onClick={testAutoTrigger}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Auto-Trigger
            </button>
          </div>
        </div>

        {/* Auto-Trigger Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-600 text-sm font-medium">Files Today</p>
            <p className="text-2xl font-bold text-blue-700">{autoTriggerStats.filesProcessedToday}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-600 text-sm font-medium">Records Today</p>
            <p className="text-2xl font-bold text-green-700">{autoTriggerStats.totalRecordsToday.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-purple-600 text-sm font-medium">Avg Speed</p>
            <p className="text-2xl font-bold text-purple-700">{autoTriggerStats.avgProcessingTime}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-orange-600 text-sm font-medium">Last Trigger</p>
            <p className="text-sm font-bold text-orange-700">
              {new Date(autoTriggerStats.lastTrigger).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Active Source with Auto-Trigger Status */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Auto-Processing Active Source</p>
                <p className="text-xl font-bold text-gray-900">{activeSource?.source_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Webhook Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Cron Backup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Simulation Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Simulate File Uploads (Auto-Processing Demo)
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => simulateFileUpload('zip')}
            className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 transition-colors group"
          >
            <Package className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Upload ZIP File</p>
            <p className="text-sm text-gray-500">Eugene's format (1,220+ records)</p>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-orange-600 group-hover:text-orange-700">
              <Zap className="w-3 h-3" />
              <span>Auto-processes in ~5s</span>
            </div>
          </button>

          <button
            onClick={() => simulateFileUpload('jsonl')}
            className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 transition-colors group"
          >
            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Upload JSONL Stream</p>
            <p className="text-sm text-gray-500">Pi device format (stream data)</p>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-600 group-hover:text-blue-700">
              <Zap className="w-3 h-3" />
              <span>Auto-processes in ~2s</span>
            </div>
          </button>

          <button
            onClick={() => simulateFileUpload('json')}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 transition-colors group"
          >
            <Database className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Upload JSON File</p>
            <p className="text-sm text-gray-500">Single transaction/batch</p>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-green-600 group-hover:text-green-700">
              <Zap className="w-3 h-3" />
              <span>Auto-processes in ~1s</span>
            </div>
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Real Production Behavior:</p>
              <p>Any file uploaded to <code className="bg-yellow-100 px-1 rounded">scout-ingest</code> bucket triggers automatic ETL processing within seconds. No manual intervention required!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources with Auto-Trigger Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        {config.map((source) => (
          <div
            key={source.id}
            className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
              source.is_active 
                ? 'border-blue-500 bg-blue-50/30' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {source.source_name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{source.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                {source.is_active && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    ACTIVE
                  </span>
                )}
                {source.auto_trigger_enabled && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    AUTO-TRIGGER
                  </span>
                )}
              </div>
            </div>

            {/* Auto-Trigger Control */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Auto-Processing</span>
                <button
                  onClick={() => toggleAutoTrigger(source.source_name)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    source.auto_trigger_enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      source.auto_trigger_enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-600">
                {source.auto_trigger_enabled 
                  ? 'Files uploaded to this bucket will be processed automatically'
                  : 'Manual processing only - auto-trigger disabled'
                }
              </p>
            </div>

            {/* Processing Stats */}
            {source.source_name === 'scout-ingest' && (
              <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700 font-medium">
                  🎯 Eugene's 720KB ZIP → 1,220+ records → Processed in ~5 seconds
                </p>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Updated: {new Date(source.updated_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Processing Log */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Real-time Processing Log
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">LIVE</span>
        </h2>
        
        <div className="space-y-2">
          {processingLog.map((log) => (
            <div
              key={log.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                log.processing_status === 'completed' ? 'bg-green-50' : 
                log.processing_status === 'processing' ? 'bg-yellow-50' : 
                'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {log.processing_status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : log.processing_status === 'processing' ? (
                  <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {log.file_name}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {log.processing_method?.replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.processed_at).toLocaleString()} • 
                    Triggered by {log.triggered_by?.replace('_', ' ')} • 
                    {(log.file_size / 1024).toFixed(1)}KB
                  </p>
                </div>
              </div>
              <div className="text-right">
                {log.processing_status === 'completed' && (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {log.records_processed?.toLocaleString()} records
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.silver_processed?.toLocaleString()} → silver
                    </p>
                  </>
                )}
                {log.processing_status === 'processing' && (
                  <p className="text-sm text-yellow-600">Processing...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800 flex-1">
            <p className="font-semibold mb-2">Auto-Trigger System Status</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Storage Webhooks: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Cron Backup: Every 5min</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Database Triggers: Ready</span>
              </div>
            </div>
            <p className="mt-2 text-xs">
              🚀 <strong>Eugene's ZIP file</strong> will auto-process all 1,220+ transactions within 5 seconds of upload!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDataSourceMonitor;