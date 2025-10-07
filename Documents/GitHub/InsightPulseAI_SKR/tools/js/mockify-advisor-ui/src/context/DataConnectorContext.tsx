import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MedallionDataConnector, DataSourceMode, MedallionTier } from '@/lib/medallion_data_connector';
import { KpiData, InsightData, ChartData } from '@/types/advisor';
import { useRole } from '@/context/RoleContext';

interface DataConnectorContextType {
  connector: MedallionDataConnector;
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
  tier: MedallionTier;
  badge: {
    label: string;
    color: string;
    description: string;
    tier: MedallionTier;
  };
  lastUpdated: Date;
  isLoading: boolean;
  // Helper methods for components
  getKpiData: (filters?: Record<string, any>) => Promise<KpiData[]>;
  getInsightData: (filters?: Record<string, any>) => Promise<InsightData[]>;
  getChartData: (metric: string, filters?: Record<string, any>) => Promise<ChartData[]>;
  getRelatedMetrics: (insightId: string) => Promise<any[]>;
}

// Default context value
const defaultContextValue: DataConnectorContextType = {
  connector: new MedallionDataConnector(),
  mode: 'simulated',
  setMode: () => {},
  tier: 'silver',
  badge: {
    label: 'Simulated Data',
    color: '#9277FF',
    description: 'Using simulated data for demonstration purposes',
    tier: 'silver'
  },
  lastUpdated: new Date(),
  isLoading: false,
  getKpiData: async () => [],
  getInsightData: async () => [],
  getChartData: async () => [],
  getRelatedMetrics: async () => []
};

// Create context
const DataConnectorContext = createContext<DataConnectorContextType>(defaultContextValue);

// Hook for using the context
export const useDataConnector = () => useContext(DataConnectorContext);

// Provider component
interface DataConnectorProviderProps {
  children: ReactNode;
  initialMode?: DataSourceMode;
}

export const DataConnectorProvider: React.FC<DataConnectorProviderProps> = ({
  children,
  initialMode = 'simulated'
}) => {
  // Get current role from RoleContext
  const { role } = useRole();
  
  // Create the data connector instance
  const [connector] = useState(() => new MedallionDataConnector({ mode: initialMode, role }));
  const [mode, setModeState] = useState<DataSourceMode>(initialMode);
  const [tier, setTier] = useState<MedallionTier>('silver');
  const [badge, setBadge] = useState(connector.getDataSourceBadge());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load saved mode from localStorage on initial mount
  useEffect(() => {
    const savedMode = localStorage.getItem('dataSourceMode');
    if (savedMode) {
      try {
        const parsedMode = JSON.parse(savedMode) as DataSourceMode;
        if (['simulated', 'real', 'hybrid'].includes(parsedMode)) {
          setMode(parsedMode);
        }
      } catch (error) {
        console.error('Error parsing saved data source mode:', error);
      }
    }
  }, []);
  
  // Update connector when role changes
  useEffect(() => {
    if (role) {
      connector.setRole(role);
      // Update badge and last updated
      setBadge(connector.getDataSourceBadge());
      setLastUpdated(new Date());
    }
  }, [role, connector]);

  // Set mode function
  const setMode = (newMode: DataSourceMode) => {
    // Save to localStorage
    localStorage.setItem('dataSourceMode', JSON.stringify(newMode));
    
    // Update connector
    connector.setMode(newMode);
    
    // Update state
    setModeState(newMode);
    setTier(connector.getTier('kpi'));
    setBadge(connector.getDataSourceBadge());
    setLastUpdated(new Date());
  };

  // Helper function to get KPI data
  const getKpiData = async (filters?: Record<string, any>): Promise<KpiData[]> => {
    setIsLoading(true);
    try {
      return await connector.getKpiData(filters);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get Insight data
  const getInsightData = async (filters?: Record<string, any>): Promise<InsightData[]> => {
    setIsLoading(true);
    try {
      return await connector.getInsightData(filters);
    } catch (error) {
      console.error('Error fetching Insight data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get Chart data
  const getChartData = async (metric: string, filters?: Record<string, any>): Promise<ChartData[]> => {
    setIsLoading(true);
    try {
      return await connector.getChartData(metric, filters);
    } catch (error) {
      console.error('Error fetching Chart data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get Related Metrics data
  const getRelatedMetrics = async (insightId: string): Promise<any[]> => {
    setIsLoading(true);
    try {
      return await connector.getRelatedMetrics(insightId);
    } catch (error) {
      console.error('Error fetching Related Metrics:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Update tier when mode changes
  useEffect(() => {
    setTier(connector.getTier('kpi'));
    setBadge(connector.getDataSourceBadge());
  }, [mode, connector]);

  const contextValue: DataConnectorContextType = {
    connector,
    mode,
    setMode,
    tier,
    badge,
    lastUpdated,
    isLoading,
    getKpiData,
    getInsightData,
    getChartData,
    getRelatedMetrics
  };

  return (
    <DataConnectorContext.Provider value={contextValue}>
      {children}
    </DataConnectorContext.Provider>
  );
};