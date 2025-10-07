'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart3, TrendingUp as TrendingUpIcon, Users, Activity } from 'lucide-react';
import { scoutFetch, handleScoutFetchError } from '@/lib/scoutFetch';
import ChoroplethMap from './ChoroplethMap';

// Type definitions
interface DashboardData {
  timestamp: string;
  executive_summary: {
    total_campaigns: number;
    avg_ces_score: number;
    performance_status: string;
  };
  top_brands: Array<{
    brand: string;
    campaign_count: number;
    avg_ces_score: number;
    avg_roi_multiplier: number;
  }>;
  campaign_trends: Array<{
    month: string;
    campaign_count: number;
    avg_ces_score: number;
    innovation_score: number;
  }>;
  system_status: {
    overall_status: 'OPERATIONAL' | 'DEGRADED' | 'ERROR';
    alerts_count: number;
  };
  api_version: string;
}

interface CampaignDataItem {
  campaign_id: string;
  campaign_name: string;
  brand_name: string;
  roi_percentage: string | number;
  campaign_status: string;
  impressions_delivered: number;
  conversions_tracked: number;
}

interface RegionalDataItem {
  region_name: string;
  revenue: number;
  growth_rate: number;
  market_share: number;
  transaction_count: number;
}

// Real data interfaces for scout.gold views
interface BasketAnalysisData {
  transaction_date: string;
  avg_basket_value: number;
  total_transactions: number;
  total_revenue: number;
}

interface CustomerActivityData {
  transaction_date: string;
  total_transactions: number;
  total_revenue: number;
  avg_satisfaction: number;
}

interface ExecutiveDashboardData {
  total_revenue_millions: string;
  total_transactions: number;
  tbwa_market_share_pct: string;
  avg_handshake_score: string;
  campaign_influence_pct: string;
  regions_covered: number;
  active_stores: number;
  system_status: string;
  last_updated_date: string;
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeType, icon: Icon, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                     changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
  const bgColor = changeType === 'increase' ? 'bg-green-50' : 
                  changeType === 'decrease' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {Icon && <Icon className="h-8 w-8 text-gray-400" />}
      </div>
      {change && (
        <div className={`flex items-center mt-4 px-3 py-1 rounded-full text-sm ${bgColor}`}>
          {changeType === 'increase' && <TrendingUp className="h-4 w-4 mr-1" />}
          {changeType === 'decrease' && <TrendingDown className="h-4 w-4 mr-1" />}
          <span className={changeColor}>{change}</span>
        </div>
      )}
    </div>
  );
};

// Timeseries Chart Component
interface TimeseriesChartProps {
  title: string;
  data: Array<{ 
    month: string; 
    campaign_count?: number;
    avg_ces_score?: number;
    innovation_score?: number;
    value?: number;
  }>;
  loading?: boolean;
}

const TimeseriesChart: React.FC<TimeseriesChartProps> = ({ title, data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.avg_ces_score || 0));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[...Array(5)].map((_, i) => (
            <line key={i} x1="40" y1={40 + i * 30} x2="360" y2={40 + i * 30} 
                  stroke="#e5e7eb" strokeWidth="1" />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((d, i) => 
              `${60 + i * (300 / (data.length - 1))},${180 - ((d.avg_ces_score || 0) / maxValue) * 120}`
            ).join(' ')}
          />
          
          {/* Fill area */}
          <polygon
            fill="url(#gradient)"
            points={`60,180 ${data.map((d, i) => 
              `${60 + i * (300 / (data.length - 1))},${180 - ((d.avg_ces_score || 0) / maxValue) * 120}`
            ).join(' ')} ${60 + (data.length - 1) * (300 / (data.length - 1))},180`}
          />
          
          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={60 + i * (300 / (data.length - 1))}
              cy={180 - ((d.avg_ces_score || 0) / maxValue) * 120}
              r="4"
              fill="#3b82f6"
            />
          ))}
          
          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={60 + i * (300 / (data.length - 1))}
              y="195"
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {d.month.slice(-2)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

// Bar Chart Component
interface BarChartProps {
  title: string;
  data: Array<any>;
  valueKey: string;
  labelKey: string;
  loading?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, valueKey, labelKey, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[valueKey]));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-center">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item[labelKey]}
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900 w-16 text-right">
              {typeof item[valueKey] === 'number' && item[valueKey] > 1000 
                ? `${(item[valueKey] / 1000).toFixed(0)}K` 
                : item[valueKey]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// System Health Badge
interface SystemHealthBadgeProps {
  status: 'OPERATIONAL' | 'DEGRADED' | 'ERROR';
  alertsCount: number;
}

const SystemHealthBadge: React.FC<SystemHealthBadgeProps> = ({ status, alertsCount }) => {
  const isOperational = status === 'OPERATIONAL';
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isOperational ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isOperational ? <CheckCircle className="h-4 w-4 mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
      {status} {alertsCount > 0 && `(${alertsCount} alerts)`}
    </div>
  );
};

