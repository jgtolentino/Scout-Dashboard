import { create } from 'zustand';

interface Filters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  region: string | null;
  city: string | null;
  barangay: string | null;
  storeType: string | null;
  category: string | null;
  brand: string | null;
}

interface StoreState {
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  selectedStore: any | null;
  setSelectedStore: (store: any) => void;
}

const initialFilters: Filters = {
  dateRange: {
    start: null,
    end: null,
  },
  region: null,
  city: null,
  barangay: null,
  storeType: null,
  category: null,
  brand: null,
};

export const useStore = create<StoreState>((set) => ({
  filters: initialFilters,
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: initialFilters }),
  selectedStore: null,
  setSelectedStore: (store) => set({ selectedStore: store }),
}));