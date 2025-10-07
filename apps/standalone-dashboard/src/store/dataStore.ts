import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dataset, Dashboard, ChartConfig, Filter, DataPoint } from '@/types';
import { generateSampleData } from '@/utils/sampleData';

interface DataStore {
  // Datasets
  datasets: Dataset[];
  activeDatasetId: string | null;
  
  // Dashboards
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addDataset: (dataset: Dataset) => void;
  updateDataset: (id: string, dataset: Partial<Dataset>) => void;
  deleteDataset: (id: string) => void;
  setActiveDataset: (id: string | null) => void;
  
  addDashboard: (dashboard: Dashboard) => void;
  updateDashboard: (id: string, dashboard: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  setActiveDashboard: (id: string | null) => void;
  
  addChartToDashboard: (dashboardId: string, chart: ChartConfig) => void;
  updateChart: (dashboardId: string, chartId: string, chart: Partial<ChartConfig>) => void;
  deleteChart: (dashboardId: string, chartId: string) => void;
  
  applyFilter: (datasetId: string, filter: Filter) => DataPoint[];
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Initialize with sample data
  initializeSampleData: () => void;
}

const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      datasets: [],
      activeDatasetId: null,
      dashboards: [],
      activeDashboardId: null,
      isLoading: false,
      error: null,

      addDataset: (dataset) =>
        set((state) => ({
          datasets: [...state.datasets, dataset],
          activeDatasetId: dataset.id,
        })),

      updateDataset: (id, dataset) =>
        set((state) => ({
          datasets: state.datasets.map((d) =>
            d.id === id ? { ...d, ...dataset, updatedAt: new Date() } : d
          ),
        })),

      deleteDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id),
          activeDatasetId: state.activeDatasetId === id ? null : state.activeDatasetId,
        })),

      setActiveDataset: (id) => set({ activeDatasetId: id }),

      addDashboard: (dashboard) =>
        set((state) => ({
          dashboards: [...state.dashboards, dashboard],
          activeDashboardId: dashboard.id,
        })),

      updateDashboard: (id, dashboard) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id ? { ...d, ...dashboard, updatedAt: new Date() } : d
          ),
        })),

      deleteDashboard: (id) =>
        set((state) => ({
          dashboards: state.dashboards.filter((d) => d.id !== id),
          activeDashboardId: state.activeDashboardId === id ? null : state.activeDashboardId,
        })),

      setActiveDashboard: (id) => set({ activeDashboardId: id }),

      addChartToDashboard: (dashboardId, chart) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  charts: [...d.charts, chart],
                  updatedAt: new Date(),
                }
              : d
          ),
        })),

      updateChart: (dashboardId, chartId, chart) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  charts: d.charts.map((c) =>
                    c.id === chartId ? { ...c, ...chart } : c
                  ),
                  updatedAt: new Date(),
                }
              : d
          ),
        })),

      deleteChart: (dashboardId, chartId) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  charts: d.charts.filter((c) => c.id !== chartId),
                  layout: d.layout.filter((l) => l.i !== chartId),
                  updatedAt: new Date(),
                }
              : d
          ),
        })),

      applyFilter: (datasetId, filter) => {
        const dataset = get().datasets.find((d) => d.id === datasetId);
        if (!dataset) return [];

        return dataset.data.filter((row) => {
          const value = row[filter.column];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'not_equals':
              return value !== filter.value;
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'greater_than':
              return Number(value) > Number(filter.value);
            case 'less_than':
              return Number(value) < Number(filter.value);
            case 'between':
              return Number(value) >= Number(filter.value) && Number(value) <= Number(filter.value2);
            default:
              return true;
          }
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      initializeSampleData: () => {
        const sampleDatasets = generateSampleData();
        set({
          datasets: sampleDatasets,
          activeDatasetId: sampleDatasets[0]?.id || null,
        });
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        datasets: state.datasets,
        dashboards: state.dashboards,
        activeDatasetId: state.activeDatasetId,
        activeDashboardId: state.activeDashboardId,
      }),
    }
  )
);

export default useDataStore;