// Main Executive Dashboard Component
export default function ExecutiveDashboard() {
  const [execData, setExecData] = useState<ExecutiveDashboardData | null>(null);
  const [basketData, setBasketData] = useState<BasketAnalysisData[] | null>(null);
  const [customerData, setCustomerData] = useState<CustomerActivityData[] | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignDataItem[] | null>(null);
  const [regionalData, setRegionalData] = useState<RegionalDataItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to connect and get real data
        const canConnect = await scoutFetch.testConnection();
        
        if (canConnect) {
          // Try to fetch real data
          const [executive, basket, customer, campaigns, regional] = await Promise.all([
            scoutFetch.platinum.executive_dashboard_api(),
            scoutFetch.gold.basket_analysis_api(),
            scoutFetch.gold.customer_activity_api(),
            scoutFetch.gold.campaign_effect_api(),
            scoutFetch.gold.regional_performance_api()
          ]);
          
          setExecData(Array.isArray(executive) ? executive[0] : executive);
          setBasketData(Array.isArray(basket) ? basket : []);
          setCustomerData(Array.isArray(customer) ? customer : []);
          setRegionalData(Array.isArray(regional) ? regional : []);
          
          // Convert GoldCampaignEffect to CampaignDataItem
          const campaignDataItems: CampaignDataItem[] = (Array.isArray(campaigns) ? campaigns : []).map(camp => ({
            campaign_id: camp.campaign_id,
            campaign_name: camp.campaign_name,
            brand_name: camp.brand_name,
            roi_percentage: camp.roi_pct?.toString() || '0',
            campaign_status: 'ACTIVE',
            impressions_delivered: camp.campaign_reach || 0,
            conversions_tracked: camp.customer_acquisition_count || 0
          }));
          setCampaignData(campaignDataItems);
        } else {
          // Use mock data for development
          console.log('Using mock data - database views not yet available');
          setExecData({
            total_revenue_millions: '125.6',
            total_transactions: 45238,
            tbwa_market_share_pct: '34.2',
            avg_handshake_score: '8.7',
            campaign_influence_pct: '42.1',
            regions_covered: 12,
            active_stores: 1847,
            system_status: 'OPERATIONAL',
            last_updated_date: new Date().toISOString().split('T')[0]
          });
          
          // Generate mock basket data
          const mockBasketData: BasketAnalysisData[] = Array.from({ length: 7 }, (_, i) => ({
            transaction_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            avg_basket_value: 850 + Math.random() * 200,
            total_transactions: Math.floor(4500 + Math.random() * 1000),
            total_revenue: Math.floor(3500000 + Math.random() * 1000000)
          }));
          setBasketData(mockBasketData);
          
          // Generate mock customer data
          const mockCustomerData: CustomerActivityData[] = Array.from({ length: 7 }, (_, i) => ({
            transaction_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            total_transactions: Math.floor(4000 + Math.random() * 1500),
            total_revenue: Math.floor(3000000 + Math.random() * 1500000),
            avg_satisfaction: 7.5 + Math.random() * 2
          }));
          setCustomerData(mockCustomerData);
          
          // Generate mock campaign data
          const mockCampaignData: CampaignDataItem[] = [
            { campaign_id: '1', campaign_name: 'Summer Retail Push', brand_name: 'Nike', roi_percentage: '245%', campaign_status: 'ACTIVE', impressions_delivered: 12500000, conversions_tracked: 45230 },
            { campaign_id: '2', campaign_name: 'Holiday Collection', brand_name: 'Adidas', roi_percentage: '189%', campaign_status: 'ACTIVE', impressions_delivered: 8900000, conversions_tracked: 28750 },
            { campaign_id: '3', campaign_name: 'Tech Innovation', brand_name: 'Samsung', roi_percentage: '167%', campaign_status: 'COMPLETED', impressions_delivered: 15600000, conversions_tracked: 62100 },
            { campaign_id: '4', campaign_name: 'Wellness Focus', brand_name: 'Unilever', roi_percentage: '143%', campaign_status: 'ACTIVE', impressions_delivered: 7800000, conversions_tracked: 19200 },
            { campaign_id: '5', campaign_name: 'Premium Experience', brand_name: 'L\'Oreal', roi_percentage: '126%', campaign_status: 'PLANNING', impressions_delivered: 5400000, conversions_tracked: 15800 }
          ];
          setCampaignData(mockCampaignData);
          
          // Generate mock regional data
          const mockRegionalData: RegionalDataItem[] = [
            { region_name: 'NCR', revenue: 125430, growth_rate: 15.2, market_share: 34.2, transaction_count: 450 },
            { region_name: 'Region III', revenue: 89650, growth_rate: 12.8, market_share: 28.1, transaction_count: 320 },
            { region_name: 'CALABARZON', revenue: 76540, growth_rate: 9.3, market_share: 22.7, transaction_count: 280 },
            { region_name: 'Region VII', revenue: 54320, growth_rate: 11.5, market_share: 18.9, transaction_count: 195 },
            { region_name: 'Region VI', revenue: 43210, growth_rate: 8.7, market_share: 15.3, transaction_count: 155 },
            { region_name: 'Region XI', revenue: 32100, growth_rate: 13.4, market_share: 12.8, transaction_count: 115 },
            { region_name: 'Region IV-A', revenue: 28900, growth_rate: 7.2, market_share: 11.4, transaction_count: 103 },
            { region_name: 'Region X', revenue: 25600, growth_rate: 10.1, market_share: 9.7, transaction_count: 92 },
            { region_name: 'Region V', revenue: 19800, growth_rate: 6.8, market_share: 8.2, transaction_count: 71 },
            { region_name: 'Region VIII', revenue: 16700, growth_rate: 5.9, market_share: 7.1, transaction_count: 60 }
          ];
          setRegionalData(mockRegionalData);
          
          setError('📊 Development Mode: Using mock data (Database views not configured)');
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(handleScoutFetchError(error));
        
        // If there's an error, still show mock data so we can see the dashboard layout
        setExecData({
          total_revenue_millions: '125.6',
          total_transactions: 45238,
          tbwa_market_share_pct: '34.2',
          avg_handshake_score: '8.7',
          campaign_influence_pct: '42.1',
          regions_covered: 12,
          active_stores: 1847,
          system_status: 'DEGRADED',
          last_updated_date: new Date().toISOString().split('T')[0]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Overview</h1>
            <p className="text-gray-600 mt-1">Scout Platform v5.2 • Scout.Gold Single Source of Truth</p>
          </div>
          {execData && (
            <SystemHealthBadge 
              status={execData.system_status === 'OPERATIONAL' ? 'OPERATIONAL' : 'DEGRADED'} 
              alertsCount={0}
            />
          )}
        </div>
        {error && (
          <div className={`mt-4 p-4 rounded-lg ${
            error.includes('Development Mode') 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {error.includes('Development Mode') ? (
                <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className={error.includes('Development Mode') ? 'text-blue-700' : 'text-red-700'}>
                {error}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Revenue"
          value={execData ? `₱${execData.total_revenue_millions}M` : '--'}
          change="+15.2% growth"
          changeType="increase"
          icon={BarChart3}
          loading={loading}
        />
        <KPICard
          title="Total Transactions"
          value={execData?.total_transactions?.toLocaleString() || '--'}
          change="Daily volume"
          changeType="neutral"
          icon={TrendingUpIcon}
          loading={loading}
        />
        <KPICard
          title="TBWA Market Share"
          value={execData ? `${execData.tbwa_market_share_pct}%` : '--'}
          change="Market leadership"
          changeType="increase"
          icon={Users}
          loading={loading}
        />
        <KPICard
          title="Customer Satisfaction"
          value={execData ? (parseFloat(execData.avg_handshake_score) * 10).toFixed(1) : '--'}
          change="Handshake score"
          changeType="increase"
          icon={Activity}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart 1: Transaction Trends */}
        <TimeseriesChart
          title="Transaction Volume Trends (Last 7 Days)"
          data={basketData?.slice(0, 7).map(d => ({ 
            month: d.transaction_date.slice(-5), 
            avg_ces_score: d.total_transactions / 100 
          })) || []}
          loading={loading}
        />

        {/* Chart 2: Campaign Performance */}
        <BarChart
          title="Top Campaign ROI Performance"
          data={campaignData?.slice(0, 5).map(c => ({ 
            brand: c.brand_name, 
            avg_ces_score: parseFloat(c.roi_percentage?.toString() || '0') 
          })) || []}
          valueKey="avg_ces_score"
          labelKey="brand"
          loading={loading}
        />

        {/* Chart 3: Regional Performance Map */}
        <ChoroplethMap
          title="Regional Performance Map"
          data={regionalData || []}
          valueKey="revenue"
          colorScheme="revenue"
          loading={loading}
        />

        {/* Chart 4: Basket Analysis */}
        <BarChart
          title="Average Basket Value Trends"
          data={basketData?.slice(0, 7).map(b => ({ 
            date: b.transaction_date.slice(-5), 
            value: parseFloat(b.avg_basket_value?.toString() || '0') 
          })) || []}
          valueKey="value"
          labelKey="date"
          loading={loading}
        />
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Chart 5: Campaign ROI */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign ROI</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {campaignData?.slice(0, 4).map((campaign, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate">{campaign.campaign_name}</span>
                  <span className="text-sm font-medium text-green-600">{campaign.roi_percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 6: Transaction Growth */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Growth</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {basketData?.slice(0, 4).map((data, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{data.transaction_date.slice(-5)}</span>
                  <span className="text-sm font-medium">{data.total_transactions.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 7: Revenue Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {customerData?.slice(0, 4).map((data, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{data.transaction_date.slice(-5)}</span>
                  <span className="text-sm font-medium">₱{parseFloat(data.total_revenue?.toString() || '0').toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 8: System Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Stats</h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Stores</span>
                <span className="text-sm font-medium">{execData?.active_stores || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Regions</span>
                <span className="text-sm font-medium">{execData?.regions_covered || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Campaigns</span>
                <span className="text-sm font-medium">{campaignData?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium text-green-600">{execData?.system_status || 'OK'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Scout Platform v5.2 • Scout.Gold Views • Last updated: {execData?.last_updated_date || 'Loading...'}</p>
        <p className="mt-1">Data from: {basketData?.length || 0} days basket analysis • {campaignData?.length || 0} campaigns • {execData?.regions_covered || 0} regions</p>
      </div>
    </div>
  );
}