import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface FilterState {
  brands: string[]
  stores: string[]
  products: string[]
  categories: string[]
  regions: string[]
  dateRange: {
    start: string
    end: string
  }
}

const initialState: FilterState = {
  brands: [],
  stores: [],
  products: [],
  categories: [],
  regions: [],
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
}

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setBrands: (state, action: PayloadAction<string[]>) => {
      state.brands = action.payload
    },
    setStores: (state, action: PayloadAction<string[]>) => {
      state.stores = action.payload
    },
    setProducts: (state, action: PayloadAction<string[]>) => {
      state.products = action.payload
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload
    },
    setRegions: (state, action: PayloadAction<string[]>) => {
      state.regions = action.payload
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload
    },
    clearFilters: () => initialState,
  },
})

export const {
  setBrands,
  setStores,
  setProducts,
  setCategories,
  setRegions,
  setDateRange,
  clearFilters,
} = filterSlice.actions
export default filterSlice.reducer