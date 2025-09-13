'use client';

import { useState, useEffect } from 'react';
import { ProcessCampaigns } from '@/components/ProcessCampaigns';
import { CreativeInsightsComponent } from '@/components/CreativeInsightsComponent';
import { HealthCheck } from '@/components/HealthCheck';
import { PageIndexDashboard } from '@/components/PageIndexDashboard';
import { Target, Upload, BarChart3, Activity, Database } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('process');
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    // Check system status on load
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  const tabs = [
    { id: 'process', label: 'Campaign Processing', icon: Upload },
    { id: 'insights', label: 'Creative Insights', icon: Target },
    { id: 'pageindex', label: 'PageIndex System', icon: Database },
    { id: 'analytics', label: 'Campaign Analytics', icon: BarChart3 },
    { id: 'health', label: 'System Health', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TBWA Creative Intelligence</h1>
                <p className="text-gray-600">Campaign Analysis & Creative Strategy Insights</p>
              </div>
            </div>
            
            {/* System Status Indicator */}
            {systemStatus && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {systemStatus.status === 'healthy' ? 'System Operational' : 'System Issues'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'process' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Processing</h2>
              <p className="text-gray-600 mb-6">
                Process campaign files from Google Drive to extract creative features and predict business outcomes.
              </p>
            </div>
            <ProcessCampaigns />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Creative Strategy Insights</h2>
              <p className="text-gray-600 mb-6">
                Ask questions about creative strategies, campaign effectiveness, and business outcomes.
              </p>
            </div>
            <CreativeInsightsComponent />
          </div>
        )}

        {activeTab === 'pageindex' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">PageIndex System</h2>
              <p className="text-gray-600 mb-6">
                ColPali-style semantic indexing, cataloging, and file-level linking for creative content discovery.
              </p>
            </div>
            <PageIndexDashboard />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Analytics</h2>
              <p className="text-gray-600 mb-6">
                View analytics on creative features, business outcomes, and campaign performance patterns.
              </p>
            </div>
            <div className="bg-white rounded-lg border p-8 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Advanced analytics and reporting will be available here once campaigns are processed.
              </p>
              <button 
                onClick={() => setActiveTab('process')}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Process Campaigns First
              </button>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">System Health</h2>
              <p className="text-gray-600 mb-6">
                Monitor system status, database connectivity, and service availability.
              </p>
            </div>
            <HealthCheck />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              TBWA Creative Campaign Analysis System - Powered by Azure AI
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>30+ Creative Features</span>
              <span>•</span>
              <span>25+ Business Outcomes</span>
              <span>•</span>
              <span>Real-time Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
